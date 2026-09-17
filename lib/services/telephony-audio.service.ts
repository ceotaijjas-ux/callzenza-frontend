/**
 * Telephony Audio Service for Real-Time Live Call Monitoring (Listen & Barge In)
 * Decodes G.711 mu-law 8kHz audio streams directly from Twilio Media Streams into Web Audio API.
 * Captures and encodes supervisor microphone into G.711 mu-law frames for Barge In.
 */

// G.711 mu-law decompression lookup table
const ULAW_DECODE_TABLE = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  let mu = ~i;
  let sign = mu & 0x80 ? -1 : 1;
  let exponent = (mu >> 4) & 0x07;
  let mantissa = mu & 0x0f;
  let sample = sign * ((mantissa << (exponent + 3)) + (132 << exponent) - 132);
  ULAW_DECODE_TABLE[i] = sample / 32768.0;
}

// G.711 mu-law linear-to-ulaw compression
function linearToMuLaw(sample: number): number {
  const MAX = 32767;
  const BIAS = 132;
  let pcm = Math.max(-1, Math.min(1, sample));
  let intSample = Math.floor(pcm * MAX);
  let sign = (intSample < 0) ? 0x80 : 0;
  if (sign) intSample = -intSample;
  if (intSample > MAX) intSample = MAX;
  intSample += BIAS;

  let exponent = 7;
  for (let expMask = 0x4000; (intSample & expMask) === 0 && exponent > 0; expMask >>= 1) {
    exponent--;
  }
  let mantissa = (intSample >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

function getWsBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.startsWith("http")) {
    return envUrl.replace(/^http/, "ws");
  }
  if (typeof window !== "undefined") {
    if (window.location.port === "3000" || window.location.port === "3001") {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${proto}//${window.location.hostname}:8000`;
    }
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}`;
  }
  return "ws://127.0.0.1:8000";
}

export type TelephonyAudioState = "IDLE" | "CONNECTING" | "LISTENING" | "BARGED_IN" | "DISCONNECTED" | "ERROR";

export class TelephonyAudioManager {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private socket: WebSocket | null = null;
  private micStream: MediaStream | null = null;
  private micProcessor: ScriptProcessorNode | null = null;
  private nextPlayTime: number = 0;
  private isMuted: boolean = false;
  private isMicMuted: boolean = false;
  private volume: number = 1.0;

  public onStateChange?: (state: TelephonyAudioState, message?: string) => void;
  public onAudioLevel?: (level: number) => void;
  public onCallEnded?: () => void;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    if (typeof window !== "undefined" && !this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        try {
          this.audioContext = new AudioContextClass();
          this.gainNode = this.audioContext.createGain();
          this.gainNode.gain.value = this.volume;
          this.analyserNode = this.audioContext.createAnalyser();
          this.analyserNode.fftSize = 64;

          this.gainNode.connect(this.analyserNode);
          this.analyserNode.connect(this.audioContext.destination);
        } catch (e) {
          console.warn("[TelephonyAudio] AudioContext init error:", e);
        }
      }
    }
  }

  public async startListen(callId: string, token: string): Promise<void> {
    this.stopSession();
    this.onStateChange?.("CONNECTING", "Connecting to live call audio...");

    this.initAudioContext();
    if (this.audioContext && this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn("[TelephonyAudio] AudioContext resume failed:", e);
      }
    }

    const wsBase = getWsBaseUrl();
    const wsUrl = `${wsBase}/api/voice/barge/stream/browser/listen/${callId}?token=${encodeURIComponent(token)}`;

    try {
      this.socket = new WebSocket(wsUrl);
    } catch (err: any) {
      console.error("[TelephonyAudio] WebSocket instantiation failed:", err);
      this.onStateChange?.("ERROR", "Failed to connect to audio stream.");
      return;
    }

    this.socket.onopen = () => {
      this.onStateChange?.("LISTENING", "Listening to live call.");
    };

    this.socket.onmessage = (event) => {
      this.handleIncomingAudio(event.data);
    };

    this.socket.onerror = (err) => {
      console.error("[TelephonyAudio] WebSocket Error:", err);
      this.onStateChange?.("ERROR", "Failed to connect to audio stream.");
    };

    this.socket.onclose = (event) => {
      if (event.code === 1008) {
        this.onStateChange?.("ERROR", "Permission denied.");
      } else {
        this.onStateChange?.("DISCONNECTED", "Listen session closed.");
      }
    };
  }

  public async startBargeIn(callId: string, token: string): Promise<void> {
    this.stopSession();
    this.onStateChange?.("CONNECTING", "Establishing two-way audio bridge...");

    this.initAudioContext();
    if (this.audioContext && this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn("[TelephonyAudio] AudioContext resume failed:", e);
      }
    }

    // Request microphone access for Barge In
    let hasMic = false;
    if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        hasMic = true;
      } catch (micErr: any) {
        console.warn("[TelephonyAudio] Microphone permission or device not available:", micErr);
      }
    }

    const wsBase = getWsBaseUrl();
    const wsUrl = `${wsBase}/api/voice/barge/stream/browser/barge/${callId}?token=${encodeURIComponent(token)}`;

    try {
      this.socket = new WebSocket(wsUrl);
    } catch (err: any) {
      console.error("[TelephonyAudio] Barge WebSocket instantiation failed:", err);
      this.onStateChange?.("ERROR", "Failed to connect to barge-in bridge.");
      return;
    }

    this.socket.onopen = () => {
      this.onStateChange?.(
        "BARGED_IN", 
        hasMic ? "Connected! You are live in the call." : "Connected to call bridge (Mic unavailable)."
      );
      if (hasMic) {
        this.startMicrophoneCapture();
      }
    };

    this.socket.onmessage = (event) => {
      this.handleIncomingAudio(event.data);
    };

    this.socket.onerror = (err) => {
      console.error("[TelephonyAudio] Barge WebSocket Error:", err);
      this.onStateChange?.("ERROR", "Failed to connect to barge-in bridge.");
    };

    this.socket.onclose = (event) => {
      this.stopMicrophone();
      if (event.code === 1008) {
        this.onStateChange?.("ERROR", "Permission denied for barge stream.");
      } else {
        this.onStateChange?.("DISCONNECTED", "Barge-in session closed.");
      }
    };
  }

  private handleIncomingAudio(data: any) {
    try {
      const msg = JSON.parse(data);
      if (msg.event === "CALL_ENDED") {
        this.onCallEnded?.();
        this.stopSession();
        return;
      }

      if (msg.event === "media" && msg.media && msg.media.payload) {
        this.playUlawChunk(msg.media.payload);
      }
    } catch (e) {
      console.debug("[TelephonyAudio] Non-JSON payload:", e);
    }
  }

  private playUlawChunk(base64Payload: string) {
    if (!this.audioContext || !this.gainNode || this.isMuted) return;

    try {
      const binaryString = atob(base64Payload);
      const len = binaryString.length;
      if (len === 0) return;

      const audioBuffer = this.audioContext.createBuffer(1, len, 8000);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < len; i++) {
        const byte = binaryString.charCodeAt(i);
        channelData[i] = ULAW_DECODE_TABLE[byte];
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      const now = this.audioContext.currentTime;
      if (this.nextPlayTime < now) {
        this.nextPlayTime = now;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
    } catch (err) {
      console.error("[TelephonyAudio] Error decoding mu-law audio chunk:", err);
    }
  }

  private startMicrophoneCapture() {
    if (!this.audioContext || !this.micStream) return;

    try {
      const micSource = this.audioContext.createMediaStreamSource(this.micStream);
      // Process 512 samples per chunk (~64ms at 8kHz)
      this.micProcessor = this.audioContext.createScriptProcessor(512, 1, 1);

      this.micProcessor.onaudioprocess = (e) => {
        if (this.isMicMuted || !this.socket || this.socket.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const ulawBytes = new Uint8Array(inputData.length);

        for (let i = 0; i < inputData.length; i++) {
          ulawBytes[i] = linearToMuLaw(inputData[i]);
        }

        // Convert to base64
        let binary = "";
        for (let i = 0; i < ulawBytes.length; i++) {
          binary += String.fromCharCode(ulawBytes[i]);
        }
        const b64 = btoa(binary);

        this.socket.send(JSON.stringify({
          event: "media",
          media: {
            payload: b64,
          },
        }));
      };

      micSource.connect(this.micProcessor);
      // Route ScriptProcessorNode through a zero-gain node to destination
      // This keeps onaudioprocess running in WebKit/Blink without supervisor hear-back echo
      const silentGain = this.audioContext.createGain();
      silentGain.gain.value = 0;
      this.micProcessor.connect(silentGain);
      silentGain.connect(this.audioContext.destination);
    } catch (err) {
      console.error("[TelephonyAudio] Error initializing microphone capture:", err);
    }
  }

  private stopMicrophone() {
    if (this.micProcessor) {
      try {
        this.micProcessor.disconnect();
      } catch (e) {}
      this.micProcessor = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && !this.isMuted) {
      this.gainNode.gain.value = this.volume;
    }
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.gainNode) {
      this.gainNode.gain.value = mute ? 0 : this.volume;
    }
  }

  public setMicMute(mute: boolean) {
    this.isMicMuted = mute;
  }

  public stopSession() {
    this.stopMicrophone();

    if (this.socket) {
      try {
        if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ action: "leave" }));
        }
        this.socket.close();
      } catch (e) {}
      this.socket = null;
    }

    this.nextPlayTime = 0;
    this.onStateChange?.("IDLE");
  }
}

export const telephonyAudioManager = typeof window !== "undefined" ? new TelephonyAudioManager() : null;

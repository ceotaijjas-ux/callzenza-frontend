"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { localVoiceTestService, ScriptStepItem } from "@/lib/services/local-voice-test.service";
import {
  Bot,
  User,
  Phone,
  Sparkles,
  Loader2,
  X,
  Check,
  ArrowRight,
  Circle,
  Send,
  ShieldCheck,
  Home,
  Building,
  DollarSign,
  MapPin,
  Calendar,
  AlertTriangle,
  WifiOff,
  Headphones,
  PhoneForwarded
} from "lucide-react";
import { leadAssignmentService } from "@/lib/services/lead-assignment.service";

interface LocalVoiceTestModalProps {
  campaignId: string;
  campaignName: string;
  agentId?: string;
  onClose: () => void;
}

export type VoiceConnectionState = 
  | "INITIALIZING"
  | "CONNECTING"
  | "CONNECTED"
  | "PROCESSING"
  | "ERROR"
  | "DISCONNECTED";

export function LocalVoiceTestModal({
  campaignId,
  campaignName,
  agentId,
  onClose,
}: LocalVoiceTestModalProps) {
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>("INITIALIZING");
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "transcribing" | "thinking" | "speaking">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [voiceSessionId, setVoiceSessionId] = useState<string | undefined>(undefined);
  const [currentScriptStep, setCurrentScriptStep] = useState<string>("1. Greeting");
  const [scriptSteps, setScriptSteps] = useState<ScriptStepItem[]>([]);
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const [qualificationStatus, setQualificationStatus] = useState<string>("IN_PROGRESS");
  const [typedInputMessage, setTypedInputMessage] = useState<string>("");
  const [transferStatus, setTransferStatus] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const sessionStartTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleTalkToAgent = async () => {
    setIsTransferring(true);
    setTransferStatus(null);
    try {
      const fullTranscript = voiceTranscript.map((t) => `${t.sender.toUpperCase()}: ${t.text}`).join("\n");
      const targetLeadId = (collectedData as any).leadId || (collectedData as any).lead_id;
      if (!targetLeadId) {
        setTransferStatus("⚠️ No active customer lead found for transfer.");
        return;
      }
      const res = await leadAssignmentService.transferToAgent({
        lead_id: targetLeadId,
        campaign_id: campaignId,
        ai_agent_name: "CallZenza Voice Agent",
        qualification_stage: currentScriptStep,
        transcript: fullTranscript,
        notes: `Talk to Agent button clicked during active call session. Qualification: ${qualificationStatus}`,
        collected_answers: collectedData,
      });

      if (res.status === "ASSIGNED") {
        setTransferStatus(`✅ Transferred! Assigned to human agent: ${res.assigned_expert?.name || "Voice Agent"}`);
      } else if (res.status === "QUEUED") {
        setTransferStatus(`⏳ All agents busy. Lead placed into Agent Assignment Queue.`);
      } else {
        setTransferStatus(`ℹ️ Lead is already assigned to ${res.assigned_expert?.name || "Human Agent"}`);
      }
    } catch (err: any) {
      setTransferStatus(`⚠️ Transfer error: ${err.message || "Failed to assign agent"}`);
    } finally {
      setIsTransferring(false);
    }
  };

  const activeSessionRef = useRef<boolean>(true);
  const recognitionRef = useRef<any>(null);
  const voiceSessionIdRef = useRef<string | undefined>(undefined);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Format elapsed time in milliseconds
  const formatDuration = (ms: number) => {
    return `${ms} ms`;
  };

  // Start the call timer in milliseconds
  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) return; // already running
    sessionStartTimeRef.current = Date.now();
    setElapsedMs(0);
    timerIntervalRef.current = setInterval(() => {
      if (sessionStartTimeRef.current) {
        setElapsedMs(Date.now() - sessionStartTimeRef.current);
      }
    }, 50);
  }, []);

  // Stop the call timer and return elapsed milliseconds
  const stopTimer = useCallback((): number => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (sessionStartTimeRef.current) {
      return Date.now() - sessionStartTimeRef.current;
    }
    return 0;
  }, []);

  // Markdown & special character stripping for clean speech synthesis
  const cleanSpeechText = (text: string): string => {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1")       // **bold** -> bold
      .replace(/\*(.*?)\*/g, "$1")           // *italic* -> italic
      .replace(/__(.*?)__/g, "$1")           // __bold__ -> bold
      .replace(/_(.*?)_/g, "$1")             // _italic_ -> italic
      .replace(/~~(.*?)~~/g, "$1")           // ~~strikethrough~~ -> strikethrough
      .replace(/`{1,3}(.*?)`{1,3}/g, "$1")   // `code` -> code
      .replace(/#{1,6}\s+/g, "")             // # Header -> Header
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) -> text
      .replace(/^[*-]\s+/gm, "")             // bullet points
      .replace(/[*_#`~]/g, "")               // stray markdown symbols
      .replace(/\s+/g, " ")                  // normalize spaces
      .trim();
  };

  const [micLanguage, setMicLanguage] = useState<string>("en-IN");
  const [interimText, setInterimText] = useState<string>("");
  const micLanguageRef = useRef<string>("en-IN");

  const changeMicLanguage = (langCode: string) => {
    setMicLanguage(langCode);
    micLanguageRef.current = langCode;
    activeLanguageRef.current = langCode;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    setTimeout(() => {
      if (activeSessionRef.current && typeof window !== "undefined" && !window.speechSynthesis.speaking) {
        initiateListening();
      }
    }, 200);
  };

  // Speech synthesis helper supporting physical <break time="Xs" /> pause gaps, emotions and markdown stripping
  const playVoiceResponse = (text: string, onEndCallback: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    const EMOTION_VOICE_MODULATION: Record<string, { pitch: number; rate: number }> = {
      happy: { pitch: 1.2, rate: 1.05 },
      sad: { pitch: 0.85, rate: 0.85 },
      fearful: { pitch: 1.25, rate: 1.15 },
      disgusted: { pitch: 0.9, rate: 0.9 },
      surprised: { pitch: 1.35, rate: 1.1 },
      neutral: { pitch: 1.0, rate: 1.0 },
      fluent: { pitch: 1.0, rate: 1.05 },
    };

    // Split speech into chunks separated by pause tags like <break time="0.5s" /> or [pause: 1s] and <emotion type="..." />
    const combinedRegex = /(<emotion\s+type=["']?([a-zA-Z]+)["']?\s*\/?>)|(<break\s+time=["']?(\d*\.?\d+)s?["']?\s*\/?>|\[pause:?\s*(\d*\.?\d+)s?\])/gi;
    const segments: Array<{ text: string; emotion: string; pauseAfterMs: number }> = [];
    let currentEmotion = "neutral";
    let lastIdx = 0;
    let match;

    while ((match = combinedRegex.exec(text)) !== null) {
      const rawChunk = text.substring(lastIdx, match.index).replace(/<[^>]+>/g, "").trim();
      const chunkText = cleanSpeechText(rawChunk);
      const emotionTag = match[2];
      const pauseSec = parseFloat(match[4] || match[5] || "0");
      const pauseMs = Math.max(0, Math.round(pauseSec * 1000));

      if (emotionTag) {
        if (chunkText) {
          segments.push({ text: chunkText, emotion: currentEmotion, pauseAfterMs: 0 });
        }
        currentEmotion = emotionTag.toLowerCase();
      } else if (pauseMs > 0 || match[3]) {
        if (chunkText) {
          segments.push({ text: chunkText, emotion: currentEmotion, pauseAfterMs: pauseMs });
        } else if (segments.length > 0) {
          segments[segments.length - 1].pauseAfterMs += pauseMs;
        } else if (pauseMs > 0) {
          segments.push({ text: "", emotion: currentEmotion, pauseAfterMs: pauseMs });
        }
      }
      lastIdx = combinedRegex.lastIndex;
    }

    const trailingRaw = text.substring(lastIdx).replace(/<[^>]+>/g, "").trim();
    const trailingText = cleanSpeechText(trailingRaw);
    if (trailingText) {
      segments.push({ text: trailingText, emotion: currentEmotion, pauseAfterMs: 0 });
    }

    if (segments.length === 0) {
      const cleanAll = cleanSpeechText(text.replace(/<[^>]+>/g, "").trim());
      segments.push({ text: cleanAll, emotion: "neutral", pauseAfterMs: 0 });
    }

    let segmentIndex = 0;

    const playNext = () => {
      if (!activeSessionRef.current) return;
      if (segmentIndex >= segments.length) {
        setVoiceStatus("listening");
        setTimeout(onEndCallback, 400);
        return;
      }

      const segment = segments[segmentIndex];
      segmentIndex++;

      // If segment text is empty (leading pause gap), delay and proceed
      if (!segment.text) {
        if (segment.pauseAfterMs > 0) {
          setVoiceStatus("speaking");
          pauseTimerRef.current = setTimeout(() => {
            playNext();
          }, segment.pauseAfterMs);
        } else {
          playNext();
        }
        return;
      }

      setVoiceStatus("speaking");
      const utterance = new SpeechSynthesisUtterance(segment.text);
      const mod = EMOTION_VOICE_MODULATION[segment.emotion] || EMOTION_VOICE_MODULATION.neutral;
      utterance.pitch = mod.pitch;
      utterance.rate = mod.rate;

      const isTamilUnicode = /[\u0B80-\u0BFF]/.test(segment.text);
      const isTanglish = /\b(irukken|irukan|solla|panradhu|pandrathu|aagum|unga|ungaloda|dhaan|nalla|vanakkam|pathi|pesalaam|thavavai|saaptinagala|machan|keetturuka|therinjukanum|mudiyadhu|epdi|eppadi|yeppadi|paarkka|kudukkang|pesa|sariyaana|ennodu|namaskaram)\b/i.test(segment.text);
      const isHindiUnicode = /[\u0900-\u097F]/.test(segment.text);
      const isHinglish = /\b(kaise|kya|nahi|karna|kar|raha|hai|samjh|bataya|apka|aapse|hoga|batao|apne|namaste)\b/i.test(segment.text);

      let detectedLangCode = "en-IN";
      if (isTamilUnicode || isTanglish) {
        utterance.lang = "ta-IN";
        detectedLangCode = "ta-IN";
      } else if (isHindiUnicode || isHinglish) {
        utterance.lang = "hi-IN";
        detectedLangCode = "hi-IN";
      } else if (/[\u0C00-\u0C7F]/.test(segment.text)) {
        utterance.lang = "te-IN";
        detectedLangCode = "te-IN";
      } else if (/[\u0D00-\u0D7F]/.test(segment.text)) {
        utterance.lang = "ml-IN";
        detectedLangCode = "ml-IN";
      } else if (/[\u0C80-\u0CFF]/.test(segment.text)) {
        utterance.lang = "kn-IN";
        detectedLangCode = "kn-IN";
      } else if (/[\u0980-\u09FF]/.test(segment.text)) {
        utterance.lang = "bn-IN";
        detectedLangCode = "bn-IN";
      } else if (/[\u0600-\u06FF]/.test(segment.text)) {
        utterance.lang = "ur-IN";
        detectedLangCode = "ur-IN";
      } else {
        utterance.lang = "en-IN";
        detectedLangCode = "en-US";
      }

      if (activeSessionRef.current) {
        activeLanguageRef.current = detectedLangCode;
      }

      utterance.onend = () => {
        if (!activeSessionRef.current) return;
        if (segment.pauseAfterMs > 0) {
          // PHYSICAL PAUSE GAP: Wait the exact duration before speaking next segment
          setVoiceStatus("speaking");
          pauseTimerRef.current = setTimeout(() => {
            playNext();
          }, segment.pauseAfterMs);
        } else {
          playNext();
        }
      };

      utterance.onerror = (e) => {
        if (!activeSessionRef.current) return;
        if (segment.pauseAfterMs > 0) {
          pauseTimerRef.current = setTimeout(() => {
            playNext();
          }, segment.pauseAfterMs);
        } else {
          playNext();
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    playNext();
  };

  // Speech recognition listener
  const activeLanguageRef = useRef<string>("en-IN");

  const initiateListening = () => {
    if (!activeSessionRef.current) return;
    if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = micLanguageRef.current || activeLanguageRef.current || "en-IN";

      recognition.onstart = () => {
        if (activeSessionRef.current) {
          setVoiceStatus("listening");
        }
      };

      recognition.onerror = (event: any) => {
        if (!activeSessionRef.current) return;
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setErrorMessage("⚠️ Microphone access is blocked. Please allow microphone permission in your browser.");
        } else if (event.error === "audio-capture") {
          setErrorMessage("⚠️ No microphone was found. Please check your mic connection.");
        }
        setTimeout(() => {
          if (activeSessionRef.current && typeof window !== "undefined" && !window.speechSynthesis.speaking) {
            initiateListening();
          }
        }, 500);
      };

      recognition.onend = () => {
        if (!activeSessionRef.current) return;
        setTimeout(() => {
          if (activeSessionRef.current && typeof window !== "undefined" && !window.speechSynthesis.speaking) {
            initiateListening();
          }
        }, 300);
      };

      recognition.onresult = (event: any) => {
        if (!activeSessionRef.current) return;
        let finalTranscript = "";
        let interim = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setInterimText(interim);
        }

        if (finalTranscript && finalTranscript.trim()) {
          setInterimText("");
          handleSendMessage(finalTranscript.trim());
        }
      };

      recognition.start();
    } catch (e) {}
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !voiceSessionIdRef.current || !activeSessionRef.current) return;

    setVoiceTranscript((prev) => [...prev, { sender: "user", text: textToSend }]);
    setVoiceStatus("thinking");
    setConnectionState("PROCESSING");
    setErrorMessage(null);

    try {
      const data = await localVoiceTestService.sendMessage(voiceSessionIdRef.current, textToSend);
      if (!activeSessionRef.current) return;

      setConnectionState("CONNECTED");
      setCurrentScriptStep(data.current_step || "1. Greeting");
      setScriptSteps(data.script_steps || []);
      setCollectedData(data.collected_data || {});
      setQualificationStatus(data.qualification_status || "IN_PROGRESS");

      const reply = data.response;
      setVoiceTranscript((prev) => [...prev, { sender: "ai", text: reply }]);

      if ((data as any).transfer_status === "ASSIGNED") {
        const agentName = (data as any).assigned_expert?.name || "Voice Agent";
        setTransferStatus(`✅ Transferred! Assigned to human agent: ${agentName}`);
      } else if ((data as any).transfer_status === "QUEUED") {
        setTransferStatus(`⏳ All human agents busy. Lead placed in assignment queue.`);
      }

      if ((data as any).audio_url) {
        setVoiceStatus("speaking");
        const audio = new Audio((data as any).audio_url);
        audio.onended = () => {
          if (activeSessionRef.current) {
            setVoiceStatus("listening");
            setTimeout(initiateListening, 400);
          }
        };
        audio.onerror = () => {
          playVoiceResponse(reply, () => {
            if (activeSessionRef.current) initiateListening();
          });
        };
        audio.play().catch(() => {
          playVoiceResponse(reply, () => {
            if (activeSessionRef.current) initiateListening();
          });
        });
      } else {
        playVoiceResponse(reply, () => {
          if (activeSessionRef.current) {
            initiateListening();
          }
        });
      }
    } catch (err: any) {
      console.warn("Error processing local voice test message:", err);
      const errMsg = err.message || "Failed to communicate with backend server";
      setConnectionState("ERROR");
      setErrorMessage(errMsg);
      setVoiceTranscript((prev) => [
        ...prev,
        { sender: "ai", text: `⚠️ Error receiving AI response: ${errMsg}` },
      ]);
      if (activeSessionRef.current) {
        setVoiceStatus("listening");
      }
    }
  };

  const startSession = async () => {
    activeSessionRef.current = true;
    setConnectionState("INITIALIZING");
    setVoiceStatus("thinking");
    setErrorMessage(null);
    setVoiceTranscript([{ sender: "ai", text: "Initializing AI Voice Session & Loading Campaign Context..." }]);

    try {
      setConnectionState("CONNECTING");
      const data = await localVoiceTestService.start(campaignId);
      if (!activeSessionRef.current) return;

      setConnectionState("CONNECTED");
      startTimer();
      setVoiceSessionId(data.session_id);
      voiceSessionIdRef.current = data.session_id;
      setCurrentScriptStep(data.current_step || "1. Greeting");
      setScriptSteps(data.script_steps || []);
      setCollectedData(data.collected_data || {});
      setQualificationStatus(data.qualification_status || "IN_PROGRESS");

      const greeting = data.greeting || (data as any).initial_message || "Hi! My name is Alex. How are you today?";
      setVoiceTranscript([{ sender: "ai", text: greeting }]);

      playVoiceResponse(greeting, () => {
        if (activeSessionRef.current) {
          initiateListening();
        }
      });
    } catch (err: any) {
      console.warn("Failed to start session:", err);
      const errMsg = err.message || "Could not connect to backend server.";
      setConnectionState("ERROR");
      setErrorMessage(errMsg);
      setVoiceStatus("idle");
      setVoiceTranscript([
        {
          sender: "ai",
          text: `⚠️ Error initializing voice session: ${errMsg}`,
        },
      ]);
    }
  };

  const handleClose = () => {
    activeSessionRef.current = false;
    setConnectionState("DISCONNECTED");
    const durationMs = stopTimer();
    const durationSeconds = Math.max(1, Math.floor(durationMs / 1000));
    if (voiceSessionIdRef.current) {
      localVoiceTestService.end(voiceSessionIdRef.current, durationSeconds).catch(() => {});
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    onClose();
  };

  useEffect(() => {
    startSession();
    return () => {
      activeSessionRef.current = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden flex flex-col h-[720px] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-2xl">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-lg">CallZenza Voice Agent</h3>
                {/* Connection State Badge */}
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  connectionState === "CONNECTED" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                  connectionState === "PROCESSING" ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse" :
                  connectionState === "CONNECTING" || connectionState === "INITIALIZING" ? "bg-blue-100 text-blue-800 border border-blue-300" :
                  connectionState === "ERROR" ? "bg-rose-100 text-rose-800 border border-rose-300" :
                  "bg-gray-100 text-gray-800 border border-gray-300"
                }`}>
                  ● {connectionState}
                </span>
                {/* Qualification Status Badge */}
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  qualificationStatus === "QUALIFIED" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                  qualificationStatus === "UNQUALIFIED" ? "bg-rose-100 text-rose-800 border border-rose-300" : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}>
                  {qualificationStatus}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">Campaign: <strong>{campaignName}</strong></p>
              {connectionState === "CONNECTED" || connectionState === "PROCESSING" ? (
                <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {formatDuration(elapsedMs)}
                </p>
              ) : null}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Script Progress Bar */}
        <div className="bg-slate-50 border-b border-slate-200/60 px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" /> Qualification Stage Progress
            </span>
            <span className="text-xs font-bold text-indigo-700">
              Active: {currentScriptStep || "1. Greeting"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(scriptSteps || []).map((stepItem, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all ${
                  stepItem.status === "DONE"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : stepItem.status === "CURRENT"
                    ? "bg-indigo-600 text-white font-bold shadow-sm"
                    : "bg-white text-slate-400 border border-slate-200"
                }`}
              >
                {stepItem.status === "DONE" && <Check className="h-3 w-3 text-emerald-600" />}
                {stepItem.status === "CURRENT" && <ArrowRight className="h-3 w-3 text-white animate-pulse" />}
                {stepItem.status === "PENDING" && <Circle className="h-2.5 w-2.5 text-slate-300" />}
                <span>{stepItem.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Qualification Data Panel */}
        <div className="bg-indigo-900/95 text-white px-6 py-2.5 flex items-center justify-between gap-2 overflow-x-auto text-[11px] font-medium border-b border-indigo-800">
          <div className="flex items-center gap-4 shrink-0">
            <span className="flex items-center gap-1">
              <Home className="h-3 w-3 text-indigo-300" />
              Owner: <strong className={collectedData.homeOwnership === "Own" ? "text-emerald-400 font-bold" : "text-slate-300"}>
                {collectedData.homeOwnership || "—"}
              </strong>
            </span>
            <span className="flex items-center gap-1">
              <Building className="h-3 w-3 text-indigo-300" />
              Single Res: <strong className={collectedData.singleResidence ? "text-emerald-400 font-bold" : "text-slate-300"}>
                {collectedData.singleResidence === true ? "Yes" : collectedData.singleResidence === false ? "No" : "—"}
              </strong>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-indigo-300" />
              Taxpayer: <strong className={collectedData.taxPayer ? "text-emerald-400 font-bold" : "text-slate-300"}>
                {collectedData.taxPayer === true ? "Yes" : collectedData.taxPayer === false ? "No" : "—"}
              </strong>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-indigo-300" />
              ZIP: <strong className={collectedData.zipCode ? "text-emerald-400 font-bold" : "text-slate-300"}>
                {collectedData.zipCode || "—"}
              </strong>
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-indigo-300" />
              Bill: <strong className={collectedData.monthlyElectricityBill ? "text-emerald-400 font-bold" : "text-slate-300"}>
                {collectedData.monthlyElectricityBill || "—"}
              </strong>
            </span>
          </div>
        </div>

        {/* Voice Status Indicator & Language Controls Banner */}
        <div className="p-3 flex items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50/20 via-white to-indigo-50/20 px-6">
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow transition-all ${
              connectionState === "ERROR" ? "bg-rose-600" :
              connectionState === "DISCONNECTED" ? "bg-gray-500" :
              voiceStatus === "listening" ? "bg-indigo-600 scale-105" :
              voiceStatus === "speaking" ? "bg-emerald-600" :
              voiceStatus === "thinking" || connectionState === "PROCESSING" ? "bg-amber-500 animate-bounce" : "bg-blue-600"
            }`}>
              {connectionState === "ERROR" ? <AlertTriangle className="h-3.5 w-3.5" /> :
               connectionState === "DISCONNECTED" ? <WifiOff className="h-3.5 w-3.5" /> :
               voiceStatus === "listening" ? <Phone className="h-3.5 w-3.5" /> :
               voiceStatus === "speaking" ? <Sparkles className="h-3.5 w-3.5" /> :
               voiceStatus === "thinking" || connectionState === "PROCESSING" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-800">
                {connectionState === "ERROR" ? `Error: ${errorMessage || "Connection failure"}` :
                 connectionState === "DISCONNECTED" ? "Session Disconnected" :
                 connectionState === "INITIALIZING" || connectionState === "CONNECTING" ? "Connecting to Backend & Gemini AI..." :
                 connectionState === "PROCESSING" || voiceStatus === "thinking" ? "Gemini LLM reasoning & matching campaign script..." :
                 voiceStatus === "speaking" ? "AI Voice Speaking..." :
                 voiceStatus === "listening" ? "Connected — Listening to customer..." : "Connected & Ready"}
              </p>
              {interimText && (
                <p className="text-[11px] text-indigo-600 font-semibold animate-pulse mt-0.5">
                  🎙️ Hearing: &ldquo;{interimText}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Language Selection Pill Group */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5">Mic:</span>
            {[
              { code: "en-IN", label: "EN (India)" },
              { code: "ta-IN", label: "Tamil" },
              { code: "en-US", label: "EN (US)" },
              { code: "hi-IN", label: "Hindi" },
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeMicLanguage(lang.code)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  micLanguage === lang.code
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
                title={`Switch microphone recognition language to ${lang.label}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transcript Chat Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
          {voiceTranscript.map((msg, idx) => (
            <div key={idx} className={`flex gap-2.5 items-start ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`p-2 rounded-full border ${msg.sender === "user" ? "bg-indigo-600 border-indigo-700" : "bg-white border-gray-200"}`}>
                {msg.sender === "user" ? <User className="h-3.5 w-3.5 text-white" /> : <Bot className="h-3.5 w-3.5 text-gray-600" />}
              </div>
              <div className={`p-3.5 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white font-medium rounded-tr-none shadow-sm"
                  : "bg-white text-gray-800 rounded-tl-none border border-gray-150 shadow-sm"
              }`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Transfer Status Notification Banner */}
        {transferStatus && (
          <div className="px-6 py-2 bg-indigo-50 border-t border-indigo-100 text-indigo-900 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
            <span>{transferStatus}</span>
            <button onClick={() => setTransferStatus(null)} className="text-indigo-400 hover:text-indigo-600 cursor-pointer">✕</button>
          </div>
        )}

        {/* Bottom Controls: Text Input & End Session */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
          <Input
            value={typedInputMessage}
            onChange={(e) => setTypedInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && typedInputMessage.trim()) {
                const msg = typedInputMessage;
                setTypedInputMessage("");
                handleSendMessage(msg);
              }
            }}
            placeholder="Type customer reply or speak into mic..."
            className="text-xs font-medium"
          />
          <Button
            type="button"
            disabled={!typedInputMessage.trim() || connectionState === "PROCESSING"}
            onClick={() => {
              const msg = typedInputMessage;
              setTypedInputMessage("");
              handleSendMessage(msg);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5 mr-1" /> Send
          </Button>
          <Button
            type="button"
            disabled={isTransferring}
            onClick={handleTalkToAgent}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5"
            title="Transfer live call to an available human voice agent"
          >
            <Headphones className="h-3.5 w-3.5" />
            {isTransferring ? "Transferring..." : "Talk to Agent"}
          </Button>
          <Button
            onClick={handleClose}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 shrink-0 cursor-pointer"
          >
            End Session
          </Button>
        </div>
      </div>
    </div>
  );
}


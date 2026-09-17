"use client";

import { useEffect, useState, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { 
  PhoneCall, 
  Headphones, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  LogOut, 
  Radio, 
  Activity,
  AlertCircle,
  PhoneOff
} from "lucide-react";
import { useWebSocketSync } from "@/lib/hooks/useWebSocketSync";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store";
import { TelephonyAudioManager } from "@/lib/services/telephony-audio.service";

interface LiveCallEvent {
  call_id: string;
  campaign_id?: string;
  campaign_name?: string;
  lead_name: string;
  agent_id?: string;
  status: string;
  duration_seconds: number;
  last_message: string;
  direction: string;
}

type MonitoringMode = "IDLE" | "LISTEN_CONNECTING" | "LISTENING" | "BARGE_CONNECTING" | "BARGED_IN" | "ERROR";

export default function LiveCallsPage() {
  const [calls, setCalls] = useState<Record<string, LiveCallEvent>>({});
  const [monitoringState, setMonitoringState] = useState<Record<string, { mode: MonitoringMode; message?: string; elapsedSeconds: number }>>({});
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  
  const audioManagerRef = useRef<TelephonyAudioManager | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioManagerRef.current = new TelephonyAudioManager();
    }

    const fetchActiveCalls = async () => {
      try {
        const activeCalls = await apiFetch<LiveCallEvent[]>('/api/voice/calls/active');
        if (Array.isArray(activeCalls)) {
          const callsMap = activeCalls.reduce((acc, call) => {
            acc[call.call_id] = call;
            return acc;
          }, {} as Record<string, LiveCallEvent>);
          setCalls(callsMap);
        }
      } catch (err) {
        console.error("Failed to fetch active calls:", err);
      }
    };
    fetchActiveCalls();

    // Auto-poll active calls every 3 seconds so console strictly matches running campaigns
    const pollInterval = setInterval(fetchActiveCalls, 3000);

    // Elapsed timer for active monitoring sessions
    timerIntervalRef.current = setInterval(() => {
      setMonitoringState(prev => {
        let changed = false;
        const next = { ...prev };
        for (const [id, s] of Object.entries(next)) {
          if (s.mode === "LISTENING" || s.mode === "BARGED_IN") {
            next[id] = { ...s, elapsedSeconds: s.elapsedSeconds + 1 };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioManagerRef.current) {
        audioManagerRef.current.stopSession();
      }
    };
  }, []);

  const getToken = () => {
    // 1. Direct from Zustand Auth Store
    const storeToken = useAuthStore.getState().token;
    if (storeToken) return storeToken;

    // 2. Storage fallbacks
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("callzenza-auth") || localStorage.getItem("callzenza-auth");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.state?.token) return parsed.state.token;
        }
      } catch (_) {}

      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("callzenza-auth-")) {
            const val = localStorage.getItem(key);
            if (val) {
              const parsed = JSON.parse(val);
              if (parsed?.state?.token) return parsed.state.token;
            }
          }
        }
      } catch (_) {}

      return localStorage.getItem("token") || "";
    }
    return "";
  };

  // 1. LISTEN HANDLERS
  const handleStartListen = async (callId: string) => {
    const token = getToken();
    setMonitoringState(prev => ({
      ...prev,
      [callId]: { mode: "LISTEN_CONNECTING", message: "Connecting to audio stream...", elapsedSeconds: 0 }
    }));

    try {
      await apiFetch(`/api/voice/calls/${callId}/listen`, { method: "POST" });
      
      if (audioManagerRef.current) {
        audioManagerRef.current.onStateChange = (state, message) => {
          if (state === "LISTENING") {
            setMonitoringState(prev => ({
              ...prev,
              [callId]: { mode: "LISTENING", message: "Live Call Audio Active", elapsedSeconds: 0 }
            }));
          } else if (state === "ERROR") {
            setMonitoringState(prev => ({
              ...prev,
              [callId]: { mode: "ERROR", message: message || "Connection Error", elapsedSeconds: 0 }
            }));
          } else if (state === "DISCONNECTED" || state === "IDLE") {
            setMonitoringState(prev => { const n = { ...prev }; delete n[callId]; return n; });
          }
        };

        audioManagerRef.current.onCallEnded = () => {
          setMonitoringState(prev => { const n = { ...prev }; delete n[callId]; return n; });
        };

        await audioManagerRef.current.startListen(callId, token);
      }
    } catch (err: any) {
      console.error("Failed starting listen:", err);
      setMonitoringState(prev => ({
        ...prev,
        [callId]: { mode: "ERROR", message: err.message || "Failed to start listening", elapsedSeconds: 0 }
      }));
    }
  };

  const handleStopListen = async (callId: string) => {
    try {
      if (audioManagerRef.current) {
        audioManagerRef.current.stopSession();
      }
      await apiFetch(`/api/voice/calls/${callId}/stop-listen`, { method: "POST" });
    } catch (e) {
      console.error(e);
    } finally {
      setMonitoringState(prev => {
        const next = { ...prev };
        delete next[callId];
        return next;
      });
    }
  };

  // 2. BARGE IN HANDLERS
  const handleStartBarge = async (callId: string) => {
    const token = getToken();
    setMonitoringState(prev => ({
      ...prev,
      [callId]: { mode: "BARGE_CONNECTING", message: "Connecting to call bridge...", elapsedSeconds: 0 }
    }));

    try {
      await apiFetch(`/api/voice/calls/${callId}/barge`, { method: "POST" });

      if (audioManagerRef.current) {
        audioManagerRef.current.onStateChange = (state, message) => {
          if (state === "BARGED_IN") {
            setMonitoringState(prev => ({
              ...prev,
              [callId]: { mode: "BARGED_IN", message: "Live in Call Bridge", elapsedSeconds: 0 }
            }));
          } else if (state === "ERROR") {
            setMonitoringState(prev => ({
              ...prev,
              [callId]: { mode: "ERROR", message: message || "Barge In Failed", elapsedSeconds: 0 }
            }));
          } else if (state === "DISCONNECTED" || state === "IDLE") {
            setMonitoringState(prev => { const n = { ...prev }; delete n[callId]; return n; });
          }
        };

        audioManagerRef.current.onCallEnded = () => {
          setMonitoringState(prev => { const n = { ...prev }; delete n[callId]; return n; });
        };

        await audioManagerRef.current.startBargeIn(callId, token);
      }
    } catch (err: any) {
      console.error("Failed starting barge:", err);
      setMonitoringState(prev => ({
        ...prev,
        [callId]: { mode: "ERROR", message: err.message || "Failed to barge into call", elapsedSeconds: 0 }
      }));
    }
  };

  const handleLeaveBarge = async (callId: string) => {
    try {
      if (audioManagerRef.current) {
        audioManagerRef.current.stopSession();
      }
      await apiFetch(`/api/voice/calls/${callId}/leave-barge`, { method: "POST" });
    } catch (e) {
      console.error("Error leaving barge:", e);
    } finally {
      setMonitoringState(prev => {
        const next = { ...prev };
        delete next[callId];
        return next;
      });
    }
  };

  const handleDismissError = (callId: string) => {
    setMonitoringState(prev => {
      const next = { ...prev };
      delete next[callId];
      return next;
    });
  };

  // Real-time call events from WebSocket sync
  const { status: wsStatus } = useWebSocketSync((payload) => {
    if (payload.status === "heartbeat") return;
    if (payload.event === "CALL_ENDED" && payload.call_id) {
      const endedCallId = payload.call_id as string;
      if (monitoringState[endedCallId]) {
        if (audioManagerRef.current) audioManagerRef.current.stopSession();
        setMonitoringState(prev => { const n = { ...prev }; delete n[endedCallId]; return n; });
      }
      setCalls((prev) => {
        const next = { ...prev };
        delete next[endedCallId];
        return next;
      });
      return;
    }

    if (payload.call_id) {
      setCalls((prev) => {
        const existingCall = prev[payload.call_id as string];
        const updatedCall: LiveCallEvent = {
          call_id: payload.call_id as string,
          campaign_id: payload.campaign_id || existingCall?.campaign_id,
          campaign_name: payload.campaign_name || existingCall?.campaign_name || "Direct / Active Campaign",
          lead_name: payload.lead_name || existingCall?.lead_name || "Active Recipient",
          status: payload.status || existingCall?.status || "IN_PROGRESS",
          duration_seconds: payload.duration_seconds ?? existingCall?.duration_seconds ?? 0,
          last_message: payload.message || payload.last_message || existingCall?.last_message || "Active Live Stream",
          direction: payload.direction || existingCall?.direction || "OUTBOUND",
        };
        return {
          ...prev,
          [updatedCall.call_id]: updatedCall,
        };
      });
    }
  });

  const formatTimer = (totalSeconds: number) => {
    return `${totalSeconds * 1000} ms`;
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioManagerRef.current) {
      audioManagerRef.current.setMute(nextMuted);
    }
  };

  const handleToggleMicMute = () => {
    const nextMicMuted = !isMicMuted;
    setIsMicMuted(nextMicMuted);
    if (audioManagerRef.current) {
      audioManagerRef.current.setMicMute(nextMicMuted);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioManagerRef.current) {
      audioManagerRef.current.setVolume(newVol);
    }
  };

  const activeCallList = Object.values(calls).filter(
    (c) => c.status !== "COMPLETED" && c.status !== "FAILED"
  );

  const groupedCalls = activeCallList.reduce((acc, call) => {
    const groupName = call.campaign_name || "Ongoing Campaign - Voice Agent";
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(call);
    return acc;
  }, {} as Record<string, LiveCallEvent[]>);

  // Active barge session for sticky top banner
  const activeBargeEntry = Object.entries(monitoringState).find(
    ([_, s]) => s.mode === "BARGED_IN" || s.mode === "BARGE_CONNECTING"
  );
  const activeBargeCall = activeBargeEntry
    ? {
        callId: activeBargeEntry[0],
        state: activeBargeEntry[1],
        call: calls[activeBargeEntry[0]],
      }
    : null;

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-indigo-600 animate-pulse" />
            Live Calls Console
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Supervise live AI & Voice Agent calls with real-time Listen and Barge In capabilities
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
          <span className={`h-2.5 w-2.5 rounded-full ${
            wsStatus === "connected" ? "bg-emerald-500 animate-pulse" :
            wsStatus === "reconnecting" ? "bg-amber-500 animate-ping" :
            "bg-rose-500"
          }`} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{wsStatus}</span>
        </div>
      </div>

      {/* STICKY TOP BANNER: ACTIVE BARGE IN SESSION */}
      {activeBargeCall && (
        <div className="sticky top-2 z-40 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-4 rounded-2xl shadow-xl border-2 border-emerald-500/70 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
                <Mic className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-900/80 px-2.5 py-0.5 rounded border border-emerald-500/50">
                  {activeBargeCall.state.mode === "BARGE_CONNECTING" ? "Connecting Barge..." : "Active Barge In (2-Way Live Bridge)"}
                </span>
                <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {formatTimer(activeBargeCall.state.elapsedSeconds)}
                </span>
              </div>
              <h4 className="text-sm md:text-base font-bold text-white tracking-tight truncate mt-1">
                {activeBargeCall.call?.lead_name || "Active Call"}
                <span className="text-slate-400 font-normal text-xs ml-2">
                  ({activeBargeCall.call?.campaign_name || "Live Telephony Stream"})
                </span>
              </h4>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={handleToggleMicMute}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isMicMuted 
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30" 
                  : "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/30"
              }`}
            >
              {isMicMuted ? <MicOff className="w-4 h-4 text-amber-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
              <span>{isMicMuted ? "Mic Muted" : "Microphone Live"}</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={handleToggleMute}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-indigo-300" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 accent-emerald-400 h-1.5 bg-slate-700 rounded cursor-pointer"
                title={`Volume: ${Math.round(volume * 100)}%`}
              />
            </div>

            <button
              type="button"
              onClick={() => handleLeaveBarge(activeBargeCall.callId)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
              title="Leave the barge call and return to normal supervisor mode"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave Barge Call</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-8">
        {Object.keys(groupedCalls).length === 0 ? (
          <Card className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3 border-dashed border-2">
            <div className="p-4 bg-slate-100 rounded-full">
              <PhoneCall className="h-8 w-8 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-600 text-base">No active live calls at the moment.</p>
            <p className="text-xs text-slate-400 max-w-sm">Trigger an outbound call from the Voice Agent dialer or launch an active campaign to start streaming.</p>
          </Card>
        ) : (
          Object.entries(groupedCalls).map(([campaignName, campaignCalls]) => (
            <div key={campaignName} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                <div className="w-2.5 h-6 bg-indigo-600 rounded-full"></div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">{campaignName}</h2>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {campaignCalls.length} Active {campaignCalls.length === 1 ? 'Call' : 'Calls'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {campaignCalls.map((call, idx) => {
                  const mon = monitoringState[call.call_id];
                  const isListening = mon?.mode === "LISTENING";
                  const isListenConnecting = mon?.mode === "LISTEN_CONNECTING";
                  const isBargedIn = mon?.mode === "BARGED_IN";
                  const isBargeConnecting = mon?.mode === "BARGE_CONNECTING";
                  const isError = mon?.mode === "ERROR";

                  return (
                    <Card key={`${call.call_id || "call"}-${idx}`} className={`p-5 space-y-4 border transition-all bg-white rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md ${
                      isBargedIn ? "border-emerald-500 ring-2 ring-emerald-500/20" : 
                      isListening ? "border-indigo-500 ring-2 ring-indigo-500/20" : 
                      "border-slate-200"
                    }`}>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-base text-slate-900">{call.lead_name}</h3>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{call.direction} CALL</p>
                          </div>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            {call.status}
                          </span>
                        </div>

                        {/* Live Transcript / Speech Snippet */}
                        <div className="bg-slate-50 p-3 rounded-xl text-xs min-h-16 flex flex-col justify-center border border-slate-100">
                          <p className="italic text-slate-600 line-clamp-2">
                            "{call.last_message || "Awaiting caller speech..."}"
                          </p>
                        </div>
                      </div>

                      {/* Monitoring Status & Control Panel */}
                      <div className="space-y-3 pt-2">
                        {isListening ? (
                          <div className="bg-indigo-950 text-white p-3.5 rounded-xl space-y-2.5 shadow-md border border-indigo-800">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 text-xs font-bold text-indigo-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                <span>LISTENING LIVE</span>
                              </div>
                              <span className="font-mono text-xs font-extrabold text-white bg-indigo-900/80 px-2 py-0.5 rounded">
                                {formatTimer(mon.elapsedSeconds)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleToggleMute}
                                  className="p-1.5 bg-indigo-900 hover:bg-indigo-800 text-indigo-200 rounded-lg transition-colors cursor-pointer"
                                  title={isMuted ? "Unmute Audio" : "Mute Audio"}
                                >
                                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-indigo-300" />}
                                </button>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  value={volume}
                                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                  className="w-16 accent-indigo-400 h-1.5 bg-indigo-800 rounded cursor-pointer"
                                  title={`Volume: ${Math.round(volume * 100)}%`}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleStopListen(call.call_id)}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <PhoneOff className="w-3.5 h-3.5" /> Stop Listening
                              </button>
                            </div>
                          </div>
                        ) : isBargedIn ? (
                          <div className="bg-emerald-950 text-white p-3.5 rounded-xl space-y-2.5 shadow-md border border-emerald-700">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 text-xs font-bold text-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                <span>BARGE IN ACTIVE (2-WAY)</span>
                              </div>
                              <span className="font-mono text-xs font-extrabold text-white bg-emerald-900/80 px-2 py-0.5 rounded">
                                {formatTimer(mon.elapsedSeconds)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1">
                              <button
                                type="button"
                                onClick={handleToggleMicMute}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                  isMicMuted ? "bg-amber-600 text-white hover:bg-amber-700" : "bg-emerald-800 text-emerald-100 hover:bg-emerald-700"
                                }`}
                              >
                                {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                {isMicMuted ? "Mic Muted" : "Mic Live"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleLeaveBarge(call.call_id)}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <PhoneOff className="w-3.5 h-3.5" /> Leave Barge Call
                              </button>
                            </div>
                          </div>
                        ) : isBargeConnecting ? (
                          <div className="bg-amber-950/90 text-white p-3.5 rounded-xl space-y-2.5 shadow-md border border-amber-700/60">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                <span>CONNECTING TO BRIDGE...</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-[11px] text-amber-300">Negotiating audio...</span>
                              <button
                                type="button"
                                onClick={() => handleLeaveBarge(call.call_id)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <PhoneOff className="w-3 h-3" /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : isError ? (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-2">
                            <div className="flex items-center gap-2 font-bold">
                              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                              <span className="truncate">{mon.message || "Connection Failed"}</span>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleDismissError(call.call_id)}
                                className="px-2.5 py-1 bg-white border border-rose-300 text-rose-700 rounded-lg text-[11px] font-bold hover:bg-rose-100/50 cursor-pointer"
                              >
                                Dismiss
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartBarge(call.call_id)}
                                className="px-3 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold hover:bg-rose-700 cursor-pointer flex items-center gap-1"
                              >
                                <Mic className="w-3 h-3" /> Retry Barge In
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartListen(call.call_id)}
                              disabled={isListenConnecting || isBargeConnecting}
                              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Headphones className="w-3.5 h-3.5" />
                              {isListenConnecting ? "Connecting..." : "Listen"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartBarge(call.call_id)}
                              disabled={isListenConnecting || isBargeConnecting}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              <Mic className="w-3.5 h-3.5" />
                              {isBargeConnecting ? "Joining..." : "Barge In"}
                            </button>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 pt-2 border-t border-slate-100">
                          <span className="font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                            Call Duration: {formatTimer(call.duration_seconds || 0)} ({Math.floor((call.duration_seconds || 0) / 60)}m {(call.duration_seconds || 0) % 60}s)
                          </span>
                          <span className="flex items-center gap-1 text-indigo-600 font-bold">
                            <Activity className="h-3 w-3 animate-pulse" /> Live Telephony
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}

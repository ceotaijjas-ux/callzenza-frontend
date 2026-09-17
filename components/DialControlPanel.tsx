"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Phone, Users, User, Pause, Play, FastForward, SquareUser, CornerUpRight, 
  Mic, MicOff, Volume2, PhoneOff, Disc, Settings, X, Save, CheckCircle2, AlertCircle,
  UserPlus, UserCheck, Search, ChevronDown, PauseCircle, Loader2, PhoneCall, Music
} from "lucide-react";
import { 
  agentDashboardService, 
  ClientConfigItem,
  HeldCallItem
} from "@/lib/services/agent-dashboard.service";
import { clientService, Client } from "@/lib/services/client.service";
import { useAuthStore, useActiveCallStore } from "@/lib/store";
import { QualifiedCustomersTab } from "./QualifiedCustomersTab";
import { CreateClientTab } from "./CreateClientTab";
import { AssignedClientsTab } from "./AssignedClientsTab";

// Web Audio API Ringback Tone Generator (440Hz + 480Hz PBX Dual Tone)
class RingbackToneGenerator {
  private ctx: AudioContext | null = null;
  private timer: any = null;
  private isPlaying: boolean = false;

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx || this.ctx.state === "closed") {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      const ringCycle = () => {
        if (!this.isPlaying || !this.ctx || this.ctx.state === "closed") return;
        try {
          const now = this.ctx.currentTime;
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc1.type = "sine";
          osc1.frequency.setValueAtTime(440, now);
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(480, now);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.09, now + 0.05);
          gain.gain.setValueAtTime(0.09, now + 1.8);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 2.0);
          osc2.stop(now + 2.0);
        } catch (_) {}
      };

      ringCycle();
      this.timer = setInterval(ringCycle, 4000);
    } catch (e) {
      console.warn("[Ringback] Tone initiation warning:", e);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (_) {}
      this.ctx = null;
    }
  }
}

// Hold Music Player with HTML5 Audio & Fallback Web Audio Harmonics
class HoldMusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private synthInterval: any = null;
  private isPlaying: boolean = false;

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      if (!this.audio) {
        this.audio = new Audio("https://s3.amazonaws.com/com.twilio.music.classical/MARKOVICHAMP-Borghestral.mp3");
        this.audio.loop = true;
        this.audio.volume = 0.35;
      }
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          this.playSynthChords();
        });
      }
    } catch (_) {
      this.playSynthChords();
    }
  }

  private playSynthChords() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx || this.ctx.state === "closed") {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      const chords = [
        [261.63, 329.63, 392.00],
        [220.00, 261.63, 329.63],
        [174.61, 220.00, 261.63],
        [196.00, 246.94, 293.66],
      ];
      let step = 0;
      const playStep = () => {
        if (!this.isPlaying || !this.ctx || this.ctx.state === "closed") return;
        try {
          const now = this.ctx.currentTime;
          const chord = chords[step % chords.length];
          step++;
          chord.forEach((f) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, now);
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            osc.start(now);
            osc.stop(now + 1.8);
          });
        } catch (_) {}
      };
      playStep();
      this.synthInterval = setInterval(playStep, 2000);
    } catch (_) {}
  }

  stop() {
    this.isPlaying = false;
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch (_) {}
    }
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (_) {}
      this.ctx = null;
    }
  }
}

export interface CampaignClientOption {
  id: string;
  client_id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  location?: string;
  status?: string;
  qualification_status?: string;
}

export interface SlotClientSelection {
  client_id: string;
  name: string;
  phone: string;
  company?: string;
}

interface DialControlPanelProps {
  number: string;
  setNumber: (num: string | ((prev: string) => string)) => void;
  callActive: boolean;
  setCallActive: (a: boolean) => void;
  paused: boolean;
  setPaused: (p: boolean) => void;
  agentStatus?: string;
  onStatusChange?: (status: string) => void;
  muted?: boolean;
  setMuted: (m: boolean) => void;
  callId?: string;
  campaignId?: string;
  campaignClients?: CampaignClientOption[];
  onCallStart: () => void;
  onCallEnd: () => void;
  onDialNext?: () => void;
  isDialingNext?: boolean;
  noMoreCustomers?: boolean;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  pdActive?: boolean;
  onTogglePd?: () => void;
  isPdLoading?: boolean;
  telephonyStatus?: string;
  onAnswerCall?: () => void;
  onResumeCall?: () => void;
}

export function DialControlPanel({
  number,
  setNumber,
  callActive,
  setCallActive,
  paused,
  setPaused,
  agentStatus,
  onStatusChange,
  muted = false,
  setMuted,
  callId,
  campaignId,
  campaignClients,
  onCallStart,
  onCallEnd,
  onDialNext,
  isDialingNext = false,
  noMoreCustomers = false,
  clientId,
  clientName,
  clientPhone,
  pdActive = false,
  onTogglePd,
  isPdLoading = false,
  telephonyStatus = "IDLE",
  onAnswerCall,
  onResumeCall,
}: DialControlPanelProps) {
  const [activeTab, setActiveTab] = useState<"phone" | "qualified" | "create_client" | "assigned_clients">("phone");
  const [autoRecord, setAutoRecord] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [showParkSlots, setShowParkSlots] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showClientConfigModal, setShowClientConfigModal] = useState(false);

  // Web Audio Ringback Tone & Hold Music refs
  const ringbackRef = useRef<RingbackToneGenerator | null>(null);
  const holdMusicRef = useRef<HoldMusicPlayer | null>(null);

  useEffect(() => {
    if (!ringbackRef.current) ringbackRef.current = new RingbackToneGenerator();
    if (!holdMusicRef.current) holdMusicRef.current = new HoldMusicPlayer();

    const isRinging = callActive && (telephonyStatus === "RINGING" || telephonyStatus === "INITIATING");
    const isOnHold = callActive && (telephonyStatus === "ON_HOLD" || telephonyStatus === "TRANSFER_REQUESTED");

    if (isRinging) {
      holdMusicRef.current.stop();
      ringbackRef.current.start();
    } else if (isOnHold) {
      ringbackRef.current.stop();
      holdMusicRef.current.play();
    } else {
      ringbackRef.current.stop();
      holdMusicRef.current.stop();
    }

    return () => {
      ringbackRef.current?.stop();
      holdMusicRef.current?.stop();
    };
  }, [callActive, telephonyStatus]);

  // Transfer destination input
  const [transferDest, setTransferDest] = useState("");
  const [transferMsg, setTransferMsg] = useState<string | null>(null);

  // Available clients for transfer
  const currentUser = useAuthStore((s) => s.user);
  const activeCallDuration = useActiveCallStore((s) => s.callDuration);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loadingClients, setLoadingClients] = useState(false);

  // Active Campaign Clients for D1 / D2 / D3 Conference Selection
  const [localCampaignClients, setLocalCampaignClients] = useState<CampaignClientOption[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [activeSlotDropdown, setActiveSlotDropdown] = useState<"D1" | "D2" | "D3" | null>(null);

  // 3-way D1, D2, D3 slot client selections
  const [slotClients, setSlotClients] = useState<{
    D1: SlotClientSelection | null;
    D2: SlotClientSelection | null;
    D3: SlotClientSelection | null;
  }>({
    D1: null,
    D2: null,
    D3: null,
  });

  const [transferConferenceMsg, setTransferConferenceMsg] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [callParked, setCallParked] = useState(false);
  const [heldCalls, setHeldCalls] = useState<HeldCallItem[]>([]);

  const lastFetchedCampIdRef = useRef<string | null>(null);

  // Load campaign clients when panel mounts or campaign changes
  useEffect(() => {
    if (campaignClients && campaignClients.length > 0) {
      setLocalCampaignClients(campaignClients);
    } else if (campaignId && campaignId !== lastFetchedCampIdRef.current) {
      lastFetchedCampIdRef.current = campaignId;
      agentDashboardService.getCampaignClients(campaignId)
        .then((res) => {
          if (res && res.clients && res.clients.length > 0) {
            setLocalCampaignClients(res.clients);
          }
        })
        .catch(console.error);
    }
  }, [campaignClients, campaignId]);

  // Fetch held calls once when slots are shown
  useEffect(() => {
    if (showParkSlots) {
      agentDashboardService.getOnHold().then(setHeldCalls).catch(console.error);
    }
  }, [showParkSlots]);

  // Reset states if call terminates
  useEffect(() => {
    if (!callActive) {
      setCallParked(false);
      setShowParkSlots(false);
      setActiveSlotDropdown(null);
      setTransferConferenceMsg(null);
      setSlotClients({ D1: null, D2: null, D3: null });
    }
  }, [callActive]);

  const openClientSelectionModal = useActiveCallStore((s) => s.openClientSelectionModal);
  const isCallParkedStore = useActiveCallStore((s) => s.isCallParked);
  const telephonyStatusStore = useActiveCallStore((s) => s.telephonyStatus);

  const handleParkCallClick = async () => {
    openClientSelectionModal();
  };

  const handleSelectSlotClient = (slot: "D1" | "D2" | "D3", client: CampaignClientOption) => {
    // Only ONE client can be selected for conference transfer at a time
    setSlotClients({
      D1: null,
      D2: null,
      D3: null,
      [slot]: {
        client_id: client.client_id || client.id,
        name: client.name,
        phone: client.phone,
        company: client.company,
      },
    });
    setActiveSlotDropdown(null);
    setClientSearchQuery("");
    setTransferConferenceMsg(null);
  };

  const handleClearSlot = (slot: "D1" | "D2" | "D3") => {
    setSlotClients((prev) => ({
      ...prev,
      [slot]: null,
    }));
  };

  const handleResumeParkedCall = async () => {
    if (!callId) {
      setCallParked(false);
      setShowParkSlots(false);
      return;
    }
    try {
      await agentDashboardService.resumeParkedCall(callId);
      setCallParked(false);
      setShowParkSlots(false);
      setActiveSlotDropdown(null);
    } catch (err: any) {
      alert(err.message || "Failed to resume parked call.");
    }
  };

  const handleTransferConferenceSubmit = async () => {
    const activeParticipants = (["D1", "D2", "D3"] as const)
      .map((slotKey) => {
        const sel = slotClients[slotKey];
        if (!sel || !sel.phone) return null;
        return {
          slot: slotKey,
          client_id: sel.client_id,
          name: sel.name,
          phone: sel.phone,
        };
      })
      .filter(Boolean) as { slot: string; client_id: string; name: string; phone: string }[];

    if (activeParticipants.length === 0) {
      setTransferConferenceMsg("Please select a client before transferring.");
      return;
    }

    setIsTransferring(true);
    setTransferConferenceMsg("Calling selected client...");

    try {
      if (callId) {
        const res = await agentDashboardService.transferCall(
          callId,
          undefined,
          undefined,
          undefined,
          undefined,
          "three_way",
          activeParticipants as any
        );
        const nowIso = (res as any)?.client_connected_at || new Date().toISOString();
        useActiveCallStore.getState().setCallState({
          clientConnectedAt: nowIso,
          clientDisconnectedAt: null,
          telephonyStatus: "CONFERENCE_3WAY_ACTIVE",
        });
      }
      setTransferConferenceMsg("3-Way Conference Connected!");
      setCallParked(false);
      setTimeout(() => {
        setTransferConferenceMsg(null);
        setShowParkSlots(false);
        setActiveSlotDropdown(null);
      }, 1800);
    } catch (err: any) {
      setTransferConferenceMsg(err.message || "Failed to initiate conference transfer.");
    } finally {
      setIsTransferring(false);
    }
  };

  // Filter campaign clients for the dropdown search
  const filteredCampaignClients = localCampaignClients.filter((c) => {
    if (!clientSearchQuery.trim()) return true;
    const q = clientSearchQuery.toLowerCase();
    const name = (c.name || "").toLowerCase();
    const phone = (c.phone || "").toLowerCase();
    const company = (c.company || "").toLowerCase();
    return name.includes(q) || phone.includes(q) || company.includes(q);
  });

  // Recording metadata
  const [recordId, setRecordId] = useState<string>("—");
  const [recordingFile, setRecordingFile] = useState<string>("—");

  const [showPauseMenu, setShowPauseMenu] = useState(false);

  const isBreakActive = Boolean(paused || ["COFFEE_BREAK", "LUNCH_BREAK", "PAUSED", "ON BREAK"].includes(agentStatus || ""));

  const getBreakLabel = () => {
    if (agentStatus === "COFFEE_BREAK") return "☕ Coffee Break";
    if (agentStatus === "LUNCH_BREAK") return "🍴 Lunch Break";
    if (agentStatus === "PAUSED" || agentStatus === "ON BREAK") return "⏸ On Break";
    return "⏸ Break Active";
  };

  // Handle Pause/Resume Agent Status
  const handleTogglePause = async () => {
    if (isBreakActive) {
      setPaused(false);
      onStatusChange?.("AVAILABLE");
      try {
        await agentDashboardService.updateAgentStatus("AVAILABLE");
      } catch (err) {
        console.error("Failed to update status on backend:", err);
      }
    } else {
      setShowPauseMenu(!showPauseMenu);
    }
  };

  const handlePauseSelect = async (reason: string) => {
    setShowPauseMenu(false);
    setPaused(true);
    onStatusChange?.(reason);
    try {
      await agentDashboardService.updateAgentStatus(reason);
    } catch (err) {
      console.error("Failed to update status on backend:", err);
    }
  };

  // Handle Record Toggle
  const handleToggleRecord = async () => {
    const nextRec = !autoRecord;
    setAutoRecord(nextRec);
    if (callId) {
      try {
        if (nextRec) {
          const res = await agentDashboardService.startRecording(callId);
          setRecordId(res.record_id || res.recording_id);
          setRecordingFile("active_rec.wav");
        } else {
          await agentDashboardService.stopRecording(callId);
          setRecordingFile("Stopped");
        }
      } catch (err) {
        console.error("Recording toggle error:", err);
      }
    }
  };

  // Execute Single Call Transfer
  const handleExecuteTransfer = async () => {
    if (!transferDest.trim()) return;
    if (callId) {
      try {
        const targetId = selectedClient?.contact_number || transferDest;
        await agentDashboardService.transferCall(
          callId,
          undefined,
          targetId,
          selectedClient?.id,
          undefined,
          "direct"
        );
        setTransferMsg("Transfer successfully initiated.");
        setTimeout(() => {
          setShowTransferModal(false);
          setTransferMsg(null);
          setTransferDest("");
        }, 1500);
      } catch (err: any) {
        setTransferMsg(err.message || "Transfer failed.");
      }
    }
  };

  const dialPad = [
    { label: "1", sub: "" },
    { label: "2", sub: "ABC" },
    { label: "3", sub: "DEF" },
    { label: "4", sub: "GHI" },
    { label: "5", sub: "JKL" },
    { label: "6", sub: "MNO" },
    { label: "7", sub: "PQRS" },
    { label: "8", sub: "TUV" },
    { label: "9", sub: "WXYZ" },
    { label: "*", sub: "" },
    { label: "0", sub: "+" },
    { label: "#", sub: "" },
  ];
  return (
    <div className="w-80 bg-slate-900 border-l border-indigo-900/50 text-slate-200 flex flex-col h-full shrink-0 shadow-xl z-40 relative">
      {/* Header */}
      <div className="p-4 border-b border-indigo-900/50 bg-slate-900 flex items-center justify-between">
        <h3 className="font-bold text-sm tracking-widest text-white uppercase">Dial Control</h3>
        {callActive ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono font-bold text-xs">{formatTime(activeCallDuration)}</span>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">IDLE</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        {activeTab === "phone" && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Top Action Controls */}
            <div className="p-4 space-y-3 border-b border-indigo-900/50 shrink-0">
              <div className="grid grid-cols-2 gap-2 relative">
                {/* Pause / Resume */}
                <div className="relative">
                  <button 
                    onClick={handleTogglePause}
                    className={`w-full flex items-center justify-center gap-2 p-2.5 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${
                      isBreakActive ? "bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                    }`}
                    title={isBreakActive ? "Click to Resume / Back to Work" : "Pause / Take Break"}
                  >
                    {isBreakActive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isBreakActive ? "Resume" : "You Are Pause"}
                  </button>
                  
                  {isBreakActive && (
                    <div className="mt-1 flex items-center justify-between px-2 py-1 bg-amber-950/40 border border-amber-500/30 rounded text-[11px] font-bold text-amber-300">
                      <span>{getBreakLabel()}</span>
                      <button
                        onClick={handleTogglePause}
                        className="text-[10px] uppercase underline text-amber-400 hover:text-amber-200 cursor-pointer font-extrabold"
                      >
                        Back to Work
                      </button>
                    </div>
                  )}
                  
                  {showPauseMenu && !isBreakActive && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                      <button 
                        onClick={() => handlePauseSelect("COFFEE_BREAK")}
                        className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                      >
                        ☕ Coffee Break
                      </button>
                      <button 
                        onClick={() => handlePauseSelect("LUNCH_BREAK")}
                        className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-t border-slate-700 cursor-pointer"
                      >
                        🍴 Lunch Break
                      </button>
                    </div>
                  )}
                </div>

                {/* Dial Next */}
                <button 
                  onClick={onDialNext}
                  disabled={isDialingNext || noMoreCustomers}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded text-xs font-bold uppercase border transition-colors cursor-pointer ${
                    noMoreCustomers 
                      ? "bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed opacity-60" 
                      : isDialingNext
                      ? "bg-indigo-900/50 text-indigo-300 border-indigo-700/60 cursor-wait animate-pulse"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                  title={noMoreCustomers ? "No more customers available" : "Dial Next Customer"}
                >
                  {isDialingNext ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Dialing...
                    </>
                  ) : (
                    <>
                      <FastForward className="w-4 h-4" /> Dial Next
                    </>
                  )}
                </button>
              </div>

              {/* PARK CALL / CONFERENCE Button */}
              <button 
                onClick={handleParkCallClick}
                className={`w-full flex items-center justify-center gap-2 p-2.5 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${
                  showParkSlots || callParked ? "bg-indigo-600 text-white border border-indigo-500 shadow-md animate-pulse" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                }`}
              >
                <PauseCircle className="w-4 h-4" /> PARK CALL (Conference)
              </button>

              {/* PREDICTIVE DIALER (PD) Control */}
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/80 border border-indigo-900/40">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${pdActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">Predictive Dialer</div>
                    <div className="text-[9px] font-bold text-slate-400 font-mono">
                      PD: <span className={pdActive ? "text-emerald-400 font-extrabold" : "text-slate-400"}>{pdActive ? "ACTIVE" : "INACTIVE"}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onTogglePd}
                  disabled={isPdLoading}
                  className={`px-3 py-1.5 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                    pdActive
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30"
                      : "bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-650"
                  }`}
                  title="Toggle Predictive Dialer Mode"
                >
                  {isPdLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : pdActive ? "PD ACTIVE" : "PD INACTIVE"}
                </button>
              </div>
            </div>

            {/* SELECT CLIENT FOR CONFERENCE Modal Overlay */}
            {showParkSlots && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-indigo-900/60 rounded-xl shadow-2xl w-[440px] overflow-visible p-6 space-y-5 animate-in zoom-in-95 duration-200 relative">
                  <div className="flex justify-between items-center border-b border-indigo-950/80 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-300">
                        SELECT CLIENT FOR CONFERENCE
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Select an existing client from active campaign. Only ONE client is required.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setShowParkSlots(false);
                        setActiveSlotDropdown(null);
                      }}
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {transferConferenceMsg && (
                    <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                      transferConferenceMsg.includes("Connected") 
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50" 
                        : "bg-indigo-950 text-indigo-200 border border-indigo-800/60"
                    }`}>
                      {isTransferring ? <Loader2 className="w-4 h-4 animate-spin shrink-0 text-indigo-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      <span>{transferConferenceMsg}</span>
                    </div>
                  )}

                  {/* 3 Slots: D1, D2, D3 */}
                  <div className="space-y-3">
                    {(["D1", "D2", "D3"] as const).map((slotKey) => {
                      const selected = slotClients[slotKey];
                      const isOpen = activeSlotDropdown === slotKey;

                      return (
                        <div key={slotKey} className="space-y-1.5 relative">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${selected ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                              <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono">
                                {slotKey} Destination
                              </label>
                              {selected && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded font-bold uppercase">
                                  Selected
                                </span>
                              )}
                            </div>
                            {selected && (
                              <button
                                type="button"
                                onClick={() => handleClearSlot(slotKey)}
                                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          {selected ? (
                            <div 
                              onClick={() => setActiveSlotDropdown(isOpen ? null : slotKey)}
                              className="p-2.5 bg-emerald-950/30 border-2 border-emerald-500 rounded-lg flex items-center justify-between cursor-pointer hover:border-emerald-400 shadow-xs"
                            >
                              <div>
                                <div className="text-xs font-bold text-emerald-100 flex items-center gap-1.5">
                                  <span>{selected.name}</span>
                                  {selected.company && (
                                    <span className="text-[10px] text-emerald-400/80 font-normal">({selected.company})</span>
                                  )}
                                </div>
                                <div className="text-[11px] font-mono text-emerald-300 font-semibold">{selected.phone}</div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <ChevronDown className={`w-4 h-4 text-emerald-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveSlotDropdown(isOpen ? null : slotKey)}
                              className="w-full p-2.5 bg-slate-950 border border-dashed border-indigo-900/70 hover:border-indigo-500/70 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <span>[ Select Client for {slotKey} ]</span>
                              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </button>
                          )}

                          {/* Searchable Dropdown for Campaign Clients */}
                          {isOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-indigo-700/80 rounded-lg shadow-2xl z-50 max-h-56 overflow-hidden flex flex-col">
                              <div className="p-2 border-b border-indigo-900/60 flex items-center gap-2 bg-slate-900">
                                <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <input
                                  type="text"
                                  value={clientSearchQuery}
                                  onChange={(e) => setClientSearchQuery(e.target.value)}
                                  placeholder="Search client by name or phone..."
                                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
                                  autoFocus
                                />
                                {clientSearchQuery && (
                                  <button onClick={() => setClientSearchQuery("")} className="text-slate-500 hover:text-slate-300">
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              <div className="overflow-y-auto max-h-44 p-1 divide-y divide-indigo-950/60">
                                {filteredCampaignClients.length === 0 ? (
                                  <div className="p-3 text-center text-xs text-slate-500">
                                    No campaign clients found matching search.
                                  </div>
                                ) : (
                                  filteredCampaignClients.map((client) => {
                                    const isCurrentlySelected = selected?.client_id === client.client_id;

                                    return (
                                      <button
                                        key={client.id}
                                        type="button"
                                        onClick={() => handleSelectSlotClient(slotKey, client)}
                                        className={`w-full text-left p-2 rounded flex items-center justify-between transition-colors cursor-pointer ${
                                          isCurrentlySelected 
                                            ? "bg-indigo-900/50 text-indigo-200" 
                                            : "hover:bg-indigo-950/80 text-slate-300 hover:text-white"
                                        }`}
                                      >
                                        <div className="truncate pr-2">
                                          <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                                            <span>{client.name}</span>
                                            {client.company && (
                                              <span className="text-[10px] text-slate-400 font-normal">({client.company})</span>
                                            )}
                                          </div>
                                          <div className="text-[11px] font-mono text-indigo-400 font-medium">{client.phone}</div>
                                        </div>
                                        {isCurrentlySelected && (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        )}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions: Resume Call vs Transfer */}
                  {(() => {
                    const activeClient = (["D1", "D2", "D3"] as const)
                      .map((k) => slotClients[k])
                      .find((c) => c && c.phone);

                    return (
                      <div className="flex gap-2 pt-2 border-t border-indigo-950/80">
                        <button
                          onClick={handleResumeParkedCall}
                          className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase rounded-lg border border-slate-700 transition-colors cursor-pointer text-center tracking-wider"
                        >
                          RESUME CALL
                        </button>
                        <button
                          onClick={handleTransferConferenceSubmit}
                          disabled={isTransferring || !activeClient}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold uppercase rounded-lg shadow-sm transition-colors cursor-pointer text-center tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isTransferring 
                            ? "TRANSFERRING..." 
                            : (activeClient ? `TRANSFER (${activeClient.name})` : "SELECT 1 CLIENT")}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Manual Dial Section */}
            <div className="p-4 bg-indigo-950/40 border-b border-indigo-900/50 flex flex-col gap-3 shrink-0">
              {callActive ? (
                (() => {
                  const isRinging = telephonyStatus === "RINGING" || telephonyStatus === "INITIATING";
                  const isOnHold = telephonyStatus === "ON_HOLD" || telephonyStatus === "TRANSFER_REQUESTED";

                  if (isRinging) {
                    return (
                      <div className="p-3 bg-amber-950/70 border border-amber-500/60 rounded-lg text-center space-y-1.5 shadow-inner">
                        <div className="flex items-center justify-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                          </span>
                          <PhoneCall className="w-3.5 h-3.5 animate-bounce" /> Call Ringing...
                        </div>
                        <div className="text-xs font-semibold text-amber-200/90 py-1">
                          Audible Ringback Active • Waiting for Answer
                        </div>
                        <div className="text-xs font-mono text-indigo-300 font-semibold truncate">
                          {number || clientPhone || "Active Customer"}
                        </div>
                      </div>
                    );
                  }

                  if (isOnHold) {
                    return (
                      <div className="p-3 bg-amber-950/70 border border-amber-500/60 rounded-lg text-center space-y-1.5 shadow-inner">
                        <div className="flex items-center justify-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                          <Music className="w-3.5 h-3.5 animate-spin" /> Call On Hold
                        </div>
                        <div className="text-xs font-semibold text-amber-300 flex items-center justify-center gap-1.5 py-0.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                          Hold Music Playing
                        </div>
                        <div className="text-xs font-mono text-indigo-300 font-semibold truncate">
                          {number || clientPhone || "Active Customer"}
                        </div>
                        {onResumeCall && (
                          <button
                            type="button"
                            onClick={onResumeCall}
                            className="mt-1 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-2 rounded text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3" /> Resume Call
                          </button>
                        )}
                      </div>
                    );
                  }

                  // Default CONNECTED state
                  return (
                    <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-lg text-center space-y-1 shadow-inner">
                      <div className="flex items-center justify-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Call Connected
                      </div>
                      <div className="text-2xl font-extrabold font-mono text-white tracking-widest py-0.5">
                        {formatTime(activeCallDuration)}
                      </div>
                      <div className="text-xs font-mono text-indigo-300 font-semibold truncate">
                        {number || clientPhone || "Active Customer"}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <>
                  <p className="text-xs text-indigo-300 font-semibold text-center leading-tight">Enter phone number to dial manually</p>
                  <input 
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="bg-slate-900 border border-indigo-500/50 text-center text-xl font-mono text-white h-12 rounded focus:outline-none focus:border-indigo-400"
                    placeholder="Phone Number"
                  />
                </>
              )}
              <div className="grid grid-cols-3 gap-2 px-2">
                {dialPad.map((key) => (
                  <button
                    key={key.label}
                    type="button"
                    onClick={() => setNumber(prev => prev + key.label)}
                    disabled={callActive}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded py-2 flex flex-col items-center justify-center transition-colors active:scale-95 disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
                  >
                    <span className="text-lg font-bold text-white leading-none">{key.label}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase h-2 mt-0.5">{key.sub}</span>
                  </button>
                ))}
              </div>
              
              {callActive ? (
                <button 
                  onClick={onCallEnd}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded shadow-lg shadow-rose-900/50 uppercase tracking-widest text-sm flex items-center justify-center gap-2 animate-pulse cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" /> End Call
                </button>
              ) : (
                <button 
                  onClick={onCallStart}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded shadow-lg shadow-emerald-900/50 uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Phone className="w-4 h-4" /> Call
                </button>
              )}
            </div>

        {/* Audio Controls */}
        <div className="p-4 border-b border-indigo-900/50 grid grid-cols-4 gap-2 shrink-0">
          <button 
            onClick={() => setMuted?.(!muted)} 
            className={`flex flex-col items-center justify-center p-2 rounded border transition-colors cursor-pointer ${
              muted ? "bg-rose-500/20 border-rose-500/50 text-rose-400" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            {muted ? <MicOff className="w-4 h-4 mb-1" /> : <Mic className="w-4 h-4 mb-1" />}
            <span className="text-[9px] uppercase font-bold tracking-widest">{muted ? "Muted" : "Mute"}</span>
          </button>

          <button 
            onClick={() => setSpeakerOn(!speakerOn)}
            className={`flex flex-col items-center justify-center p-2 rounded border transition-colors cursor-pointer ${
              speakerOn ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            <Volume2 className="w-4 h-4 mb-1" />
            <span className="text-[9px] uppercase font-bold tracking-widest">{speakerOn ? "Spkr On" : "Spkr"}</span>
          </button>

          <button 
            onClick={handleToggleRecord} 
            className={`flex flex-col items-center justify-center p-2 rounded border transition-colors cursor-pointer ${
              autoRecord ? "bg-rose-500/20 border-rose-500/50 text-rose-400" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            <Disc className={`w-4 h-4 mb-1 ${autoRecord && callActive ? "animate-pulse" : ""}`} />
            <span className="text-[9px] uppercase font-bold tracking-widest">{autoRecord ? "Rec On" : "Rec Off"}</span>
          </button>

          <button 
            onClick={callActive ? onCallEnd : undefined}
            disabled={!callActive}
            className="flex flex-col items-center justify-center p-2 rounded border bg-slate-800 border-slate-700 text-slate-400 hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
          >
            <PhoneOff className="w-4 h-4 mb-1" />
            <span className="text-[9px] uppercase font-bold tracking-widest">End Call</span>
          </button>
        </div>

        {/* Call Metadata Information */}
        <div className="p-4 text-xs font-mono text-slate-400 space-y-2 mt-auto">
          <div className="flex justify-between border-b border-slate-800 pb-1">
            <span>Call Duration:</span>
            <span className={callActive ? "text-emerald-400 font-bold font-mono" : "text-white"}>
              {callActive ? formatTime(activeCallDuration) : "00:00:00"}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1">
            <span>Record ID:</span>
            <span className="text-white">{callActive ? (recordId !== "—" ? recordId : `REC-${(callId || "847291").slice(0, 6)}`) : "—"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1">
            <span>Recording:</span>
            <span className="text-white">{autoRecord && callActive ? (recordingFile !== "—" ? recordingFile : "active_rec.wav") : "—"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1">
            <span>Active Lead:</span>
            <span className="text-indigo-300 font-semibold truncate max-w-[120px]">{clientName || "—"}</span>
          </div>
        </div>
          </div>
        )}
        
        {activeTab === "qualified" && <QualifiedCustomersTab onCallRequest={(num) => { setNumber(num); setActiveTab("phone"); }} />}
        {activeTab === "create_client" && <CreateClientTab onSuccess={() => setActiveTab("assigned_clients")} />}
        {activeTab === "assigned_clients" && <AssignedClientsTab onCallRequest={(num) => { setNumber(num); setActiveTab("phone"); }} />}
      </div>

      {/* Bottom Navigation Tabs */}
      <div className="flex border-t border-indigo-900/50 shrink-0 bg-slate-900 mt-auto">
        <button 
          onClick={() => setActiveTab("phone")}
          className={`flex-1 py-3 flex justify-center border-t-2 cursor-pointer transition-colors ${activeTab === "phone" ? "border-indigo-500 text-indigo-400 bg-slate-800/30" : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/20"}`}
          title="Dialer"
        >
          <Phone className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setActiveTab("qualified")}
          className={`flex-1 py-3 flex justify-center border-t-2 cursor-pointer transition-colors ${activeTab === "qualified" ? "border-indigo-500 text-indigo-400 bg-slate-800/30" : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/20"}`}
          title="Qualified Customers"
        >
          <Users className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setActiveTab("create_client")}
          className={`flex-1 py-3 flex justify-center border-t-2 cursor-pointer transition-colors ${activeTab === "create_client" ? "border-indigo-500 text-indigo-400 bg-slate-800/30" : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/20"}`}
          title="Create Client"
        >
          <UserPlus className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setActiveTab("assigned_clients")}
          className={`flex-1 py-3 flex justify-center border-t-2 cursor-pointer transition-colors ${activeTab === "assigned_clients" ? "border-indigo-500 text-indigo-400 bg-slate-800/30" : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/20"}`}
          title="Assigned Clients"
        >
          <UserCheck className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}


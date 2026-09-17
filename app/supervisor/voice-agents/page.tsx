"use client";

import { useAuthStore } from "@/lib/store";
import { useEffect, useState, useRef } from "react";
import { DialControlPanel } from "@/components/DialControlPanel";
import { leadService, Lead } from "@/lib/services/lead.service";
import { campaignService } from "@/lib/services/campaign.service";
import { callService } from "@/lib/services/call.service";
import { Play, Pause, Phone, CheckCircle2, XCircle, PhoneForwarded } from "lucide-react";
import { VoiceAgentTransferModal } from "@/components/VoiceAgentTransferModal";
// @ts-ignore
import WhatsAppPanel from "@/components/messages/whatsapp/WhatsAppPanel";
// @ts-ignore
import EmailPanel from "@/components/messages/email/EmailPanel";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { leadAssignmentService, QueueItem, LeadAssignmentRecord } from "@/lib/services/lead-assignment.service";
import { AppShell } from "@/components/AppShell";
import { VoiceAgentSidebar } from "@/components/VoiceAgentSidebar";
import dynamic from "next/dynamic";
const ReportPage = dynamic(() => import("../../voice-agent/report/page"), { ssr: false });

export default function SupervisorVoiceAgentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tab = searchParams.get("tab");
  const { user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  

  // Category tab state for assigned leads
  const [categoryTab, setCategoryTab] = useState<"ACTIVE" | "REQUESTED" | "HISTORY">("ACTIVE");
  // Upper Tab state
  const [upperTab, setUpperTab] = useState<"CUSTOMER" | "SCRIPT" | "QUEUE">("CUSTOMER");
  // Lower Left Tab state
  const [lowerTab, setLowerTab] = useState<"DETAILS" | "LIVE">("DETAILS");

  // Call History State
  const [showDispo, setShowDispo] = useState(false);
  const [dispoList, setDispoList] = useState<string[]>([]);
  const [dispoOption, setDispoOption] = useState("Sale / Success");
  const [customDispo, setCustomDispo] = useState("");
  const [historyCalls, setHistoryCalls] = useState<any[]>([
    { id: 1, phone: "+1 (555) 019-2834", duration: 222, status: "Completed", dispo: "Sale", time: "10 mins ago", hasRecording: true }
  ]);

  // Queue & Assignments state
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [assignments, setAssignments] = useState<LeadAssignmentRecord[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<LeadAssignmentRecord | null>(null);

  // Leads data for placeholder interaction
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // --- Voice Agent Live State ---
  const [number, setNumber] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);

  // Predictive Dialer (PD) state
  const [pdActive, setPdActive] = useState<boolean>(false);
  const [isPdLoading, setIsPdLoading] = useState<boolean>(false);

  // Voice Agent Internal Transfer state
  const [showVoiceAgentTransferModal, setShowVoiceAgentTransferModal] = useState(false);
  const [transferredInfo, setTransferredInfo] = useState<{
    targetAgentName: string;
    transferType: "warm" | "cold";
    transferredAt: string;
  } | null>(null);

  const fetchPdStatus = async () => {
    try {
      const res = await campaignService.getActivePdStatus();
      setPdActive(Boolean(res.auto_dial_enabled || res.status === "ACTIVE"));
    } catch (err) {
      console.error("Error fetching PD status in supervisor:", err);
    }
  };

  useEffect(() => {
    fetchPdStatus();
  }, []);

  const handleTogglePd = async () => {
    setIsPdLoading(true);
    try {
      const res = await campaignService.toggleActivePdStatus(!pdActive);
      setPdActive(Boolean(res.auto_dial_enabled || res.status === "ACTIVE"));
    } catch (err: any) {
      console.error("Failed to toggle PD state in supervisor:", err);
      alert(err?.message || "Failed to toggle Predictive Dialer state.");
    } finally {
      setIsPdLoading(false);
    }
  };
  
  // Session Stats
  const [totalCalls, setTotalCalls] = useState(0);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayRecording = (id: number, url?: string) => {
    if (playingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // Only play if a real recording URL is provided
      if (!url) return;
      const audio = new Audio(url);
      audio.play().catch(console.error);
      audio.onended = () => setPlayingId(null);
      audioRef.current = audio;
      setPlayingId(id);
    }
  };


  const [totalTime, setTotalTime] = useState(0); // in seconds
  const [callDuration, setCallDuration] = useState(0); // active call duration
  
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Helper to format seconds as HH:MM:SS
  const formatTime = (seconds: number) => {
    return `${seconds * 1000} ms`;
  };

  useEffect(() => {
    setHydrated(true);
    // Fetch dynamic dispositions
    callService.getDispositions().then((data) => {
      setDispoList(data);
      if (data.length > 0) setDispoOption(data[0]);
    }).catch(console.error);

    const loadAllData = () => {
      leadService.list().then((data) => {
        const voiceLeads = data.filter(l => l.requirement?.toLowerCase().includes("voice"));
        if (voiceLeads.length > 0) {
          setLeads(voiceLeads);
          setActiveLead((prev) => prev || voiceLeads[0]);
        } else if (data.length > 0) {
          setLeads(data);
          setActiveLead((prev) => prev || data[0]);
        } else {
          setLeads([]);
          setActiveLead(null);
        }
      }).catch(console.error);
      leadAssignmentService.getQueue("WAITING").then(setQueueItems).catch(console.error);
      leadAssignmentService.getMyAssignments().then(setAssignments).catch(console.error);
    };
    loadAllData();
  }, []);

  // Timer effect for active call
  useEffect(() => {
    if (callActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
        setTotalTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
  
  return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callActive]);

  const handleCallStart = () => {
    if (!number && !activeLead?.phone) return;
    if (!number && activeLead?.phone) setNumber(activeLead.phone);
    setCallActive(true);
    setCallDuration(0);
    setTotalCalls((prev) => prev + 1);
  };

  const handleCallEnd = () => {
    setShowDispo(true);
  };

  const handleDialNext = () => {
    if (leads.length > 0) {
      const currentIndex = leads.findIndex(l => l.id === activeLead?.id);
      const nextIndex = (currentIndex + 1) % leads.length;
      const nextLead = leads[nextIndex];
      setActiveLead(nextLead);
      setNumber(nextLead.phone || "");
    }
    setCallActive(true);
    setCallDuration(0);
    setTotalCalls((prev) => prev + 1);
  };

  const handleDispoSubmit = (dispoType: string) => {
    setCallActive(false);
    setShowDispo(false);
    
    setHistoryCalls(prev => [{
      id: Date.now(),
      phone: number || activeLead?.phone || "Unknown",
      duration: callDuration,
      status: "Completed",
      dispo: dispoType,
      time: "Just now",
      hasRecording: true
    }, ...prev]);
  };

  if (!hydrated || !user) return null;

  const agentStatus = paused ? "Paused" : (callActive ? "Busy" : "Available");


  // Filter assignments into categories
  const activeAssignments = assignments.filter(a => a.status === "ACTIVE");
  const historyAssignments = assignments.filter(a => a.status === "REASSIGNED" || a.status === "COMPLETED");
  const myRequestedQueue = queueItems.filter(q => q.requested_expert_name?.toLowerCase() === (user?.full_name || "").toLowerCase());

  return (
    <AppShell>
      <div className="flex h-full animate-in fade-in duration-300 bg-slate-200/50 select-none -m-6 rounded-tl-2xl overflow-hidden relative flex-1">
        <VoiceAgentSidebar basePath="/supervisor/voice-agents" />
      
      {/* Main Central Workspace */}
      <div className="flex-1 flex flex-col min-w-0 p-4 gap-4 overflow-y-auto">
        
        {tab === "messages" ? (
          <div className="flex flex-col gap-4 min-h-0 flex-1">
            <div className="flex items-center justify-between bg-white border border-slate-300 rounded p-3 shadow-sm shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-700">Messages Workspace</span>
              </div>
              <button 
                onClick={() => router.push("/voice-agent/dashboard")}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                title="Close Messages"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-4 shrink-0 min-h-0 flex-1">
              <div className="flex-1 bg-white border border-slate-300 rounded shadow-sm flex overflow-hidden">
                <WhatsAppPanel />
              </div>
              <div className="flex-1 bg-white border border-slate-300 rounded shadow-sm flex overflow-hidden">
                <EmailPanel />
              </div>
            </div>
          </div>
        ) : tab === "status" ? (
          <div className="flex flex-col gap-4 min-h-0 flex-1">
            <div className="flex items-center justify-between bg-white border border-slate-300 rounded p-3 shadow-sm shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-700">Status</span>
              </div>
              <button 
                onClick={() => router.push("/voice-agent/dashboard")}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                title="Close Status"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white border border-slate-300 rounded shadow-sm flex flex-col flex-1 min-h-0">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <p className="text-slate-600 font-bold text-sm">Agent is currently {agentStatus}.</p>
              </div>
              <div className="flex border-b border-slate-200 bg-slate-100/50 shrink-0">
                <button onClick={() => setLowerTab("DETAILS")} className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider border-r border-slate-200 ${lowerTab === "DETAILS" ? "bg-white text-indigo-600 shadow-[0_-2px_0_inset_#4f46e5]" : "text-slate-500 hover:text-slate-700"}`}>Call Detail</button>
                <button onClick={() => setLowerTab("LIVE")} className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider border-r border-slate-200 ${lowerTab === "LIVE" ? "bg-white text-indigo-600 shadow-[0_-2px_0_inset_#4f46e5]" : "text-slate-500 hover:text-slate-700"}`}>Call History</button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                {lowerTab === "DETAILS" && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase">Customer Time</label><span className="font-medium">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase">Channel</label><span className="font-medium">Voice (PSTN)</span></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase">Call ID</label><span className="font-mono text-xs">{callActive ? "CL-99120349" : "—"}</span></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase">Direction</label><span className="font-medium text-blue-600 font-bold">Outbound</span></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase">Customer Info</label><span className="font-medium">{number || activeLead?.phone || "—"}</span></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase">Duration</label><span className="font-mono font-medium">{formatTime(callDuration)}</span></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase">Call Status</label>
                      <span className={`font-medium flex items-center gap-1 ${callActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {callActive ? <><CheckCircle2 className="w-3.5 h-3.5"/> Active</> : <><XCircle className="w-3.5 h-3.5" /> Disconnected</>}
                      </span>
                    </div>
                  </div>
                )}
                {lowerTab === "LIVE" && (
                  <div className="text-sm text-slate-500 flex flex-col gap-2">
                    {historyCalls.map((call, idx) => (
                      <div key={`${call.id || 'call'}-${idx}`} className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100 hover:border-indigo-100 transition-colors group">
                        <div>
                          <div className="font-bold text-slate-700">{call.phone}</div>
                          {call.dispo && <div className="text-[10px] uppercase font-bold text-indigo-600">{call.dispo}</div>}
                          <div className="text-[10px] uppercase">Outbound - {call.status}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          {call.hasRecording && (
                            <button 
                              onClick={() => handlePlayRecording(call.id)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all shadow-sm ${
                                playingId === call.id 
                                  ? 'text-indigo-600 bg-indigo-50 border border-indigo-200 opacity-100' 
                                  : 'text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 opacity-0 group-hover:opacity-100'
                              }`}
                              title={playingId === call.id ? "Stop Recording" : "Play Recording"}
                            >
                              {playingId === call.id ? (
                                <Pause className="w-3.5 h-3.5 animate-pulse" />
                              ) : (
                                <Play className="w-3.5 h-3.5" />
                              )}
                              <span className="text-[9px] uppercase font-bold tracking-widest">
                                {playingId === call.id ? "Playing" : "Listen"}
                              </span>
                            </button>
                          )}
                          <div className="text-right">
                            <div className="font-mono font-bold text-slate-600">{formatTime(call.duration)}</div>
                            <div className="text-[10px] text-slate-400">{call.time}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>

        <div className="grid grid-cols-5 gap-4 shrink-0">
          {[
            { label: "Total Calls", value: totalCalls.toString() },
            { label: "Total Time", value: formatTime(totalTime) },
            { label: "Agent Status", value: agentStatus, highlight: !paused && !callActive, busy: callActive, paused: paused },
            { label: "Calls in Queue", value: paused ? "2" : "1" },
            { label: "Calls on Hold", value: callActive ? "1" : "0" },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-slate-300 rounded shadow-sm p-3 text-center flex flex-col justify-center transition-all">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className={`text-xl font-extrabold tracking-tight ${stat.highlight ? 'text-emerald-600' : (stat.busy ? 'text-rose-600' : (stat.paused ? 'text-amber-500' : 'text-slate-900'))}`}>
                {stat.value}
              </h3>
            </div>
          ))}
        </div>

        {/* Active Call Bar (Only shows when call is active) */}
        <div className={`transition-all duration-300 overflow-hidden ${callActive ? "h-14 opacity-100" : "h-0 opacity-0 mb-[-1rem]"} bg-emerald-50 text-emerald-900 border border-emerald-200 rounded shadow-sm px-3 flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer">
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
            <button 
              onClick={() => setShowVoiceAgentTransferModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              <PhoneForwarded className="w-3.5 h-3.5" /> Transfer to Agent
            </button>
            <div className="text-sm font-bold flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Live Call <span className="font-mono ml-2 opacity-70">{formatTime(callDuration)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            {transferredInfo && (
              <span className="bg-purple-600 text-white px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <PhoneForwarded className="w-3 h-3" /> Transferred to {transferredInfo.targetAgentName}
              </span>
            )}
            <span className="opacity-70 uppercase text-xs font-bold tracking-widest">Outbound</span>
            <span className="font-mono bg-white/50 px-2 py-0.5 rounded border border-emerald-200">
              {number || activeLead?.phone}
            </span>
            <span className="opacity-70 text-xs font-mono ml-2">UID: TZ{Math.floor(Date.now() / 1000)}</span>
          </div>
        </div>

        {/* Transferred Badge Banner */}
        {transferredInfo && (
          <div className="bg-purple-50 text-purple-900 border border-purple-200 rounded shadow-sm px-3 py-2 text-xs font-semibold flex items-center justify-between shrink-0 animate-in fade-in">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
              Call transferred to Voice Agent <strong className="font-extrabold">{transferredInfo.targetAgentName}</strong> ({transferredInfo.transferType.toUpperCase()} TRANSFER)
            </span>
            <span className="text-[11px] text-purple-700 font-mono">Transferred at {transferredInfo.transferredAt}</span>
          </div>
        )}

                      {/* ASSIGNED LEADS BAR & CATEGORY SELECTOR */}
            <div className="bg-white border border-slate-300 rounded shadow-sm p-3 shrink-0 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCategoryTab("ACTIVE")}
                    className={`text-xs font-extrabold uppercase tracking-wider pb-1 transition-all ${
                      categoryTab === "ACTIVE" 
                        ? "text-indigo-600 border-b-2 border-indigo-600" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Active Leads ({activeAssignments.length})
                  </button>
                  <button 
                    onClick={() => setCategoryTab("REQUESTED")}
                    className={`text-xs font-extrabold uppercase tracking-wider pb-1 transition-all ${
                      categoryTab === "REQUESTED" 
                        ? "text-purple-600 border-b-2 border-purple-600" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    My Requested Queue ({myRequestedQueue.length})
                  </button>
                  <button 
                    onClick={() => setCategoryTab("HISTORY")}
                    className={`text-xs font-extrabold uppercase tracking-wider pb-1 transition-all ${
                      categoryTab === "HISTORY" 
                        ? "text-slate-800 border-b-2 border-slate-800" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Reassignment History ({historyAssignments.length})
                  </button>
                </div>

                <span className="text-xs text-slate-400 font-mono">
                  Live Sync (5s)
                </span>
              </div>

              {/* Items Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                {categoryTab === "ACTIVE" && (
                  activeAssignments.length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-1">No active leads assigned yet. Waiting for incoming AI call transfers or qualified leads.</div>
                  ) : (
                    activeAssignments.map((item) => {
                      const isActive = activeAssignment?.id === item.id;
                      const source = item.trigger_source || "TALK_TO_AGENT";
                      const isSpecific = source === "SPECIFIC_AGENT_REQUEST";
                      const isTalkToAgent = source === "TALK_TO_AGENT";
                      const isQualified = source === "QUALIFIED_LEAD";

                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveAssignment(item)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                            isActive
                              ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span>{item.context?.lead_name || item.lead_id.slice(0, 8)}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                              isSpecific
                                ? "bg-purple-600 text-white"
                                : isTalkToAgent
                                ? "bg-indigo-600 text-white"
                                : isQualified
                                ? "bg-emerald-600 text-white"
                                : "bg-amber-500 text-white"
                            }`}
                          >
                            {isSpecific ? "Requested Agent" : isTalkToAgent ? "Talk to Agent" : isQualified ? "Qualified Lead" : "Queue Auto"}
                          </span>
                        </button>
                      );
                    })
                  )
                )}

                {categoryTab === "REQUESTED" && (
                  myRequestedQueue.length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-1">No pending leads specifically waiting for you in queue.</div>
                  ) : (
                    myRequestedQueue.map((q) => (
                      <div key={q.id} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-purple-200 bg-purple-50 text-purple-900 text-xs font-semibold shrink-0">
                        <span>{q.lead_name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-600 text-white font-bold uppercase">
                          Waiting for You
                        </span>
                      </div>
                    ))
                  )
                )}

                {categoryTab === "HISTORY" && (
                  historyAssignments.length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-1">No reassigned lead history.</div>
                  ) : (
                    historyAssignments.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveAssignment(item)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-rose-200 bg-rose-50 text-rose-900 text-xs font-semibold shrink-0"
                      >
                        <span>{item.context?.lead_name || item.lead_id.slice(0, 8)}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-600 text-white font-bold uppercase">
                          Reassigned
                        </span>
                      </button>
                    ))
                  )
                )}
              </div>
            </div>

        {/* CUSTOMER DATA SECTION */}
          <div className="bg-white border border-slate-300 rounded shadow-sm flex flex-col shrink-0 min-h-[250px]">
            <div className="flex border-b border-slate-200 bg-slate-100/50">
              <button onClick={() => setUpperTab("CUSTOMER")} className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider border-r border-slate-200 ${upperTab === "CUSTOMER" ? "bg-white text-indigo-600 shadow-[0_-2px_0_inset_#4f46e5]" : "text-slate-500 hover:text-slate-700"}`}>Customer Data</button>
              <button onClick={() => setUpperTab("SCRIPT")} className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider border-r border-slate-200 ${upperTab === "SCRIPT" ? "bg-white text-indigo-600 shadow-[0_-2px_0_inset_#4f46e5]" : "text-slate-500 hover:text-slate-700"}`}>Agent Script</button>
              <button onClick={() => setUpperTab("QUEUE")} className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider border-r border-slate-200 ${upperTab === "QUEUE" ? "bg-white text-indigo-600 shadow-[0_-2px_0_inset_#4f46e5]" : "text-slate-500 hover:text-slate-700"}`}>Queue & Transfers ({queueItems.length})</button>
            </div>
            {/* LOWER WORKSPACE (Split 50/50) */}
        <div className="flex gap-4 flex-1 min-h-0">
          
          <div className="flex-1 bg-white border border-slate-300 rounded shadow-sm flex flex-col">
            <div className="p-4 flex-1 overflow-y-auto">
              {upperTab === "CUSTOMER" && (
                <div className="grid grid-cols-2 gap-6 text-sm bg-slate-50 border border-slate-100 rounded-lg p-5">
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">First Name</label><span className="font-semibold text-slate-800">{activeLead?.first_name || "—"}</span></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Last Name</label><span className="font-semibold text-slate-800">{activeLead?.last_name || "—"}</span></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label><span className="font-semibold text-slate-800">{activeLead?.email || "—"}</span></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label><span className="font-semibold text-slate-800">{activeLead?.phone || "—"}</span></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Location</label><span className="font-semibold text-slate-800">{activeLead?.location || "—"}</span></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Requirement</label><span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{activeLead?.requirement || "—"}</span></div>
                </div>
              )}
              {upperTab === "SCRIPT" && (
                <div className="text-sm prose prose-sm max-w-none text-slate-700">
                  <p><strong>Opening:</strong> "Hi, am I speaking with {activeLead?.first_name || "the business owner"}? My name is {user.full_name}, calling from CallZenza."</p>
                  <p><strong>Hook:</strong> "We noticed you've been looking into AI voice agents..."</p>
                </div>
              )}
              {upperTab === "QUEUE" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase">Waiting Queue & Recent Handoffs</span>
                    <button
                      onClick={async () => {
                        await leadAssignmentService.processQueue();
                        const q = await leadAssignmentService.getQueue("WAITING");
                        setQueueItems(q);
                        const a = await leadAssignmentService.getMyAssignments();
                        setAssignments(a);
                      }}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Process Queue Now
                    </button>
                  </div>
                  {queueItems.length === 0 ? (
                    <p className="text-xs text-slate-400">No leads currently waiting in queue.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {queueItems.map((q: any) => (
                        <div key={q.id} className="p-2 bg-amber-50 border border-amber-200 rounded text-xs flex justify-between items-center">
                          <span className="font-bold text-amber-900">{q.lead_name} ({q.phone})</span>
                          <span className="text-[10px] text-amber-700 uppercase font-bold">Reason: {q.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      </>
    )}

  </div>

      <DialControlPanel 
        number={number}
        setNumber={setNumber}
        callActive={callActive}
        setCallActive={setCallActive}
        paused={paused}
        setPaused={setPaused}
        muted={muted}
        setMuted={setMuted}
        onCallStart={handleCallStart}
        onCallEnd={handleCallEnd}
        onDialNext={handleDialNext}
        pdActive={pdActive}
        onTogglePd={handleTogglePd}
        isPdLoading={isPdLoading}
      />

      {/* Dispo Modal */}
      {showDispo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-[400px] overflow-hidden">
            <div className="p-4 bg-indigo-600 text-white font-bold tracking-widest text-sm uppercase">
              Call Disposition
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm mb-4">Please select the outcome (Dispo) for this call:</p>
              <select 
                value={dispoOption}
                onChange={(e) => setDispoOption(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded mb-4 text-sm focus:outline-none focus:border-indigo-500"
              >
                {dispoList.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="Others">Others</option>
              </select>
              
              {dispoOption === "Others" && (
                <input 
                  type="text" 
                  value={customDispo}
                  onChange={(e) => setCustomDispo(e.target.value)}
                  placeholder="Type custom disposition..." 
                  autoFocus
                  className="w-full p-2.5 border border-slate-300 rounded mb-6 text-sm focus:outline-none focus:border-indigo-500" 
                />
              )}
              <div className={`flex justify-end gap-3 ${dispoOption !== "Others" ? 'mt-2' : ''}`}>
                <button onClick={() => setShowDispo(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                <button onClick={() => {
                  let finalDispo = dispoOption;
                  if (dispoOption === "Others" && customDispo.trim()) {
                    finalDispo = customDispo.trim();
                  }
                  handleDispoSubmit(finalDispo);
                  setDispoOption(dispoList.length > 0 ? dispoList[0] : "Sale / Success");
                  setCustomDispo("");
                }} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded shadow-sm transition-colors uppercase tracking-wider">OK</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Agent Transfer Modal */}
      <VoiceAgentTransferModal
        isOpen={showVoiceAgentTransferModal}
        onClose={() => setShowVoiceAgentTransferModal(false)}
        callId={(activeAssignment as any)?.call_id || activeAssignment?.context?.call_id || "CL-SUP-ACTIVE"}
        clientId={activeAssignment?.lead_id}
        onTransferSuccess={(targetAgent, type) => {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setTransferredInfo({
            targetAgentName: targetAgent.name || "Voice Agent",
            transferType: type,
            transferredAt: nowStr,
          });
          if (type === "cold") {
            setCallActive(false);
          }
        }}
      />

      </div>
    </AppShell>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft, Filter, Plus, RefreshCw, X, Phone, UserCheck, AlertCircle, CheckCircle } from "lucide-react";

import { apiFetch } from "@/lib/api-client";

interface CallCardData {
  id: string;
  displayId?: string;
  customer: string;
  phone: string;
  campaign: string;
  agent: string;
  priority: "HIGH" | "NORMAL";
  stage: string;
  extraLabel1?: string;
  extraVal1?: string;
  extraLabel2?: string;
  extraVal2?: string;
  aiStatus?: string;
}

export default function RealTimeWhiteboardReportPage() {
  // Sync Time State
  const [syncTime, setSyncTime] = useState<string>("");

  // Options loaded from backend
  const [campaignOptions, setCampaignOptions] = useState<any[]>([]);
  const [agentOptions, setAgentOptions] = useState<any[]>([]);

  // Draft Filters State
  const [selectedCampaign, setSelectedCampaign] = useState("All Campaigns");
  const [selectedAgent, setSelectedAgent] = useState("All AI Agents");
  const [selectedPriority, setSelectedPriority] = useState("All Priorities");
  const [searchQuery, setSearchQuery] = useState("");

  // Applied Filters State
  const [appliedFilters, setAppliedFilters] = useState({
    campaign: "All Campaigns",
    agent: "All AI Agents",
    priority: "All Priorities",
    search: "",
  });
  const [isApplying, setIsApplying] = useState(false);

  // Selected Call Modal State
  const [selectedCall, setSelectedCall] = useState<CallCardData | null>(null);
  const [liveCalls, setLiveCalls] = useState<any[]>([]);

  // Add Call Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addCustomerName, setAddCustomerName] = useState("");
  const [addCustomerPhone, setAddCustomerPhone] = useState("");
  const [addCampaign, setAddCampaign] = useState("");
  const [addPriority, setAddPriority] = useState<"HIGH" | "NORMAL">("NORMAL");
  const [isAddingCall, setIsAddingCall] = useState(false);
  const [addCallFeedback, setAddCallFeedback] = useState<string | null>(null);

  useEffect(() => {
    const updateClock = () => {
      setSyncTime(new Date().toLocaleTimeString());
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load real campaigns and agents for dropdowns
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const camps = await apiFetch<any[]>("/api/campaigns");
        if (Array.isArray(camps)) {
          setCampaignOptions(camps);
        }
      } catch (err) {
        console.warn("Could not load campaigns for whiteboard:", err);
      }

      try {
        const agents = await apiFetch<any[]>("/api/voice-agents");
        if (Array.isArray(agents)) {
          setAgentOptions(agents);
        }
      } catch (err) {
        console.warn("Could not load agents for whiteboard:", err);
      }
    };
    loadDropdownData();
  }, []);

  const fetchLiveCalls = async () => {
    try {
      const calls = await apiFetch<any[]>("/api/voice/calls");
      if (Array.isArray(calls)) {
        setLiveCalls(calls);
      }
    } catch (err) {
      console.error("Failed to fetch whiteboard live calls:", err);
    }
  };

  useEffect(() => {
    fetchLiveCalls();
    const interval = setInterval(fetchLiveCalls, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle Apply button click
  const handleApply = () => {
    setIsApplying(true);
    setAppliedFilters({
      campaign: selectedCampaign,
      agent: selectedAgent,
      priority: selectedPriority,
      search: searchQuery.trim(),
    });
    fetchLiveCalls();
    setTimeout(() => setIsApplying(false), 300);
  };

  // Handle Reset button click
  const handleReset = () => {
    setSelectedCampaign("All Campaigns");
    setSelectedAgent("All AI Agents");
    setSelectedPriority("All Priorities");
    setSearchQuery("");
    setAppliedFilters({
      campaign: "All Campaigns",
      agent: "All AI Agents",
      priority: "All Priorities",
      search: "",
    });
    fetchLiveCalls();
  };

  const openCallModal = (call: CallCardData) => {
    setSelectedCall(call);
  };

  const closeCallModal = () => {
    setSelectedCall(null);
  };

  // Handle Add Call Form Submission
  const handleAddCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCustomerName.trim() || !addCustomerPhone.trim()) {
      setAddCallFeedback("Please enter both customer name and phone number.");
      return;
    }

    setIsAddingCall(true);
    setAddCallFeedback(null);

    const newCallId = `CZ-${Math.floor(10000 + Math.random() * 90000)}`;
    const newCallRecord = {
      id: newCallId,
      client_name: addCustomerName.trim(),
      client_phone: addCustomerPhone.trim(),
      to_number: addCustomerPhone.trim(),
      campaign_id: addCampaign || (campaignOptions[0]?.name ?? "General Campaign"),
      agent_type: "AI Voice",
      status: "QUEUED",
      created_at: new Date().toISOString(),
      priority: addPriority,
    };

    try {
      // Try to persist lead via apiFetch
      await apiFetch("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          first_name: addCustomerName.trim(),
          phone: addCustomerPhone.trim(),
          status: "Ready",
          requirement: `Added via Whiteboard (${addCampaign || "General Campaign"})`,
        }),
      });
    } catch (err) {
      console.warn("Persisting lead note:", err);
    }

    // Add directly to liveCalls state so it immediately appears in QUEUED column
    setLiveCalls((prev) => [newCallRecord, ...prev]);
    setIsAddingCall(false);
    setIsAddModalOpen(false);

    // Reset form
    setAddCustomerName("");
    setAddCustomerPhone("");
    setAddCampaign("");
    setAddPriority("NORMAL");
  };

  // Build columns dynamically from DB calls
  const queuedCalls = liveCalls
    .filter((c) => c.status === "QUEUED" || c.status === "RINGING" || c.status === "NEW")
    .map((c, i) => {
      const rawId = c.id || `CZ-${10500 + i}`;
      const campName = c.campaign_id || (campaignOptions.find((x) => x.id === c.campaign_id)?.name ?? "Sales Campaign");
      return {
        id: `queued-${rawId}-${i}`,
        displayId: c.id ? (c.id.length > 12 ? c.id.slice(0, 10) : c.id) : `CZ-${10500 + i}`,
        customer: c.client_name || c.customer_name || "Customer",
        phone: c.client_phone || c.to_number || c.phone || "—",
        campaign: campName,
        agent: c.agent_type || c.agent_name || "Voice Agent",
        priority: (c.priority === "HIGH" ? "HIGH" : "NORMAL") as "HIGH" | "NORMAL",
        stage: "Queued",
        extraLabel1: "Campaign",
        extraVal1: campName,
        extraLabel2: "Agent",
        extraVal2: c.agent_type || "AI",
      };
    });

  const dialingCalls = liveCalls
    .filter((c) => c.status === "AI_HANDLING" || c.status === "IN_PROGRESS" || c.status === "DIALING" || c.status === "CALLING")
    .map((c, i) => {
      const rawId = c.id || `CZ-${10490 + i}`;
      const campName = c.campaign_id || (campaignOptions.find((x) => x.id === c.campaign_id)?.name ?? "Follow-up");
      return {
        id: `dialing-${rawId}-${i}`,
        displayId: c.id ? (c.id.length > 12 ? c.id.slice(0, 10) : c.id) : `CZ-${10490 + i}`,
        customer: c.client_name || c.customer_name || "Customer",
        phone: c.client_phone || c.to_number || c.phone || "—",
        campaign: campName,
        agent: c.agent_type || c.agent_name || "AI Voice",
        priority: (c.priority === "HIGH" ? "HIGH" : "NORMAL") as "HIGH" | "NORMAL",
        stage: "Dialing",
        extraLabel1: "Number",
        extraVal1: "Attempt 1",
        extraLabel2: "AI Agent",
        extraVal2: c.agent_type || "AI-01",
        aiStatus: "In Progress",
      };
    });

  const connectedCalls = liveCalls
    .filter((c) => c.status === "HUMAN_HANDLING" || c.status === "CONFERENCE_3WAY_ACTIVE" || c.status === "CONNECTED" || c.status === "TALKING")
    .map((c, i) => {
      const rawId = c.id || `CZ-${10480 + i}`;
      const campName = c.campaign_id || (campaignOptions.find((x) => x.id === c.campaign_id)?.name ?? "Support");
      return {
        id: `connected-${rawId}-${i}`,
        displayId: c.id ? (c.id.length > 12 ? c.id.slice(0, 10) : c.id) : `CZ-${10480 + i}`,
        customer: c.client_name || c.customer_name || "Customer",
        phone: c.client_phone || c.to_number || c.phone || "—",
        campaign: campName,
        agent: c.agent_type || c.agent_name || "Voice Agent",
        priority: "HIGH" as const,
        stage: "Connected",
        extraLabel1: "Duration",
        extraVal1: `${Math.floor((c.duration_seconds || 120) / 60)}m ${(c.duration_seconds || 120) % 60}s`,
        extraLabel2: "Agent",
        extraVal2: c.agent_type || "Agent",
      };
    });

  const transferredCalls = liveCalls
    .filter((c) => c.status === "TRANSFER_REQUESTED" || c.status === "TRANSFERRED")
    .map((c, i) => {
      const rawId = c.id || `CZ-${10470 + i}`;
      const campName = c.campaign_id || (campaignOptions.find((x) => x.id === c.campaign_id)?.name ?? "Transfer");
      return {
        id: `transferred-${rawId}-${i}`,
        displayId: c.id ? (c.id.length > 12 ? c.id.slice(0, 10) : c.id) : `CZ-${10470 + i}`,
        customer: c.client_name || c.customer_name || "Customer",
        phone: c.client_phone || c.to_number || c.phone || "—",
        campaign: campName,
        agent: c.agent_type || c.agent_name || "Voice Agent",
        priority: "HIGH" as const,
        stage: "Transferred",
        extraLabel1: "Target",
        extraVal1: "Expert",
        extraLabel2: "Mode",
        extraVal2: "Warm",
      };
    });

  const qualifiedCalls = liveCalls
    .filter((c) => c.status === "COMPLETED" || c.status === "QUALIFIED")
    .map((c, i) => {
      const rawId = c.id || `CZ-${10460 + i}`;
      const campName = c.campaign_id || (campaignOptions.find((x) => x.id === c.campaign_id)?.name ?? "Sales");
      return {
        id: `qualified-${rawId}-${i}`,
        displayId: c.id ? (c.id.length > 12 ? c.id.slice(0, 10) : c.id) : `CZ-${10460 + i}`,
        customer: c.client_name || c.customer_name || "Customer",
        phone: c.client_phone || c.to_number || c.phone || "—",
        campaign: campName,
        agent: c.agent_type || c.agent_name || "AI",
        priority: "NORMAL" as const,
        stage: "Qualified",
        extraLabel1: "Outcome",
        extraVal1: c.call_result || "Qualified",
        extraLabel2: "Score",
        extraVal2: "92%",
      };
    });

  // Filter helper applied to cards
  const filterCard = (card: CallCardData) => {
    // 1. Search filter
    if (appliedFilters.search) {
      const q = appliedFilters.search.toLowerCase();
      const match =
        card.id.toLowerCase().includes(q) ||
        (card.displayId && card.displayId.toLowerCase().includes(q)) ||
        card.customer.toLowerCase().includes(q) ||
        card.phone.toLowerCase().includes(q) ||
        card.campaign.toLowerCase().includes(q) ||
        card.agent.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. Campaign filter
    if (appliedFilters.campaign && appliedFilters.campaign !== "All Campaigns") {
      const c = appliedFilters.campaign.toLowerCase();
      const match =
        card.campaign.toLowerCase().includes(c) ||
        (card.extraVal1 && card.extraVal1.toLowerCase().includes(c));
      if (!match) return false;
    }

    // 3. Agent filter
    if (appliedFilters.agent && appliedFilters.agent !== "All AI Agents") {
      const a = appliedFilters.agent.toLowerCase();
      const match =
        card.agent.toLowerCase().includes(a) ||
        (card.extraVal2 && card.extraVal2.toLowerCase().includes(a));
      if (!match) return false;
    }

    // 4. Priority filter
    if (appliedFilters.priority && appliedFilters.priority !== "All Priorities") {
      const targetP = appliedFilters.priority.toUpperCase().includes("HIGH") ? "HIGH" : "NORMAL";
      if (card.priority !== targetP) return false;
    }

    return true;
  };

  const filteredQueued = queuedCalls.filter(filterCard);
  const filteredDialing = dialingCalls.filter(filterCard);
  const filteredConnected = connectedCalls.filter(filterCard);
  const filteredTransferred = transferredCalls.filter(filterCard);
  const filteredQualified = qualifiedCalls.filter(filterCard);

  const columnsData: { stage: string; count: number; cards: CallCardData[] }[] = [
    {
      stage: "QUEUED",
      count: filteredQueued.length,
      cards: filteredQueued,
    },
    {
      stage: "DIALING",
      count: filteredDialing.length,
      cards: filteredDialing,
    },
    {
      stage: "CONNECTED",
      count: filteredConnected.length,
      cards: filteredConnected,
    },
    {
      stage: "TRANSFERRED",
      count: filteredTransferred.length,
      cards: filteredTransferred,
    },
    {
      stage: "QUALIFIED",
      count: filteredQualified.length,
      cards: filteredQualified,
    },
  ];

  const hasActiveFilters =
    selectedCampaign !== "All Campaigns" ||
    selectedAgent !== "All AI Agents" ||
    selectedPriority !== "All Priorities" ||
    searchQuery !== "";

  return (
    <AppShell>
      <div className="p-4 md:p-7 w-full max-w-[1500px] mx-auto bg-[#f5f7fb] min-h-screen text-[#172033]">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-semibold transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1 text-slate-900">
              Real-Time Whiteboard Report
            </h1>
            <p className="text-slate-500 text-xs md:text-sm">
              Live visual workspace for monitoring the movement of calls and leads.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-white border border-[#e1e6ed] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs self-start sm:self-center">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Whiteboard Live
          </div>
        </div>

        {/* CONTROLS & FILTER BAR */}
        <div className="bg-white border border-[#e1e6ed] p-4 rounded-2xl flex flex-wrap items-center gap-3 mb-6 shadow-xs">
          
          {/* Campaign Selector */}
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="h-9 min-w-[180px] border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500 transition-colors"
          >
            <option value="All Campaigns">All Campaigns</option>
            {campaignOptions.map((c) => (
              <option key={c.id} value={c.name || c.id}>
                {c.name || c.id}
              </option>
            ))}
            {campaignOptions.length === 0 && (
              <>
                <option value="Sales Campaign">Sales Campaign</option>
                <option value="Lead Generation">Lead Generation</option>
                <option value="Customer Follow-up">Customer Follow-up</option>
              </>
            )}
          </select>

          {/* Agent Selector */}
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="h-9 min-w-[180px] border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500 transition-colors"
          >
            <option value="All AI Agents">All AI Agents</option>
            {agentOptions.map((a) => (
              <option key={a.id} value={a.name || a.id}>
                {a.name || a.id}
              </option>
            ))}
            {agentOptions.length === 0 && (
              <>
                <option value="AI Agent 01">AI Agent 01</option>
                <option value="AI Agent 02">AI Agent 02</option>
                <option value="AI Agent 03">AI Agent 03</option>
              </>
            )}
          </select>

          {/* Priority Selector */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="h-9 min-w-[150px] border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500 transition-colors"
          >
            <option value="All Priorities">All Priorities</option>
            <option value="High Priority">High Priority</option>
            <option value="Normal">Normal</option>
          </select>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search customer / phone / call ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApply();
            }}
            className="h-9 flex-1 min-w-[200px] border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500 transition-colors"
          />

          {/* Apply Button */}
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="h-9 border-none bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-lg px-4 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {isApplying ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Filter className="w-3.5 h-3.5" />
            )}
            Apply
          </button>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="h-9 border border-[#dce2ea] hover:bg-slate-100 text-slate-600 rounded-lg px-3 text-xs font-medium cursor-pointer transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* WHITEBOARD BOARD */}
        <div className="bg-white border border-[#dfe5ec] rounded-2xl p-5 shadow-xs">
          
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-base md:text-lg font-bold text-slate-900">Live Call Workflow</h2>
              {hasActiveFilters && (
                <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                  Filtered
                </span>
              )}
            </div>
            <span className="text-slate-500 text-xs">
              Last synchronized: <b className="text-slate-800 font-semibold">{syncTime || "Live"}</b>
            </span>
          </div>

          {/* WORKFLOW COLUMNS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 overflow-x-auto pb-2">
            {columnsData.map((col) => (
              <div
                key={col.stage}
                className="bg-[#f7f8fa] border border-[#e5e9ef] rounded-xl min-w-[210px] min-h-[520px] p-3 flex flex-col justify-between"
              >
                <div>
                  {/* COLUMN HEADER */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e1e5ea]">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{col.stage}</h3>
                    <span className="w-6 h-6 rounded-full bg-[#e8edf3] flex items-center justify-center text-[10px] font-bold text-slate-700">
                      {String(col.count).padStart(2, "0")}
                    </span>
                  </div>

                  {/* CALL CARDS */}
                  <div className="space-y-2.5">
                    {col.cards.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs italic">
                        No calls in {col.stage.toLowerCase()}
                      </div>
                    ) : (
                      col.cards.map((card, cIdx) => (
                        <div
                          key={`${card.id}-${cIdx}`}
                          onClick={() => openCallModal(card)}
                          className="bg-white border border-[#e2e7ed] hover:border-amber-500 rounded-xl p-3 cursor-pointer hover:-translate-y-0.5 transition-all shadow-xs"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-slate-500 font-mono">{card.displayId || card.id}</span>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                card.priority === "HIGH"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {card.priority}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-900 mb-1">{card.customer}</div>
                          <div className="text-[10px] text-slate-500 mb-2.5">{card.phone}</div>

                          {card.extraLabel1 && (
                            <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                              <span>{card.extraLabel1}</span>
                              <strong className="text-slate-700">{card.extraVal1}</strong>
                            </div>
                          )}

                          {card.extraLabel2 && (
                            <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                              <span>{card.extraLabel2}</span>
                              <strong className="text-slate-700">{card.extraVal2}</strong>
                            </div>
                          )}

                          {card.aiStatus && (
                            <div className="flex items-center gap-1.5 text-[9px] text-emerald-700 mt-2 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              {card.aiStatus}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {col.stage === "QUEUED" && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full border border-dashed border-[#cbd5e1] hover:border-amber-500 hover:bg-amber-50/40 text-slate-600 hover:text-amber-700 p-2.5 rounded-lg cursor-pointer text-xs font-semibold transition-all mt-3 flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-600" />
                    + Add Call
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* BOTTOM INFORMATION PANELS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            
            {/* AGENT AVAILABILITY */}
            <div className="bg-white border border-[#e1e6ed] rounded-xl p-4 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
                👥 Agent Availability
              </h3>

              <div className="divide-y divide-[#edf0f4]">
                {[
                  { name: "Voice Agents", state: "On Call", isOnline: true, count: String(connectedCalls.length).padStart(2, "0") },
                  { name: "AI Dialers", state: "Dialing / Ready", isOnline: true, count: String(dialingCalls.length).padStart(2, "0") },
                  { name: "Standby Queue", state: "Queued", isOnline: false, count: String(queuedCalls.length).padStart(2, "0") },
                ].map((agent) => (
                  <div key={agent.name} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-700">
                        AI
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{agent.name}</div>
                        <div className={`text-[9px] font-medium ${agent.isOnline ? "text-emerald-600" : "text-slate-500"}`}>
                          ● {agent.state}
                        </div>
                      </div>
                    </div>
                    <strong className="text-xs text-slate-800 font-bold">{agent.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* QUEUE SUMMARY */}
            <div className="bg-white border border-[#e1e6ed] rounded-xl p-4 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
                📥 Calling Queue
              </h3>

              <div className="divide-y divide-[#edf0f4] text-xs">
                {[
                  { label: "Queued Calls", num: queuedCalls.length },
                  { label: "Active Dialing", num: dialingCalls.length },
                  { label: "Connected Calls", num: connectedCalls.length },
                  { label: "Transferred Calls", num: transferredCalls.length },
                  { label: "Qualified Calls", num: qualifiedCalls.length },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 text-slate-700">
                    <span>{item.label}</span>
                    <span className="font-bold text-slate-900">{item.num}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 font-bold text-slate-900 pt-2.5">
                  <span>Total Monitored</span>
                  <span className="text-amber-600">{liveCalls.length}</span>
                </div>
              </div>
            </div>

            {/* ALERTS */}
            <div className="bg-white border border-[#e1e6ed] rounded-xl p-4 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
                🔔 Whiteboard Alerts
              </h3>

              <div className="space-y-2">
                {[
                  { title: "High Priority Calls", desc: `${transferredCalls.length + connectedCalls.length} active high priority calls.` },
                  { title: "Transfer Waiting", desc: `${transferredCalls.length} customers transferred to human agents.` },
                  { title: "Calling Capacity", desc: `${connectedCalls.length + dialingCalls.length} live channels actively engaged.` },
                  { title: "Queued Leads", desc: `${queuedCalls.length} calls waiting in the dialer queue.` },
                ].map((alert) => (
                  <div key={alert.title} className="p-2.5 rounded-lg bg-[#f8fafc] border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-900">{alert.title}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{alert.desc}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* ADD CALL MODAL */}
        {isAddModalOpen && (
          <div
            onClick={() => setIsAddModalOpen(false)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-[480px] rounded-2xl p-6 shadow-2xl border border-slate-200 text-slate-800 animate-in fade-in zoom-in duration-150"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Add Call to Queue</h2>
                    <p className="text-xs text-slate-500">Add a customer lead directly to the calling queue</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {addCallFeedback && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  {addCallFeedback}
                </div>
              )}

              <form onSubmit={handleAddCallSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={addCustomerName}
                    onChange={(e) => setAddCustomerName(e.target.value)}
                    className="w-full h-9 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-800 outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1 555 123 4567"
                    value={addCustomerPhone}
                    onChange={(e) => setAddCustomerPhone(e.target.value)}
                    className="w-full h-9 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-800 outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign</label>
                    <select
                      value={addCampaign}
                      onChange={(e) => setAddCampaign(e.target.value)}
                      className="w-full h-9 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-800 outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="">Select Campaign</option>
                      {campaignOptions.map((c) => (
                        <option key={c.id} value={c.name || c.id}>
                          {c.name || c.id}
                        </option>
                      ))}
                      {campaignOptions.length === 0 && (
                        <option value="General Campaign">General Campaign</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                    <select
                      value={addPriority}
                      onChange={(e) => setAddPriority(e.target.value as "HIGH" | "NORMAL")}
                      className="w-full h-9 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-800 outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="NORMAL">Normal Priority</option>
                      <option value="HIGH">High Priority</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="h-9 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingCall}
                    className="h-9 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {isAddingCall ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add to Queue
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CALL DETAILS MODAL */}
        {selectedCall && (
          <div
            onClick={closeCallModal}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-[520px] rounded-2xl p-6 shadow-xl border border-slate-200 text-slate-800 animate-in fade-in zoom-in duration-150"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Call Details</h2>
                  <span className="text-xs text-slate-400 font-mono">{selectedCall.displayId || selectedCall.id}</span>
                </div>
                <button
                  onClick={closeCallModal}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="border border-[#e5e9ef] rounded-xl p-3 bg-slate-50/50">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1">CALL ID</span>
                  <strong className="text-xs text-slate-900 font-mono">{selectedCall.displayId || selectedCall.id}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3 bg-slate-50/50">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1">CUSTOMER</span>
                  <strong className="text-xs text-slate-900 font-bold">{selectedCall.customer}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3 bg-slate-50/50">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1">PHONE</span>
                  <strong className="text-xs text-slate-900 font-mono">{selectedCall.phone}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3 bg-slate-50/50">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1">CAMPAIGN</span>
                  <strong className="text-xs text-slate-900 font-medium">{selectedCall.campaign}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3 bg-slate-50/50">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1">CURRENT STAGE</span>
                  <strong className="text-xs text-amber-600 font-bold uppercase">{selectedCall.stage}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3 bg-slate-50/50">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1">PRIORITY</span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block ${
                      selectedCall.priority === "HIGH"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {selectedCall.priority}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Link
                  href="/live-calls"
                  className="h-8 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-600" />
                  View in Live Calls
                </Link>
                <button
                  onClick={closeCallModal}
                  className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}

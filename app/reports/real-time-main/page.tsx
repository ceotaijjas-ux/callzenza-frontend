"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppShell } from "@/components/AppShell";
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Clock, Phone, PhoneCall, PhoneForwarded, Users, UserCheck, 
  Pause, MonitorX, CheckCircle, RefreshCcw, Settings, Filter, Search,
  Activity, Radio, X, SlidersHorizontal, Headphones
} from 'lucide-react';
import { apiFetch } from "@/lib/api-client";
import { campaignService, Campaign } from "@/lib/services/campaign.service";

interface DashboardSummary {
  total_leads: number;
  new_leads: number;
  qualified_leads: number;
  qualification_rate: number;
  active_conversations: number;
  human_handoffs: number;
  open_deals: number;
  won_deals: number;
  revenue: number;
  conversion_rate: number;
  lead_sources: Record<string, number>;
  pipeline_by_stage: Record<string, number>;
  active_calls_count?: number;
  calls_ringing_count?: number;
  ai_calls_in_progress: number;
  completed_ai_calls: number;
  assigned_leads: number;
  unassigned_leads: number;
  waiting_queue_count: number;
  ivr_calls_count?: number;
  available_agents_count: number;
  busy_agents_count: number;
  offline_agents_count: number;
  active_transfers_count: number;
  total_created_agents_count?: number;
  voice_agents_count?: number;
  ai_agents_count?: number;
}

export default function RealTimeMainReport() {
  const [timeStr, setTimeStr] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [experts, setExperts] = useState<any[]>([]);
  const [callsWaiting, setCallsWaiting] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allCallsList, setAllCallsList] = useState<any[]>([]);
  
  // Interactive Controls State
  const [autoRefreshSecs, setAutoRefreshSecs] = useState<number>(5);
  const [showOptionsModal, setShowOptionsModal] = useState<boolean>(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>('ALL');
  const [isInitialLoadDone, setIsInitialLoadDone] = useState<boolean>(false);

  // Initialize campaign filter from URL search params or localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCampaignId = params.get('campaign_id');
      const storedCampaignId = localStorage.getItem('realtime_report_selected_campaign');
      if (urlCampaignId) {
        setSelectedCampaignFilter(urlCampaignId);
      } else if (storedCampaignId) {
        setSelectedCampaignFilter(storedCampaignId);
      }
    }
  }, []);

  const fetchRealtimeData = useCallback(async () => {
    try {
      const campaignParam = selectedCampaignFilter !== 'ALL' 
        ? `?campaign_id=${encodeURIComponent(selectedCampaignFilter)}` 
        : '';

      const [dash, exps, queue, camps, callsRes] = await Promise.allSettled([
        apiFetch<DashboardSummary>(`/api/analytics/dashboard${campaignParam}`),
        apiFetch<any[]>("/api/experts"),
        apiFetch<any[]>(`/api/lead-assignment/queue${campaignParam}`),
        campaignService.list(),
        apiFetch<any[]>(`/api/voice/calls${campaignParam}`)
      ]);

      if (camps.status === "fulfilled" && Array.isArray(camps.value)) {
        const fetchedCamps = camps.value;
        setCampaigns(fetchedCamps);

        // Auto-select currently active/running campaign if no selection stored in URL/localStorage
        if (!isInitialLoadDone && typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const urlCampaignId = params.get('campaign_id');
          const storedCampaignId = localStorage.getItem('realtime_report_selected_campaign');
          
          if (!urlCampaignId && !storedCampaignId && selectedCampaignFilter === 'ALL') {
            const activeCamp = fetchedCamps.find(c => (c.status || '').toUpperCase() === 'RUNNING');
            if (activeCamp) {
              setSelectedCampaignFilter(activeCamp.id);
              localStorage.setItem('realtime_report_selected_campaign', activeCamp.id);
              const url = new URL(window.location.href);
              url.searchParams.set('campaign_id', activeCamp.id);
              window.history.replaceState({}, '', url.toString());
            }
          }
          setIsInitialLoadDone(true);
        }
      }

      if (dash.status === "fulfilled" && dash.value) {
        setDashboardData(dash.value);
      }
      if (exps.status === "fulfilled" && Array.isArray(exps.value)) {
        setExperts(exps.value);
      }
      if (queue.status === "fulfilled" && Array.isArray(queue.value)) {
        setCallsWaiting(queue.value);
      }
      if (callsRes.status === "fulfilled" && Array.isArray(callsRes.value)) {
        setAllCallsList(callsRes.value);
      }
    } catch (err) {
      console.warn("Failed to fetch real-time report data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCampaignFilter, isInitialLoadDone]);

  const handleCampaignChange = (campaignId: string) => {
    setSelectedCampaignFilter(campaignId);
    if (typeof window !== 'undefined') {
      if (campaignId !== 'ALL') {
        localStorage.setItem('realtime_report_selected_campaign', campaignId);
      } else {
        localStorage.removeItem('realtime_report_selected_campaign');
      }

      const url = new URL(window.location.href);
      if (campaignId !== 'ALL') {
        url.searchParams.set('campaign_id', campaignId);
      } else {
        url.searchParams.delete('campaign_id');
      }
      window.history.replaceState({}, '', url.toString());
    }
    setLoading(true);
  };

  const hasActiveCampaign = useMemo(() => {
    if (selectedCampaignFilter !== 'ALL') {
      const selected = campaigns.find(c => c.id === selectedCampaignFilter || c.name === selectedCampaignFilter);
      return (selected?.status || "").toUpperCase() === "RUNNING";
    }
    return campaigns.some(c => (c.status || "").toUpperCase() === "RUNNING");
  }, [campaigns, selectedCampaignFilter]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        now.toTimeString().split(' ')[0]
      );
    };
    updateTime();
    const clockTimer = setInterval(updateTime, 1000);

    fetchRealtimeData();

    let pollTimer: NodeJS.Timeout | null = null;
    if (autoRefreshSecs > 0 && hasActiveCampaign) {
      pollTimer = setInterval(fetchRealtimeData, autoRefreshSecs * 1000);
    }

    return () => {
      clearInterval(clockTimer);
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [fetchRealtimeData, autoRefreshSecs, hasActiveCampaign]);

  // Real-time WebSocket connection for instant active campaign & call event detection
  useEffect(() => {
    if (typeof window === "undefined") return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    const wsUrl = `${protocol}//${host}/api/ws/call-events?token=${encodeURIComponent(token)}`;
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (
            msg.event === "campaign_status_changed" ||
            msg.event === "call_status" ||
            msg.type === "CALL_UPDATE"
          ) {
            fetchRealtimeData();
          }
        } catch (e) {}
      };
    } catch (err) {}

    return () => {
      if (ws) {
        try { ws.close(); } catch (e) {}
      }
    };
  }, [fetchRealtimeData]);

  // Format integer dial ratio to display ratio (e.g. 1 -> "1:1", 2 -> "1:2", 3 -> "1:3")
  const formatDialRatio = (ratio?: number | string | null): string => {
    if (ratio === null || ratio === undefined || ratio === '') return '--';
    if (typeof ratio === 'string' && ratio.includes(':')) return ratio;
    const num = Number(ratio);
    if (isNaN(num) || num <= 0) return '--';
    return `1:${num}`;
  };

  // Format campaign dial method to display code (PD = Predictive Dialing, MD = Manual Dialing)
  const formatDialMethod = (campaign?: Campaign | null): string => {
    if (!campaign) return '--';
    const scheduleDialerType = campaign.schedule?.dialer_type || campaign.schedule?.dialerType;
    if (scheduleDialerType) {
      const upper = String(scheduleDialerType).toUpperCase();
      if (upper === 'AUTO' || upper === 'PD' || upper === 'PREDICTIVE') return 'PD';
      if (upper === 'MANUAL' || upper === 'MD') return 'MD';
    }
    if (campaign.auto_dial_enabled === true || (campaign.auto_dial_ratio && campaign.auto_dial_ratio > 1)) {
      return 'PD';
    }
    if (campaign.auto_dial_enabled === false) {
      return 'MD';
    }
    return '--';
  };

  // Format lead ordering method for selected campaign
  const formatLeadOrder = (campaign?: Campaign | null): string => {
    if (!campaign) return '--';
    const configuredOrder = (
      campaign.schedule?.lead_order || 
      campaign.schedule?.dial_order || 
      campaign.schedule?.order || 
      campaign.schedule?.order_type
    );

    if (configuredOrder) {
      const upper = String(configuredOrder).toUpperCase();
      if (upper.includes("DESC")) return "DESCENDING";
      if (upper.includes("ASC")) return "ASCENDING";
      if (upper.includes("RAND")) return "RANDOM";
      if (upper.includes("SEQ") || upper.includes("NEXT")) return "SEQUENTIAL / NEXT";
    }

    // Default backend ordering behavior: ORDER BY created_at ASC
    return "ASCENDING";
  };

  // Find currently selected campaign or active campaign for dial level ratio lookup
  const selectedCampaign = useMemo(() => {
    if (selectedCampaignFilter === 'ALL') return null;
    return campaigns.find(c => c.id === selectedCampaignFilter || c.name === selectedCampaignFilter);
  }, [campaigns, selectedCampaignFilter]);

  const dialLevelDisplay = useMemo(() => {
    if (selectedCampaign) {
      return formatDialRatio(selectedCampaign.auto_dial_ratio);
    }
    if (campaigns.length > 0) {
      const activeCamp = campaigns.find(c => c.status === 'RUNNING') || campaigns[0];
      return formatDialRatio(activeCamp?.auto_dial_ratio);
    }
    return '--';
  }, [selectedCampaign, campaigns]);

  const dialMethodDisplay = useMemo(() => {
    if (selectedCampaign) {
      return formatDialMethod(selectedCampaign);
    }
    if (campaigns.length > 0) {
      const activeCamp = campaigns.find(c => c.status === 'RUNNING') || campaigns[0];
      return formatDialMethod(activeCamp);
    }
    return '--';
  }, [selectedCampaign, campaigns]);

  const orderDisplay = useMemo(() => {
    const targetCampaign = selectedCampaign || (campaigns.length > 0 ? (campaigns.find(c => c.status === 'RUNNING') || campaigns[0]) : null);
    return formatLeadOrder(targetCampaign);
  }, [selectedCampaign, campaigns]);

  const dialableLeadsDisplay = useMemo(() => {
    if (selectedCampaign) {
      return String(selectedCampaign.dialable_leads ?? 0);
    }
    if (campaigns.length > 0) {
      const activeCamp = campaigns.find(c => c.status === 'RUNNING') || campaigns[0];
      return String(activeCamp?.dialable_leads ?? 0);
    }
    return '--';
  }, [selectedCampaign, campaigns]);

  // Derived live metrics from DB analytics and real-time active call statuses
  const HUMAN_ACTIVE_STATUSES = useMemo(() => [
    "HUMAN_HANDLING", "CONFERENCE_3WAY_ACTIVE", "ON_CALL", "TALKING",
    "CLIENT_ADDING", "TRANSFERRING", "TRANSFER_REQUESTED"
  ], []);

  const AI_IVR_STATUSES = useMemo(() => [
    "AI_HANDLING", "IVR", "IN_IVR", "IVR_FLOW"
  ], []);

  const RINGING_STATUSES = useMemo(() => [
    "RINGING", "DIALING"
  ], []);

  const WAITING_STATUSES = useMemo(() => [
    "QUEUED", "WAITING", "WAITING_FOR_AGENT"
  ], []);

  const liveCallCounts = useMemo(() => {
    if (!hasActiveCampaign) {
      return { active: 0, ringing: 0, waiting: 0, ivr: 0 };
    }

    let activeFromList = 0;
    let ringingFromList = 0;
    let waitingFromList = 0;
    let ivrFromList = 0;

    if (Array.isArray(allCallsList) && allCallsList.length > 0) {
      for (const call of allCallsList) {
        const st = (call.status || "").toUpperCase();
        const agentType = (call.agent_type || "").toUpperCase();

        if (RINGING_STATUSES.includes(st)) {
          ringingFromList++;
        } else if (HUMAN_ACTIVE_STATUSES.includes(st) || (agentType === "HUMAN" && st === "IN_PROGRESS")) {
          activeFromList++;
        } else if (AI_IVR_STATUSES.includes(st) || (agentType !== "HUMAN" && st === "IN_PROGRESS")) {
          ivrFromList++;
        } else if (WAITING_STATUSES.includes(st)) {
          waitingFromList++;
        }
      }
    }

    const active = dashboardData?.active_calls_count ?? activeFromList;
    const ringing = dashboardData?.calls_ringing_count ?? ringingFromList;
    const waiting = Math.max(dashboardData?.waiting_queue_count ?? 0, callsWaiting.length, waitingFromList);
    const ivr = dashboardData?.ivr_calls_count ?? ivrFromList;

    return { active, ringing, waiting, ivr };
  }, [hasActiveCampaign, dashboardData, allCallsList, callsWaiting, HUMAN_ACTIVE_STATUSES, AI_IVR_STATUSES, RINGING_STATUSES, WAITING_STATUSES]);

  const activeCallsCount = liveCallCounts.active;
  const callsRingingCount = liveCallCounts.ringing;
  const callsWaitingCount = liveCallCounts.waiting;
  const ivrCallsCount = liveCallCounts.ivr;

  const availableAgents = dashboardData?.available_agents_count ?? experts.filter(e => ['AVAILABLE', 'FREE'].includes(e.status)).length;
  const busyAgents = dashboardData?.busy_agents_count ?? experts.filter(e => ['BUSY', 'IN_CALL', 'ON_CALL'].includes(e.status)).length;
  const offlineAgents = dashboardData?.offline_agents_count ?? experts.filter(e => e.status === 'OFFLINE').length;
  const totalAgents = experts.length || (availableAgents + busyAgents + offlineAgents);
  const dispoAgents = dashboardData?.active_transfers_count ?? 0;

  const liveAgents = availableAgents + busyAgents;
  const completedCalls = dashboardData?.completed_ai_calls ?? 0;

  // Dynamic Hopper Count based on Dial Ratio, Active Agents, and Dialable Leads Cap
  const hopperCountDisplay = useMemo(() => {
    if (!hasActiveCampaign) return 0;
    const targetCampaign = selectedCampaign || (campaigns.length > 0 ? (campaigns.find(c => c.status === 'RUNNING') || campaigns[0]) : null);
    if (!targetCampaign) return 0;

    const dialable = targetCampaign.dialable_leads ?? 0;
    if (dialable <= 0) return 0;

    const ratio = Math.max(1, targetCampaign.auto_dial_ratio || 1);
    const agentCount = liveAgents > 0 ? liveAgents : (availableAgents > 0 ? availableAgents : (totalAgents > 0 ? 1 : 0));

    if (agentCount <= 0) return 0;

    const targetHopper = agentCount * ratio;
    return Math.min(targetHopper, dialable);
  }, [hasActiveCampaign, selectedCampaign, campaigns, liveAgents, availableAgents, totalAgents]);

  // Answered and Dropped calls calculated per selected campaign & Dial Method (PD vs MD)
  const answeredAndDroppedStats = useMemo(() => {
    const targetCampaign = selectedCampaign || (campaigns.length > 0 ? (campaigns.find(c => c.status === 'RUNNING') || campaigns[0]) : null);
    
    // Filter calls by target campaign if set
    const targetCalls = allCallsList.filter(c => {
      if (selectedCampaign) {
        return c.campaign_id === selectedCampaign.id;
      }
      if (targetCampaign) {
        return c.campaign_id === targetCampaign.id || !c.campaign_id;
      }
      return true;
    });

    const dialMethod = formatDialMethod(targetCampaign);
    const ANSWERED_STATUSES = ["COMPLETED", "CONNECTED", "IN_PROGRESS", "AI_HANDLING", "HUMAN_HANDLING", "QUALIFIED", "NOT_QUALIFIED", "CLOSED"];
    
    let answeredCount = 0;
    let droppedCount = 0;

    for (const call of targetCalls) {
      const status = (call.status || "").toUpperCase();
      const isAnswered = ANSWERED_STATUSES.includes(status) || call.connected_at != null || (call.duration_seconds || 0) > 0;
      
      if (isAnswered) {
        answeredCount++;
      } else {
        if (dialMethod === "PD") {
          // Predictive Dialing dropped/abandoned call statuses
          if (["DROPPED", "ABANDONED", "NO_ANSWER_ABANDON", "TIMEOUT_DROPPED"].includes(status)) {
            droppedCount++;
          }
        } else {
          // Manual Dialing dropped/failed/abandoned call statuses per business logic
          if (["DROPPED", "ABANDONED", "FAILED", "CLIENT_ADD_FAILED", "CANCELLED"].includes(status)) {
            droppedCount++;
          }
        }
      }
    }

    return { answeredCount, droppedCount };
  }, [allCallsList, selectedCampaign, campaigns]);

  // Filtered lists for table search
  const filteredCallsWaiting = useMemo(() => {
    return callsWaiting.filter((call) => {
      const matchSearch = searchQuery === '' || 
        (call.lead_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (call.phone_number || '').includes(searchQuery) ||
        (call.campaign_id || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = selectedStatusFilter === 'ALL' || (call.status || 'WAITING').toUpperCase() === selectedStatusFilter;
      const matchCamp = selectedCampaignFilter === 'ALL' || (call.campaign_id || 'MAIN_CAMPAIGN') === selectedCampaignFilter;
      return matchSearch && matchStatus && matchCamp;
    });
  }, [callsWaiting, searchQuery, selectedStatusFilter, selectedCampaignFilter]);

  const filteredExperts = useMemo(() => {
    return experts.filter((agent) => {
      const nameOrEmail = (agent.name || agent.email || '').toLowerCase();
      const matchSearch = searchQuery === '' || nameOrEmail.includes(searchQuery.toLowerCase());
      const statusStr = (agent.status || 'AVAILABLE').toUpperCase();
      const matchStatus = selectedStatusFilter === 'ALL' || statusStr === selectedStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [experts, searchQuery, selectedStatusFilter]);

  // Numerical difference computations for Telephony Operations Matrix (No Percentages)
  const activeDialRatio = useMemo(() => {
    const targetCampaign = selectedCampaign || (campaigns.length > 0 ? (campaigns.find(c => c.status === 'RUNNING') || campaigns[0]) : null);
    return targetCampaign?.auto_dial_ratio || 1;
  }, [selectedCampaign, campaigns]);

  const dlDiff = Math.abs(activeDialRatio - activeCallsCount);
  const netCallDiff = answeredAndDroppedStats.answeredCount - answeredAndDroppedStats.droppedCount;

  const SUMMARY_STATS = [
    { label: 'DIAL LEVEL', value: dialLevelDisplay, highlight: dialLevelDisplay !== '--', isBadge: dialLevelDisplay === '--' },
    { label: 'TRUNK SHORT/FILL', value: `${activeCallsCount} / 100`, subText: 'Active Capacity' },
    { label: 'FILTER', value: selectedStatusFilter === 'ALL' && selectedCampaignFilter === 'ALL' ? 'NONE' : `${selectedStatusFilter} / ${selectedCampaignFilter}`, isBadge: true },
    { label: 'TIME', value: timeStr || 'Live', isMono: true },
    { label: 'DIALABLE LEADS', value: dialableLeadsDisplay, highlight: dialableLeadsDisplay !== '--', isBadge: dialableLeadsDisplay === '--' },
    { label: 'CALLS TODAY', value: String(completedCalls), highlight: true },
    { label: 'AVG AGENTS', value: String(dashboardData?.total_created_agents_count ?? totalAgents) },
    { label: 'DIAL METHOD', value: dialMethodDisplay, highlight: dialMethodDisplay !== '--', isBadge: dialMethodDisplay === '--' },
    { label: 'HOPPER (MIN/AUTO)', value: `${hopperCountDisplay} / ${dialableLeadsDisplay}` },
    { label: 'DROPPED / ANSWERED', value: `${answeredAndDroppedStats.droppedCount} / ${answeredAndDroppedStats.answeredCount}` },
    { label: 'DL DIFF', value: String(dlDiff) },
    { label: 'STATUSES', value: selectedStatusFilter, isBadge: true },
    { label: 'LEADS IN HOPPER', value: String(hopperCountDisplay) },
    { label: 'DROPPED CALLS', value: String(answeredAndDroppedStats.droppedCount), highlight: answeredAndDroppedStats.droppedCount > 0 },
    { label: 'NET CALL DIFF', value: String(netCallDiff) },
    { label: 'ORDER', value: orderDisplay, isBadge: true },
  ];

  const CALL_CARDS = [
    { 
      title: 'Current Active Calls', 
      value: activeCallsCount, 
      icon: Phone, 
      gradient: 'from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-indigo-500/20',
      badge: 'Live',
      badgeColor: 'bg-indigo-400/30 text-indigo-100 border-indigo-300/30'
    },
    { 
      title: 'Calls Ringing', 
      value: callsRingingCount, 
      icon: PhoneForwarded, 
      gradient: 'from-blue-600 via-sky-500 to-cyan-500 text-white shadow-blue-500/20',
      badge: 'Ringing',
      badgeColor: 'bg-blue-400/30 text-blue-100 border-blue-300/30'
    },
    { 
      title: 'Calls Waiting for Agents', 
      value: callsWaitingCount, 
      icon: PhoneCall, 
      gradient: 'from-rose-600 via-rose-500 to-pink-600 text-white shadow-rose-500/25',
      badge: callsWaitingCount > 0 ? 'Queue Active' : 'Idle',
      badgeColor: callsWaitingCount > 0 ? 'bg-rose-400/30 text-rose-100 border-rose-300/30 animate-pulse' : 'bg-rose-400/20 text-rose-100 border-rose-300/20'
    },
    { 
      title: 'Calls in IVRC', 
      value: ivrCallsCount, 
      icon: Radio, 
      gradient: 'from-slate-800 via-slate-700 to-slate-900 text-white shadow-slate-900/20',
      badge: 'System',
      badgeColor: 'bg-slate-600/40 text-slate-200 border-slate-500/30'
    },
  ];

  const AGENT_CARDS = [
    { title: 'Agents Logged In', value: totalAgents, icon: Users, bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
    { title: 'Agents In Calls', value: busyAgents, icon: UserCheck, bg: 'bg-blue-500/10 text-blue-600 border-blue-200' },
    { title: 'Agents Waiting', value: availableAgents, icon: Clock, bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
    { title: 'Paused Agents', value: offlineAgents, icon: Pause, bg: 'bg-amber-500/10 text-amber-600 border-amber-200' },
    { title: 'Agents In Dead Calls', value: 0, icon: MonitorX, bg: 'bg-slate-500/10 text-slate-600 border-slate-200' },
    { title: 'Agents In Dispo', value: dispoAgents, icon: CheckCircle, bg: 'bg-teal-500/10 text-teal-600 border-teal-200' },
  ];

  return (
    <AppShell>
      <div className="p-4 md:p-8 w-full space-y-8 bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
        
        {/* Ambient Background Gradients */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-0" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none -z-0" />

        <div className="relative z-10 space-y-8">
          
          {/* Top Control Bar & Header */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-indigo-950/20"
          >
            <div className="space-y-2">
              <Link 
                href="/reports"
                className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                Back to Reports
              </Link>
              
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Real-Time Agent & Calls Report
                </h1>

                {/* Prominent Top Campaign Selector */}
                <div className="flex items-center gap-2 bg-slate-950/90 border border-indigo-500/40 px-3.5 py-1.5 rounded-2xl shadow-inner">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-400 shrink-0" />
                  <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 whitespace-nowrap">
                    Select Campaign:
                  </label>
                  <select
                    value={selectedCampaignFilter}
                    onChange={(e) => handleCampaignChange(e.target.value)}
                    className="bg-slate-900 border border-slate-700 hover:border-indigo-500 text-white text-xs font-bold rounded-xl px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer min-w-[200px]"
                  >
                    <option value="ALL">All Campaigns</option>
                    {campaigns.map((camp) => {
                      const isRunning = (camp.status || '').toUpperCase() === 'RUNNING';
                      return (
                        <option key={camp.id} value={camp.id}>
                          {camp.name} {isRunning ? '🟢 [ACTIVE]' : camp.status ? `[${camp.status.toUpperCase()}]` : ''}
                        </option>
                      );
                    })}
                  </select>

                  {/* Selected Campaign Active Status Badge */}
                  {selectedCampaignFilter !== 'ALL' && (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      hasActiveCampaign 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {hasActiveCampaign ? 'RUNNING' : 'INACTIVE'}
                    </span>
                  )}
                </div>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  LIVE SYNC
                </div>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Search Bar */}
              <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search agents or calls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Options Toggle Button */}
              <button 
                onClick={() => setShowOptionsModal(!showOptionsModal)}
                className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/60 transition-all flex items-center gap-2 shadow-sm"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                Options
              </button>

              {/* Filter Toggle Button */}
              <button 
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-2 shadow-sm ${
                  selectedStatusFilter !== 'ALL' || selectedCampaignFilter !== 'ALL'
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/60'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                Filter: <span className="font-bold text-white">{selectedStatusFilter}</span>
              </button>

              {/* Reload Button */}
              <button 
                onClick={() => {
                  setLoading(true);
                  fetchRealtimeData();
                }}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Reload Now'}
              </button>
            </div>
          </motion.div>

          {/* Interactive Options Modal */}
          <AnimatePresence>
            {showOptionsModal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-4 shadow-xl overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-indigo-300">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                    Report Configuration & Auto-Sync Options
                  </div>
                  <button onClick={() => setShowOptionsModal(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Auto-Refresh Interval</label>
                    <div className="flex items-center gap-2">
                      {[3, 5, 10, 30, 0].map((sec) => (
                        <button
                          key={sec}
                          onClick={() => setAutoRefreshSecs(sec)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            autoRefreshSecs === sec
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {sec === 0 ? 'Off' : `${sec}s`}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Select Active Campaign</label>
                    <select
                      value={selectedCampaignFilter}
                      onChange={(e) => handleCampaignChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ALL">All Campaigns</option>
                      {campaigns.map((camp) => (
                        <option key={camp.id} value={camp.id}>
                          {camp.name} ({formatDialRatio(camp.auto_dial_ratio)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Current Dial Ratio</label>
                    <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                      <span className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold font-mono">
                        {dialLevelDisplay}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Filter Drawer */}
          <AnimatePresence>
            {showFilterDrawer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-4 shadow-xl overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-indigo-300">
                    <Filter className="w-4 h-4 text-indigo-400" />
                    Filter Real-Time Data Streams
                  </div>
                  <button onClick={() => setShowFilterDrawer(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Campaign Filter:</span>
                    <select
                      value={selectedCampaignFilter}
                      onChange={(e) => handleCampaignChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ALL">All Campaigns</option>
                      {campaigns.map((camp) => (
                        <option key={camp.id} value={camp.id}>
                          {camp.name} ({formatDialRatio(camp.auto_dial_ratio)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Status Filter:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {['ALL', 'AVAILABLE', 'BUSY', 'OFFLINE', 'WAITING'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setSelectedStatusFilter(st)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                            selectedStatusFilter === st
                              ? 'bg-indigo-600 text-white border-indigo-400'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {(selectedStatusFilter !== 'ALL' || selectedCampaignFilter !== 'ALL') && (
                  <div className="flex justify-end pt-2 border-t border-slate-800">
                    <button 
                      onClick={() => {
                        setSelectedStatusFilter('ALL');
                        setSelectedCampaignFilter('ALL');
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline underline-offset-4"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glassmorphic Summary Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="p-6 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
              <div className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Telephony Operations Matrix
              </div>
              <div className="text-xs font-mono text-slate-400">
                Auto-Sync Interval: <span className="font-bold text-indigo-400">{autoRefreshSecs === 0 ? 'Off' : `${autoRefreshSecs}s`}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SUMMARY_STATS.map((stat, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-col justify-between p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                    {stat.isBadge && (
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
                        {stat.value}
                      </span>
                    )}
                  </div>

                  {!stat.isBadge && (
                    <div className={`text-sm font-black mt-1 ${stat.highlight ? 'text-indigo-400' : 'text-white'} ${stat.isMono ? 'font-mono text-xs' : ''}`}>
                      {stat.value}
                    </div>
                  )}

                  {(stat as any).isBar && (stat as any).barPercent !== undefined && (
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(stat as any).barPercent}%` }} 
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Calls Metric Cards Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Headphones className="w-4 h-4 text-indigo-400" />
                Live Call Session Indicators
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CALL_CARDS.map((card, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${card.gradient} shadow-xl flex flex-col justify-between min-h-[140px] group`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wide uppercase ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform">
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-3xl font-black tracking-tight text-white drop-shadow-md">
                      {card.value}
                    </div>
                    <div className="text-xs font-bold text-white/80 uppercase tracking-wider mt-1">
                      {card.title}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Agents Metrics Mini Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {AGENT_CARDS.map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + idx * 0.04 }}
                  className={`rounded-2xl p-4 border backdrop-blur-md flex flex-col justify-between gap-3 ${card.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <card.icon className="w-5 h-5 opacity-80" />
                    <span className="text-xl font-black tracking-tight">{card.value}</span>
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-90 leading-tight">
                    {card.title}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Calls Waiting Queue Table */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-xl overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Calls Waiting in Queue</h2>
                  <p className="text-xs text-slate-400">Live incoming callers awaiting expert assignment ({filteredCallsWaiting.length})</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
                {timeStr}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Campaign</th>
                    <th className="px-6 py-4">Lead / Contact Phone</th>
                    <th className="px-6 py-4">Server IP</th>
                    <th className="px-6 py-4">Queue Time</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4 text-center">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-medium">
                  {filteredCallsWaiting.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle className="w-8 h-8 text-emerald-500/40 mb-1" />
                          <span className="font-semibold text-slate-400">No calls currently waiting in queue</span>
                          <span className="text-[11px] text-slate-600">Calls waiting for available agents will appear here in real-time</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCallsWaiting.map((call: any, idx: number) => (
                      <tr key={call.id || idx} className="bg-rose-500/5 hover:bg-rose-500/10 transition-colors">
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 text-[11px]">
                            {call.status || 'WAITING'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-200">{call.campaign_id || 'MAIN_CAMPAIGN'}</td>
                        <td className="px-6 py-4 text-slate-200 font-semibold">{call.lead_name || call.lead_id || call.phone_number || 'Incoming Lead'}</td>
                        <td className="px-6 py-4 font-mono text-slate-400">127.0.0.1</td>
                        <td className="px-6 py-4 font-mono text-amber-400 font-bold">{call.created_at ? new Date(call.created_at).toLocaleTimeString() : '0:00'}</td>
                        <td className="px-6 py-4 text-slate-300 font-semibold">INBOUND</td>
                        <td className="px-6 py-4 text-center font-bold text-rose-400">{call.priority ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Agents Time On Calls Campaign Table */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-xl overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Agents Time On Calls & Status Roster</h2>
                  <p className="text-xs text-slate-400">Live agent station states and session details ({filteredExperts.length})</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
                {timeStr}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="px-6 py-4">Station Role</th>
                    <th className="px-6 py-4">Agent Name / User</th>
                    <th className="px-6 py-4">Session Token</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Session Time</th>
                    <th className="px-6 py-4">Specialization</th>
                    <th className="px-6 py-4 text-right">Dialed Calls</th>
                    <th className="px-6 py-4 text-center">Hold</th>
                    <th className="px-6 py-4">Contact Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-medium">
                  {filteredExperts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-8 h-8 text-slate-600 mb-1" />
                          <span className="font-semibold text-slate-400">No agent profiles found</span>
                          <span className="text-[11px] text-slate-600">Connect agent accounts or adjust filters to view agent roster</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredExperts.map((agent: any, idx: number) => {
                      const statusStr = (agent.status || 'AVAILABLE').toUpperCase();
                      let statusBadge = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                      let statusDot = "bg-emerald-400";

                      if (['BUSY', 'IN_CALL', 'ON_CALL'].includes(statusStr)) {
                        statusBadge = "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30";
                        statusDot = "bg-fuchsia-400 animate-pulse";
                      } else if (['OFFLINE', 'INACTIVE'].includes(statusStr)) {
                        statusBadge = "bg-slate-800 text-slate-400 border-slate-700";
                        statusDot = "bg-slate-500";
                      }

                      const initials = (agent.name || agent.email || 'A').substring(0, 2).toUpperCase();

                      return (
                        <tr key={agent.id || idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-mono text-[11px] text-indigo-400 font-bold">
                            {agent.role || 'VOICE_AGENT'}
                          </td>
                          <td className="px-6 py-4 font-semibold text-white">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black flex items-center justify-center">
                                {initials}
                              </div>
                              <span>{agent.name || agent.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded bg-slate-950 font-mono text-[11px] text-sky-400 border border-slate-800">
                              {agent.id ? agent.id.substring(0, 8) : `sess_${idx}`}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-bold text-[11px] ${statusBadge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                              {statusStr}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-400">0:00</td>
                          <td className="px-6 py-4 text-slate-300 font-semibold">{agent.specialization || 'GENERAL'}</td>
                          <td className="px-6 py-4 text-right font-black text-indigo-400">{agent.dialed_calls_count || 0}</td>
                          <td className="px-6 py-4 text-center text-slate-500">-</td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{agent.email || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

        </div>
      </div>
    </AppShell>
  );
}

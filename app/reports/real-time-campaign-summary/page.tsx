"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Printer,
  Download,
  Phone,
  Clock,
  UserCheck,
  ShieldCheck,
  RotateCcw,
  Copy,
  Check,
  Activity,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { reportService } from "@/lib/services/report.service";
import { campaignService } from "@/lib/services/campaign.service";
import { expertService } from "@/lib/services/expert.service";

interface RecentCallItem {
  id: string;
  call_id: string;
  time: string;
  campaign: string;
  agent: string;
  customer: string;
  phone: string;
  duration: string;
  duration_seconds: number;
  outcome: string;
  statusText: string;
  statusClass: string;
}

interface OutcomeItem {
  label: string;
  count: string;
  color: string;
}

export default function RealTimeCampaignSummaryPage() {
  // Filter States
  const [selectedCampaign, setSelectedCampaign] = useState("All Campaigns");
  const [selectedAgent, setSelectedAgent] = useState("All AI Agents");
  const [selectedStatus, setSelectedStatus] = useState("All Call Status");
  const [selectedDate, setSelectedDate] = useState("");

  // Live Stats State
  const [totalCalls, setTotalCalls] = useState(0);
  const [callsAnswered, setCallsAnswered] = useState(0);
  const [callsInProgress, setCallsInProgress] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [conversions, setConversions] = useState(0);
  const [avgDuration, setAvgDuration] = useState("00:00");
  const [answerRate, setAnswerRate] = useState("0.0%");
  const [completionRate, setCompletionRate] = useState("0.0%");
  const [conversionRate, setConversionRate] = useState("0.0%");

  // Dynamic lists from DB
  const [campaignOptions, setCampaignOptions] = useState<string[]>(["All Campaigns"]);
  const [agentOptions, setAgentOptions] = useState<string[]>(["All AI Agents"]);
  const [hourlyActivity, setHourlyActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [callOutcomes, setCallOutcomes] = useState<OutcomeItem[]>([]);
  const [recentCalls, setRecentCalls] = useState<RecentCallItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCallDetail, setSelectedCallDetail] = useState<RecentCallItem | null>(null);
  const [modalTitle, setModalTitle] = useState<string | null>(null);
  const [copiedSid, setCopiedSid] = useState<boolean>(false);

  const isFilterActive = useMemo(() => {
    return (
      selectedCampaign !== "All Campaigns" ||
      selectedAgent !== "All AI Agents" ||
      selectedStatus !== "All Call Status" ||
      selectedDate !== ""
    );
  }, [selectedCampaign, selectedAgent, selectedStatus, selectedDate]);

  const fetchRealData = async (overrideParams?: {
    campaign?: string;
    agent?: string;
    status?: string;
    date?: string;
  }) => {
    const campaign = overrideParams?.campaign !== undefined ? overrideParams.campaign : selectedCampaign;
    const agent = overrideParams?.agent !== undefined ? overrideParams.agent : selectedAgent;
    const status = overrideParams?.status !== undefined ? overrideParams.status : selectedStatus;
    const date = overrideParams?.date !== undefined ? overrideParams.date : selectedDate;

    try {
      setLoading(true);
      const res = await reportService.getGenericReport("real-time-campaign-summary", {
        campaign_id: campaign !== "All Campaigns" ? campaign : undefined,
        agent_id: agent !== "All AI Agents" ? agent : undefined,
        status: status !== "All Call Status" ? status : undefined,
        from_date: date || undefined,
      });

      if (res) {
        setTotalCalls(res.total_calls || (res.data ? res.data.length : 0));
        setCallsAnswered(res.calls_answered || 0);
        setCallsInProgress(res.calls_in_progress || 0);
        setCompleted(res.completed || 0);
        setConversions(res.conversions || 0);
        setAvgDuration(res.avg_duration || "00:00");
        setAnswerRate(res.answer_rate || "0.0%");
        setCompletionRate(res.completion_rate || "0.0%");
        setConversionRate(res.conversion_rate || "0.0%");

        if (Array.isArray(res.campaigns) && res.campaigns.length > 0) {
          setCampaignOptions(prev => Array.from(new Set([...prev, ...res.campaigns])));
        }
        if (Array.isArray(res.agents) && res.agents.length > 0) {
          setAgentOptions(prev => Array.from(new Set([...prev, ...res.agents])));
        }
        if (Array.isArray(res.hourly_activity)) {
          setHourlyActivity(res.hourly_activity);
        }
        if (Array.isArray(res.outcomes)) {
          setCallOutcomes(res.outcomes);
        }
        if (Array.isArray(res.recent_calls)) {
          setRecentCalls(res.recent_calls);
        } else if (Array.isArray(res.data)) {
          setRecentCalls(res.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch real-time campaign summary:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedCampaign("All Campaigns");
    setSelectedAgent("All AI Agents");
    setSelectedStatus("All Call Status");
    setSelectedDate("");
    fetchRealData({
      campaign: "All Campaigns",
      agent: "All AI Agents",
      status: "All Call Status",
      date: "",
    });
  };

  useEffect(() => {
    // Initial fetch
    fetchRealData();

    // Populate dropdown options from campaign & expert services
    (async () => {
      try {
        const [campsRes, expRes] = await Promise.allSettled([
          campaignService.list(),
          expertService.list(),
        ]);
        if (campsRes.status === "fulfilled" && Array.isArray(campsRes.value)) {
          const names = campsRes.value.map(c => c.name).filter(Boolean);
          if (names.length > 0) {
            setCampaignOptions(prev => Array.from(new Set([...prev, ...names])));
          }
        }
        if (expRes.status === "fulfilled" && Array.isArray(expRes.value)) {
          const names = expRes.value.map((e: any) => e.name || e.full_name).filter(Boolean);
          if (names.length > 0) {
            setAgentOptions(prev => Array.from(new Set([...prev, ...names])));
          }
        }
      } catch {
        // ignore background list errors
      }
    })();

    const interval = setInterval(() => {
      fetchRealData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter recent calls client-side to ensure instant responsive sync
  const displayCalls = useMemo(() => {
    return recentCalls.filter((c) => {
      if (
        selectedCampaign !== "All Campaigns" &&
        c.campaign !== selectedCampaign &&
        !c.campaign?.toLowerCase().includes(selectedCampaign.toLowerCase())
      ) {
        return false;
      }
      if (
        selectedAgent !== "All AI Agents" &&
        c.agent !== selectedAgent &&
        !c.agent?.toLowerCase().includes(selectedAgent.toLowerCase())
      ) {
        return false;
      }
      if (
        selectedStatus !== "All Call Status" &&
        (c.statusText || "").toUpperCase() !== selectedStatus.toUpperCase()
      ) {
        return false;
      }
      return true;
    });
  }, [recentCalls, selectedCampaign, selectedAgent, selectedStatus]);

  // Max hourly calls for proportional bar chart
  const maxHourCalls = useMemo(() => {
    return Math.max(...hourlyActivity, 1);
  }, [hourlyActivity]);

  const openReportModal = (title: string, callItem?: RecentCallItem) => {
    setModalTitle(title);
    if (callItem) {
      setSelectedCallDetail(callItem);
    } else {
      setSelectedCallDetail(null);
    }
  };

  const closeReportModal = () => {
    setModalTitle(null);
    setSelectedCallDetail(null);
    setCopiedSid(false);
  };

  const handleCopySid = (sid: string) => {
    if (!sid) return;
    navigator.clipboard.writeText(sid);
    setCopiedSid(true);
    setTimeout(() => setCopiedSid(false), 2000);
  };

  const exportToCSV = () => {
    if (!displayCalls || displayCalls.length === 0) return;
    const headers = ["Call ID", "DB Call SID", "Time", "Campaign", "Agent", "Customer", "Phone", "Duration", "Outcome", "Status"];
    const rows = displayCalls.map(c => [
      c.id,
      c.call_id,
      `"${c.time}"`,
      `"${c.campaign}"`,
      `"${c.agent}"`,
      `"${c.customer}"`,
      `"${c.phone}"`,
      `"${c.duration}"`,
      `"${c.outcome}"`,
      `"${c.statusText}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campaign_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell>
      <div className="p-4 md:p-8 w-full max-w-[1450px] mx-auto bg-[#f6f8fc] min-h-screen text-[#172033]">
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
              Real-Time Campaign Summary
            </h1>
            <p className="text-slate-500 text-sm">
              Monitor live campaign activity, connected calls, voice agents, and lead conversions in real time.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
            <button
              onClick={() => fetchRealData()}
              disabled={loading}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button
              onClick={handlePrint}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <div className="inline-flex items-center gap-2 bg-white border border-[#e3e8ef] px-4 py-2 rounded-xl text-xs font-semibold shadow-xs">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Live Database Connected
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white border border-[#e3e8ef] p-4 md:p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-6 shadow-sm items-center">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="h-10 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500 transition-colors"
          >
            {campaignOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="h-10 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500 transition-colors"
          >
            {agentOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500 transition-colors"
          >
            <option value="All Call Status">All Call Status</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="HUMAN_HANDLING">HUMAN_HANDLING</option>
            <option value="TRANSFER_REQUESTED">TRANSFER_REQUESTED</option>
            <option value="THREE_WAY_ACTIVE">THREE_WAY_ACTIVE</option>
            <option value="FAILED">FAILED</option>
            <option value="NO_ANSWER">NO_ANSWER</option>
            <option value="QUEUED">QUEUED</option>
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500 transition-colors"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchRealData()}
              disabled={loading}
              className="flex-1 h-10 border-none bg-amber-500 hover:bg-amber-600 disabled:opacity-75 text-white rounded-lg px-4 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : null}
              <span>Apply Filters</span>
            </button>
            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                title="Reset all filters"
                className="h-10 border border-slate-300 hover:border-slate-400 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-3 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white border border-[#e3e8ef] rounded-2xl p-5 shadow-sm">
            <div className="text-slate-500 text-xs font-medium mb-2">Total Calls</div>
            <div className="text-2xl font-extrabold text-slate-900">{totalCalls.toLocaleString()}</div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-1.5">Live DB Calls</div>
          </div>

          <div className="bg-white border border-[#e3e8ef] rounded-2xl p-5 shadow-sm">
            <div className="text-slate-500 text-xs font-medium mb-2">Calls Answered</div>
            <div className="text-2xl font-extrabold text-slate-900">{callsAnswered.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1.5">{answerRate} Answer Rate</div>
          </div>

          <div className="bg-white border border-[#e3e8ef] rounded-2xl p-5 shadow-sm">
            <div className="text-slate-500 text-xs font-medium mb-2">Calls In Progress</div>
            <div className="text-2xl font-extrabold text-slate-900">{callsInProgress}</div>
            <div className="text-[11px] text-amber-600 font-semibold mt-1.5">Active Channels</div>
          </div>

          <div className="bg-white border border-[#e3e8ef] rounded-2xl p-5 shadow-sm">
            <div className="text-slate-500 text-xs font-medium mb-2">Completed</div>
            <div className="text-2xl font-extrabold text-slate-900">{completed.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1.5">{completionRate} Completion</div>
          </div>

          <div className="bg-white border border-[#e3e8ef] rounded-2xl p-5 shadow-sm">
            <div className="text-slate-500 text-xs font-medium mb-2">Conversions</div>
            <div className="text-2xl font-extrabold text-slate-900">{conversions.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1.5">{conversionRate} Lead Conversion</div>
          </div>

          <div className="bg-white border border-[#e3e8ef] rounded-2xl p-5 shadow-sm">
            <div className="text-slate-500 text-xs font-medium mb-2">Avg Call Duration</div>
            <div className="text-2xl font-extrabold text-slate-900">{avgDuration}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1.5">Average Handle Time</div>
          </div>
        </div>

        {/* REPORT TYPES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { title: "Campaign Overview", desc: `Total ${totalCalls} calls across active campaigns.`, icon: "📊" },
            { title: "Live Call Status", desc: `${callsInProgress} calls currently active in audio pipeline.`, icon: "📞" },
            { title: "Agent Performance", desc: `Track live voice agents and specialist dispatch.`, icon: "👥" },
            { title: "Conversion Report", desc: `${conversions} qualified customer leads verified.`, icon: "🎯" },
            { title: "Call Outcomes", desc: `Breakdown of completed, transferred, and active calls.`, icon: "📋" },
            { title: "Lead Status", desc: `Track lead progression throughout active campaigns.`, icon: "👤" },
            { title: "Voice Agent Metrics", desc: `Live speech duration and connection rates.`, icon: "🤖" },
            { title: "Hourly Activity", desc: `Distribution of call traffic throughout the day.`, icon: "⏱️" },
          ].map((report) => (
            <div
              key={report.title}
              onClick={() => openReportModal(report.title)}
              className="bg-white border border-[#e3e8ef] rounded-2xl p-5 cursor-pointer hover:border-amber-500 hover:-translate-y-0.5 transition-all shadow-sm"
            >
              <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-xl mb-3">
                {report.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">{report.title}</h3>
              <p className="text-slate-500 text-xs">{report.desc}</p>
            </div>
          ))}
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* HOURLY CALL ACTIVITY */}
          <div className="lg:col-span-2 bg-white border border-[#e3e8ef] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900">Hourly Call Activity</h2>
              <span className="text-slate-400 text-xs">Live Database Timestamps</span>
            </div>

            <div className="h-56 flex items-end gap-3.5 px-2 pb-2 border-b border-slate-200">
              {hourlyActivity.map((count, idx) => {
                const heightPct = Math.max(8, Math.round((count / maxHourCalls) * 100));
                return (
                  <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center">
                    <span className="text-[10px] font-bold text-slate-600 mb-1">{count > 0 ? count : ""}</span>
                    <div
                      className="w-full bg-amber-500 hover:bg-amber-600 rounded-t-md transition-all cursor-pointer"
                      style={{ height: `${heightPct}%` }}
                      title={`${count} Calls recorded`}
                    ></div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3.5 pt-3">
              {["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM"].map((hour) => (
                <span key={hour} className="flex-1 text-center text-[10px] text-slate-500 font-medium">
                  {hour}
                </span>
              ))}
            </div>
          </div>

          {/* CALL OUTCOMES */}
          <div className="bg-white border border-[#e3e8ef] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-900">Call Outcomes</h2>
                <span className="text-slate-400 text-xs">From Database</span>
              </div>

              <div className="space-y-4">
                {callOutcomes.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-xs text-slate-700 font-medium">{item.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-900">{item.count} Calls</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2 text-xs font-semibold">
                <span className="text-slate-600">Campaign Call Completion</span>
                <span className="text-slate-900 font-bold">{completionRate}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: completionRate }}
                ></div>
              </div>
            </div>
          </div>

        </div>

        {/* RECENT CALLS TABLE */}
        <div className="bg-white border border-[#e3e8ef] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Campaign Calls</h2>
              <p className="text-xs text-slate-500">Live indexed call logs from PostgreSQL/SQLite</p>
            </div>
            <div className="flex items-center gap-3">
              {isFilterActive && (
                <span className="text-amber-700 text-xs font-semibold bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                  Filtered Results
                </span>
              )}
              <span className="text-slate-500 text-xs font-semibold bg-slate-100 px-3 py-1 rounded-lg">
                {displayCalls.length} Calls Loaded
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">CALL ID</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">TIME</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">CAMPAIGN</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">AGENT</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">CUSTOMER</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">DURATION</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">OUTCOME</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">STATUS</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayCalls.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No calls matching the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  displayCalls.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{row.id}</td>
                      <td className="p-3 text-slate-600">{row.time}</td>
                      <td className="p-3 text-slate-700">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
                          {row.campaign}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{row.agent}</td>
                      <td className="p-3 font-medium text-slate-900">{row.customer}</td>
                      <td className="p-3 text-slate-600 font-mono font-semibold">{row.duration}</td>
                      <td className="p-3 text-slate-700">{row.outcome}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${row.statusClass}`}>
                          {row.statusText}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => openReportModal(`Call ${row.id}`, row)}
                          className="border border-[#dce2ea] bg-white hover:border-amber-500 px-3 py-1 rounded-md text-[11px] font-medium text-slate-700 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL */}
        {modalTitle && (
          <div
            onClick={closeReportModal}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-[650px] rounded-2xl p-6 shadow-xl border border-slate-200 text-slate-800 animate-in fade-in zoom-in duration-150"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">{modalTitle}</h2>
                <button
                  onClick={closeReportModal}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg px-3 py-1 text-sm font-semibold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {selectedCallDetail ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Database Call SID</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 truncate max-w-[180px]">
                          {selectedCallDetail.call_id}
                        </span>
                        <button
                          onClick={() => handleCopySid(selectedCallDetail.call_id)}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded"
                          title="Copy SID"
                        >
                          {copiedSid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Campaign Name</span>
                      <span className="font-semibold text-slate-900">{selectedCallDetail.campaign}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Assigned Agent</span>
                      <span className="font-semibold text-slate-900">{selectedCallDetail.agent}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Customer Contact</span>
                      <span className="font-semibold text-slate-900">{selectedCallDetail.customer}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Phone Number</span>
                      <span className="font-mono font-semibold text-slate-800">{selectedCallDetail.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Duration</span>
                      <span className="font-mono font-bold text-indigo-600">{selectedCallDetail.duration}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Outcome</span>
                      <span className="font-semibold text-slate-900">{selectedCallDetail.outcome}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Status</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${selectedCallDetail.statusClass}`}>
                        {selectedCallDetail.statusText}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={closeReportModal}
                      className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <p className="text-slate-500">
                    Live operational metrics aggregated across active database campaigns and voice pipelines.
                  </p>
                  
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <div className="flex justify-between font-medium mb-1.5">
                        <span>Total Calls Recorded</span>
                        <strong className="text-slate-900">{totalCalls}</strong>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: "100%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-medium mb-1.5">
                        <span>Answer Rate</span>
                        <strong className="text-emerald-700">{answerRate}</strong>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: answerRate }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-medium mb-1.5">
                        <span>Call Completion Rate</span>
                        <strong className="text-amber-700">{completionRate}</strong>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: completionRate }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-medium mb-1.5">
                        <span>Lead Conversion Rate</span>
                        <strong className="text-indigo-700">{conversionRate}</strong>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: conversionRate }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={closeReportModal}
                      className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}

"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { reportService } from "@/lib/services/report.service";

interface AgentPerfRecord {
  id: string;
  name: string;
  avatarInitials: string;
  agentId: string;
  status: "Ready" | "Talking" | "On Break" | "Offline";
  inbound: number;
  outbound: number;
  totalCalls: number;
  answered: number;
  missed: number;
  answerRate: string;
  talkTime: string;
  holdTime: string;
  wrapUp: string;
  aht: string;
  occupancy: string;
  csat: string;
  score: string;
  team: string;
  campaign: string;
  callType: string;
}

export default function AgentPerformanceDetailPage() {
  const todayStr = new Date().toISOString().split("T")[0];

  // Filters State
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState(todayStr);
  const [selectedCampaign, setSelectedCampaign] = useState("All Campaigns");
  const [selectedTeam, setSelectedTeam] = useState("All Teams");
  const [selectedAgent, setSelectedAgent] = useState("All Agents");
  const [selectedCallType, setSelectedCallType] = useState("All Calls");

  // Trend State
  const [trendRange, setTrendRange] = useState("week");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Toast Notification
  const [notification, setNotification] = useState<string | null>(null);
  const [liveAgentsData, setLiveAgentsData] = useState<AgentPerfRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchAgentPerfData = async () => {
    try {
      setLoading(true);
      const res = await reportService.getAgentPerformance({
        from_date: fromDate,
        to_date: toDate,
        campaign_id: selectedCampaign,
        agent_id: selectedAgent,
      });
      if (res && Array.isArray(res.data)) {
        setLiveAgentsData(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch agent performance report:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAgentPerfData();
    const interval = setInterval(fetchAgentPerfData, 10000);
    return () => clearInterval(interval);
  }, [fromDate, toDate, selectedCampaign, selectedAgent]);

  const agentsData: AgentPerfRecord[] = liveAgentsData;

  const filteredAgents = agentsData.filter((a) => {
    if (selectedCampaign !== "All Campaigns" && a.campaign !== selectedCampaign) return false;
    if (selectedTeam !== "All Teams" && a.team !== selectedTeam) return false;
    if (selectedAgent !== "All Agents" && a.name !== selectedAgent) return false;
    if (selectedCallType !== "All Calls" && a.callType !== selectedCallType) return false;
    return true;
  });

  const exportCSV = () => {
    let csvRows = [];
    const headers = [
      "Agent",
      "Agent ID",
      "Status",
      "Inbound",
      "Outbound",
      "Total Calls",
      "Answered",
      "Missed",
      "Answer Rate",
      "Talk Time",
      "Hold Time",
      "Wrap Up",
      "AHT",
      "Occupancy",
      "CSAT",
      "Score",
    ];
    csvRows.push(headers.join(","));

    filteredAgents.forEach((a) => {
      const row = [
        `"${a.name}"`,
        `"${a.agentId}"`,
        `"${a.status}"`,
        `"${a.inbound}"`,
        `"${a.outbound}"`,
        `"${a.totalCalls}"`,
        `"${a.answered}"`,
        `"${a.missed}"`,
        `"${a.answerRate}"`,
        `"${a.talkTime}"`,
        `"${a.holdTime}"`,
        `"${a.wrapUp}"`,
        `"${a.aht}"`,
        `"${a.occupancy}"`,
        `"${a.csat}"`,
        `"${a.score}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "agent-performance-detail.csv";
    link.click();
    URL.revokeObjectURL(url);
    showNotification("CSV export downloaded successfully.");
  };

  return (
    <AppShell>
      <div className="p-4 md:p-7 w-full max-w-[1600px] mx-auto bg-[#f5f7fb] min-h-screen text-[#1f2937] font-sans">
        
        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className="fixed top-5 right-5 bg-blue-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
            {notification}
          </div>
        )}

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1">
              Agent Performance Detail
            </h1>
            <p className="text-slate-500 text-xs md:text-sm">
              Detailed analysis of agent productivity, call handling and performance
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => window.print()}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              🖨 Print
            </button>
            <button
              onClick={exportCSV}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              ⬇ Export CSV
            </button>
            <button
              onClick={() => showNotification("Dashboard refreshed.")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* PERFORMANCE FILTERS CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 mb-6 shadow-xs">
          <div className="text-sm font-bold text-slate-900 mb-4">Performance Filters</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Campaign</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-blue-600"
              >
                <option>All Campaigns</option>
                {Array.from(new Set(liveAgentsData.map((a) => a.campaign).filter(Boolean))).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-blue-600"
              >
                <option>All Teams</option>
                {Array.from(new Set(liveAgentsData.map((a) => a.team).filter(Boolean))).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-blue-600"
              >
                <option>All Agents</option>
                {Array.from(new Set(liveAgentsData.map((a) => a.name).filter(Boolean))).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Call Type</label>
              <select
                value={selectedCallType}
                onChange={(e) => setSelectedCallType(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-blue-600"
              >
                <option>All Calls</option>
                <option>Inbound</option>
                <option>Outbound</option>
                <option>Manual</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPI CARDS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
          {[
            { icon: "👥", label: "Total Agents", val: "24", change: "↑ 8.3% vs previous period" },
            { icon: "📞", label: "Total Calls Handled", val: "4,286", change: "↑ 12.7% vs previous period" },
            { icon: "📤", label: "Outbound Calls", val: "2,184", change: "↑ 9.4%" },
            { icon: "⏱", label: "Average Handle Time", val: "04:18", change: "↓ 6.2% improvement" },
            { icon: "📊", label: "Occupancy Rate", val: "84.7%", change: "↑ 3.8%" },
            { icon: "⭐", label: "Avg CSAT", val: "4.6/5", change: "↑ 0.3 points" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg mb-3">
                {kpi.icon}
              </div>
              <div className="text-xs text-slate-500 font-medium mb-1">{kpi.label}</div>
              <div className="text-2xl font-bold text-slate-900">{kpi.val}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">{kpi.change}</div>
            </div>
          ))}
        </div>

        {/* CHART + OVERALL SCORE ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* PERFORMANCE TREND LINE CHART (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Agent Performance Trend</h2>
                <p className="text-xs text-slate-400 font-normal mt-0.5">Calls handled and average handle time</p>
              </div>

              <select
                value={trendRange}
                onChange={(e) => setTrendRange(e.target.value)}
                className="border border-slate-300 bg-white rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            <div className="h-64 w-full flex items-end justify-between px-4 pb-6 pt-4 relative bg-slate-50/40 rounded-xl border border-slate-100">
              <svg className="absolute inset-0 w-full h-full p-6 overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                <path
                  d="M 0 140 L 80 110 L 160 120 L 240 80 L 320 100 L 400 60 L 480 30"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                />
                {[
                  [0, 140], [80, 110], [160, 120], [240, 80], [320, 100], [400, 60], [480, 30]
                ].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
                ))}
              </svg>

              <div className="absolute bottom-2 inset-x-6 flex justify-between text-[11px] font-semibold text-slate-500">
                {["Sep 1", "Sep 2", "Sep 3", "Sep 4", "Sep 5", "Sep 6", "Sep 7"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* OVERALL PERFORMANCE SCORE */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Overall Performance Score</h2>
              <p className="text-xs text-slate-400 font-normal mt-0.5">Combined agent performance</p>
            </div>

            <div className="flex items-center gap-5 py-4">
              <div className="relative w-32 h-32 rounded-full bg-[conic-gradient(#2563eb_0deg_316deg,#e5e7eb_316deg_360deg)] flex items-center justify-center shadow-xs">
                <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center">
                  <strong className="text-2xl font-extrabold text-slate-900">87%</strong>
                  <span className="text-[11px] text-slate-500 font-semibold">Excellent</span>
                </div>
              </div>

              <div className="flex-1 space-y-3 text-xs">
                {[
                  { label: "Productivity", val: "91%" },
                  { label: "Call Quality", val: "88%" },
                  { label: "Efficiency", val: "84%" },
                  { label: "Customer Satisfaction", val: "92%" },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-slate-500">{s.label}</span>
                    <strong className="text-slate-900 font-bold">{s.val}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* SECOND ROW (Leaderboard, Productivity, Mini Metrics) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* TOP AGENTS LEADERBOARD */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-900">Top Agent Performance</h2>
              <p className="text-[11px] text-slate-400">Ranked by overall performance</p>
            </div>

            <div className="space-y-3.5">
              {[...liveAgentsData]
                .sort((a, b) => parseInt(b.score || "0") - parseInt(a.score || "0"))
                .slice(0, 5)
                .map((top, idx) => {
                  const initials = top.avatarInitials || (top.name ? top.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() : "AG");
                  return (
                    <div key={top.agentId || idx} className="flex items-center gap-3 text-xs">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px]">
                        {idx + 1}
                      </span>
                      <div className="w-8.5 h-8.5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {initials}
                      </div>
                      <div className="flex-1">
                        <strong className="block text-slate-900 font-semibold">{top.name}</strong>
                        <span className="block text-[10px] text-slate-400">{top.agentId} · {top.team || "Voice Team"}</span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900">{top.score || "0%"}</div>
                    </div>
                  );
                })}
              {liveAgentsData.length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">No agent performance records available.</p>
              )}
            </div>
          </div>

          {/* PRODUCTIVITY */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-900">Productivity</h2>
              <p className="text-[11px] text-slate-400">Team performance distribution</p>
            </div>

            <div className="space-y-4 text-xs">
              {[
                { team: "Team A", pct: "92%" },
                { team: "Team B", pct: "87%" },
                { team: "Team C", pct: "81%" },
                { team: "Support", pct: "76%" },
              ].map((row) => (
                <div key={row.team} className="grid grid-cols-[80px_1fr_45px] items-center gap-2">
                  <span className="text-slate-600 font-medium">{row.team}</span>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: row.pct }}></div>
                  </div>
                  <strong className="text-right text-slate-900 font-bold">{row.pct}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* PERFORMANCE METRICS */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-900">Performance Metrics</h2>
              <p className="text-[11px] text-slate-400">Current reporting period</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Answer Rate", val: "93.8%" },
                { label: "Transfer Rate", val: "7.4%" },
                { label: "Avg Talk Time", val: "03:42" },
                { label: "Avg Hold Time", val: "00:24" },
                { label: "Wrap Up", val: "00:31" },
                { label: "Calls / Hour", val: "12.8" },
              ].map((m) => (
                <div key={m.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="block text-[11px] text-slate-500 font-semibold mb-1">{m.label}</span>
                  <strong className="text-lg font-extrabold text-slate-900">{m.val}</strong>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* CALL DISTRIBUTION ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* CALLS HANDLED BY AGENT DUAL-BAR CHART (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Calls Handled by Agent</h2>
              <p className="text-xs text-slate-400">Inbound vs outbound performance</p>
            </div>

            <div className="h-56 flex items-end justify-between px-6 pt-4 bg-slate-50/40 rounded-xl border border-slate-100">
              {filteredAgents.length === 0 ? (
                <div className="w-full flex items-center justify-center text-xs text-slate-400">No agent performance data available</div>
              ) : (
                filteredAgents.slice(0, 6).map((item) => {
                  const maxCall = Math.max(1, ...filteredAgents.slice(0, 6).map(a => Math.max(a.inbound, a.outbound, 1)));
                  return (
                    <div key={item.id || item.name} className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                      <div className="flex items-end gap-1.5 h-[80%]">
                        <div
                          className="w-7 bg-blue-600 rounded-t-sm"
                          style={{ height: `${Math.min(100, (item.inbound / maxCall) * 100)}%` }}
                          title={`Inbound: ${item.inbound}`}
                        ></div>
                        <div
                          className="w-7 bg-blue-300 rounded-t-sm"
                          style={{ height: `${Math.min(100, (item.outbound / maxCall) * 100)}%` }}
                          title={`Outbound: ${item.outbound}`}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold truncate max-w-[70px]" title={item.name}>
                        {item.name.split(" ")[0]}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TIME DISTRIBUTION */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Time Distribution</h2>
              <p className="text-xs text-slate-400">Average agent working time</p>
            </div>

            <div className="space-y-4 text-xs">
              {[
                { label: "Talk Time", pct: "72%" },
                { label: "Ready", pct: "18%" },
                { label: "Wrap Up", pct: "6%" },
                { label: "Break", pct: "4%" },
              ].map((item) => (
                <div key={item.label} className="grid grid-cols-[80px_1fr_45px] items-center gap-2">
                  <span className="text-slate-600 font-medium">{item.label}</span>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: item.pct }}></div>
                  </div>
                  <strong className="text-right text-slate-900 font-bold">{item.pct}</strong>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* AGENT PERFORMANCE DETAILS TABLE PANEL */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden mb-6">
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Agent Performance Details</h2>
              <p className="text-xs text-slate-400">Detailed performance metrics for each agent</p>
            </div>

            <button
              onClick={exportCSV}
              className="border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1250px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Agent</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Inbound</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Outbound</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Calls</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Answered</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Missed</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Answer Rate</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Talk Time</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hold Time</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Wrap Up</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">AHT</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Occupancy</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">CSAT</th>
                  <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAgents.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          {a.avatarInitials}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{a.name}</div>
                          <div className="text-[10px] text-slate-400">{a.agentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          a.status === "Ready"
                            ? "bg-emerald-100 text-emerald-800"
                            : a.status === "Talking"
                            ? "bg-blue-100 text-blue-800"
                            : a.status === "On Break"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{a.inbound}</td>
                    <td className="p-3 text-slate-700">{a.outbound}</td>
                    <td className="p-3 text-slate-900 font-bold">{a.totalCalls}</td>
                    <td className="p-3 text-emerald-700 font-semibold">{a.answered}</td>
                    <td className="p-3 text-rose-600 font-semibold">{a.missed}</td>
                    <td className="p-3 font-bold text-emerald-700">{a.answerRate}</td>
                    <td className="p-3 text-slate-800 font-medium">{a.talkTime}</td>
                    <td className="p-3 text-slate-600">{a.holdTime}</td>
                    <td className="p-3 text-slate-600">{a.wrapUp}</td>
                    <td className="p-3 text-slate-800 font-medium">{a.aht}</td>
                    <td className={`p-3 font-bold ${parseFloat(a.occupancy) >= 90 ? "text-emerald-700" : "text-amber-700"}`}>
                      {a.occupancy}
                    </td>
                    <td className="p-3 text-slate-900 font-semibold">{a.csat}</td>
                    <td className="p-3 font-bold text-emerald-700">{a.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs">
            <div className="text-slate-500 text-[12px]">
              Showing 1–{filteredAgents.length} of 24 agents
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7.5 h-7.5 rounded-md border font-semibold text-xs cursor-pointer flex items-center justify-center ${
                    currentPage === page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button className="w-7.5 h-7.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer flex items-center justify-center">
                ›
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

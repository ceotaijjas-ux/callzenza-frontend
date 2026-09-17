"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AgentStatusRecord {
  id: string;
  name: string;
  avatarInitials: string;
  agentId: string;
  status: "Ready" | "Talking" | "On Break" | "Wrap Up" | "Offline";
  login: string;
  readyTime: string;
  talkTime: string;
  wrapTime: string;
  breakTime: string;
  inboundCalls: number;
  answeredCalls: number;
  missedCalls: number;
  answerRate: string;
  aht: string;
  team: string;
  campaign: string;
}

export default function AgentStatusDetailInboundSummaryPage() {
  const todayStr = new Date().toISOString().split("T")[0];

  // Filters State
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [selectedCampaign, setSelectedCampaign] = useState("All Campaigns");
  const [selectedTeam, setSelectedTeam] = useState("All Teams");
  const [selectedAgentFilter, setSelectedAgentFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Toast Notification
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const [agentsData, setAgentsData] = useState<AgentStatusRecord[]>([]);
  const [liveKpis, setLiveKpis] = useState({
    total_inbound: "0",
    answered: "0",
    abandoned: "0",
    answer_rate: "0.0%",
    service_level: "0.0%",
    avg_handle_time: "00:00"
  });
  const [liveHourlyBars, setLiveHourlyBars] = useState<any[]>([]);
  const [liveTopAgents, setLiveTopAgents] = useState<any[]>([]);
  const [liveStatusDist, setLiveStatusDist] = useState<any[]>([]);
  const [liveQueueMetrics, setLiveQueueMetrics] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await reportService.getGenericReport("agent-status-detail-inbound-summary", {
          from_date: fromDate,
          to_date: toDate,
          campaign_id: selectedCampaign !== "All Campaigns" ? selectedCampaign : undefined,
        });
        if (res) {
          if (res.kpis) setLiveKpis(res.kpis);
          if (Array.isArray(res.hourly_bars)) setLiveHourlyBars(res.hourly_bars);
          if (Array.isArray(res.top_agents)) setLiveTopAgents(res.top_agents);
          if (Array.isArray(res.status_distribution)) setLiveStatusDist(res.status_distribution);
          if (Array.isArray(res.queue_metrics)) setLiveQueueMetrics(res.queue_metrics);

          if (Array.isArray(res.data)) {
            const mapped: AgentStatusRecord[] = res.data.map((item: any, index: number) => ({
              id: item.id || String(index + 1),
              name: item.name || "Agent",
              avatarInitials: item.avatarInitials || "AG",
              agentId: item.agentId || `AGT-00${index + 1}`,
              status: item.status || "Ready",
              login: item.login || "--",
              readyTime: item.readyTime || "00h 00m",
              talkTime: item.talkTime || "00h 00m",
              wrapTime: item.wrapTime || "00h 00m",
              breakTime: item.breakTime || "00h 00m",
              inboundCalls: Number(item.inboundCalls || 0),
              answeredCalls: Number(item.answeredCalls || 0),
              droppedCalls: Number(item.droppedCalls || 0),
              missedCalls: Number(item.missedCalls ?? item.droppedCalls ?? 0),
              answerRate: item.answerRate || "0.0%",
              avgTalk: item.avgTalk || "00m 00s",
              aht: item.aht || item.avgTalk || "00m 00s",
              team: item.team || "Inbound Voice Team",
              campaign: item.campaign || "Inbound Default Trunk",
            }));
            setAgentsData(mapped);
          } else {
            setAgentsData([]);
          }
        }
      } catch (err) {
        console.error("Failed loading agent status inbound summary:", err);
      }
    };
    fetchLive();
  }, [fromDate, toDate, selectedCampaign]);

  const filteredAgents = agentsData.filter((a) => {
    if (selectedCampaign !== "All Campaigns" && a.campaign !== selectedCampaign) return false;
    if (selectedTeam !== "All Teams" && a.team !== selectedTeam) return false;
    if (selectedAgentFilter && a.name !== selectedAgentFilter) return false;
    if (selectedStatusFilter && a.status !== selectedStatusFilter) return false;
    return true;
  });

  const exportCSV = () => {
    let csvRows = [];
    const headers = [
      "Agent",
      "Agent ID",
      "Status",
      "Login",
      "Ready",
      "Talk",
      "Wrap Up",
      "Break",
      "Inbound",
      "Answered",
      "Missed",
      "Answer Rate",
      "AHT",
    ];
    csvRows.push(headers.join(","));

    filteredAgents.forEach((a) => {
      const row = [
        `"${a.name}"`,
        `"${a.agentId}"`,
        `"${a.status}"`,
        `"${a.login}"`,
        `"${a.readyTime}"`,
        `"${a.talkTime}"`,
        `"${a.wrapTime}"`,
        `"${a.breakTime}"`,
        `"${a.inboundCalls}"`,
        `"${a.answeredCalls}"`,
        `"${a.missedCalls}"`,
        `"${a.answerRate}"`,
        `"${a.aht}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "agent-status-detail-inbound-summary.csv";
    link.click();
    URL.revokeObjectURL(url);
    showNotification("CSV export downloaded successfully.");
  };

  return (
    <AppShell>
      <div className="p-4 md:p-7 w-full max-w-[1650px] mx-auto bg-[#f5f7fb] min-h-screen text-[#111827] font-sans">
        
        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className="fixed top-5 right-5 bg-indigo-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
            {notification}
          </div>
        )}

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1">
              Agent Status Detail - Inbound Summary
            </h1>
            <p className="text-slate-500 text-xs md:text-sm">
              Real-time inbound activity, agent availability and performance analytics
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => window.print()}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Print
            </button>
            <button
              onClick={exportCSV}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* FILTER CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 mb-6 shadow-xs">
          <div className="text-sm font-bold text-slate-900 mb-4">Report Filters</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3.5 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Campaign</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-indigo-600"
              >
                <option>All Campaigns</option>
                <option>Inbound Support</option>
                <option>Inbound Sales</option>
                <option>Customer Service</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-indigo-600"
              >
                <option>All Teams</option>
                <option>Sales Team</option>
                <option>Support Team</option>
                <option>Retention Team</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Agent</label>
              <select
                value={selectedAgentFilter}
                onChange={(e) => setSelectedAgentFilter(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-indigo-600"
              >
                <option value="">All Agents</option>
                {agentsData.map((a, idx) => (
                  <option key={idx} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Status</label>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-indigo-600"
              >
                <option value="">All Status</option>
                <option value="Ready">Ready</option>
                <option value="Talking">Talking</option>
                <option value="On Break">On Break</option>
                <option value="Wrap Up">Wrap Up</option>
                <option value="Offline">Offline</option>
              </select>
            </div>

            <button
              onClick={() => showNotification("Filters applied.")}
              className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 text-xs font-semibold cursor-pointer transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* KPI CARDS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
          {[
            { label: "Total Inbound", val: liveKpis.total_inbound, change: "Live DB records", isGood: true },
            { label: "Answered", val: liveKpis.answered, change: "Connected calls", isGood: true },
            { label: "Abandoned", val: liveKpis.abandoned, change: "Live lost calls", isGood: true },
            { label: "Answer Rate", val: liveKpis.answer_rate, change: "SLA target met", isGood: true },
            { label: "Service Level", val: liveKpis.service_level, change: "Within 20s SLA", isGood: true },
            { label: "Avg Handle Time", val: liveKpis.avg_handle_time, change: "Mean duration", isGood: false },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white border border-slate-200 border-l-4 border-l-indigo-600 rounded-xl p-4 shadow-xs"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{kpi.label}</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{kpi.val}</div>
              <div className={`text-[11px] font-semibold mt-1 ${kpi.isGood ? "text-emerald-600" : "text-slate-400"}`}>
                {kpi.change}
              </div>
            </div>
          ))}
        </div>

        {/* DASHBOARD GRID (Inbound Volume Line Chart + Agent Status Distribution Donut) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* CALL VOLUME LINE CHART (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Inbound Call Volume</h2>
              <span className="text-xs text-slate-400 font-medium">Today · Hourly</span>
            </div>

            <div className="h-64 w-full flex items-end justify-between px-4 pb-6 pt-4 relative bg-slate-50/40 rounded-xl border border-slate-100">
              {/* SVG Line Graphic */}
              <svg className="absolute inset-0 w-full h-full p-6 overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                <path
                  d="M 0 120 L 60 80 L 120 40 L 180 20 L 240 50 L 300 70 L 360 10 L 420 0 L 480 100"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="3"
                />
                {[
                  [0, 120], [60, 80], [120, 40], [180, 20], [240, 50], [300, 70], [360, 10], [420, 0], [480, 100]
                ].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="4" fill="#4f46e5" />
                ))}
              </svg>

              {/* Time X-Axis */}
              <div className="absolute bottom-2 inset-x-6 flex justify-between text-[10px] font-semibold text-slate-400">
                {["8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM"].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* AGENT STATUS DONUT */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Agent Status Distribution</h2>
              <span className="text-xs text-slate-400 font-medium">{agentsData.length || 5} Agents</span>
            </div>

            <div className="flex items-center justify-around py-4">
              {/* CSS Donut Chart */}
              <div className="relative w-44 h-44 rounded-full flex items-center justify-center bg-[conic-gradient(#4f46e5_0deg_151deg,#06b6d4_151deg_252deg,#f59e0b_252deg_295deg,#8b5cf6_295deg_324deg,#9ca3af_324deg_360deg)]">
                <div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
                  <div className="text-2xl font-extrabold text-slate-900">{agentsData.length || 5}</div>
                  <div className="text-[10px] text-slate-400 font-semibold">Agents</div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2.5 text-xs">
                {(liveStatusDist.length > 0 ? liveStatusDist : [
                  { label: "Ready", count: Math.max(1, agentsData.length - 2), color: "bg-indigo-600" },
                  { label: "Talking", count: 1, color: "bg-cyan-500" },
                  { label: "Break", count: Math.max(0, agentsData.length - 2), color: "bg-amber-500" },
                  { label: "Wrap Up", count: 0, color: "bg-purple-500" },
                  { label: "Offline", count: 0, color: "bg-slate-400" },
                ]).map((leg) => (
                  <div key={leg.label} className="flex items-center gap-2.5 min-w-[100px] justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${leg.color}`}></span>
                      <span className="text-slate-700 font-medium">{leg.label}</span>
                    </div>
                    <strong className="text-slate-900 font-bold">{leg.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* PERFORMANCE GRAPHS THREE-COLUMN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* ANSWERED VS ABANDONED BAR CHART */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Answered vs Abandoned</h2>
              <span className="text-xs text-slate-400 font-medium">Hourly</span>
            </div>

            <div className="h-44 flex items-end justify-between px-2 pt-4 bg-slate-50/40 rounded-xl border border-slate-100">
              {(liveHourlyBars.length > 0 ? liveHourlyBars : [
                { time: "8AM", ans: 0, ab: 0 },
                { time: "9AM", ans: 4, ab: 0 },
                { time: "10AM", ans: 22, ab: 1 },
                { time: "11AM", ans: 28, ab: 1 },
                { time: "12PM", ans: 12, ab: 1 },
                { time: "1PM", ans: 8, ab: 0 },
                { time: "2PM", ans: 0, ab: 0 },
                { time: "3PM", ans: 0, ab: 0 },
              ]).map((bar) => (
                <div key={bar.time} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                  <div className="flex items-end gap-1 h-[80%]">
                    <div
                      className="w-2.5 bg-indigo-600 rounded-t-xs"
                      style={{ height: `${Math.max(8, (bar.ans / 30) * 100)}%` }}
                      title={`Answered: ${bar.ans}`}
                    ></div>
                    <div
                      className="w-2.5 bg-amber-500 rounded-t-xs"
                      style={{ height: bar.ab > 0 ? `${Math.max(8, (bar.ab / 5) * 100)}%` : "0%" }}
                      title={`Abandoned: ${bar.ab}`}
                    ></div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold">{bar.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SERVICE LEVEL GAUGE */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Service Level</h2>
              <span className="text-xs text-slate-400 font-medium">Target 80%</span>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="relative w-52 h-26 rounded-t-full bg-[conic-gradient(from_270deg,#ef4444_0deg_35deg,#f59e0b_35deg_75deg,#10b981_75deg_150deg,#e5e7eb_150deg_180deg)] flex items-end justify-center">
                <div className="w-38 h-19 rounded-t-full bg-white flex flex-col items-center justify-end pb-3 shadow-xs">
                  <div className="text-2xl font-extrabold text-slate-900">87.4%</div>
                  <div className="text-[10px] text-slate-500 font-medium">Service Level</div>
                </div>
              </div>
            </div>
          </div>

          {/* AVERAGE WAIT TIME LINE CHART */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Average Wait Time</h2>
              <span className="text-xs text-slate-400 font-medium">Today</span>
            </div>

            <div className="h-44 w-full flex items-end justify-between px-4 pb-6 pt-4 relative bg-slate-50/40 rounded-xl border border-slate-100">
              <svg className="absolute inset-0 w-full h-full p-4 overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
                <path
                  d="M 0 80 L 40 60 L 80 40 L 120 20 L 160 30 L 200 45 L 240 35 L 280 50"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                />
                {[
                  [0, 80], [40, 60], [80, 40], [120, 20], [160, 30], [200, 45], [240, 35], [280, 50]
                ].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="3" fill="#06b6d4" />
                ))}
              </svg>

              <div className="absolute bottom-1.5 inset-x-4 flex justify-between text-[9px] font-semibold text-slate-400">
                {["8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM"].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* AGENT PERFORMANCE THREE-COLUMN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* TOP AGENTS LEADERBOARD */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Top Agent Performance</h2>
              <span className="text-xs text-slate-400 font-medium">Calls handled</span>
            </div>

            <div className="space-y-3.5">
              {(liveTopAgents.length > 0 ? liveTopAgents : agentsData.slice(0, 5).map((a, idx) => ({
                rank: `0${idx + 1}`,
                initials: a.avatarInitials,
                name: a.name,
                calls: `${a.answeredCalls} answered calls`,
                score: a.answerRate
              }))).map((top: any) => (
                <div key={top.rank} className="flex items-center gap-3 text-xs">
                  <span className="w-5 text-slate-400 font-semibold">{top.rank}</span>
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                    {top.initials}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{top.name}</div>
                    <div className="text-[10px] text-slate-400">{top.calls}</div>
                  </div>
                  <div className="font-bold text-slate-900">{top.score}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AGENT TIME DISTRIBUTION */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Agent Time Distribution</h2>
              <span className="text-xs text-slate-400 font-medium">Today</span>
            </div>

            <div className="space-y-4">
              {[
                { label: "Ready Time", pct: "42%" },
                { label: "Talking Time", pct: "28%" },
                { label: "Wrap Up", pct: "12%" },
                { label: "Break", pct: "10%" },
                { label: "Other", pct: "8%" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="text-slate-500">{item.pct}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: item.pct }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QUEUE METRICS */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Queue Metrics</h2>
              <span className="text-xs text-slate-400 font-medium">Live</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(liveQueueMetrics.length > 0 ? liveQueueMetrics : [
                { label: "Calls Waiting", val: "0" },
                { label: "Longest Wait", val: "00:00" },
                { label: "Avg Wait", val: "00:00" },
                { label: "Live Calls", val: "0" },
                { label: "Transfers", val: "0" },
                { label: "Overflow", val: "0" },
              ]).map((m: any) => (
                <div key={m.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div className="text-[10px] text-slate-500 font-semibold">{m.label}</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">{m.val}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* AGENT DETAIL TABLE PANEL */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden mb-6">
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Agent Status Details</h2>
            <span className="text-xs text-slate-500 font-medium">{filteredAgents.length} agents</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agent</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Login</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ready</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Talk</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Wrap Up</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Break</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inbound</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Answered</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Missed</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Answer Rate</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">AHT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-400">
                      No agent records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
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
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          a.status === "Ready"
                            ? "bg-emerald-100 text-emerald-800"
                            : a.status === "Talking"
                            ? "bg-blue-100 text-blue-800"
                            : a.status === "On Break"
                            ? "bg-amber-100 text-amber-800"
                            : a.status === "Wrap Up"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{a.login}</td>
                    <td className="p-3 text-slate-800 font-medium">{a.readyTime}</td>
                    <td className="p-3 text-slate-800 font-medium">{a.talkTime}</td>
                    <td className="p-3 text-slate-600">{a.wrapTime}</td>
                    <td className="p-3 text-slate-600">{a.breakTime}</td>
                    <td className="p-3 text-slate-900 font-semibold">{a.inboundCalls}</td>
                    <td className="p-3 text-emerald-700 font-bold">{a.answeredCalls}</td>
                    <td className="p-3 text-rose-600 font-semibold">{a.missedCalls}</td>
                    <td className="p-3 text-slate-900 font-bold">{a.answerRate}</td>
                    <td className="p-3 text-slate-800 font-medium">{a.aht}</td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs">
            <div className="text-slate-500 text-[11px]">
              Showing 1–{filteredAgents.length} of {agentsData.length} agents
            </div>
            <div className="flex gap-1">
              <button className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer">
                ‹
              </button>
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg border font-semibold text-xs cursor-pointer ${
                    currentPage === page
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer">
                ›
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

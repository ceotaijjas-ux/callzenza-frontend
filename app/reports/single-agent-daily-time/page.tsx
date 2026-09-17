"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AgentLogEvent {
  start: string;
  end: string;
  duration: string;
  status: string;
  statusClass: string;
  activity: string;
  calls: number;
  notes: string;
}

export default function SingleAgentDailyTimePage() {
  const [timeLogData, setTimeLogData] = useState<AgentLogEvent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("System Admin");
  const [agentList, setAgentList] = useState<string[]>([]);

  const parseDurMinutes = (str: string) => {
    if (!str) return 0;
    const parts = str.split(":");
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    const hMatch = str.match(/(\d+)\s*h/);
    const mMatch = str.match(/(\d+)\s*m/);
    return (hMatch ? parseInt(hMatch[1], 10) * 60 : 0) + (mMatch ? parseInt(mMatch[1], 10) : 0);
  };

  const totalMin = timeLogData.reduce((acc, r) => acc + parseDurMinutes(r.duration), 0);
  const readyMin = timeLogData.filter(r => r.status.toLowerCase().includes("ready") || r.status.toLowerCase().includes("avail")).reduce((acc, r) => acc + parseDurMinutes(r.duration), 0);
  const talkMin = timeLogData.filter(r => r.status.toLowerCase().includes("talk") || r.status.toLowerCase().includes("call")).reduce((acc, r) => acc + parseDurMinutes(r.duration), 0);
  const breakMin = timeLogData.filter(r => r.status.toLowerCase().includes("break") || r.status.toLowerCase().includes("lunch") || r.status.toLowerCase().includes("pause")).reduce((acc, r) => acc + parseDurMinutes(r.duration), 0);
  const otherMin = Math.max(0, totalMin - (readyMin + talkMin + breakMin));
  const totalCalls = timeLogData.reduce((acc, r) => acc + (r.calls || 0), 0);
  const readyPct = totalMin > 0 ? ((readyMin / totalMin) * 100).toFixed(1) + "%" : "0.0%";
  const talkPct = totalMin > 0 ? ((talkMin / totalMin) * 100).toFixed(1) + "%" : "0.0%";
  const breakPct = totalMin > 0 ? ((breakMin / totalMin) * 100).toFixed(1) + "%" : "0.0%";
  const otherPct = totalMin > 0 ? ((otherMin / totalMin) * 100).toFixed(1) + "%" : "0.0%";
  const totalHoursStr = (totalMin / 60).toFixed(1) + "h";
  const totalFormattedTime = `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;

  React.useEffect(() => {
    const loadLiveReportData = async () => {
      try {
        const res = await reportService.getGenericReport("single-agent-daily-time");
        if (res) {
          if (Array.isArray(res.agents)) {
            setAgentList(res.agents);
          }
          if (Array.isArray(res.data) && res.data.length > 0) {
            const mapped: AgentLogEvent[] = res.data.map((item: any) => ({
              start: item.start,
              end: item.end,
              duration: item.duration,
              status: item.status,
              statusClass: item.statusClass === "green" ? "bg-emerald-100 text-emerald-800" : (item.statusClass === "yellow" ? "bg-amber-100 text-amber-800" : (item.statusClass === "blue" ? "bg-purple-100 text-purple-800" : "bg-indigo-100 text-indigo-800")),
              activity: item.activity,
              calls: item.calls,
              notes: item.notes,
            }));
            setTimeLogData(mapped);
          }
          if (res.agent && res.agent.name) {
            setSelectedAgent(res.agent.name);
          } else if (Array.isArray(res.agents) && res.agents.length > 0) {
            setSelectedAgent(res.agents[0]);
          }
        }
      } catch (err) {
        console.error("Failed loading report for single-agent-daily-time:", err);
      }
    };
    loadLiveReportData();
  }, []);

  // Notification Toast
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const exportCSV = () => {
    let csvRows = [];
    const headers = ["Start Time", "End Time", "Duration", "Status", "Activity", "Calls", "Notes"];
    csvRows.push(headers.join(","));

    timeLogData.forEach((row) => {
      const line = [
        `"${row.start}"`,
        `"${row.end}"`,
        `"${row.duration}"`,
        `"${row.status}"`,
        `"${row.activity}"`,
        `"${row.calls}"`,
        `"${row.notes}"`,
      ];
      csvRows.push(line.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "single-agent-daily-time.csv";
    link.click();
    URL.revokeObjectURL(url);
    showNotification("CSV report exported.");
  };

  return (
    <AppShell>
      <div className="p-4 md:p-7 w-full max-w-[1500px] mx-auto bg-[#f3f5f9] min-h-screen text-[#172033] font-sans">
        
        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className="fixed top-5 right-5 bg-slate-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
            {notification}
          </div>
        )}

        {/* HEADER TOPBAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-base">
              C
            </div>
            <div>
              <Link
                href="/reports"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-0.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Reports
              </Link>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">CallZenza Daily Agent Analytics</h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <div className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-700">
              05 September 2026
            </div>
            <button
              onClick={() => window.print()}
              className="w-9 h-9 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-sm flex items-center justify-center text-slate-700 cursor-pointer"
              title="Print"
            >
              ⎙
            </button>
            <button
              onClick={() => showNotification("Refreshed data.")}
              className="w-9 h-9 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-sm flex items-center justify-center text-slate-700 cursor-pointer"
              title="Refresh"
            >
              ↻
            </button>
          </div>
        </div>

        {/* TITLE ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1">
              Single Agent Daily - Time
            </h1>
            <p className="text-slate-500 text-xs md:text-sm">
              Detailed daily time utilization and activity analysis for one agent.
            </p>
          </div>

          <select
            value={selectedAgent}
            onChange={(e) => {
              setSelectedAgent(e.target.value);
              showNotification(`Loaded daily time report for ${e.target.value}`);
            }}
            className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none shadow-xs min-w-[190px]"
          >
            {agentList.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
            {agentList.length === 0 && <option value={selectedAgent}>{selectedAgent}</option>}
          </select>
        </div>

        {/* AGENT PROFILE BANNER */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 mb-6 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white text-slate-900 font-extrabold text-xl flex items-center justify-center">
              {selectedAgent.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "AG"}
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">{selectedAgent}</h2>
              <p className="text-xs text-slate-300">
                Sales Team &nbsp;•&nbsp; Agent ID: AG-1048 &nbsp;•&nbsp; Shift: 09:00 AM - 06:00 PM
              </p>
              <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 px-3 py-1 rounded-full text-[10px] font-semibold mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Logged In
              </div>
            </div>
          </div>

          <div className="text-left md:text-right relative z-10 pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Logged Time</span>
            <strong className="text-3xl font-extrabold mt-1 block">{totalMin > 0 ? `${Math.floor(totalMin / 60)}h ${totalMin % 60}m` : "00h 00m"}</strong>
          </div>
        </div>

        {/* SUMMARY CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
          {[
            { label: "Logged Time", val: totalMin > 0 ? `${Math.floor(totalMin / 60)}:${(totalMin % 60).toString().padStart(2, '0')}` : "00:00", sub: totalMin > 0 ? "Live session" : "No activity" },
            { label: "Ready Time", val: readyMin > 0 ? `${Math.floor(readyMin / 60)}:${(readyMin % 60).toString().padStart(2, '0')}` : "00:00", sub: totalMin > 0 ? `${Math.round((readyMin / totalMin) * 100)}% of logged time` : "0%" },
            { label: "Talk Time", val: talkMin > 0 ? `${Math.floor(talkMin / 60)}:${(talkMin % 60).toString().padStart(2, '0')}` : "00:00", sub: `${talkMin} minutes active` },
            { label: "Break Time", val: breakMin > 0 ? `${Math.floor(breakMin / 60)}:${(breakMin % 60).toString().padStart(2, '0')}` : "00:00", sub: "Recorded pauses" },
            { label: "Occupancy", val: totalMin > 0 ? `${Math.round(((talkMin + readyMin) / totalMin) * 100)}%` : "0%", sub: "Live agent utilization" },
          ].map((card) => (
            <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.label}</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{card.val}</div>
              <div className="text-[11px] text-slate-400 mt-1">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* MAIN ANALYTICS GRID (Timeline + Time Distribution) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* DAILY TIMELINE (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Agent Activity Timeline</h3>
              <span className="text-xs text-slate-400 font-medium">09:00 AM — 06:00 PM</span>
            </div>

            <div className="relative pl-7 space-y-4 border-l-2 border-slate-200">
              {timeLogData.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No activity timeline events recorded for this agent.
                </div>
              ) : (
                timeLogData.map((ev, idx) => (
                  <div key={idx} className="relative">
                    <span
                      className={`absolute -left-[34px] top-1 w-3 h-3 rounded-full border-2 ${
                        ev.status.toLowerCase().includes("call") || ev.status.toLowerCase().includes("talk")
                          ? "bg-emerald-500 border-emerald-100"
                          : ev.status.toLowerCase().includes("break")
                          ? "bg-amber-500 border-amber-100"
                          : "bg-indigo-600 border-indigo-100"
                      }`}
                    ></span>
                    <div className="flex justify-between text-xs font-bold text-slate-900 mb-1">
                      <span>{ev.status}</span>
                      <span className="text-slate-400 font-normal">{ev.start} - {ev.end}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full ${
                          ev.status.toLowerCase().includes("call") || ev.status.toLowerCase().includes("talk")
                            ? "bg-emerald-500"
                            : ev.status.toLowerCase().includes("break")
                            ? "bg-amber-500"
                            : "bg-indigo-600"
                        }`}
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>{ev.activity || ev.notes || "Recorded Activity"}</span>
                      <strong className="text-slate-700">{ev.duration}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TIME DISTRIBUTION DONUT */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Time Distribution</h3>
              <span className="text-xs text-slate-400 font-medium">{totalFormattedTime} total</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around py-4 gap-4">
              <div className="relative w-38 h-38 rounded-full bg-slate-100 flex items-center justify-center shadow-xs shrink-0">
                <div className="w-26 h-26 rounded-full bg-white flex flex-col items-center justify-center">
                  <strong className="text-2xl font-extrabold text-slate-900">{totalHoursStr}</strong>
                  <span className="text-[10px] text-slate-400 font-semibold">Logged</span>
                </div>
              </div>

              <div className="w-full space-y-3 text-xs">
                {[
                  { label: "Ready", pct: readyPct, color: "bg-indigo-600" },
                  { label: "Talk", pct: talkPct, color: "bg-emerald-500" },
                  { label: "Break", pct: breakPct, color: "bg-amber-500" },
                  { label: "Other", pct: otherPct, color: "bg-slate-300" },
                ].map((leg) => (
                  <div key={leg.label} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${leg.color}`}></span>
                      <span className="text-slate-700 font-medium">{leg.label}</span>
                    </div>
                    <strong className="text-slate-900 font-bold">{leg.pct}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* MINI METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold">Inbound Talk</span>
              <span className="bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-md">IN</span>
            </div>
            <strong className="text-2xl font-extrabold text-slate-900 mt-2">
              {talkMin > 0 ? `${Math.floor(talkMin / 60).toString().padStart(2, '0')}:${(talkMin % 60).toString().padStart(2, '0')}` : "00:00"}
            </strong>
            <p className="text-[10px] text-slate-400 mt-1">{totalCalls} calls recorded</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold">Outbound Talk</span>
              <span className="bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-md">OUT</span>
            </div>
            <strong className="text-2xl font-extrabold text-slate-900 mt-2">00:00</strong>
            <p className="text-[10px] text-slate-400 mt-1">0 outbound calls</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold">Wrap Up</span>
              <span className="bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-md">ACW</span>
            </div>
            <strong className="text-2xl font-extrabold text-slate-900 mt-2">00:00</strong>
            <p className="text-[10px] text-slate-400 mt-1">Average 0 seconds</p>
          </div>
        </div>

        {/* PRODUCTIVITY + DAILY INSIGHTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* TIME UTILIZATION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="pb-3 border-b border-slate-100 mb-4 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Time Utilization</h3>
              <span className="text-xs text-slate-400">Compared with shift</span>
            </div>

            <div className="space-y-3.5 text-xs">
              {[
                { label: "Ready Time", pct: readyPct, color: "bg-indigo-600" },
                { label: "Talk Time", pct: talkPct, color: "bg-emerald-500" },
                { label: "Wrap Up", pct: "0.0%", color: "bg-amber-500" },
                { label: "Break", pct: breakPct, color: "bg-slate-400" },
                { label: "Other / Offline", pct: otherPct, color: "bg-slate-600" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="text-slate-900">{item.pct}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: item.pct }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DAILY INSIGHTS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="pb-3 border-b border-slate-100 mb-4 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Daily Insights</h3>
              <span className="text-xs text-slate-400">System generated</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <strong className="block text-xs font-bold text-slate-900 mb-1">High occupancy</strong>
                <p className="text-xs text-slate-500">Agent occupancy reached 86.3%, indicating strong utilization throughout the shift.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <strong className="block text-xs font-bold text-slate-900 mb-1">Talk time improved</strong>
                <p className="text-xs text-slate-500">Talk time increased compared with the previous working day, driven by higher outbound activity.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <strong className="block text-xs font-bold text-slate-900 mb-1">Break usage</strong>
                <p className="text-xs text-slate-500">Total break time remained within the configured daily allowance.</p>
              </div>
            </div>
          </div>

        </div>

        {/* LAST 7 DAYS — LOGGED TIME BAR CHART */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 mb-6">
          <div className="pb-3 border-b border-slate-100 mb-4 flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">Last 7 Days — Logged Time</h3>
            <span className="text-xs text-slate-400">Daily comparison</span>
          </div>

          <div className="h-44 flex items-end justify-between px-6 pt-4 bg-slate-50/40 rounded-xl border border-slate-100">
            {[
              { day: "Mon", h1: "76%", h2: "84%" },
              { day: "Tue", h1: "80%", h2: "88%" },
              { day: "Wed", h1: "72%", h2: "81%" },
              { day: "Thu", h1: "86%", h2: "91%" },
              { day: "Fri", h1: "78%", h2: "86%" },
              { day: "Sat", h1: "65%", h2: "74%" },
              { day: "Sun", h1: "58%", h2: "66%" },
            ].map((bar) => (
              <div key={bar.day} className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                <div className="flex items-end gap-1.5 h-[80%]">
                  <div className="w-3 bg-slate-300 rounded-t-sm" style={{ height: bar.h1 }}></div>
                  <div className="w-3 bg-indigo-600 rounded-t-sm" style={{ height: bar.h2 }}></div>
                </div>
                <span className="text-xs text-slate-500 font-semibold">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* DETAILED AGENT TIME LOG TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden mb-6">
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Detailed Agent Time Log</h3>
            <button
              onClick={exportCSV}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Time</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">End Time</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Activity</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Calls</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {timeLogData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No agent time log records found for this agent.
                    </td>
                  </tr>
                ) : (
                  timeLogData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 text-slate-700 font-medium">{row.start}</td>
                      <td className="p-3.5 text-slate-700 font-medium">{row.end}</td>
                      <td className="p-3.5 text-slate-900 font-bold">{row.duration}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${row.statusClass}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-900 font-semibold">{row.activity}</td>
                      <td className="p-3.5 text-slate-700 font-bold">{row.calls}</td>
                      <td className="p-3.5 text-slate-500">{row.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="text-center text-xs text-slate-400 pt-3 pb-6 border-t border-slate-200">
          CallZenza Analytics • Single Agent Daily Time Report • Generated automatically
        </footer>

      </div>
    </AppShell>
  );
}

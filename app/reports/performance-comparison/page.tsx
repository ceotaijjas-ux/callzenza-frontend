"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface TeamCompareRecord {
  team: string;
  currentCalls: string;
  previousCalls: string;
  callChange: string;
  currentAnswer: string;
  previousAnswer: string;
  ahtCurrent: string;
  ahtPrevious: string;
  csat: string;
  score: number;
  isWarn?: boolean;
}

export default function PerformanceComparisonReportPage() {
  React.useEffect(() => {
    const loadLiveReportData = async () => {
      try {
        const res = await reportService.getGenericReport("performance-comparison");
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          console.log("Loaded live DB report data for performance-comparison:", res.data.length, "records");
        }
      } catch (err) {
        console.error("Failed loading report for performance-comparison:", err);
      }
    };
    loadLiveReportData();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];

  // Filter States
  const [periodAFrom, setPeriodAFrom] = useState("2026-09-01");
  const [periodATo, setPeriodATo] = useState(todayStr);
  const [periodBFrom, setPeriodBFrom] = useState("2026-08-27");
  const [periodBTo, setPeriodBTo] = useState("2026-08-31");
  const [selectedTeam, setSelectedTeam] = useState("All Teams");

  // Notification Toast State
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const [tableData, setTableData] = useState<TeamCompareRecord[]>([]);

  React.useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await reportService.getGenericReport("performance-comparison", {
          from_date: periodAFrom,
          to_date: periodATo,
        });
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: TeamCompareRecord[] = res.data.map((item: any) => ({
            team: item.team,
            currentCalls: item.currentCalls,
            previousCalls: item.previousCalls,
            callChange: item.callChange,
            currentAnswer: item.currentAnswer,
            previousAnswer: item.previousAnswer,
            ahtCurrent: item.ahtCurrent,
            ahtPrevious: item.ahtPrevious,
            csat: item.currentCsat || "4.8",
            score: 92,
          }));
          setTableData(mapped);
        }
      } catch (err) {
        console.error("Failed loading performance comparison:", err);
      }
    };
    fetchLive();
  }, [periodAFrom, periodATo, periodBFrom, periodBTo]);

  const filteredTableData = tableData.filter((t) => {
    if (selectedTeam !== "All Teams" && t.team !== selectedTeam) return false;
    return true;
  });

  const exportCSV = () => {
    let csvRows = [];
    const headers = [
      "Team",
      "Current Calls",
      "Previous Calls",
      "Call Change",
      "Current Answer",
      "Previous Answer",
      "AHT Current",
      "AHT Previous",
      "CSAT",
      "Performance Score",
    ];
    csvRows.push(headers.join(","));

    filteredTableData.forEach((t) => {
      const row = [
        `"${t.team}"`,
        `"${t.currentCalls}"`,
        `"${t.previousCalls}"`,
        `"${t.callChange}"`,
        `"${t.currentAnswer}"`,
        `"${t.previousAnswer}"`,
        `"${t.ahtCurrent}"`,
        `"${t.ahtPrevious}"`,
        `"${t.csat}"`,
        `"${t.score}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "performance-comparison-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    showNotification("CSV export downloaded successfully.");
  };

  return (
    <AppShell>
      <div className="p-4 md:p-7 w-full max-w-[1600px] mx-auto bg-[#f4f6fa] min-h-screen text-[#172033] font-sans">
        
        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className="fixed top-5 right-5 bg-indigo-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
            {notification}
          </div>
        )}

        {/* HEADER TOPBAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-slate-900 text-white p-5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-extrabold text-lg text-white">
              C
            </div>
            <div>
              <Link
                href="/reports"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-300 hover:text-white transition-colors mb-0.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Reports
              </Link>
              <h2 className="text-lg font-bold tracking-tight">CallZenza Analytics & Reports</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => window.print()}
              className="border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Print
            </button>
            <button
              onClick={exportCSV}
              className="border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Export CSV
            </button>
            <button
              onClick={() => showNotification("Comparison refreshed.")}
              className="border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* PAGE TITLE */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1">
            Performance Comparison
          </h1>
          <p className="text-slate-500 text-xs md:text-sm">
            Compare team and agent performance across two reporting periods.
          </p>
        </div>

        {/* COMPARISON CONFIGURATION FILTER PANEL */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-xs">
          <div className="text-sm font-bold text-slate-900 mb-4">Comparison Configuration</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 items-end">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Period A From</label>
              <input
                type="date"
                value={periodAFrom}
                onChange={(e) => setPeriodAFrom(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-slate-50 text-slate-700 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Period A To</label>
              <input
                type="date"
                value={periodATo}
                onChange={(e) => setPeriodATo(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-slate-50 text-slate-700 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Period B From</label>
              <input
                type="date"
                value={periodBFrom}
                onChange={(e) => setPeriodBFrom(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-slate-50 text-slate-700 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Period B To</label>
              <input
                type="date"
                value={periodBTo}
                onChange={(e) => setPeriodBTo(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-slate-50 text-slate-700 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-slate-50 text-slate-700 outline-none focus:border-indigo-600"
              >
                <option>All Teams</option>
                {Array.from(new Set(tableData.map((t) => t.team).filter(Boolean))).map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => showNotification("Performance comparison updated.")}
              className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 text-xs font-bold cursor-pointer transition-colors"
            >
              Compare
            </button>
          </div>
        </div>

        {/* PERIOD BANNER */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 mb-6 shadow-xs grid grid-cols-1 md:grid-cols-[1fr_80px_1fr] items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center text-sm">
              A
            </div>
            <div>
              <strong className="block text-sm font-bold text-slate-900">Current Period</strong>
              <small className="block text-xs text-slate-400">01 Sep 2026 – 05 Sep 2026</small>
            </div>
          </div>

          <div className="text-center text-slate-400 font-extrabold text-sm uppercase">VS</div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 font-extrabold flex items-center justify-center text-sm">
              B
            </div>
            <div>
              <strong className="block text-sm font-bold text-slate-900">Previous Period</strong>
              <small className="block text-xs text-slate-400">27 Aug 2026 – 31 Aug 2026</small>
            </div>
          </div>
        </div>

        {/* KPI COMPARISON GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
          {[
            { label: "TOTAL CALLS", val: "18,492", prev: "Prev 16,820", change: "▲ 9.9%", isGood: true },
            { label: "ANSWER RATE", val: "94.8%", prev: "Prev 91.4%", change: "▲ 3.4%", isGood: true },
            { label: "AVG HANDLE TIME", val: "03:42", prev: "Prev 04:05", change: "▼ 9.3%", isGood: true },
            { label: "OCCUPANCY", val: "87.2%", prev: "Prev 82.6%", change: "▲ 4.6%", isGood: true },
            { label: "CSAT", val: "4.72", prev: "Prev 4.51", change: "▲ 4.7%", isGood: true },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="text-xs font-bold text-slate-400 tracking-wider">{kpi.label}</div>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900 my-2">{kpi.val}</div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{kpi.prev}</span>
                <span className="text-emerald-600 font-extrabold">{kpi.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN ANALYTICS GRID (Trend Comparison + Performance Index) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* TREND COMPARISON (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Performance Trend Comparison</h3>
                <span className="text-xs text-slate-400">Daily performance index</span>
              </div>
            </div>

            <div className="h-64 w-full flex items-end justify-between px-4 pb-6 pt-4 relative bg-slate-50/40 rounded-xl border border-slate-100">
              <svg className="absolute inset-0 w-full h-full p-6 overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Previous Period Line (Gray) */}
                <path
                  d="M 0 130 L 80 120 L 160 115 L 240 110 L 320 100 L 400 90 L 480 85"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="3"
                />
                {[
                  [0, 130], [80, 120], [160, 115], [240, 110], [320, 100], [400, 90], [480, 85]
                ].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="4" fill="#cbd5e1" />
                ))}

                {/* Current Period Line (Indigo) */}
                <path
                  d="M 0 110 L 80 95 L 160 100 L 240 75 L 320 85 L 400 60 L 480 40"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                />
                {[
                  [0, 110], [80, 95], [160, 100], [240, 75], [320, 85], [400, 60], [480, 40]
                ].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="4" fill="#6366f1" />
                ))}
              </svg>

              <div className="absolute bottom-2 inset-x-6 flex justify-between text-[11px] font-semibold text-slate-500">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>

            <div className="flex gap-6 mt-3 text-xs text-slate-500 font-medium justify-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Current Period
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Previous Period
              </span>
            </div>
          </div>

          {/* PERFORMANCE INDEX */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Performance Index</h3>
              <span className="text-xs text-slate-400">Overall</span>
            </div>

            <div className="text-center py-3">
              <div className="relative w-36 h-36 mx-auto rounded-full bg-[conic-gradient(#6366f1_0_82%,#e8eaf0_82%_100%)] flex items-center justify-center shadow-xs">
                <div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center">
                  <strong className="text-3xl font-extrabold text-slate-900">82</strong>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
              </div>
              <div className="mt-3 text-emerald-600 text-xs font-bold">▲ 7.8% improvement</div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <strong className="block text-slate-900 font-bold">Calls</strong>
                <p className="text-[10px] text-slate-500 mt-0.5">Volume +9.9%</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <strong className="block text-slate-900 font-bold">Quality</strong>
                <p className="text-[10px] text-slate-500 mt-0.5">CSAT +4.7%</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <strong className="block text-slate-900 font-bold">Efficiency</strong>
                <p className="text-[10px] text-slate-500 mt-0.5">AHT -9.3%</p>
              </div>
            </div>
          </div>

        </div>

        {/* TEAM COMPARISON + BIGGEST IMPROVERS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* TEAM PERFORMANCE COMPARISON */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Team Performance Comparison</h3>
              <span className="text-xs text-slate-400">Current vs Previous</span>
            </div>

            <div className="space-y-4 text-xs">
              {[
                { team: "Sales Team", cur: "92%", prev: "84%", score: "92 / 84" },
                { team: "Support Team", cur: "87%", prev: "82%", score: "87 / 82" },
                { team: "Retention Team", cur: "81%", prev: "78%", score: "81 / 78" },
                { team: "Enterprise Team", cur: "76%", prev: "80%", score: "76 / 80" },
              ].map((item) => (
                <div key={item.team} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">{item.team}</span>
                    <strong className="text-slate-900">{item.score}</strong>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: item.cur }}></div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-300 rounded-full" style={{ width: item.prev }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BIGGEST IMPROVERS */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Biggest Improvers</h3>
              <span className="text-xs text-slate-400">Top 5</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {tableData.slice(0, 5).map((teamItem, idx) => {
                const initials = teamItem.team.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={teamItem.team || idx} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="w-8.5 h-8.5 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold text-xs flex items-center justify-center">
                      {initials}
                    </div>
                    <div className="flex-1">
                      <strong className="block text-slate-900 font-bold">{teamItem.team}</strong>
                      <small className="block text-slate-400">Calls: {teamItem.currentCalls}</small>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-extrabold border border-emerald-100">
                      {teamItem.callChange || "+0.0%"}
                    </span>
                  </div>
                );
              })}
              {tableData.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">No comparison data available.</p>
              )}
            </div>
          </div>

        </div>

        {/* PERFORMANCE DECLINERS SECTION */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 mb-6">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-900">Performance Decliners</h3>
            <span className="text-xs text-slate-400">Requires attention</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <strong className="block text-xs font-bold text-slate-900 mb-1">Enterprise Team</strong>
              <p className="text-xs text-slate-500">Performance dropped from 80 to 76. Review occupancy and answer rate.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <strong className="block text-xs font-bold text-slate-900 mb-1">Agent Availability</strong>
              <p className="text-xs text-slate-500">Average ready time decreased by 4.2% compared with the previous period.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <strong className="block text-xs font-bold text-slate-900 mb-1">Missed Calls</strong>
              <p className="text-xs text-slate-500">Missed calls increased by 2.1% in the Enterprise queue.</p>
            </div>
          </div>
        </div>

        {/* DETAILED PERFORMANCE COMPARISON TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden mb-6">
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Detailed Performance Comparison</h3>
            <button
              onClick={exportCSV}
              className="border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Team</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Calls</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Previous Calls</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Call Change</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Answer</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Previous Answer</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">AHT Current</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">AHT Previous</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">CSAT</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTableData.map((row) => (
                  <tr key={row.team} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{row.team}</td>
                    <td className="p-3.5 text-slate-900 font-semibold">{row.currentCalls}</td>
                    <td className="p-3.5 text-slate-500">{row.previousCalls}</td>
                    <td className="p-3.5 text-emerald-600 font-extrabold">{row.callChange}</td>
                    <td className="p-3.5 text-slate-900 font-semibold">{row.currentAnswer}</td>
                    <td className="p-3.5 text-slate-500">{row.previousAnswer}</td>
                    <td className="p-3.5 text-slate-900 font-semibold">{row.ahtCurrent}</td>
                    <td className="p-3.5 text-slate-500">{row.ahtPrevious}</td>
                    <td className="p-3.5 text-slate-900 font-semibold">{row.csat}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                          row.isWarn ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {row.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

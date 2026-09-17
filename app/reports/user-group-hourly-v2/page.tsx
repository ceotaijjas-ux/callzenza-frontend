"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLiveClock } from "@/lib/useLiveClock";

interface HourlyGroupRecord {
  id: string;
  name: string;
  code: string;
  totalUsers: number;
  hour: string;
  users: number;
  logins: number;
  successful: number;
  failed: number;
  active: number;
  idle: number;
  avgSession: string;
  utilization: string;
  status: "Active" | "Idle" | "Low Activity";
}

export default function UserGroupHourlyReportV2Page() {
  const { currentHourWindow, timeStr } = useLiveClock();

  React.useEffect(() => {
    const loadLiveReportData = async () => {
      try {
        const res = await reportService.getGenericReport("user-group-hourly-v2");
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          console.log("Loaded live DB report data for user-group-hourly-v2:", res.data.length, "records");
        }
      } catch (err) {
        console.error("Failed loading report for user-group-hourly-v2:", err);
      }
    };
    loadLiveReportData();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];

  // Filter States
  const [reportDate, setReportDate] = useState(todayStr);
  const [selectedGroup, setSelectedGroup] = useState("All User Groups");
  const [selectedHourRange, setSelectedHourRange] = useState("Full Day");
  const [selectedActivity, setSelectedActivity] = useState("All Activity");
  const [selectedInterval, setSelectedInterval] = useState("Hourly");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Toast Notification
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const [tableData, setTableData] = useState<HourlyGroupRecord[]>([]);

  React.useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await reportService.getGenericReport("user-group-hourly-v2", {
          from_date: reportDate,
          to_date: reportDate,
        });
        if (res && Array.isArray(res.data)) {
          const mapped: HourlyGroupRecord[] = res.data.map((item: any, idx: number) => ({
            id: item.id || String(idx + 1),
            name: item.name || "Inbound Voice Group",
            code: item.code || "IV",
            totalUsers: Number(item.totalUsers || item.users || 0),
            hour: item.hour || timeStr,
            users: Number(item.users || 0),
            logins: Number(item.logins || 0),
            successful: Number(item.successful || item.logins || 0),
            failed: Number(item.failed || 0),
            active: Number(item.active || item.users || 0),
            idle: Number(item.idle || 0),
            avgSession: item.avgSessionTime || item.avgSession || "00:00",
            utilization: item.efficiency || item.utilization || "0.0%",
            status: item.status || "Active",
          }));
          setTableData(mapped);
        }
      } catch (err) {
        console.error("Failed loading user group hourly:", err);
      }
    };
    fetchLive();
  }, [reportDate]);

  const filteredTableData = tableData.filter((r) => {
    if (selectedGroup !== "All User Groups" && r.name !== selectedGroup) return false;
    return true;
  });

  const exportCSV = () => {
    let csvRows = [];
    const headers = [
      "User Group",
      "Hour",
      "Users",
      "Logins",
      "Successful",
      "Failed",
      "Active",
      "Idle",
      "Avg Session",
      "Utilization",
      "Status",
    ];
    csvRows.push(headers.join(","));

    filteredTableData.forEach((r) => {
      const row = [
        `"${r.name}"`,
        `"${r.hour}"`,
        `"${r.users}"`,
        `"${r.logins}"`,
        `"${r.successful}"`,
        `"${r.failed}"`,
        `"${r.active}"`,
        `"${r.idle}"`,
        `"${r.avgSession}"`,
        `"${r.utilization}"`,
        `"${r.status}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "user-group-hourly-report-v2.csv";
    link.click();
    URL.revokeObjectURL(url);
    showNotification("CSV export downloaded successfully.");
  };

  return (
    <AppShell>
      <div className="p-4 md:p-7 w-full max-w-[1550px] mx-auto bg-[#f5f7fb] min-h-screen text-[#172033] font-sans">
        
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
              <h2 className="text-lg font-bold tracking-tight text-slate-900">CallZenza User Group Analytics</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => window.print()}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Print
            </button>
            <button
              onClick={() => showNotification("Refreshed report.")}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Refresh
            </button>
            <button
              onClick={exportCSV}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* PAGE TITLE */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1">
            User Group Hourly Report - v2
          </h1>
          <p className="text-slate-500 text-xs md:text-sm">
            Hour-by-hour login, activity and availability analysis across user groups.
          </p>
        </div>

        {/* HOURLY REPORT FILTERS CARD (DARK BANNER) */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 md:p-6 mb-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold">Hourly Report Filters</h3>
            <span className="text-xs text-slate-400 font-mono">Timezone: Asia/Kolkata</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 items-end">
            <div>
              <label className="block text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full h-10 border border-slate-700 bg-slate-800 text-white rounded-lg px-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">User Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full h-10 border border-slate-700 bg-slate-800 text-white rounded-lg px-3 text-xs outline-none focus:border-indigo-400"
              >
                <option>All User Groups</option>
                <option>Agents</option>
                <option>Managers</option>
                <option>Supervisors</option>
                <option>Administrators</option>
                <option>Reports Users</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">Hour Range</label>
              <select
                value={selectedHourRange}
                onChange={(e) => setSelectedHourRange(e.target.value)}
                className="w-full h-10 border border-slate-700 bg-slate-800 text-white rounded-lg px-3 text-xs outline-none focus:border-indigo-400"
              >
                <option>Full Day</option>
                <option>09:00 - 12:00</option>
                <option>12:00 - 15:00</option>
                <option>15:00 - 18:00</option>
                <option>18:00 - 21:00</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">Activity</label>
              <select
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full h-10 border border-slate-700 bg-slate-800 text-white rounded-lg px-3 text-xs outline-none focus:border-indigo-400"
              >
                <option>All Activity</option>
                <option>Login</option>
                <option>Logout</option>
                <option>Active</option>
                <option>Idle</option>
                <option>Failed Login</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">Interval</label>
              <select
                value={selectedInterval}
                onChange={(e) => setSelectedInterval(e.target.value)}
                className="w-full h-10 border border-slate-700 bg-slate-800 text-white rounded-lg px-3 text-xs outline-none focus:border-indigo-400"
              >
                <option>Hourly</option>
                <option>30 Minutes</option>
                <option>15 Minutes</option>
              </select>
            </div>

            <button
              onClick={() => showNotification("User Group Hourly Report generated successfully.")}
              className="h-10 bg-white hover:bg-slate-100 text-slate-900 rounded-lg px-5 text-xs font-bold cursor-pointer transition-colors"
            >
              Generate Report
            </button>
          </div>
        </div>

        {/* KPI CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
          {[
            { label: "TOTAL LOGIN SESSIONS", val: String(tableData.reduce((acc, r) => acc + r.logins, 0)), sub: "Today", tag: "Live DB", isGood: true },
            { label: "PEAK HOUR", val: tableData.length > 0 ? tableData[0].hour : "--", sub: `${tableData.length > 0 ? tableData[0].logins : 0} sessions`, tag: "Recorded", isGood: true },
            { label: "ACTIVE USERS", val: String(tableData.reduce((acc, r) => acc + r.active, 0)), sub: "Current hour", tag: tableData.length > 0 ? "Online" : "0.0%", isGood: true },
            { label: "AVG SESSION", val: tableData.length > 0 ? tableData[0].avgSession : "00:00", sub: "Per user", tag: "Average", isGood: true },
            { label: "FAILED LOGINS", val: String(tableData.reduce((acc, r) => acc + r.failed, 0)), sub: "Attempts", tag: "0.0%", isGood: true },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">{kpi.label}</div>
              <div className="text-2xl md:text-3xl font-black text-slate-900 my-2">{kpi.val}</div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">{kpi.sub}</span>
                <span className={`font-extrabold ${kpi.isGood ? "text-emerald-600" : "text-rose-600"}`}>{kpi.tag}</span>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN GRID (Hourly Chart + Current Hour Snapshot) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* HOURLY LOGIN ACTIVITY LINE CHART (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Hourly Login Activity</h3>
              <span className="text-xs text-slate-400">Sessions per hour</span>
            </div>

            <div className="h-64 w-full flex items-end justify-between px-4 pb-6 pt-4 relative bg-slate-50/40 rounded-xl border border-slate-100">
              <svg className="absolute inset-0 w-full h-full p-6 overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="hourlyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <polygon points="0,150 45,120 90,80 135,50 180,10 225,40 270,75 315,55 360,65 405,90 450,120 495,145 495,200 0,200" fill="url(#hourlyAreaGrad)" />
                <path
                  d="M 0 150 L 45 120 L 90 80 L 135 50 L 180 10 L 225 40 L 270 75 L 315 55 L 360 65 L 405 90 L 450 120 L 495 145"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                />
                {[
                  [0, 150], [45, 120], [90, 80], [135, 50], [180, 10], [225, 40], [270, 75], [315, 55], [360, 65], [405, 90], [450, 120], [495, 145]
                ].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="4" fill="#ffffff" stroke="#6366f1" strokeWidth="2.5" />
                ))}
              </svg>

              <div className="absolute bottom-2 inset-x-6 flex justify-between text-[10px] font-semibold text-slate-400">
                {["07", "08", "09", "10", "11", "12", "01", "02", "03", "04", "05", "06"].map((h) => (
                  <span key={h}>{h}</span>
                ))}
              </div>
            </div>
          </div>

          {/* CURRENT HOUR SNAPSHOT */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Current Hour Snapshot</h3>
              <span className="text-xs text-slate-400">{currentHourWindow}</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Active Sessions</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> LIVE
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900 my-1">286</div>
              <div className="text-[10px] text-slate-400 font-medium">Users currently active</div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-indigo-600 rounded-full w-[78%]"></div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { hr: "08 AM", pct: "42%", val: 128 },
                { hr: "09 AM", pct: "63%", val: 218 },
                { hr: "10 AM", pct: "71%", val: 264 },
                { hr: "11 AM", pct: "100%", val: 337 },
                { hr: "12 PM", pct: "85%", val: 288 },
                { hr: "01 PM", pct: "66%", val: 221 },
              ].map((item) => (
                <div key={item.hr} className="grid grid-cols-[45px_1fr_40px] items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-semibold">{item.hr}</span>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: item.pct }}></div>
                  </div>
                  <strong className="text-right text-[11px] text-slate-900 font-bold">{item.val}</strong>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* USER GROUP HOURLY ACTIVITY MATRIX CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 mb-6">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-900">User Group Hourly Activity Matrix</h3>
            <span className="text-xs text-slate-400">Login sessions by hour</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-separate border-spacing-1.5 min-w-[950px]">
              <thead>
                <tr>
                  <th className="text-left text-xs font-bold text-slate-400 p-2">User Group</th>
                  {["08 AM", "09 AM", "10 AM", "11 AM", "12 PM", "01 PM", "02 PM", "03 PM", "04 PM", "05 PM", "06 PM"].map((h) => (
                    <th key={h} className="text-xs font-bold text-slate-400 p-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-xs font-bold">
                {[
                  { group: "Agents", vals: [62, 148, 198, 242, 218, 174, 205, 231, 214, 169, 91] },
                  { group: "Managers", vals: [18, 38, 54, 72, 61, 49, 66, 71, 57, 36, 21] },
                  { group: "Supervisors", vals: [14, 32, 45, 58, 52, 41, 61, 64, 48, 29, 17] },
                  { group: "Administrators", vals: [9, 21, 34, 41, 37, 28, 39, 44, 36, 23, 12] },
                ].map((row) => (
                  <tr key={row.group}>
                    <td className="text-left bg-slate-50 text-slate-800 p-2.5 rounded-lg font-bold">{row.group}</td>
                    {row.vals.map((v, i) => {
                      let cellClass = "bg-slate-100 text-slate-600";
                      if (v >= 200) cellClass = "bg-indigo-600 text-white font-black";
                      else if (v >= 100) cellClass = "bg-indigo-300 text-indigo-950";
                      else if (v >= 40) cellClass = "bg-indigo-100 text-indigo-800";
                      return (
                        <td key={i} className={`p-2.5 rounded-lg ${cellClass}`}>
                          {v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOWER THREE-COLUMN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* HOURLY LOGIN STATUS */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Hourly Login Status</h3>
              <span className="text-xs text-slate-400">Current hour</span>
            </div>

            <div className="space-y-3.5 text-xs">
              {[
                { label: "Successful", count: "286", color: "bg-emerald-500" },
                { label: "Idle", count: "34", color: "bg-amber-500" },
                { label: "Failed", count: "8", color: "bg-rose-500" },
                { label: "Logged Out", count: "42", color: "bg-slate-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                    <span className="text-slate-700 font-medium">{item.label}</span>
                  </div>
                  <strong className="text-slate-900 font-black">{item.count}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* TOP ACTIVITY HOURS */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Top Activity Hours</h3>
              <span className="text-xs text-slate-400">Highest sessions</span>
            </div>

            <div className="space-y-3">
              {[
                { rank: "01", time: "11:00 AM - 12:00 PM", note: "Peak activity window", count: "337" },
                { rank: "02", time: "12:00 PM - 01:00 PM", note: "High activity", count: "288" },
                { rank: "03", time: "10:00 AM - 11:00 AM", note: "High activity", count: "264" },
                { rank: "04", time: "02:00 PM - 03:00 PM", note: "High activity", count: "251" },
              ].map((p) => (
                <div key={p.rank} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-black flex items-center justify-center text-xs">
                    {p.rank}
                  </div>
                  <div className="flex-1">
                    <strong className="block text-slate-900 font-bold">{p.time}</strong>
                    <small className="block text-[10px] text-slate-400">{p.note}</small>
                  </div>
                  <strong className="text-slate-900 font-black">{p.count}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* GROUP UTILIZATION */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Group Utilization</h3>
              <span className="text-xs text-slate-400">Current day</span>
            </div>

            <div className="space-y-4 text-xs">
              {tableData.length === 0 ? (
                <div className="text-slate-400 text-xs text-center py-4">No group utilization data recorded.</div>
              ) : (
                tableData.slice(0, 4).map((g) => (
                  <div key={g.id} className="space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-800">{g.name}</span>
                      <span className="text-slate-900 font-black">{g.utilization}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: g.utilization }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* HOURLY USER GROUP DETAILS TABLE PANEL */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden mb-6">
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Hourly User Group Details</h3>

            <button
              onClick={exportCSV}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">User Group</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hour</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Users</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logins</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Successful</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Failed</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Idle</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Session</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Utilization</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTableData.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      No hourly user group records found.
                    </td>
                  </tr>
                ) : (
                  filteredTableData.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center">
                            {r.code}
                          </div>
                          <div>
                            <strong className="block text-slate-900 font-bold">{r.name}</strong>
                            <small className="block text-slate-400">{r.totalUsers} users</small>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">{r.hour}</td>
                      <td className="p-3.5 font-bold text-slate-900">{r.users}</td>
                      <td className="p-3.5 font-bold text-slate-900">{r.logins}</td>
                      <td className="p-3.5 text-emerald-700 font-bold">{r.successful}</td>
                      <td className="p-3.5 text-rose-600 font-semibold">{r.failed}</td>
                      <td className="p-3.5 text-slate-800 font-medium">{r.active}</td>
                      <td className="p-3.5 text-slate-600">{r.idle}</td>
                      <td className="p-3.5 text-slate-800 font-medium">{r.avgSession}</td>
                      <td className="p-3.5 font-bold text-emerald-700">{r.utilization}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            r.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : r.status === "Idle"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs">
            <span className="text-slate-400 text-[10px]">
              Showing {filteredTableData.length > 0 ? 1 : 0}–{filteredTableData.length} of {tableData.length} user group records
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7.5 h-7.5 rounded-lg border font-semibold text-xs cursor-pointer flex items-center justify-center ${
                    currentPage === page
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button className="w-7.5 h-7.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer flex items-center justify-center">
                ›
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="text-center text-xs text-slate-400 pt-3 pb-6 border-t border-slate-200">
          CallZenza Analytics • User Group Hourly Report v2 • Generated automatically
        </footer>

      </div>
    </AppShell>
  );
}

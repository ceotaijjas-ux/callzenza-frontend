"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";

interface UserStatRow {
  name: string;
  email: string;
  initials: string;
  group: string;
  loginCount: number;
  lastLogin: string;
  sessionTime: string;
  activeTime: string;
  idleTime: string;
  calls: number;
  successRate: string;
  status: "Active" | "Idle" | "Offline" | "Blocked";
}

const INITIAL_USERS: UserStatRow[] = [];

export default function UserStatsPage() {
  const [userStatsList, setUserStatsList] = useState<UserStatRow[]>([]);
  const totalUsersCount = userStatsList.length;
  const activeUsersCount = userStatsList.filter((u) => u.status === "Active").length;
  const offlineUsersCount = userStatsList.filter((u) => u.status === "Offline").length;
  const idleUsersCount = userStatsList.filter((u) => u.status === "Idle").length;
  const availableUsersCount = Math.max(0, activeUsersCount - idleUsersCount);
  const activePct = totalUsersCount > 0 ? Math.round((activeUsersCount / totalUsersCount) * 100) : 0;
  const totalSessionsCount = userStatsList.reduce((acc, u) => acc + (Number(u.loginCount) || 0), 0);

  React.useEffect(() => {
    const loadLiveReportData = async () => {
      try {
        const res = await reportService.getGenericReport("user-stats");
        if (res && Array.isArray(res.data)) {
          const mapped: UserStatRow[] = res.data.map((item: any) => ({
            name: item.name,
            email: item.email,
            initials: item.initials || "US",
            group: item.group || "Inbound Voice Team",
            loginCount: item.loginCount ?? 0,
            lastLogin: item.lastLogin || "--",
            sessionTime: item.sessionTime || "00h 00m",
            activeTime: item.activeTime || "00h 00m",
            idleTime: item.idleTime || "00h 00m",
            calls: Number(item.calls || 0),
            successRate: item.calls > 0 ? `${Math.round(((item.sales || 0) / item.calls) * 100)}%` : "0.0%",
            status: item.status === "Active" ? "Active" : "Offline",
          }));
          setUserStatsList(mapped);
        } else {
          setUserStatsList([]);
        }
      } catch (err) {
        console.error("Failed loading report for user-stats:", err);
      }
    };
    loadLiveReportData();
  }, []);

  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-05");
  const [userGroup, setUserGroup] = useState("All User Groups");
  const [userStatus, setUserStatus] = useState("All Status");
  const [viewBy, setViewBy] = useState("Daily");
  const [isApplying, setIsApplying] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [notification, setNotification] = useState<string | null>(null);

  const handleApplyFilters = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setNotification("User Stats report updated successfully.");
      setTimeout(() => setNotification(null), 3000);
    }, 600);
  };

  const exportCSV = () => {
    const headers = [
      "User",
      "Email",
      "Group",
      "Login Count",
      "Last Login",
      "Session Time",
      "Active Time",
      "Idle Time",
      "Calls",
      "Success Rate",
      "Status",
    ];

    const rows = userStatsList.map((u) => [
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.group}"`,
      `"${u.loginCount}"`,
      `"${u.lastLogin}"`,
      `"${u.sessionTime}"`,
      `"${u.activeTime}"`,
      `"${u.idleTime}"`,
      `"${u.calls}"`,
      `"${u.successRate}"`,
      `"${u.status}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "user-stats-report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-[#f4f6fa] text-[#172033] font-sans pb-12">
        {/* Header Bar */}
        <header className="h-[76px] bg-[#111827] text-white flex items-center justify-between px-6 md:px-8 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-black shadow-md">
              C
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">CallZenza</h2>
              <span className="text-[10px] text-gray-400 block tracking-wide">
                User Analytics & Statistics
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-[#1f2937] hover:bg-[#374151] border border-[#374151] text-white rounded-lg px-3 py-2 text-xs font-medium transition"
            >
              Print
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#1f2937] hover:bg-[#374151] border border-[#374151] text-white rounded-lg px-3 py-2 text-xs font-medium transition"
            >
              Refresh
            </button>
            <button
              onClick={exportCSV}
              className="bg-[#6366f1] hover:bg-indigo-600 text-white rounded-lg px-3.5 py-2 text-xs font-semibold shadow transition"
            >
              Export CSV
            </button>
          </div>
        </header>

        {/* Main Content Container */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 pt-7 space-y-6">
          {/* Toast Notification */}
          {notification && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
              <span>✅ {notification}</span>
              <button
                onClick={() => setNotification(null)}
                className="text-emerald-600 hover:text-emerald-900 font-bold ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {/* Title Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                User Stats
              </h1>
              <p className="text-slate-500 text-xs md:text-sm mt-1">
                Complete overview of user activity, sessions, availability and performance statistics.
              </p>
            </div>
            <div className="bg-white border border-slate-200 px-3.5 py-2 rounded-[9px] text-xs font-bold text-slate-700 shadow-sm self-start md:self-auto">
              05 September 2026
            </div>
          </div>

          {/* Filter Card */}
          <section className="bg-white border border-[#e1e5eb] rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">Statistics Filters</h3>
              <span className="text-[11px] text-slate-400">Customize report view</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1.5">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full h-10 bg-[#fafbfc] border border-[#dfe4eb] rounded-lg px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1.5">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full h-10 bg-[#fafbfc] border border-[#dfe4eb] rounded-lg px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1.5">
                  User Group
                </label>
                <select
                  value={userGroup}
                  onChange={(e) => setUserGroup(e.target.value)}
                  className="w-full h-10 bg-[#fafbfc] border border-[#dfe4eb] rounded-lg px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option>All User Groups</option>
                  <option>Agents</option>
                  <option>Managers</option>
                  <option>Supervisors</option>
                  <option>Administrators</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1.5">
                  User Status
                </label>
                <select
                  value={userStatus}
                  onChange={(e) => setUserStatus(e.target.value)}
                  className="w-full h-10 bg-[#fafbfc] border border-[#dfe4eb] rounded-lg px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Idle</option>
                  <option>Offline</option>
                  <option>Blocked</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1.5">
                  View By
                </label>
                <select
                  value={viewBy}
                  onChange={(e) => setViewBy(e.target.value)}
                  className="w-full h-10 bg-[#fafbfc] border border-[#dfe4eb] rounded-lg px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option>Daily</option>
                  <option>Hourly</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleApplyFilters}
                  disabled={isApplying}
                  className="w-full h-10 bg-[#6366f1] hover:bg-indigo-600 text-white rounded-lg text-xs font-extrabold transition shadow disabled:opacity-70"
                >
                  {isApplying ? "Loading..." : "Apply"}
                </button>
              </div>
            </div>
          </section>

          {/* KPI Section */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white border border-[#e1e5eb] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Total Users
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                  USR
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2.5">{totalUsersCount}</div>
              <div className="text-[10px] text-slate-400 mt-1">
                <span className="text-emerald-600 font-bold">+12</span> new users this period
              </div>
            </div>

            <div className="bg-white border border-[#e1e5eb] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Active Users
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                  ON
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2.5">{activeUsersCount}</div>
              <div className="text-[10px] text-slate-400 mt-1">
                <span className="text-emerald-600 font-bold">{activePct}%</span> currently active
              </div>
            </div>

            <div className="bg-white border border-[#e1e5eb] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Total Sessions
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                  SES
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2.5">{totalSessionsCount}</div>
              <div className="text-[10px] text-slate-400 mt-1">
                <span className="text-emerald-600 font-bold">+8.4%</span> vs previous period
              </div>
            </div>

            <div className="bg-white border border-[#e1e5eb] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Avg Session
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                  AVG
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2.5">07:42</div>
              <div className="text-[10px] text-slate-400 mt-1">Average session duration</div>
            </div>

            <div className="bg-white border border-[#e1e5eb] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Login Rate
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                  IN
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2.5">
                {totalUsersCount > 0 ? "98.2%" : "0%"}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                <span className="text-emerald-600 font-bold">▲ 2.8%</span> auth success
              </div>
            </div>

            <div className="bg-white border border-[#e1e5eb] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Failed Logins
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                  ERR
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2.5">
                {totalUsersCount > 0 ? userStatsList.filter(u => u.status === "Blocked").length : 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                <span className="text-amber-600 font-bold">
                  {totalSessionsCount > 0 ? `${((userStatsList.filter(u => u.status === "Blocked").length / totalSessionsCount) * 100).toFixed(1)}%` : "0%"}
                </span> of total attempts
              </div>
            </div>
          </section>

          {/* Main Analytics Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Activity Bar Chart */}
            <div className="lg:col-span-2 bg-white border border-[#e1e5eb] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">User Activity by Day</h3>
                  <span className="text-xs text-slate-400">Sessions & active users</span>
                </div>
              </div>

              <div className="relative h-64 flex items-end justify-between gap-3 px-4 pb-6 pt-4 border-b border-slate-100">
                {/* Horizontal guide lines */}
                <div className="absolute inset-x-0 top-0 bottom-6 pointer-events-none flex flex-col justify-between">
                  <div className="border-b border-dashed border-slate-100 w-full" />
                  <div className="border-b border-dashed border-slate-100 w-full" />
                  <div className="border-b border-dashed border-slate-100 w-full" />
                  <div className="border-b border-dashed border-slate-100 w-full" />
                </div>

                {[
                  { day: "Mon", val: 218, height: "54%" },
                  { day: "Tue", val: 264, height: "68%" },
                  { day: "Wed", val: 241, height: "61%" },
                  { day: "Thu", val: 302, height: "79%" },
                  { day: "Fri", val: 288, height: "75%" },
                  { day: "Sat", val: 337, height: "88%" },
                  { day: "Sun", val: 196, height: "51%" },
                ].map((item) => (
                  <div key={item.day} className="flex-1 h-full flex flex-col items-center justify-end relative group">
                    <span className="absolute -top-5 text-[10px] font-extrabold text-slate-600">
                      {item.val}
                    </span>
                    <div
                      style={{ height: item.height }}
                      className="w-full max-w-[42px] bg-indigo-500 rounded-t-lg transition-all duration-200 group-hover:bg-indigo-600 group-hover:-translate-y-1 shadow-sm"
                    />
                    <span className="absolute -bottom-6 text-[10px] font-semibold text-slate-400">
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Active Users */}
            <div className="bg-white border border-[#e1e5eb] rounded-2xl p-5 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-900">Most Active Users</h3>
                <span className="text-xs text-slate-400">Today</span>
              </div>

              <div className="space-y-3 flex-1 flex flex-col justify-around">
                {userStatsList.slice(0, 3).map((user) => (
                  <div key={user.name} className="border border-slate-100 bg-[#fafbfc] rounded-xl p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">
                        {user.initials}
                      </div>
                      <div className="flex-1">
                        <strong className="block text-xs font-bold text-slate-900">{user.name}</strong>
                        <small className="block text-[10px] text-slate-400">{user.group}</small>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-md">
                        {user.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="bg-white border border-slate-100 rounded-lg p-2 text-center">
                        <span className="block text-[9px] text-slate-400">Sessions</span>
                        <strong className="block text-xs font-black text-slate-800 mt-0.5">
                          {user.loginCount}
                        </strong>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-lg p-2 text-center">
                        <span className="block text-[9px] text-slate-400">Active Time</span>
                        <strong className="block text-xs font-black text-slate-800 mt-0.5">
                          {user.activeTime}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
                {userStatsList.length === 0 && (
                  <p className="text-xs text-slate-400 py-6 text-center">No active users recorded.</p>
                )}
              </div>
            </div>
          </section>

          {/* Secondary Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Status Donut Chart */}
            <div className="bg-white border border-[#e1e5eb] rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-bold text-slate-900">User Status</h3>
                <span className="text-xs text-slate-400">{totalUsersCount} users</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Conic Gradient Donut Representation */}
                <div
                  className="w-36 h-36 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner"
                  style={{
                    background:
                      "conic-gradient(#6366f1 0 48%, #10b981 48% 77%, #f59e0b 77% 91%, #e5e7eb 91% 100%)",
                  }}
                >
                  <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center shadow">
                    <strong className="text-xl font-black text-slate-900">{activePct}%</strong>
                    <span className="text-[10px] text-slate-400">Active</span>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
                      <span className="text-slate-600 font-medium">Active</span>
                    </div>
                    <strong className="font-bold text-slate-800">{activeUsersCount}</strong>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                      <span className="text-slate-600 font-medium">Available</span>
                    </div>
                    <strong className="font-bold text-slate-800">{availableUsersCount}</strong>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                      <span className="text-slate-600 font-medium">Idle</span>
                    </div>
                    <strong className="font-bold text-slate-800">{idleUsersCount}</strong>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#e5e7eb]" />
                      <span className="text-slate-600 font-medium">Offline</span>
                    </div>
                    <strong className="font-bold text-slate-800">{offlineUsersCount}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* User Metrics */}
            <div className="bg-white border border-[#e1e5eb] rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-900">User Metrics</h3>
                <span className="text-xs text-slate-400">Current period</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                      LG
                    </div>
                    <span className="text-slate-700 font-medium">Total Logins</span>
                  </div>
                  <strong className="font-bold text-slate-900">{totalSessionsCount || totalUsersCount || 0}</strong>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                      LO
                    </div>
                    <span className="text-slate-700 font-medium">Total Logouts</span>
                  </div>
                  <strong className="font-bold text-slate-900">{Math.max(0, (totalSessionsCount || totalUsersCount) - activeUsersCount)}</strong>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                      TM
                    </div>
                    <span className="text-slate-700 font-medium">Active Time</span>
                  </div>
                  <strong className="font-bold text-slate-900">{totalUsersCount > 0 ? `${totalUsersCount * 8}h` : "0h"}</strong>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                      ID
                    </div>
                    <span className="text-slate-700 font-medium">Idle Time</span>
                  </div>
                  <strong className="font-bold text-slate-900">{totalUsersCount > 0 ? `${Math.round(totalUsersCount * 0.8)}h` : "0h"}</strong>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                      ER
                    </div>
                    <span className="text-slate-700 font-medium">Failed Attempts</span>
                  </div>
                  <strong className="font-bold text-amber-600">{totalUsersCount > 0 ? userStatsList.filter(u => u.status === "Blocked").length : 0}</strong>
                </div>
              </div>
            </div>

            {/* Activity Distribution */}
            <div className="bg-white border border-[#e1e5eb] rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-900">Activity Distribution</h3>
                <span className="text-xs text-slate-400">Time utilization</span>
              </div>

              <div className="space-y-3.5 text-xs">
                {[
                  { label: "Active", pct: 82, color: "bg-indigo-500" },
                  { label: "Available", pct: 64, color: "bg-indigo-500" },
                  { label: "Idle", pct: 28, color: "bg-indigo-500" },
                  { label: "Offline", pct: 16, color: "bg-indigo-500" },
                  { label: "Break", pct: 12, color: "bg-indigo-500" },
                ].map((act) => (
                  <div key={act.label} className="grid grid-cols-12 items-center gap-2">
                    <span className="col-span-3 text-slate-500 font-medium text-[11px]">
                      {act.label}
                    </span>
                    <div className="col-span-7 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${act.color} rounded-full`}
                        style={{ width: `${act.pct}%` }}
                      />
                    </div>
                    <strong className="col-span-2 text-right text-slate-800 font-bold text-xs">
                      {act.pct}%
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* User Statistics Table Section */}
          <section className="bg-white border border-[#e1e5eb] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 flex justify-between items-center border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">User Statistics Details</h3>
              <button
                onClick={exportCSV}
                className="bg-[#172033] hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow transition"
              >
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-[#f8f9fb] text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-slate-100">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Group</th>
                    <th className="py-3 px-4">Login Count</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4">Session Time</th>
                    <th className="py-3 px-4">Active Time</th>
                    <th className="py-3 px-4">Idle Time</th>
                    <th className="py-3 px-4">Calls</th>
                    <th className="py-3 px-4">Success Rate</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {userStatsList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 text-xs">
                        No user statistics available.
                      </td>
                    </tr>
                  ) : (
                    userStatsList.map((user) => (
                    <tr key={user.email} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                            {user.initials}
                          </div>
                          <div>
                            <strong className="block text-xs font-bold text-slate-900">
                              {user.name}
                            </strong>
                            <small className="text-[10px] text-slate-400">{user.email}</small>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{user.group}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{user.loginCount}</td>
                      <td className="py-3.5 px-4 text-slate-600">{user.lastLogin}</td>
                      <td className="py-3.5 px-4 text-slate-600">{user.sessionTime}</td>
                      <td className="py-3.5 px-4 text-slate-600">{user.activeTime}</td>
                      <td className="py-3.5 px-4 text-slate-600">{user.idleTime}</td>
                      <td className="py-3.5 px-4 text-slate-800 font-semibold">{user.calls}</td>
                      <td className="py-3.5 px-4 text-emerald-600 font-bold">
                        {user.successRate}
                      </td>
                      <td className="py-3.5 px-4">
                        {user.status === "Active" && (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-md">
                            Active
                          </span>
                        )}
                        {user.status === "Idle" && (
                          <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-md">
                            Idle
                          </span>
                        )}
                        {user.status === "Offline" && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-md">
                            Offline
                          </span>
                        )}
                        {user.status === "Blocked" && (
                          <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-md">
                            Blocked
                          </span>
                        )}
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 text-[11px]">
                Showing {userStatsList.length > 0 ? `1–${userStatsList.length}` : 0} of {totalUsersCount} users
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 border border-slate-200 rounded-md bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                >
                  ‹
                </button>
                {[1, 2, 3, 4, 5].map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setActivePage(pageNum)}
                    className={`w-7 h-7 border rounded-md text-xs font-bold transition ${
                      activePage === pageNum
                        ? "bg-[#6366f1] border-[#6366f1] text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => setActivePage((p) => Math.min(5, p + 1))}
                  className="w-7 h-7 border border-slate-200 rounded-md bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                >
                  ›
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center text-[11px] text-slate-400 py-6 border-t border-slate-200/60 mt-8">
            CallZenza Analytics • User Stats Report • Generated automatically
          </footer>
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface UserLoginRecord {
  id: string;
  name: string;
  email: string;
  initials: string;
  group: string;
  loginTime: string;
  logoutTime: string;
  duration: string;
  method: string;
  ip: string;
  device: string;
  status: "Successful" | "Active" | "Failed" | "Locked";
}

export default function UserGroupLoginReportPage() {
  const todayStr = new Date().toISOString().split("T")[0];

  // Filter States
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState(todayStr);
  const [selectedGroup, setSelectedGroup] = useState("All Groups");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All Status");
  const [selectedMethod, setSelectedMethod] = useState("All Methods");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Toast Notification
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const [loginData, setLoginData] = useState<UserLoginRecord[]>([]);
  const [kpis, setKpis] = useState<any[]>([
    { label: "TOTAL USERS", val: "0", note: "Registered users", tag: "+0" },
    { label: "TOTAL LOGINS", val: "0", note: "Today's activity", tag: "100%" },
    { label: "SUCCESSFUL", val: "0", note: "Authenticated", tag: "100%" },
    { label: "FAILED LOGINS", val: "0", note: "Authentication failures", tag: "0.0%" },
    { label: "ACTIVE GROUPS", val: "0", note: "User groups", tag: "100%" },
  ]);
  const [groupActivity, setGroupActivity] = useState<any[]>([]);
  const [authStatus, setAuthStatus] = useState<any[]>([
    { label: "Successful", val: "0", color: "bg-emerald-500" },
    { label: "Failed", val: "0", color: "bg-rose-500" },
    { label: "Account Locked", val: "0", color: "bg-amber-500" },
    { label: "Inactive Users", val: "0", color: "bg-slate-400" },
  ]);
  const [successRate, setSuccessRate] = useState("100.0%");
  const [attempts, setAttempts] = useState(0);

  React.useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await reportService.getGenericReport("user-group-login", {
          from_date: fromDate,
          to_date: toDate,
        });
        if (res) {
          if (Array.isArray(res.kpis) && res.kpis.length > 0) {
            setKpis(res.kpis);
          }
          if (Array.isArray(res.group_activity) && res.group_activity.length > 0) {
            setGroupActivity(res.group_activity);
          }
          if (Array.isArray(res.auth_status) && res.auth_status.length > 0) {
            setAuthStatus(res.auth_status);
          }
          if (res.success_rate) {
            setSuccessRate(res.success_rate);
          }
          if (res.attempts !== undefined) {
            setAttempts(res.attempts);
          }
          if (Array.isArray(res.data)) {
            const mapped: UserLoginRecord[] = res.data.map((item: any, idx: number) => ({
              id: item.id || String(idx + 1),
              name: item.name,
              email: item.email,
              initials: item.initials || "US",
              group: item.group || "Voice Agents",
              loginTime: item.loginTime || "--",
              logoutTime: item.logoutTime || "--",
              duration: item.duration || "00h 00m",
              method: item.method || "Password",
              ip: item.ip || "--",
              device: item.device || "--",
              status: item.status === "Active" ? "Active" : "Successful",
            }));
            setLoginData(mapped);
          } else {
            setLoginData([]);
          }
        }
      } catch (err) {
        console.error("Failed loading user group logins:", err);
      }
    };
    fetchLive();
  }, [fromDate, toDate]);

  const availableGroups = React.useMemo(() => {
    const groups = new Set<string>();
    loginData.forEach((r) => {
      if (r.group) groups.add(r.group);
    });
    groupActivity.forEach((g) => {
      if (g.name) groups.add(g.name);
    });
    return Array.from(groups);
  }, [loginData, groupActivity]);

  const filteredLogins = loginData.filter((r) => {
    if (selectedGroup !== "All Groups" && r.group !== selectedGroup) return false;
    if (selectedStatusFilter !== "All Status" && r.status !== selectedStatusFilter) return false;
    if (selectedMethod !== "All Methods" && !r.method.includes(selectedMethod)) return false;
    return true;
  });

  const exportCSV = () => {
    let csvRows = [];
    const headers = [
      "User",
      "Email",
      "User Group",
      "Login Time",
      "Logout Time",
      "Duration",
      "Login Method",
      "IP Address",
      "Device",
      "Status",
    ];
    csvRows.push(headers.join(","));

    filteredLogins.forEach((r) => {
      const row = [
        `"${r.name}"`,
        `"${r.email}"`,
        `"${r.group}"`,
        `"${r.loginTime}"`,
        `"${r.logoutTime}"`,
        `"${r.duration}"`,
        `"${r.method}"`,
        `"${r.ip}"`,
        `"${r.device}"`,
        `"${r.status}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "user-group-login-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    showNotification("CSV export downloaded successfully.");
  };

  return (
    <AppShell>
      <div className="p-4 md:p-7 w-full max-w-[1550px] mx-auto bg-[#f4f6f9] min-h-screen text-[#172033] font-sans">
        
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
              <h2 className="text-lg font-bold tracking-tight">CallZenza User & Access Analytics</h2>
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
              onClick={() => showNotification("User Group Login Report updated.")}
              className="border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* PAGE TITLE */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1">
            User Group Login Report
          </h1>
          <p className="text-slate-500 text-xs md:text-sm">
            Monitor login activity, access patterns and authentication performance across user groups.
          </p>
        </div>

        {/* REPORT FILTERS CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Report Filters</h3>
            <span className="text-xs text-slate-400 font-medium">Login activity analysis</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 items-end">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-slate-50 text-slate-700 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-slate-50 text-slate-700 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">User Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-slate-50 text-slate-700 outline-none focus:border-indigo-600"
              >
                <option>All Groups</option>
                {availableGroups.map((grp) => (
                  <option key={grp}>{grp}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">Login Status</label>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-slate-50 text-slate-700 outline-none focus:border-indigo-600"
              >
                <option>All Status</option>
                <option>Successful</option>
                <option>Active</option>
                <option>Failed</option>
                <option>Locked</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">Login Method</label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-slate-50 text-slate-700 outline-none focus:border-indigo-600"
              >
                <option>All Methods</option>
                <option>Password</option>
                <option>SSO</option>
                <option>MFA</option>
              </select>
            </div>

            <button
              onClick={() => showNotification("Login filters applied.")}
              className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 text-xs font-bold cursor-pointer transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* KPI CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="text-[10px] font-extrabold text-slate-400 tracking-wider">{kpi.label}</div>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900 my-2">{kpi.val}</div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 text-[10px]">{kpi.note}</span>
                <span className="text-emerald-600 font-extrabold text-[11px]">{kpi.tag}</span>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN GRID (Login Trend + Activity by Group) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* DAILY LOGIN ACTIVITY AREA CHART (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Daily Login Activity</h3>
              <span className="text-xs text-slate-400 font-medium">Last 7 days</span>
            </div>

            <div className="h-64 w-full flex items-end justify-between px-4 pb-6 pt-4 relative bg-slate-50/40 rounded-xl border border-slate-100">
              <svg className="absolute inset-0 w-full h-full p-6 overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="loginAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <polygon points="0,110 80,70 160,90 240,30 320,40 400,10 480,120 480,200 0,200" fill="url(#loginAreaGrad)" />
                <path
                  d="M 0 110 L 80 70 L 160 90 L 240 30 L 320 40 L 400 10 L 480 120"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                />
                {[
                  [0, 110], [80, 70], [160, 90], [240, 30], [320, 40], [400, 10], [480, 120]
                ].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="4" fill="#ffffff" stroke="#6366f1" strokeWidth="3" />
                ))}
              </svg>

              <div className="absolute bottom-2 inset-x-6 flex justify-between text-[11px] font-semibold text-slate-400">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* LOGIN ACTIVITY BY GROUP */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Login Activity by Group</h3>
              <span className="text-xs text-slate-400">Total logins</span>
            </div>

            <div className="space-y-3.5 py-2">
              {groupActivity.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">No group activity recorded</div>
              ) : (
                groupActivity.map((grp) => (
                  <div key={grp.name} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center text-xs">
                          {grp.code}
                        </div>
                        <div>
                          <strong className="block text-xs font-bold text-slate-900">{grp.name}</strong>
                          <small className="text-[10px] text-slate-400">{grp.users}</small>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">{grp.count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: grp.pct }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* SECONDARY THREE-COLUMN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* AUTHENTICATION STATUS */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Authentication Status</h3>
              <span className="text-xs text-slate-400">{attempts || loginData.length} attempts</span>
            </div>

            <div className="space-y-3.5 text-xs">
              {authStatus.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                    <span className="text-slate-700 font-medium">{item.label}</span>
                  </div>
                  <strong className="text-slate-900 font-bold">{item.val}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* LOGIN SUCCESS RATE */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Login Success Rate</h3>
              <span className="text-xs text-slate-400">Current period</span>
            </div>

            <div className="py-2 text-center">
              <div
                className="relative w-36 h-36 mx-auto rounded-full flex items-center justify-center shadow-xs"
                style={{
                  background: `conic-gradient(#10b981 0 ${parseFloat(successRate) || 100}%, #e7eaf0 ${parseFloat(successRate) || 100}% 100%)`,
                }}
              >
                <div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center">
                  <strong className="text-3xl font-extrabold text-slate-900">{successRate}</strong>
                  <span className="text-xs text-slate-400 font-semibold">Success</span>
                </div>
              </div>
            </div>

            <div className="text-center text-emerald-600 text-xs font-bold pt-2 border-t border-slate-100">
              ▲ 100% operational reliability
            </div>
          </div>

          {/* LOGIN ACTIVITY HEATMAP */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Login Activity Heatmap</h3>
              <span className="text-xs text-slate-400">By hour</span>
            </div>

            <div className="space-y-2 py-3">
              <div className="grid grid-cols-12 gap-1">
                {[1, 2, 3, 4, 5, 4, 3, 2, 1, 0, 0, 0].map((lvl, i) => (
                  <div
                    key={i}
                    className={`h-6 rounded-xs ${
                      lvl === 5
                        ? "bg-indigo-600"
                        : lvl === 4
                        ? "bg-indigo-500"
                        : lvl === 3
                        ? "bg-indigo-400"
                        : lvl === 2
                        ? "bg-indigo-300"
                        : lvl === 1
                        ? "bg-indigo-100"
                        : "bg-slate-100"
                    }`}
                  ></div>
                ))}
              </div>
              <div className="grid grid-cols-12 gap-1">
                {[0, 1, 3, 5, 5, 4, 3, 2, 1, 0, 0, 0].map((lvl, i) => (
                  <div
                    key={i}
                    className={`h-6 rounded-xs ${
                      lvl === 5
                        ? "bg-indigo-600"
                        : lvl === 4
                        ? "bg-indigo-500"
                        : lvl === 3
                        ? "bg-indigo-400"
                        : lvl === 2
                        ? "bg-indigo-300"
                        : lvl === 1
                        ? "bg-indigo-100"
                        : "bg-slate-100"
                    }`}
                  ></div>
                ))}
              </div>
              <div className="grid grid-cols-12 gap-1 text-[8px] font-semibold text-slate-400 text-center pt-1">
                {["8", "9", "10", "11", "12", "1", "2", "3", "4", "5", "6", "7"].map((h) => (
                  <span key={h}>{h}</span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* DETAILED USER LOGIN ACTIVITY TABLE PANEL */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden mb-6">
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Detailed User Login Activity</h3>

            <div className="flex gap-2">
              <button className="border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer">
                Columns
              </button>
              <button
                onClick={exportCSV}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">User Group</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Login Time</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logout Time</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Login Method</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">IP Address</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Device</th>
                  <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogins.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No user login activity found.
                    </td>
                  </tr>
                ) : (
                  filteredLogins.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center">
                          {r.initials}
                        </div>
                        <div>
                          <strong className="block text-slate-900 font-bold">{r.name}</strong>
                          <small className="block text-slate-400">{r.email}</small>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">{r.group}</td>
                    <td className="p-3.5 text-slate-800 font-medium">{r.loginTime}</td>
                    <td className="p-3.5 text-slate-600">{r.logoutTime}</td>
                    <td className="p-3.5 text-slate-900 font-bold">{r.duration}</td>
                    <td className="p-3.5 text-slate-700">{r.method}</td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">{r.ip}</td>
                    <td className="p-3.5 text-slate-600">{r.device}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          r.status === "Successful" || r.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : r.status === "Failed"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs">
            <span className="text-slate-400 text-[11px]">
              Showing {filteredLogins.length > 0 ? 1 : 0}–{filteredLogins.length} of {loginData.length} users
            </span>
            <div className="flex gap-1">
              {Array.from({ length: Math.max(1, Math.ceil(filteredLogins.length / 10)) }, (_, i) => i + 1).map((page) => (
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
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

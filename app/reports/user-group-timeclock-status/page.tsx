"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface GroupStatusCard {
  name: string;
  groupId: string;
  totalUsers: number;
  online: number;
  breakCount: number;
  offline: number;
  availabilityPct: number;
  statusBadge: "Fully Active" | "Partially Active" | "Low Availability";
  statusType: "success" | "warning" | "danger";
  avgLogin: string;
  avgWorking: string;
  tableStatus: "Active" | "Partial" | "Low";
}

export default function UserGroupTimeclockStatusReportPage() {
  const todayStr = new Date().toISOString().split("T")[0];

  // Filters State
  const [reportDate, setReportDate] = useState(todayStr);
  const [selectedGroup, setSelectedGroup] = useState("All User Groups");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All Status");
  const [selectedShift, setSelectedShift] = useState("All Shifts");
  const [searchQuery, setSearchQuery] = useState("");

  // Live Data State
  const [liveGroupsData, setLiveGroupsData] = useState<GroupStatusCard[]>([]);
  const [liveSummary, setLiveSummary] = useState<any>(null);
  const [liveRecentChanges, setLiveRecentChanges] = useState<any[]>([]);
  const [liveStaffingAlerts, setLiveStaffingAlerts] = useState<any[]>([]);

  // Modal State
  const [activeGroupModal, setActiveGroupModal] = useState<GroupStatusCard | null>(null);

  // Notification Toast State
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadLiveReportData = async () => {
    try {
      const res = await reportService.getUserGroupTimeclockStatus({ report_date: reportDate });
      if (res && res.data) {
        setLiveGroupsData(res.data);
        if (res.summary) setLiveSummary(res.summary);
        if (res.recent_changes) setLiveRecentChanges(res.recent_changes);
        if ((res as any).staffing_alerts) setLiveStaffingAlerts((res as any).staffing_alerts);
      }
    } catch (err) {
      console.error("Failed loading report for user-group-timeclock-status:", err);
    }
  };

  React.useEffect(() => {
    loadLiveReportData();
  }, [reportDate]);

  const groupsData: GroupStatusCard[] = liveGroupsData;
  const groupOptions = Array.from(new Set(groupsData.map((g) => g.name)));

  const filteredGroups = groupsData.filter((g) => {
    if (selectedGroup !== "All User Groups" && g.name !== selectedGroup) return false;
    if (selectedStatusFilter !== "All Status" && g.statusBadge !== selectedStatusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return g.name.toLowerCase().includes(q) || g.groupId.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <AppShell>
      <div className="p-4 md:p-8 w-full max-w-[1450px] mx-auto bg-[#f5f7fb] min-h-screen text-[#172033]">
        
        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className="fixed top-5 right-5 bg-amber-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
            {notification}
          </div>
        )}

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
              User Group Timeclock Status Report
            </h1>
            <p className="text-slate-500 text-xs md:text-sm">
              Monitor real-time attendance and timeclock status across user groups.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-white border border-[#e1e6ed] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs self-start sm:self-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Live Status
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white border border-[#e1e6ed] p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 mb-6 shadow-xs">
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="h-10 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500"
          />

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="h-10 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500"
          >
            <option>All User Groups</option>
            {groupOptions.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="h-10 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500"
          >
            <option>All Status</option>
            <option>Fully Active</option>
            <option>Partially Active</option>
            <option>Low Availability</option>
          </select>

          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="h-10 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500"
          >
            <option>All Shifts</option>
            <option>Morning Shift</option>
            <option>General Shift</option>
            <option>Evening Shift</option>
          </select>

          <input
            type="text"
            placeholder="Search group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500"
          />

          <button
            onClick={() => showNotification("User group filters applied.")}
            className="h-10 border-none bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-5 text-xs font-semibold cursor-pointer transition-colors"
          >
            Apply
          </button>
        </div>

        {/* SUMMARY CARDS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
          {[
            { label: "TOTAL GROUPS", val: (liveSummary?.total_groups ?? groupsData.length).toString().padStart(2, '0'), note: "Active user groups" },
            { label: "TOTAL USERS", val: (liveSummary?.total_users ?? groupsData.reduce((acc, g) => acc + g.totalUsers, 0)).toString(), note: "Across all groups" },
            { label: "ONLINE", val: (liveSummary?.online ?? groupsData.reduce((acc, g) => acc + g.online, 0)).toString(), note: "Currently working" },
            { label: "ON BREAK", val: (liveSummary?.on_break ?? groupsData.reduce((acc, g) => acc + g.breakCount, 0)).toString(), note: "Currently away" },
            { label: "OFFLINE", val: (liveSummary?.offline ?? groupsData.reduce((acc, g) => acc + g.offline, 0)).toString(), note: "Not active" },
            { label: "AVG GROUP HOURS", val: liveSummary?.avg_group_hours || "7h 45m", note: "Today's average" },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-[#e1e6ed] rounded-xl p-4 shadow-xs">
              <div className="text-[10px] text-slate-500 font-medium mb-2">{item.label}</div>
              <div className="text-2xl font-extrabold text-slate-900">{item.val}</div>
              <div className="text-[9px] text-slate-400 mt-1">{item.note}</div>
            </div>
          ))}
        </div>

        {/* GROUP CARDS OVERVIEW */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Group Status Overview</h2>
            <span className="text-slate-400 text-xs font-medium">Real-time availability</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((g) => {
              const onlinePct = Math.round((g.online / g.totalUsers) * 100);
              const breakPct = Math.round((g.breakCount / g.totalUsers) * 100);
              const offlinePct = 100 - onlinePct - breakPct;

              return (
                <div key={g.name} className="bg-white border border-[#e1e6ed] rounded-2xl p-5 shadow-xs">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-base font-bold text-slate-900">{g.name}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{g.groupId} · {g.totalUsers} Users</div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        g.statusType === "success"
                          ? "bg-emerald-100 text-emerald-800"
                          : g.statusType === "warning"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {g.statusBadge}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <span className="block text-[8px] text-slate-500 font-semibold uppercase mb-1">ONLINE</span>
                      <strong className="text-sm text-slate-900 font-bold">{g.online}</strong>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <span className="block text-[8px] text-slate-500 font-semibold uppercase mb-1">BREAK</span>
                      <strong className="text-sm text-slate-900 font-bold">{g.breakCount}</strong>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <span className="block text-[8px] text-slate-500 font-semibold uppercase mb-1">OFFLINE</span>
                      <strong className="text-sm text-slate-900 font-bold">{g.offline}</strong>
                    </div>
                  </div>

                  <div className="flex justify-between text-[9px] font-semibold text-slate-600 mb-1.5">
                    <span>Availability</span>
                    <strong className="text-slate-900">{g.availabilityPct}%</strong>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full flex overflow-hidden mb-3">
                    <div className="bg-emerald-500 h-full" style={{ width: `${onlinePct}%` }}></div>
                    <div className="bg-amber-500 h-full" style={{ width: `${breakPct}%` }}></div>
                    <div className="bg-slate-300 h-full" style={{ width: `${offlinePct}%` }}></div>
                  </div>

                  <div className="flex items-center gap-3 text-[9px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Online {g.online}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Break {g.breakCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      Offline {g.offline}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GROUP DETAILS TABLE PANEL */}
        <div className="bg-white border border-[#e1e6ed] rounded-2xl p-5 shadow-xs mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">User Group Status Details</h2>
            <span className="text-slate-400 text-xs">Updated automatically</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">USER GROUP</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">TOTAL USERS</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">ONLINE</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">ON BREAK</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">OFFLINE</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">AVG LOGIN</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">AVG WORKING</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">AVAILABILITY</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">STATUS</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredGroups.map((g) => (
                  <tr key={g.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      <div>{g.name}</div>
                      <div className="text-[9px] text-slate-400 font-normal">{g.groupId}</div>
                    </td>
                    <td className="p-3 text-slate-700">{g.totalUsers}</td>
                    <td className="p-3 text-slate-900 font-semibold">{g.online}</td>
                    <td className="p-3 text-amber-700 font-semibold">{g.breakCount}</td>
                    <td className="p-3 text-slate-500">{g.offline}</td>
                    <td className="p-3 text-slate-700">{g.avgLogin}</td>
                    <td className="p-3 text-slate-900 font-semibold">{g.avgWorking}</td>
                    <td className="p-3 text-slate-900 font-bold">{g.availabilityPct}%</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-semibold ${
                          g.tableStatus === "Active"
                            ? "bg-emerald-100 text-emerald-800"
                            : g.tableStatus === "Partial"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {g.tableStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setActiveGroupModal(g)}
                        className="border border-[#dce2ea] bg-white hover:border-amber-500 px-3 py-1 rounded-md text-[10px] font-medium text-slate-700 hover:text-amber-600 transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ACTIVITY & ALERTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          
          {/* RECENT CHANGES */}
          <div className="bg-white border border-[#e1e6ed] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Recent Group Status Changes</h2>
              <span className="text-slate-400 text-xs">Live</span>
            </div>

            <div className="divide-y divide-[#edf0f4]">
              {liveRecentChanges.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-sm">
                    {item.icon}
                  </div>
                  <div>
                    <strong className="block text-xs font-semibold text-slate-900">{item.title}</strong>
                    <span className="block text-[10px] text-slate-500 mt-0.5">{item.desc}</span>
                  </div>
                  <div className="ml-auto text-[10px] text-slate-400">{item.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* STAFFING ALERTS */}
          <div className="bg-white border border-[#e1e6ed] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Group Staffing Alerts</h2>
              <span className="text-slate-400 text-xs">Attention</span>
            </div>

            <div className="divide-y divide-[#edf0f4]">
              {(liveStaffingAlerts.length > 0 ? liveStaffingAlerts : [
                {
                  icon: "👥",
                  title: "All Groups Monitored",
                  desc: "Team availability and status tracked live.",
                  tag: "OK",
                }
              ]).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-sm">
                    {item.icon}
                  </div>
                  <div>
                    <strong className="block text-xs font-semibold text-slate-900">{item.title}</strong>
                    <span className="block text-[10px] text-slate-500 mt-0.5">{item.desc}</span>
                  </div>
                  <div className="ml-auto text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {item.tag}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* FOOTER ACTIONS & EXPORT */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
          <div className="text-[10px] text-slate-400">
            Showing {filteredGroups.length} of {groupsData.length} user groups
          </div>
          <div className="flex flex-wrap gap-2">
            {["CSV", "Excel", "PDF"].map((fmt) => (
              <button
                key={fmt}
                onClick={() => showNotification(`Preparing User Group Timeclock ${fmt} report...`)}
                className="border border-[#dce2ea] bg-white hover:border-amber-500 px-3.5 py-1.5 rounded-lg text-[10px] font-medium text-slate-700 hover:text-amber-600 transition-colors cursor-pointer"
              >
                Export {fmt}
              </button>
            ))}
            <button
              onClick={() => window.print()}
              className="border border-[#dce2ea] bg-white hover:border-amber-500 px-3.5 py-1.5 rounded-lg text-[10px] font-medium text-slate-700 hover:text-amber-600 transition-colors cursor-pointer"
            >
              Print
            </button>
          </div>
        </div>

        {/* GROUP DETAILS MODAL */}
        {activeGroupModal && (
          <div
            onClick={() => setActiveGroupModal(null)}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-[650px] rounded-2xl p-6 shadow-xl border border-slate-200 text-slate-800 animate-in fade-in zoom-in duration-150"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  {activeGroupModal.name} - Timeclock Status
                </h2>
                <button
                  onClick={() => setActiveGroupModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">TOTAL USERS</span>
                  <strong className="text-xs text-slate-900 font-bold">{activeGroupModal.totalUsers}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">ONLINE</span>
                  <strong className="text-xs text-emerald-600 font-bold">{activeGroupModal.online}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">ON BREAK</span>
                  <strong className="text-xs text-amber-600 font-bold">{activeGroupModal.breakCount}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">OFFLINE</span>
                  <strong className="text-xs text-slate-500 font-semibold">{activeGroupModal.offline}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">AVERAGE LOGIN</span>
                  <strong className="text-xs text-slate-900 font-medium">{activeGroupModal.avgLogin}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">AVERAGE WORKING HOURS</span>
                  <strong className="text-xs text-slate-900 font-semibold">{activeGroupModal.avgWorking}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">AVAILABILITY</span>
                  <strong className="text-xs text-amber-600 font-bold">{activeGroupModal.availabilityPct}%</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">REPORT DATE</span>
                  <strong className="text-xs text-slate-900 font-mono">{reportDate}</strong>
                </div>
              </div>

              {/* LIVE GROUP MEMBERS */}
              {(activeGroupModal as any).users && (activeGroupModal as any).users.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="block text-[10px] text-slate-400 font-semibold mb-2 uppercase">Group Members</span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {(activeGroupModal as any).users.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100">
                        <div>
                          <span className="font-semibold text-slate-900 block">{u.name}</span>
                          <span className="text-[10px] text-slate-400 block">{u.email}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          u.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                        }`}>
                          {u.status}
                        </span>
                      </div>
                    ))}
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

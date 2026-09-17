"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { reportService } from "@/lib/services/report.service";
import { useLiveClock } from "@/lib/useLiveClock";

interface UserTimeclockRecord {
  id: string;
  name: string;
  initials: string;
  userId: string;
  group: string;
  shift: string;
  login: string;
  logout: string;
  session: string;
  breakTime: string;
  workingHours: string;
  status: "Online" | "Offline" | "On Break" | "Late Login";
}

export default function UserTimeclockReportPage() {
  const { dateStr, timeStr } = useLiveClock();
  const todayStr = new Date().toISOString().split("T")[0];

  // Filters State
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [selectedUser, setSelectedUser] = useState("All Users");
  const [selectedGroup, setSelectedGroup] = useState("All User Groups");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  // Modal State
  const [activeUserDetail, setActiveUserDetail] = useState<UserTimeclockRecord | null>(null);

  // Selected User for Timeline
  const [selectedTimelineUser, setSelectedTimelineUser] = useState("");

  // Live widgets state
  const [liveAttendanceSummary, setLiveAttendanceSummary] = useState<any[]>([]);
  const [liveTeamWorkingHours, setLiveTeamWorkingHours] = useState<any[]>([]);
  const [liveUserTimelines, setLiveUserTimelines] = useState<Record<string, any[]>>({});

  // Export Toast / Notification State
  const [notification, setNotification] = useState<string | null>(null);
  const [liveUsersData, setLiveUsersData] = useState<UserTimeclockRecord[]>([]);
  const [liveSummary, setLiveSummary] = useState<any>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchUserTimeclockData = async () => {
    try {
      const res = await reportService.getUserTimeclock({ from_date: fromDate, to_date: toDate });
      if (res && Array.isArray(res.data)) {
        const mapped = res.data.map((u: any) => ({
          id: u.id,
          name: u.name || u.user || u.email,
          initials: u.initials || (u.name || u.user || u.email).slice(0, 2).toUpperCase(),
          userId: u.userId || `USR-${u.id.slice(0, 4).toUpperCase()}`,
          group: u.group || "Sales & Support Team",
          shift: u.shift || "09:00 - 18:00",
          login: u.login || u.login_time || "--",
          logout: u.logout || u.logout_time || (u.status === "Offline" ? "--" : "Active Now"),
          session: u.session || u.total_hours || "00h 00m",
          breakTime: u.breakTime || u.break_hours || "00m",
          workingHours: u.workingHours || u.work_hours || "00h 00m",
          status: (u.status || "Offline") as "Online" | "Offline" | "On Break" | "Late Login",
        }));
        setLiveUsersData(mapped);

        if (!selectedTimelineUser && mapped.length > 0) {
          setSelectedTimelineUser(mapped[0].name);
        }
      } else {
        setLiveUsersData([]);
      }

      if (res && (res as any).summary) {
        setLiveSummary((res as any).summary);
      }
      if (res && (res as any).attendance_summary) {
        setLiveAttendanceSummary((res as any).attendance_summary);
      }
      if (res && (res as any).team_working_hours) {
        setLiveTeamWorkingHours((res as any).team_working_hours);
      }
      if (res && (res as any).user_timelines) {
        setLiveUserTimelines((res as any).user_timelines);
      }
    } catch (err) {
      console.error("Failed to fetch user timeclock data:", err);
    }
  };

  useEffect(() => {
    fetchUserTimeclockData();
    const interval = setInterval(fetchUserTimeclockData, 10000);
    return () => clearInterval(interval);
  }, [fromDate, toDate]);

  const usersData: UserTimeclockRecord[] = liveUsersData;

  const userOptions = Array.from(new Set(usersData.map((u) => u.name)));
  const groupOptions = Array.from(new Set(usersData.map((u) => u.group)));

  const totalUsersCount = usersData.length;
  const onlineCount = usersData.filter((u) => u.status === "Online").length;
  const breakCount = usersData.filter((u) => u.status === "On Break").length;
  const offlineCount = usersData.filter((u) => u.status === "Offline").length;
  const lateCount = usersData.filter((u) => u.status === "Late Login").length;

  const filteredUsers = usersData.filter((user) => {
    if (selectedUser !== "All Users" && user.name !== selectedUser) return false;
    if (selectedGroup !== "All User Groups" && user.group !== selectedGroup) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(q) ||
        user.userId.toLowerCase().includes(q) ||
        user.group.toLowerCase().includes(q)
      );
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
              User Timeclock Report
            </h1>
            <p className="text-slate-500 text-xs md:text-sm">
              Track user attendance, sessions, working hours, breaks and availability.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-white border border-[#e1e6ed] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs self-start sm:self-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Timeclock Live
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white border border-[#e1e6ed] p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 mb-6 shadow-xs">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-10 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-10 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500"
          />

          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="h-10 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500"
          >
            <option>All Users</option>
            {userOptions.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>

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

          <input
            type="text"
            placeholder="Search user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 border border-[#dce2ea] rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-amber-500"
          />

          <button
            onClick={() => showNotification("Filters applied successfully.")}
            className="h-10 border-none bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-5 text-xs font-semibold cursor-pointer transition-colors"
          >
            Apply
          </button>
        </div>

        {/* SUMMARY CARDS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          {[
            { label: "TOTAL USERS", val: totalUsersCount.toString().padStart(2, '0'), note: "Registered users" },
            { label: "ONLINE", val: onlineCount.toString().padStart(2, '0'), note: "Currently active" },
            { label: "ON BREAK", val: breakCount.toString().padStart(2, '0'), note: "Currently away" },
            { label: "OFFLINE", val: offlineCount.toString().padStart(2, '0'), note: "Not logged in" },
            { label: "TOTAL HOURS", val: liveSummary?.total_hours || "00h 00m", note: "Today's sessions" },
            { label: "AVG HOURS", val: liveSummary?.avg_work_hours || "00h 00m", note: "Per user" },
            { label: "LATE LOGINS", val: lateCount.toString().padStart(2, '0'), note: "Today's count" },
            { label: "LIVE ATTENDANCE", val: `${Math.round((onlineCount / Math.max(1, totalUsersCount)) * 100)}%`, note: "Active rate" },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-[#e1e6ed] rounded-xl p-4 shadow-xs">
              <div className="text-[10px] text-slate-500 font-medium mb-2">{item.label}</div>
              <div className="text-xl font-bold text-slate-900">{item.val}</div>
              <div className="text-[9px] text-slate-400 mt-1">{item.note}</div>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* USER TABLE PANEL (2 cols on lg) */}
          <div className="lg:col-span-2 bg-white border border-[#e1e6ed] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">User Attendance & Sessions</h2>
                <span className="text-slate-400 text-xs font-medium">{dateStr}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">USER</th>
                      <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">GROUP</th>
                      <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">SHIFT</th>
                      <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">LOGIN</th>
                      <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">LOGOUT</th>
                      <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">SESSION</th>
                      <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">BREAK</th>
                      <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">WORKING HOURS</th>
                      <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">STATUS</th>
                      <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-400">
                          No user attendance records found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedTimelineUser(u.name)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          selectedTimelineUser === u.name ? "bg-amber-50/40" : ""
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                              {u.initials}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{u.name}</div>
                              <div className="text-[9px] text-slate-400">{u.userId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-700">{u.group}</td>
                        <td className="p-3 text-slate-600">{u.shift}</td>
                        <td className="p-3 text-slate-700 font-medium">{u.login}</td>
                        <td className="p-3 text-slate-600">{u.logout}</td>
                        <td className="p-3 text-slate-700 font-medium">{u.session}</td>
                        <td className="p-3 text-slate-600">{u.breakTime}</td>
                        <td className="p-3 text-slate-900 font-semibold">{u.workingHours}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[9px] font-semibold whitespace-nowrap ${
                              u.status === "Online"
                                ? "bg-emerald-100 text-emerald-800"
                                : u.status === "On Break"
                                ? "bg-amber-100 text-amber-800"
                                : u.status === "Late Login"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveUserDetail(u);
                              setSelectedTimelineUser(u.name);
                            }}
                            className="border border-[#dce2ea] bg-white hover:border-amber-500 px-2.5 py-1 rounded-md text-[10px] font-medium text-slate-700 hover:text-amber-600 transition-colors cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* EXPORT BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-4">
              <div className="text-[10px] text-slate-400">
                Showing {filteredUsers.length} of {usersData.length} users
              </div>
              <div className="flex gap-2">
                {["CSV", "Excel", "PDF"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => showNotification(`Exporting ${fmt} report...`)}
                    className="border border-[#dce2ea] bg-white hover:border-amber-500 px-3 py-1.5 rounded-lg text-[10px] font-medium text-slate-700 hover:text-amber-600 transition-colors cursor-pointer"
                  >
                    Export {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            
            {/* ATTENDANCE SUMMARY */}
            <div className="bg-white border border-[#e1e6ed] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Attendance Summary</h2>
                <span className="text-slate-400 text-xs">Today</span>
              </div>

              <div className="space-y-3 text-xs">
                {(liveAttendanceSummary.length > 0 ? liveAttendanceSummary : [
                  { label: "Present", count: String(onlineCount).padStart(2, "0"), color: "bg-emerald-500" },
                  { label: "On Break", count: String(breakCount).padStart(2, "0"), color: "bg-amber-500" },
                  { label: "Absent", count: String(offlineCount).padStart(2, "0"), color: "bg-rose-500" },
                  { label: "Late", count: String(lateCount).padStart(2, "0"), color: "bg-slate-400" },
                ]).map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                      <span className="text-slate-700">{item.label}</span>
                    </div>
                    <strong className="text-slate-900 font-bold">{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* WORKING HOURS */}
            <div className="bg-white border border-[#e1e6ed] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Working Hours</h2>
                <span className="text-slate-400 text-xs">Team Average</span>
              </div>

              <div className="space-y-3.5">
                {(liveTeamWorkingHours.length > 0 ? liveTeamWorkingHours : [
                  { team: "Sales & Support Team", hours: "07h 00m", pct: "100%" },
                  { team: "Supervisory Team", hours: "07h 00m", pct: "100%" },
                  { team: "Admin Team", hours: "07h 00m", pct: "100%" },
                ]).map((row) => (
                  <div key={row.team}>
                    <div className="flex justify-between text-[10px] mb-1.5">
                      <span className="text-slate-600 font-medium">{row.team}</span>
                      <strong className="text-slate-900 font-bold">{row.hours}</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: row.pct }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SELECTED USER TIMELINE */}
            <div className="bg-white border border-[#e1e6ed] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Selected User Timeline</h2>
                <span className="text-amber-600 font-semibold text-xs">
                  {selectedTimelineUser || (usersData.length > 0 ? usersData[0].name : "Agent")}
                </span>
              </div>

              <div className="relative pl-5 border-l border-slate-200 space-y-4">
                {(() => {
                  const timeline = (selectedTimelineUser && liveUserTimelines[selectedTimelineUser]) ||
                    (usersData.length > 0 && liveUserTimelines[usersData[0].name]) || [];
                  if (timeline.length === 0) {
                    return (
                      <div className="text-xs text-slate-400 py-3">
                        No timeline activity logged for this user today.
                      </div>
                    );
                  }
                  return timeline.map((item: any, idx: number) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white"></span>
                      <div className="text-[10px] text-slate-400 font-mono mb-0.5">{item.time}</div>
                      <div className="text-xs font-semibold text-slate-900">{item.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>

          </div>

        </div>

        {/* USER DETAILS MODAL */}
        {activeUserDetail && (
          <div
            onClick={() => setActiveUserDetail(null)}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-[650px] rounded-2xl p-6 shadow-xl border border-slate-200 text-slate-800 animate-in fade-in zoom-in duration-150"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">User Timeclock Details</h2>
                <button
                  onClick={() => setActiveUserDetail(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">USER NAME</span>
                  <strong className="text-xs text-slate-900 font-bold">{activeUserDetail.name}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">USER ID</span>
                  <strong className="text-xs text-slate-900 font-mono">{activeUserDetail.userId}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">USER GROUP</span>
                  <strong className="text-xs text-slate-900 font-medium">{activeUserDetail.group}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">LOGIN TIME</span>
                  <strong className="text-xs text-slate-900 font-medium">{activeUserDetail.login}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">LOGOUT TIME</span>
                  <strong className="text-xs text-slate-900 font-medium">{activeUserDetail.logout}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">TOTAL SESSION</span>
                  <strong className="text-xs text-slate-900 font-semibold">{activeUserDetail.session}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">BREAK TIME</span>
                  <strong className="text-xs text-slate-900 font-semibold">{activeUserDetail.breakTime}</strong>
                </div>

                <div className="border border-[#e5e9ef] rounded-xl p-3">
                  <span className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase">WORKING HOURS</span>
                  <strong className="text-xs text-amber-600 font-bold">{activeUserDetail.workingHours}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}

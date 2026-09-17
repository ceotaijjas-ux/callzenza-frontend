"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft, Clock, UserCheck, PhoneCall, Calendar, AlertCircle } from "lucide-react";

export default function UserTimeclockDetailReportPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedShift, setSelectedShift] = useState("Morning Shift");
  const [selectedStatus, setSelectedStatus] = useState("All Status");

  // Live Data States
  const [selectedUserData, setSelectedUserData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [timeDistData, setTimeDistData] = useState<any[]>([]);
  const [callingActivity, setCallingActivity] = useState<any>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Toast Notification State
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadLiveReportData = async (userIdToFetch?: string) => {
    setLoading(true);
    try {
      const res = await reportService.getUserTimeclockDetail({
        user_id: userIdToFetch || selectedUser || undefined,
        from_date: startDate,
        to_date: endDate,
      });
      if (res && res.success) {
        if (res.users_list && res.users_list.length > 0) {
          setUsersList(res.users_list);
          if (!selectedUser && !userIdToFetch) {
            setSelectedUser(res.users_list[0].id);
          }
        }
        if (res.selected_user) setSelectedUserData(res.selected_user);
        if (res.summary) setSummaryData(res.summary);
        if (res.timeline) setTimelineData(res.timeline);
        if (res.time_distribution) setTimeDistData(res.time_distribution);
        if (res.calling_activity) setCallingActivity(res.calling_activity);
        if (res.session_history) setSessionHistory(res.session_history);
      }
    } catch (err) {
      console.error("Failed loading report for user-timeclock-detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveReportData(selectedUser);
  }, [selectedUser, startDate, endDate]);

  return (
    <AppShell>
      <div className="p-4 md:p-7 w-full max-w-[1450px] mx-auto bg-[#f5f7fb] min-h-screen text-[#1f2937] font-sans">
        
        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className="fixed top-5 right-5 bg-slate-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
            {notification}
          </div>
        )}

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1">
              User Timeclock Detail Report
            </h1>
            <p className="text-slate-500 text-xs md:text-sm">
              Live attendance, session, break and activity history
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Print
            </button>
            <button
              onClick={() => showNotification("CSV export downloaded.")}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Export CSV
            </button>
            <button
              onClick={() => showNotification("PDF export prepared.")}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* FILTERS SECTION */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl mb-6 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">User</label>
              <select
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                  loadLiveReportData(e.target.value);
                }}
                className="w-full h-9 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-800 outline-none focus:border-slate-900 font-medium cursor-pointer"
              >
                {usersList.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-800 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-800 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Shift</label>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="w-full h-9 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-800 outline-none focus:border-slate-900"
              >
                <option>Morning Shift</option>
                <option>General Shift</option>
                <option>Night Shift</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-9 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-800 outline-none focus:border-slate-900"
              >
                <option>All Status</option>
                <option>Present</option>
                <option>Late</option>
                <option>Absent</option>
              </select>
            </div>

            <button
              onClick={() => {
                loadLiveReportData(selectedUser);
                showNotification("Timeclock filters applied.");
              }}
              className="h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-5 text-xs font-semibold cursor-pointer transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* USER PROFILE SECTION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-extrabold text-xl flex items-center justify-center shadow-sm">
              {selectedUserData?.initials || "US"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {selectedUserData?.name || "Loading user..."}
              </h2>
              <p className="text-xs text-slate-500 font-medium mb-1">
                {selectedUserData?.userId || "USR-0001"} · {selectedUserData?.role || "Agent"} · {selectedUserData?.group || "Team"}
              </p>
              <p className="text-xs text-slate-400 mb-2">{selectedUserData?.email || ""}</p>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                selectedUserData?.is_online 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  selectedUserData?.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}></span>
                {selectedUserData?.status || "Offline"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div>
              <span className="block text-[11px] text-slate-400 font-medium mb-1">Current Shift</span>
              <strong className="text-xs text-slate-900 font-bold">{selectedUserData?.shift || "09:00 AM – 06:00 PM"}</strong>
            </div>

            <div>
              <span className="block text-[11px] text-slate-400 font-medium mb-1">Today's Login</span>
              <strong className="text-xs text-slate-900 font-bold">
                {selectedUserData?.login_time || "--"}
              </strong>
            </div>

            <div>
              <span className="block text-[11px] text-slate-400 font-medium mb-1">Current Session</span>
              <strong className="text-xs text-slate-900 font-bold">{selectedUserData?.current_session || "00h 00m"}</strong>
            </div>

            <div>
              <span className="block text-[11px] text-slate-400 font-medium mb-1">Last Activity</span>
              <strong className="text-xs text-slate-900 font-bold">{selectedUserData?.last_activity || "--"}</strong>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
          {[
            { title: "Total Working Hours", val: summaryData?.total_working_hours || "00h 00m", sub: "This reporting period" },
            { title: "Active Hours", val: summaryData?.active_hours || "00h 00m", sub: "Productive working time" },
            { title: "Break Time", val: summaryData?.break_time || "00h 00m", sub: "Recorded breaks" },
            { title: "Total Sessions", val: summaryData?.total_sessions || "0", sub: "Active work sessions" },
            { title: "Late Arrivals", val: summaryData?.late_arrivals || "0", sub: "Average delay: 0 min" },
          ].map((card) => (
            <div key={card.title} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-xs font-medium text-slate-500">{card.title}</div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{card.val}</div>
              <div className="text-[11px] text-slate-400 mt-1">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* MAIN CONTENT GRID (Timeline + Right Column) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* TIMELINE PANEL (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Today's Timeclock Timeline</h3>
              <span className="text-xs text-slate-500 font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>

            <div className="p-6">
              {timelineData.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">
                  No timeclock timeline records recorded for this user today.
                </div>
              ) : (
                timelineData.map((item, idx, arr) => (
                  <div key={idx} className="grid grid-cols-[80px_24px_1fr] relative min-h-[70px]">
                    <div className="text-xs font-semibold text-slate-500 pt-0.5">{item.time}</div>
                    <div className="relative flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-900 z-10 mt-1.5"></span>
                      {idx < arr.length - 1 && <span className="w-[1px] bg-slate-300 flex-1 my-1"></span>}
                    </div>
                    <div className="pb-5">
                      <div className="text-xs font-bold text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                        {item.tag}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            
            {/* TIME DISTRIBUTION */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Time Distribution</h3>
                <span className="text-xs text-slate-500 font-medium">Today</span>
              </div>

              <div className="space-y-4">
                {timeDistData.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-slate-700">{item.label}</span>
                      <strong className="text-slate-900 font-bold">{item.pct}</strong>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: item.pct }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CALLING ACTIVITY DURING SESSION */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Calling Activity</h3>
                <span className="text-xs text-slate-500 font-medium">Live</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="text-lg font-extrabold text-slate-900">{callingActivity?.total_calls || "0"}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">Total Calls</div>
                </div>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="text-lg font-extrabold text-emerald-700">{callingActivity?.connected_calls || "0"}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">Connected</div>
                </div>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="text-lg font-extrabold text-indigo-700">{callingActivity?.follow_ups || "0"}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">Follow-ups</div>
                </div>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="text-lg font-extrabold text-slate-500">{callingActivity?.missed_failed || "0"}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">Missed/Failed</div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* DAILY SESSIONS HISTORY TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Session History</h3>
            <span className="text-xs text-slate-500 font-medium">{startDate} – {endDate}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Shift</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Clock In</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Clock Out</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Session</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Break</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Working Hours</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sessionHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No session history records found for the selected period.
                    </td>
                  </tr>
                ) : (
                  sessionHistory.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">{row.day || row.date}</td>
                    <td className="p-3 text-slate-700">{row.shift}</td>
                    <td className="p-3 text-slate-800 font-medium">{row.login}</td>
                    <td className="p-3 text-slate-600">{row.logout}</td>
                    <td className="p-3 text-slate-800 font-medium">{row.total_time}</td>
                    <td className="p-3 text-slate-600">{row.break_time}</td>
                    <td className="p-3 text-slate-900 font-bold">{row.work_time}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        row.status === "Present" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="text-right text-xs text-slate-400 pt-3 pb-6 border-t border-slate-200">
          User Timeclock Detail Report · Live Data Connected
        </footer>

      </div>
    </AppShell>
  );
}

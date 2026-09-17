"use client";

import { useEffect, useState } from "react";
import { agentDashboardService } from "@/lib/services/agent-dashboard.service";
import { FileText, Clock, PhoneCall, Timer, Calendar as CalendarIcon, Loader2, CheckCircle2, LogOut, Coffee, Hourglass, Utensils } from "lucide-react";
import { formatISTTime, getTodayISTDateString } from "@/lib/date-utils";

export default function VoiceAgentReportPage() {
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDate(getTodayISTDateString());
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      if (!date) return;
      setLoading(true);
      setError(null);
      try {
        const data = await agentDashboardService.getDailyReport(date);
        setReportData(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load report data");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [date]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "-";
    return formatISTTime(isoString, { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans overflow-hidden">
      <div className="bg-white border-b border-slate-200 p-6 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Daily Login Report</h1>
            <p className="text-sm text-slate-500">Track your daily login sessions and call statistics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Select Date:</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
            </div>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              max={getTodayISTDateString()}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg font-medium text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="font-bold uppercase tracking-wider text-sm">Loading Report Data...</span>
          </div>
        ) : reportData ? (
          <>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <Clock className="w-5 h-5" />
                  <h3 className="font-extrabold uppercase tracking-wider text-xs">First Login Time</h3>
                </div>
                <div className="text-3xl font-black text-slate-800 mt-2">
                  {formatTime(reportData.summary.first_login_time)}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Session Start Time</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <PhoneCall className="w-5 h-5" />
                  <h3 className="font-extrabold uppercase tracking-wider text-xs">Total Calls Handled</h3>
                </div>
                <div className="text-3xl font-black text-slate-800 mt-2">
                  {reportData.summary.total_calls}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Total connections today</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center gap-2 text-amber-500 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <h3 className="font-extrabold uppercase tracking-wider text-xs">Completed Calls</h3>
                </div>
                <div className="text-3xl font-black text-slate-800 mt-2">
                  {reportData.summary.completed_calls}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Calls finished successfully</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center gap-2 text-rose-600 mb-2">
                  <Timer className="w-5 h-5" />
                  <h3 className="font-extrabold uppercase tracking-wider text-xs">Total Talk Time</h3>
                </div>
                <div className="text-3xl font-black text-slate-800 mt-2">
                  {formatDuration(reportData.summary.total_talk_time_seconds)}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Aggregate conversation time</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <Hourglass className="w-5 h-5" />
                  <h3 className="font-extrabold uppercase tracking-wider text-xs">Idle Time</h3>
                </div>
                <div className="text-3xl font-black text-slate-800 mt-2">
                  {formatDuration(reportData.summary.total_break_time_seconds)}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Time spent without active calls</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center gap-2 text-amber-700 mb-2">
                  <Coffee className="w-5 h-5" />
                  <h3 className="font-extrabold uppercase tracking-wider text-xs">Coffee Break</h3>
                </div>
                <div className="text-3xl font-black text-slate-800 mt-2">
                  {formatDuration(reportData.summary.coffee_break_seconds || 0)}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Total coffee break time</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                  <Utensils className="w-5 h-5" />
                  <h3 className="font-extrabold uppercase tracking-wider text-xs">Lunch Break</h3>
                </div>
                <div className="text-3xl font-black text-slate-800 mt-2">
                  {formatDuration(reportData.summary.lunch_break_seconds || 0)}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Total lunch break time</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <LogOut className="w-5 h-5" />
                  <h3 className="font-extrabold uppercase tracking-wider text-xs">Logout Time</h3>
                </div>
                <div className="text-3xl font-black text-slate-800 mt-2">
                  {formatTime(reportData.summary.logout_time)}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Session End Time</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 uppercase tracking-wider text-sm">Call Log for {date ? new Date(date).toLocaleDateString() : ""}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase font-extrabold tracking-wider text-slate-500 border-b border-slate-200">
                      <th className="p-4">Time</th>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Phone Number</th>
                      <th className="p-4">Connected At</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.calls.length > 0 ? (
                      reportData.calls.map((call: any, idx: number) => (
                        <tr key={`${call.id || 'call'}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-xs font-bold text-slate-700 whitespace-nowrap">{call.start_time}</td>
                          <td className="p-4 text-sm font-semibold text-slate-900">{call.customer_name}</td>
                          <td className="p-4 text-sm font-mono text-slate-600">{call.customer_phone}</td>
                          <td className="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">{call.connected_time}</td>
                          <td className="p-4 text-sm font-bold text-slate-700">{formatDuration(call.duration_seconds)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              call.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                              call.status === "FAILED" ? "bg-red-100 text-red-700" :
                              "bg-indigo-100 text-indigo-700"
                            }`}>
                              {call.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 text-sm font-medium">
                          No calls recorded for this date.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

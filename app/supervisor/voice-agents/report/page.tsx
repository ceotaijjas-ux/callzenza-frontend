"use client";

import { useEffect, useState, useMemo } from "react";
import { agentDashboardService } from "@/lib/services/agent-dashboard.service";
import { 
  FileText, 
  Clock, 
  PhoneCall, 
  Timer, 
  Calendar as CalendarIcon, 
  Loader2, 
  CheckCircle2, 
  LogOut, 
  Coffee, 
  Hourglass, 
  Utensils, 
  Users, 
  Download, 
  RefreshCw, 
  Search,
  ArrowLeft
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { VoiceAgentSidebar } from "@/components/VoiceAgentSidebar";
import { useRouter } from "next/navigation";
import { formatISTTime, getTodayISTDateString } from "@/lib/date-utils";

export default function SupervisorVoiceAgentReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("ALL");
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setDate(getTodayISTDateString());
  }, []);

  const fetchReport = async () => {
    if (!date) return;
    setLoading(true);
    setError(null);
    try {
      const data = await agentDashboardService.getDailyReport(date, selectedAgentId);
      setReportData(data);
    } catch (err: any) {
      console.error("Failed to load supervisor voice agent report:", err);
      setError(err.message || "Unable to load Voice Agent reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [date, selectedAgentId]);

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0m 0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "-";
    return formatISTTime(isoString, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  // Filtered call logs based on search query
  const filteredCalls = useMemo(() => {
    if (!reportData?.calls) return [];
    if (!searchQuery.trim()) return reportData.calls;
    const q = searchQuery.toLowerCase();
    return reportData.calls.filter((call: any) => 
      (call.customer_name && call.customer_name.toLowerCase().includes(q)) ||
      (call.customer_phone && call.customer_phone.toLowerCase().includes(q)) ||
      (call.agent_name && call.agent_name.toLowerCase().includes(q)) ||
      (call.status && call.status.toLowerCase().includes(q)) ||
      (call.outcome && call.outcome.toLowerCase().includes(q))
    );
  }, [reportData?.calls, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredCalls || filteredCalls.length === 0) return;
    const headers = ["Time", "Agent Name", "Customer Name", "Phone Number", "Connected At", "Duration (s)", "Duration", "Status", "Outcome"];
    const rows = filteredCalls.map((c: any) => [
      `"${c.start_time || ""}"`,
      `"${c.agent_name || ""}"`,
      `"${c.customer_name || ""}"`,
      `"${c.customer_phone || ""}"`,
      `"${c.connected_time || ""}"`,
      c.duration_seconds || 0,
      `"${formatDuration(c.duration_seconds)}"`,
      `"${c.status || ""}"`,
      `"${c.outcome || ""}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `voice_agent_report_${selectedAgentId}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="flex h-full animate-in fade-in duration-300 bg-slate-200/50 select-none -m-6 rounded-tl-2xl overflow-hidden relative flex-1">
        <VoiceAgentSidebar basePath="/supervisor/voice-agents" />

        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden font-sans">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 p-6 shrink-0 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/supervisor/voice-agents")}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Back to Voice Agent Workspace"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Voice Agent Report</h1>
                <p className="text-sm text-slate-500">Live call activity and session performance tracking for voice agents</p>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Agent Filter */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-xs text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Voice Agents</option>
                  {reportData?.available_agents?.map((ag: any) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} {ag.role ? `(${ag.role})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg shadow-xs text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                    max={getTodayISTDateString()}
                  />
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchReport}
                disabled={loading}
                className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh Report Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
              </button>

              {/* Export CSV Button */}
              <button
                onClick={handleExportCSV}
                disabled={!filteredCalls || filteredCalls.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export to CSV"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl font-medium text-sm flex items-center justify-between">
                <span>{error}</span>
                <button onClick={fetchReport} className="underline font-bold text-xs hover:text-red-800">Retry</button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="font-bold uppercase tracking-wider text-sm">Loading Voice Agent reports...</span>
              </div>
            ) : reportData ? (
              <>
                {/* 8 Metric Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col">
                    <div className="flex items-center gap-2 text-indigo-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <h3 className="font-extrabold uppercase tracking-wider text-xs">First Login Time</h3>
                    </div>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      {formatTime(reportData.summary?.first_login_time)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Session Start Time</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                      <PhoneCall className="w-4 h-4" />
                      <h3 className="font-extrabold uppercase tracking-wider text-xs">Total Calls Handled</h3>
                    </div>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      {reportData.summary?.total_calls || 0}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Total connections today</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col">
                    <div className="flex items-center gap-2 text-amber-500 mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <h3 className="font-extrabold uppercase tracking-wider text-xs">Completed Calls</h3>
                    </div>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      {reportData.summary?.completed_calls || 0}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Calls finished successfully</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col">
                    <div className="flex items-center gap-2 text-rose-600 mb-1">
                      <Timer className="w-4 h-4" />
                      <h3 className="font-extrabold uppercase tracking-wider text-xs">Total Talk Time</h3>
                    </div>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      {formatDuration(reportData.summary?.total_talk_time_seconds || 0)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Aggregate conversation time</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col">
                    <div className="flex items-center gap-2 text-orange-600 mb-1">
                      <Hourglass className="w-4 h-4" />
                      <h3 className="font-extrabold uppercase tracking-wider text-xs">Idle / Break Time</h3>
                    </div>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      {formatDuration(reportData.summary?.total_break_time_seconds || 0)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Time spent without active calls</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col">
                    <div className="flex items-center gap-2 text-amber-700 mb-1">
                      <Coffee className="w-4 h-4" />
                      <h3 className="font-extrabold uppercase tracking-wider text-xs">Coffee Break</h3>
                    </div>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      {formatDuration(reportData.summary?.coffee_break_seconds || 0)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Total coffee break duration</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col">
                    <div className="flex items-center gap-2 text-red-500 mb-1">
                      <Utensils className="w-4 h-4" />
                      <h3 className="font-extrabold uppercase tracking-wider text-xs">Lunch Break</h3>
                    </div>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      {formatDuration(reportData.summary?.lunch_break_seconds || 0)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Total lunch break duration</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <LogOut className="w-4 h-4" />
                      <h3 className="font-extrabold uppercase tracking-wider text-xs">Logout Time</h3>
                    </div>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      {formatTime(reportData.summary?.logout_time)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Session End Time</p>
                  </div>
                </div>

                {/* Call Log Table Section */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <h3 className="font-extrabold text-slate-800 uppercase tracking-wider text-sm">
                        Call Activity Log ({filteredCalls.length} calls)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Date: {date ? new Date(date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : "-"}
                      </p>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search calls or agents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] uppercase font-extrabold tracking-wider text-slate-500 border-b border-slate-200">
                          <th className="p-4">Time</th>
                          <th className="p-4">Agent Name</th>
                          <th className="p-4">Customer Name</th>
                          <th className="p-4">Phone Number</th>
                          <th className="p-4">Connected At</th>
                          <th className="p-4">Duration</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Outcome</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCalls.length > 0 ? (
                          filteredCalls.map((call: any, idx: number) => (
                            <tr key={`${call.id || 'call'}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-4 text-xs font-bold text-slate-700 whitespace-nowrap">{call.start_time}</td>
                              <td className="p-4 text-xs font-semibold text-indigo-700 whitespace-nowrap">
                                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[11px] font-bold">
                                  {call.agent_name || "Voice Agent"}
                                </span>
                              </td>
                              <td className="p-4 text-sm font-semibold text-slate-900">{call.customer_name}</td>
                              <td className="p-4 text-xs font-mono text-slate-600">{call.customer_phone || "-"}</td>
                              <td className="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">{call.connected_time}</td>
                              <td className="p-4 text-xs font-bold text-slate-800">{formatDuration(call.duration_seconds)}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  call.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                                  call.status === "FAILED" ? "bg-red-100 text-red-700" :
                                  "bg-indigo-100 text-indigo-700"
                                }`}>
                                  {call.status}
                                </span>
                              </td>
                              <td className="p-4 text-xs font-medium text-slate-600">
                                {call.outcome || "Connected"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400 text-sm font-medium">
                              No Voice Agent report data available for this date.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm font-medium bg-white rounded-xl border border-slate-200">
                No Voice Agent report data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

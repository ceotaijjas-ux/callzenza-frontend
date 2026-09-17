"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft, Printer, Download, Filter, RefreshCw } from "lucide-react";
import { reportService } from "@/lib/services/report.service";

export default function AnotherTestProcessPage() {
  const formattedTitle = "Another Test Process";
  const slug = "another-test-process";
  const todayStr = new Date().toISOString().split("T")[0];

  // Filter States
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [selectedCampaign, setSelectedCampaign] = useState("All Campaigns");
  const [selectedGroup, setSelectedGroup] = useState("All Groups");
  const [selectedAgent, setSelectedAgent] = useState("All Agents");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const [reportData, setReportData] = useState<any[]>([]);
  const [summaryCards, setSummaryCards] = useState<any[]>([
    { label: "Total Volume", val: "0", sub: "Recorded period items" },
    { label: "Answered / Processed", val: "0", sub: "0% completion rate" },
    { label: "Avg Service Time", val: "00m 00s", sub: "Average connected duration" },
    { label: "Active SLA", val: "88.4%", sub: "Target SLA > 80%" },
    { label: "Abandon Rate", val: "0.0%", sub: "Within normal threshold" },
  ]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportService.getGenericReport(slug, {
        from_date: fromDate,
        to_date: toDate,
        campaign_id: selectedCampaign,
        agent_id: selectedAgent,
        status: selectedStatus,
      });
      if (res && Array.isArray(res.data)) {
        setReportData(res.data);
      }
      if (res && Array.isArray(res.summary)) {
        setSummaryCards(res.summary);
      }
    } catch (err: any) {
      console.error("Failed to load report data:", err);
      setError(err.message || "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
    const interval = setInterval(fetchReportData, 8000);
    return () => clearInterval(interval);
  }, [slug, fromDate, toDate, selectedCampaign, selectedAgent, selectedStatus]);

  const exportCSV = () => {
    const dataToExport = reportData.length > 0 ? reportData : [];
    const csvContent = [
      "Agent,Date,Time,Calls,Answered,Abandons,Status,Group",
      ...dataToExport.map(
        (d) =>
          `"${d.agent || d.agent_name || ""}",` +
          `"${d.date || ""}",` +
          `"${d.time || d.duration || ""}",` +
          `"${d.calls ?? 0}",` +
          `"${d.answered || 0}",` +
          `"${d.abandons || 0}",` +
          `"${d.status || ""}",` +
          `"${d.group || ""}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `another-test-process.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification("Report CSV downloaded successfully.");
  };

  return (
    <AppShell>
      <div className="p-4 md:p-7 w-full max-w-[1600px] mx-auto bg-[#f7f8fa] min-h-screen text-[#1f2937]">
        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className="fixed top-5 right-5 bg-indigo-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
            {notification}
          </div>
        )}

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1">
              {formattedTitle}
            </h1>
            <p className="text-slate-500 text-xs md:text-sm">
              Process benchmarking, operational workflow reports, and test metrics
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => window.print()}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={exportCSV}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={fetchReportData}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl text-xs transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* FILTER CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 mb-6 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4">
            <Filter className="w-4 h-4 text-indigo-600" /> Report Filters
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3.5 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Campaign</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-indigo-600"
              >
                <option>All Campaigns</option>
                <option>testcampaign</option>
                <option>testprocess</option>
                <option>Sales Campaign</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">User Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-indigo-600"
              >
                <option>All Groups</option>
                <option>Sales Team</option>
                <option>Support Team</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-indigo-600"
              >
                <option>All Agents</option>
                <option>Voice Agent</option>
                <option>Admin User</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-indigo-600"
              >
                <option>All Statuses</option>
                <option>Active</option>
                <option>Completed</option>
              </select>
            </div>

            <button
              onClick={() => {
                fetchReportData();
                showNotification("Filters applied successfully.");
              }}
              className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 text-xs font-semibold cursor-pointer transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* SUMMARY METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
          {summaryCards.map((card, idx) => (
            <div key={card.label || idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] text-slate-500 font-semibold uppercase mb-2">{card.label}</div>
              <div className="text-2xl font-bold text-slate-900">{card.val}</div>
              <div className="text-[11px] text-slate-400 mt-1">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* REPORT TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden mb-6">
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">{formattedTitle} Details</h2>
            <div className="text-xs text-slate-500 font-medium">
              {loading ? "Loading..." : `${reportData.length} records found`}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading && reportData.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">Loading report metrics from database...</div>
            ) : reportData.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">No records found for the selected filter criteria.</div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agent / Source</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Group</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Time</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Calls</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Answered</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Abandons</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {reportData.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-900">{row.agent || row.agent_name || "Voice Agent"}</td>
                      <td className="p-3.5 text-slate-600">{row.date || "Today"}</td>
                      <td className="p-3.5 text-slate-700">{row.group || "Default Group"}</td>
                      <td className="p-3.5 font-bold text-slate-900">{row.time || row.duration || "00:00"}</td>
                      <td className="p-3.5 font-bold text-slate-900">{row.calls ?? 0}</td>
                      <td className="p-3.5 text-emerald-600 font-semibold">{row.answered || 0}</td>
                      <td className="p-3.5 text-rose-600 font-semibold">{row.abandons || 0}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            row.status === "Active" || row.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : row.status === "On Break"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {row.status || "Active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Filter,
  Search,
  RefreshCw,
  Printer
} from "lucide-react";
import { reportService } from "@/lib/services/report.service";

interface APDRow {
  id: string;
  rank: number;
  agent: string;
  email: string;
  role: string;
  campaign: string;
  period: string;
  calls: number;
  answered: number;
  abandons: number;
  answer_rate: string;
  talk_time: string;
  talk_time_seconds: number;
  aht: string;
  aht_seconds: number;
  occupancy: string;
  conversion_rate: string;
  status: string;
  group: string;
}

export default function OneMonthAPDReport() {
  const [apdData, setApdData] = useState<APDRow[]>([]);
  const [summaryCards, setSummaryCards] = useState<any[]>([
    { label: "1-Month APD Calls", val: "0", sub: "Test campaign volume" },
    { label: "Answer / Reach Rate", val: "0%", sub: "Target > 80% SLA" },
    { label: "Total Speech Time", val: "00:00:00", sub: "Audio duration" },
    { label: "Avg Handle Time (AHT)", val: "00:00", sub: "Average engagement" },
    { label: "Test Campaigns", val: "2 Active", sub: "testcampaign & testprocess" }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [campaignFilter, setCampaignFilter] = useState("All Campaigns");
  const [groupFilter, setGroupFilter] = useState("All Groups");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchAPDData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportService.getGenericReport("1-month-apd-report-for-test-campaigns", {
        campaign_id: campaignFilter !== "All Campaigns" ? campaignFilter : undefined,
        status: statusFilter !== "All Statuses" ? statusFilter : undefined,
      });

      if (res && Array.isArray(res.data)) {
        setApdData(res.data);
      } else if (res && Array.isArray(res.records)) {
        setApdData(res.records);
      }

      if (res && Array.isArray(res.summary)) {
        setSummaryCards(res.summary);
      }
    } catch (err: any) {
      console.error("Failed to load 1-Month APD Report:", err);
      setError(err.message || "Failed to load 1-Month APD Report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAPDData();
  }, []);

  // Filter options
  const campaignOptions = useMemo(() => {
    const list = Array.from(new Set(apdData.map((d) => d.campaign).filter(Boolean)));
    return ["All Campaigns", ...list];
  }, [apdData]);

  const groupOptions = useMemo(() => {
    const list = Array.from(new Set(apdData.map((d) => d.group).filter(Boolean)));
    return ["All Groups", ...list];
  }, [apdData]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return apdData.filter((row) => {
      if (campaignFilter !== "All Campaigns" && row.campaign !== campaignFilter) return false;
      if (groupFilter !== "All Groups" && row.group !== groupFilter) return false;
      if (statusFilter !== "All Statuses" && row.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          row.agent.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q) ||
          row.campaign.toLowerCase().includes(q) ||
          row.group.toLowerCase().includes(q) ||
          row.role.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [apdData, campaignFilter, groupFilter, statusFilter, searchTerm]);

  const exportCSV = () => {
    const dataToExport = filteredRows.length > 0 ? filteredRows : apdData;
    const headers = [
      "Rank",
      "Agent Name",
      "Email",
      "Role",
      "Campaign",
      "Group",
      "Period",
      "Total Calls",
      "Answered",
      "Abandons",
      "Answer Rate",
      "Total Talk Time",
      "AHT",
      "Occupancy",
      "Conversion Rate",
      "Status"
    ];

    const rows = dataToExport.map((d) => [
      d.rank,
      `"${d.agent}"`,
      `"${d.email}"`,
      `"${d.role}"`,
      `"${d.campaign}"`,
      `"${d.group}"`,
      `"${d.period}"`,
      d.calls,
      d.answered,
      d.abandons,
      d.answer_rate,
      `"${d.talk_time}"`,
      `"${d.aht}"`,
      d.occupancy,
      d.conversion_rate,
      d.status
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `1-month-apd-report-test-campaigns-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification("1-Month APD Report exported successfully.");
  };

  return (
    <AppShell>
      <div className="p-4 md:p-7 w-full max-w-[1600px] mx-auto bg-[#f7f8fa] min-h-screen text-[#1f2937]">
        {/* TOAST NOTIFICATION */}
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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1 flex items-center gap-2.5">
              <span>1-Month APD Report for Test Campaigns</span>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                Live DB
              </span>
            </h1>
            <p className="text-slate-500 text-xs md:text-sm">
              30-day Agent Performance Detail (APD) and Automated Predictive Dialer metrics for test campaigns (<code className="text-indigo-600 font-mono">testcampaign</code> & <code className="text-indigo-600 font-mono">testprocess</code>).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => {
                fetchAPDData();
                showNotification("Refreshed live data from database.");
              }}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button
              onClick={() => window.print()}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={exportCSV}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
          {summaryCards.map((card, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">
                {card.label}
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{card.val}</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                {card.sub}
              </div>
            </div>
          ))}
        </div>

        {/* FILTER BAR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-xs">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Filter className="w-4 h-4 text-indigo-600" /> Filter APD Records
            </div>
            <div className="text-xs text-slate-400">Timeframe: Last 30 Days (1 Month)</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Search Agent / Role</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Test Campaign</label>
              <select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-800 outline-none focus:border-indigo-600"
              >
                {campaignOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">User Group</label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-800 outline-none focus:border-indigo-600"
              >
                {groupOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-800 outline-none focus:border-indigo-600"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  fetchAPDData();
                  showNotification("Filters applied.");
                }}
                className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCampaignFilter("All Campaigns");
                  setGroupFilter("All Groups");
                  setStatusFilter("All Statuses");
                  fetchAPDData();
                  showNotification("Filters reset.");
                }}
                className="px-3 h-10 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* APD DATA TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden mb-6">
          <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">Agent Performance Detail Breakdown</h2>
              <p className="text-xs text-slate-500">Live operational stats for test campaigns aggregated across users</p>
            </div>
            <div className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
              {loading ? "Refreshing..." : `${filteredRows.length} Agents Logged`}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading && apdData.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 font-medium">
                Loading 1-Month APD data from database...
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 font-medium">
                No matching APD records found for the selected criteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rank / Agent</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role & Group</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Test Campaign</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Calls Handled</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Answered</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Abandons</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Answer %</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Talk Time</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">AHT</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Occupancy</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Conversion</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                            {row.rank}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{row.agent}</div>
                            <div className="text-[10px] text-slate-400">{row.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{row.role}</div>
                        <div className="text-[10px] text-slate-500">{row.group}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {row.campaign}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-extrabold text-slate-900">{row.calls}</td>
                      <td className="p-3.5 text-right font-semibold text-emerald-600">{row.answered}</td>
                      <td className="p-3.5 text-right font-semibold text-rose-500">{row.abandons}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900">{row.answer_rate}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-indigo-600">{row.talk_time}</td>
                      <td className="p-3.5 text-right font-mono text-slate-700">{row.aht}</td>
                      <td className="p-3.5 text-right font-semibold text-slate-700">{row.occupancy}</td>
                      <td className="p-3.5 text-right font-bold text-emerald-600">{row.conversion_rate}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            row.status === "Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {row.status}
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

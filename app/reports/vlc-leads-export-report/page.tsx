"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Filter,
  Search,
  CheckSquare,
  Square,
  Printer,
  RefreshCw,
  Phone,
  Building,
  UserCheck,
  ShieldCheck,
  Tag
} from "lucide-react";
import { reportService } from "@/lib/services/report.service";

interface VLCLeadRow {
  id: string;
  lead_id: string;
  alt_lead_id: string;
  name: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  company: string;
  campaign: string;
  list_id: string;
  status: string;
  qualification_status: string;
  score: number;
  attempt_count: number;
  agent: string;
  source: string;
  location: string;
  date: string;
  call_duration: string;
  duration_seconds: number;
}

export default function VLCLeadsExportReportPage() {
  const [leads, setLeads] = useState<VLCLeadRow[]>([]);
  const [summaryCards, setSummaryCards] = useState<any[]>([
    { label: "Total VLC Leads", val: "0", sub: "Loaded from active DB" },
    { label: "Contacted / Dialed", val: "0", sub: "Live attempt records" },
    { label: "Qualified Leads", val: "0", sub: "Sales & inbound verified" },
    { label: "Avg Lead Score", val: "0.0", sub: "Algorithmic rating" },
    { label: "Export Status", val: "Ready", sub: "100% DB Synced" },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [campaignFilter, setCampaignFilter] = useState("All Campaigns");
  const [listFilter, setListFilter] = useState("All Lists");
  const [agentFilter, setAgentFilter] = useState("All Agents");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportService.getGenericReport("vlc-leads-export-report", {
        campaign_id: campaignFilter !== "All Campaigns" ? campaignFilter : undefined,
        status: statusFilter !== "All Statuses" ? statusFilter : undefined,
      });

      if (res && Array.isArray(res.data)) {
        setLeads(res.data);
      } else if (res && Array.isArray(res.records)) {
        setLeads(res.records);
      }

      if (res && Array.isArray(res.summary)) {
        setSummaryCards(res.summary);
      }
    } catch (err: any) {
      console.error("Failed to load VLC Leads:", err);
      setError(err.message || "Failed to load VLC Leads Report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Filter options
  const statusOptions = useMemo(() => {
    const list = Array.from(new Set(leads.map((l) => l.status).filter(Boolean)));
    return ["All Statuses", ...list];
  }, [leads]);

  const campaignOptions = useMemo(() => {
    const list = Array.from(new Set(leads.map((l) => l.campaign).filter(Boolean)));
    return ["All Campaigns", ...list];
  }, [leads]);

  const listOptions = useMemo(() => {
    const list = Array.from(new Set(leads.map((l) => l.list_id).filter(Boolean)));
    return ["All Lists", ...list];
  }, [leads]);

  const agentOptions = useMemo(() => {
    const list = Array.from(new Set(leads.map((l) => l.agent).filter(Boolean)));
    return ["All Agents", ...list];
  }, [leads]);

  // Filtered rows
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== "All Statuses" && lead.status !== statusFilter) return false;
      if (campaignFilter !== "All Campaigns" && lead.campaign !== campaignFilter) return false;
      if (listFilter !== "All Lists" && lead.list_id !== listFilter) return false;
      if (agentFilter !== "All Agents" && lead.agent !== agentFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          lead.name.toLowerCase().includes(q) ||
          lead.phone.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.company.toLowerCase().includes(q) ||
          lead.alt_lead_id.toLowerCase().includes(q) ||
          lead.lead_id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [leads, statusFilter, campaignFilter, listFilter, agentFilter, searchTerm]);

  // Bulk selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map((l) => l.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Export CSV
  const exportCSV = () => {
    const toExport =
      selectedIds.length > 0
        ? filteredLeads.filter((l) => selectedIds.includes(l.id))
        : filteredLeads;

    const headers = [
      "Lead ID",
      "Alt Lead ID",
      "Customer Name",
      "Phone",
      "Email",
      "Company",
      "Campaign",
      "List ID",
      "Status",
      "Qualification",
      "Score",
      "Attempt Count",
      "Agent",
      "Location",
      "Call Duration",
      "Date Created"
    ];

    const rows = toExport.map((l) => [
      `"${l.lead_id}"`,
      `"${l.alt_lead_id}"`,
      `"${l.name}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.company}"`,
      `"${l.campaign}"`,
      `"${l.list_id}"`,
      `"${l.status}"`,
      `"${l.qualification_status}"`,
      l.score,
      l.attempt_count,
      `"${l.agent}"`,
      `"${l.location}"`,
      `"${l.call_duration}"`,
      `"${l.date}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vlc-leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification(`Exported ${toExport.length} VLC lead records successfully.`);
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
              <span>VLC Leads Export Report</span>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                Live DB
              </span>
            </h1>
            <p className="text-slate-500 text-xs md:text-sm">
              VICIdial List Campaign (VLC) export records, lead statuses, call attempts, assigned voice agents, and bulk CSV generation.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => {
                fetchLeads();
                showNotification("Refreshed leads from live database.");
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
              <Download className="w-3.5 h-3.5" /> Export VLC CSV
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
              <Filter className="w-4 h-4 text-indigo-600" /> Filter VLC Leads
            </div>
            <div className="text-xs text-slate-400">
              {selectedIds.length > 0
                ? `${selectedIds.length} leads selected for export`
                : "All matching leads will be exported"}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 items-end">
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Search Leads</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Name, phone, company, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Campaign</label>
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
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">List ID</label>
              <select
                value={listFilter}
                onChange={(e) => setListFilter(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-800 outline-none focus:border-indigo-600"
              >
                {listOptions.map((l) => (
                  <option key={l} value={l}>
                    {l}
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
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  fetchLeads();
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
                  setListFilter("All Lists");
                  setStatusFilter("All Statuses");
                  setAgentFilter("All Agents");
                  setSelectedIds([]);
                  fetchLeads();
                  showNotification("Filters reset.");
                }}
                className="px-3 h-10 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* VLC LEADS TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden mb-6">
          <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
              >
                {selectedIds.length === filteredLeads.length && filteredLeads.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Select All</span>
              </button>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-bold text-slate-900">
                {filteredLeads.length} VLC Leads Indexed
              </span>
            </div>

            {selectedIds.length > 0 && (
              <button
                onClick={exportCSV}
                className="text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export Selected ({selectedIds.length})
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            {loading && leads.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 font-medium">
                Loading VLC Leads from database...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 font-medium">
                No VLC leads found for the selected filter criteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3.5 w-10 text-center"></th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lead ID / Contact</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company & City</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Campaign & List</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Score</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Attempts</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Duration</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Agent</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredLeads.map((lead) => {
                    const isSelected = selectedIds.includes(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? "bg-indigo-50/40" : ""
                        }`}
                      >
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => toggleSelectRow(lead.id)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900">
                          <div className="font-bold text-slate-900">{lead.name}</div>
                          <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" /> {lead.phone}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {lead.alt_lead_id} ({lead.email})
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" /> {lead.company}
                          </div>
                          <div className="text-[10px] text-slate-500">{lead.location}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {lead.campaign}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">List: {lead.list_id}</div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              lead.status.toUpperCase() === "COMPLETED" || lead.status.toUpperCase() === "SALE"
                                ? "bg-emerald-100 text-emerald-800"
                                : lead.status.toUpperCase() === "READY"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-800">
                          {lead.score || "—"}
                        </td>
                        <td className="p-3.5 text-center font-semibold text-slate-700">
                          {lead.attempt_count}
                        </td>
                        <td className="p-3.5 text-right font-mono font-semibold text-slate-800">
                          {lead.call_duration}
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-800">{lead.agent}</div>
                          <div className="text-[10px] text-slate-400">{lead.source}</div>
                        </td>
                        <td className="p-3.5 text-slate-600 text-[11px]">
                          {lead.date}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

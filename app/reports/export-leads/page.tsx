"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft, Download, Filter, Search, CheckSquare, Users, ShieldCheck, PhoneCall, Sparkles, RefreshCw } from "lucide-react";
import { reportService } from "@/lib/services/report.service";

interface LeadRow {
  id: string;
  lead_id: string;
  name: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  status: string;
  qualification_status: string;
  score: number;
  campaign: string;
  agent: string;
  source: string;
  date: string;
  call_duration: string;
}

export default function ExportLeadsReport() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any[]>([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [campaignFilter, setCampaignFilter] = useState("All Campaigns");
  const [agentFilter, setAgentFilter] = useState("All Agents");
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await reportService.getGenericReport("export-leads");
      if (res && Array.isArray(res.data)) {
        setLeads(res.data);
      }
      if (res && Array.isArray(res.summary)) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error("Failed to load export leads report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Extract unique filter lists
  const statuses = useMemo(() => ["All Statuses", ...Array.from(new Set(leads.map(l => l.status).filter(Boolean)))], [leads]);
  const campaigns = useMemo(() => ["All Campaigns", ...Array.from(new Set(leads.map(l => l.campaign).filter(Boolean)))], [leads]);
  const agents = useMemo(() => ["All Agents", "Inbound Voice Agent", ...Array.from(new Set(leads.map(l => l.agent).filter(Boolean)))], [leads]);
  const sources = useMemo(() => ["All Sources", ...Array.from(new Set(leads.map(l => l.source).filter(Boolean)))], [leads]);

  // Filtered rows
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== "All Statuses" && lead.status !== statusFilter) return false;
      if (campaignFilter !== "All Campaigns" && lead.campaign !== campaignFilter) return false;
      if (agentFilter !== "All Agents") {
        if (agentFilter === "Inbound Voice Agent" && !lead.agent.toLowerCase().includes("inbound")) return false;
        if (agentFilter !== "Inbound Voice Agent" && lead.agent !== agentFilter) return false;
      }
      if (sourceFilter !== "All Sources" && lead.source !== sourceFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          lead.name.toLowerCase().includes(q) ||
          lead.phone.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.lead_id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [leads, statusFilter, campaignFilter, agentFilter, sourceFilter, searchTerm]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const exportCSV = () => {
    const rowsToExport = selectedIds.length > 0 
      ? filteredLeads.filter(l => selectedIds.includes(l.id))
      : filteredLeads;

    if (rowsToExport.length === 0) {
      showNotification("No leads to export with the current filter criteria.");
      return;
    }

    const headers = [
      "Lead ID",
      "Customer Name",
      "Phone",
      "Email",
      "Status",
      "Qualification Status",
      "Score",
      "Campaign",
      "Assigned Agent",
      "Source",
      "Created Date"
    ];

    const dataRows = rowsToExport.map(l => [
      l.lead_id,
      l.name,
      l.phone,
      l.email,
      l.status,
      l.qualification_status,
      l.score,
      l.campaign,
      l.agent,
      l.source,
      l.date
    ]);

    const csvContent = [headers, ...dataRows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LEADS_EXPORT_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`Successfully exported ${rowsToExport.length} live leads to CSV.`);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 w-full bg-slate-50 min-h-screen font-sans">
        
        {/* Navigation & Header */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Link 
              href="/reports"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-bold transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Reports
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Download className="w-7 h-7 text-indigo-600" />
              Export Leads Report
            </h1>
            <p className="text-slate-500 text-sm mt-1">Export filtered live customer leads with real database qualification and agent handoff records.</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchLeads} 
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button 
              onClick={exportCSV}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" /> Export CSV ({selectedIds.length > 0 ? selectedIds.length : filteredLeads.length})
            </button>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-3 animate-fade-in shadow-sm">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            {notification}
          </div>
        )}

        {/* KPI Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Indexed Leads</div>
            <div className="text-3xl font-black text-slate-800 tracking-tight">{leads.length}</div>
            <div className="text-xs text-slate-400 mt-1">Real database records</div>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Qualified Leads</div>
            <div className="text-3xl font-black text-emerald-600 tracking-tight">
              {leads.filter(l => l.qualification_status === "QUALIFIED").length}
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">Passed AI/Agent criteria</div>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Assigned to Agents</div>
            <div className="text-3xl font-black text-indigo-600 tracking-tight">
              {leads.filter(l => l.agent && l.agent !== "Unassigned").length}
            </div>
            <div className="text-xs text-indigo-600 font-semibold mt-1">Active agent ownership</div>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Rate</div>
            <div className="text-3xl font-black text-amber-600 tracking-tight">
              {leads.length > 0 ? `${((leads.filter(l => l.status === "Contacted" || l.status === "Qualified" || l.status === "Won").length / leads.length) * 100).toFixed(1)}%` : "0%"}
            </div>
            <div className="text-xs text-slate-400 mt-1">Verified telephone reach</div>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 mb-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-indigo-500" /> Filter Criteria
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Search Leads</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name, Phone, ID..." 
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Lead Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-semibold bg-white cursor-pointer"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Campaign</label>
              <select 
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-semibold bg-white cursor-pointer"
              >
                {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Assigned Agent</label>
              <select 
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-semibold bg-white cursor-pointer"
              >
                {agents.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Lead Source</label>
              <select 
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-semibold bg-white cursor-pointer"
              >
                {sources.map(src => <option key={src} value={src}>{src}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Live Leads Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-slate-800">
                Matching Leads ({filteredLeads.length})
              </span>
              {selectedIds.length > 0 && (
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full border border-indigo-200">
                  {selectedIds.length} selected for export
                </span>
              )}
            </div>
            <button 
              onClick={toggleSelectAll}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4" /> 
              {selectedIds.length === filteredLeads.length && filteredLeads.length > 0 ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3.5 w-12 text-center">
                    <input 
                      type="checkbox"
                      checked={filteredLeads.length > 0 && selectedIds.length === filteredLeads.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3.5">Lead ID</th>
                  <th className="px-4 py-3.5">Customer Name</th>
                  <th className="px-4 py-3.5">Phone Number</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Qualification</th>
                  <th className="px-4 py-3.5">Campaign</th>
                  <th className="px-4 py-3.5">Assigned Agent</th>
                  <th className="px-4 py-3.5">Source</th>
                  <th className="px-4 py-3.5">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className={`hover:bg-indigo-50/40 transition-colors ${selectedIds.includes(lead.id) ? 'bg-indigo-50/60' : ''}`}
                  >
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600 text-xs">
                      {lead.lead_id}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {lead.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 text-xs">
                      {lead.phone}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        lead.status === 'QUALIFIED' ? 'bg-emerald-100 text-emerald-700' :
                        lead.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
                        lead.status === 'CONTACTED' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        lead.qualification_status === 'QUALIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {lead.qualification_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-xs font-medium">
                      {lead.campaign}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">
                      {lead.agent}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {lead.source}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {lead.date}
                    </td>
                  </tr>
                ))}
                {!loading && filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No leads match the selected filter criteria.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Loading live customer leads from backend...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

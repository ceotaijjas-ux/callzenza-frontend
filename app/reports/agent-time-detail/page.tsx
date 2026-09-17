"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { reportService } from "@/lib/services/report.service";

interface AgentRecord {
  id: string;
  name: string;
  avatarInitials: string;
  agentId: string;
  date: string;
  login: string;
  logout: string;
  timeClock: string;
  agentTime: string;
  activeTime: string;
  breakTime: string;
  idleTime: string;
  status: "Active" | "Offline" | "On Break";
  campaign: string;
  userGroup: string;
}

export default function AgentTimeDetailPage() {
  const todayStr = new Date().toISOString().split("T")[0];

  // Filter States
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [selectedCampaign, setSelectedCampaign] = useState("All Campaigns");
  const [selectedGroup, setSelectedGroup] = useState("All Groups");
  const [selectedAgentFilter, setSelectedAgentFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Toast Notification
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const [agentsData, setAgentsData] = useState<AgentRecord[]>([]);
  const [summaryCards, setSummaryCards] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await reportService.getGenericReport("agent-time-detail", {
          from_date: fromDate,
          to_date: toDate,
          campaign_id: selectedCampaign !== "All Campaigns" ? selectedCampaign : undefined,
        });
        if (res) {
          if (res.summary) setSummaryCards(res.summary);
          if (Array.isArray(res.data)) {
            const mapped: AgentRecord[] = res.data.map((item: any, index: number) => ({
              id: item.id || String(index + 1),
              name: item.name || item.agent || "Agent",
              avatarInitials: item.avatarInitials || "AG",
              agentId: item.agentId || `AGT-00${index + 1}`,
              date: item.date || new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
              login: item.login || "--",
              logout: item.logout || "--",
              timeClock: item.timeClock || "00h 00m",
              agentTime: item.agentTime || "00h 00m",
              activeTime: item.activeTime || "00h 00m",
              breakTime: item.breakTime || "00h 00m",
              idleTime: item.idleTime || "00h 00m",
              status: item.status === "Active" || item.status === "Ready" ? "Active" : (item.status === "On Break" ? "On Break" : "Offline"),
              campaign: item.campaign || "Inbound Care",
              userGroup: item.team || item.userGroup || "Inbound Voice Team",
            }));
            setAgentsData(mapped);
          } else {
            setAgentsData([]);
          }
        }
      } catch (e) {
        console.error("Error fetching agent time detail:", e);
      }
    };
    fetchLive();
  }, [fromDate, toDate, selectedCampaign]);

  const filteredAgents = agentsData.filter((a) => {
    if (selectedCampaign !== "All Campaigns" && a.campaign !== selectedCampaign) return false;
    if (selectedGroup !== "All Groups" && a.userGroup !== selectedGroup) return false;
    if (selectedAgentFilter && a.name !== selectedAgentFilter) return false;
    if (selectedStatusFilter && a.status !== selectedStatusFilter) return false;
    return true;
  });

  const exportCSV = () => {
    let csvRows = [];
    const headers = [
      "Agent",
      "Agent ID",
      "Date",
      "Login",
      "Logout",
      "Time Clock",
      "Agent Time",
      "Active Time",
      "Break",
      "Idle",
      "Status",
    ];
    csvRows.push(headers.join(","));

    filteredAgents.forEach((a) => {
      const row = [
        `"${a.name}"`,
        `"${a.agentId}"`,
        `"${a.date}"`,
        `"${a.login}"`,
        `"${a.logout}"`,
        `"${a.timeClock}"`,
        `"${a.agentTime}"`,
        `"${a.activeTime}"`,
        `"${a.breakTime}"`,
        `"${a.idleTime}"`,
        `"${a.status}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "agent-time-detail-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    showNotification("CSV export downloaded successfully.");
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
              Agent Time Detail
            </h1>
            <p className="text-slate-500 text-xs md:text-sm">
              Detailed agent login, activity and time utilization report
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => window.print()}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Print
            </button>
            <button
              onClick={exportCSV}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* FILTER CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 mb-6 shadow-xs">
          <div className="text-sm font-bold text-slate-900 mb-4">Report Filters</div>

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
                <option>Sales Campaign</option>
                <option>Support Campaign</option>
                <option>Renewal Campaign</option>
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
                {Array.from(new Set(agentsData.map((a) => a.userGroup).filter(Boolean))).map((grp) => (
                  <option key={grp} value={grp}>{grp}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Agent</label>
              <select
                value={selectedAgentFilter}
                onChange={(e) => setSelectedAgentFilter(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-indigo-600"
              >
                <option value="">All Agents</option>
                {Array.from(new Set(agentsData.map((a) => a.name).filter(Boolean))).map((agent) => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Status</label>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-xs bg-white text-slate-700 outline-none focus:border-indigo-600"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="On Break">On Break</option>
                <option value="Offline">Offline</option>
              </select>
            </div>

            <button
              onClick={() => showNotification("Filters applied.")}
              className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 text-xs font-semibold cursor-pointer transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
          {(summaryCards.length > 0 ? summaryCards : [
            { label: "Total Agents", val: String(agentsData.length), sub: "Agents in selected period" },
            { label: "Time Clock", val: "00h 00m", sub: "Total logged-in time" },
            { label: "Agent Time", val: "00h 00m", sub: "Total productive time" },
            { label: "Active Time", val: "00h 00m", sub: "Available / working time" },
            { label: "Idle Time", val: "00h 00m", sub: "Idle and non-active time" },
          ]).map((card: any) => (
            <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] text-slate-500 font-semibold uppercase mb-2">{card.label}</div>
              <div className="text-2xl font-bold text-slate-900">{card.val}</div>
              <div className="text-[11px] text-slate-400 mt-1">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* REPORT TABLE CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden mb-6">
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Agent Time Details</h2>
            <div className="text-xs text-slate-500 font-medium">{filteredAgents.length} records found</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agent</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Login</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logout</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time Clock</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agent Time</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Time</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Break</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Idle</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      No agent time records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8.5 h-8.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {a.avatarInitials}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{a.name}</div>
                          <div className="text-[10px] text-slate-400">{a.agentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-700">{a.date}</td>
                    <td className="p-3 text-slate-800 font-medium">{a.login}</td>
                    <td className="p-3 text-slate-600">{a.logout}</td>
                    <td className="p-3 font-bold text-slate-900">{a.timeClock}</td>
                    <td className="p-3 font-bold text-slate-900">{a.agentTime}</td>
                    <td className="p-3 text-slate-700 font-medium">{a.activeTime}</td>
                    <td className="p-3 text-slate-600">{a.breakTime}</td>
                    <td className="p-3 text-slate-600">{a.idleTime}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          a.status === "Active"
                            ? "bg-emerald-100 text-emerald-800"
                            : a.status === "On Break"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs">
            <div className="text-slate-500 text-[11px]">
              Showing {filteredAgents.length > 0 ? 1 : 0}–{filteredAgents.length} of {agentsData.length} agents
            </div>
            <div className="flex gap-1">
              <button className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer">
                ‹
              </button>
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg border font-semibold text-xs cursor-pointer ${
                    currentPage === page
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer">
                ›
              </button>
            </div>
          </div>
        </div>

        {/* AGENT TIME BREAKDOWN CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 text-base font-bold text-slate-900">
            Agent Time Breakdown
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            {[
              { label: "Wait Time", val: "00h 00m" },
              { label: "Talk Time", val: summaryCards.find((c: any) => c.label?.toLowerCase().includes("active") || c.label?.toLowerCase().includes("duration"))?.val || "00h 00m" },
              { label: "Disposition / ACW", val: "00h 00m" },
              { label: "Pause Time", val: "00h 00m" },
              { label: "Idle Time", val: "00h 00m" },
            ].map((b) => (
              <div key={b.label} className="p-5">
                <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1.5">{b.label}</div>
                <div className="text-xl font-bold text-slate-900">{b.val}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}

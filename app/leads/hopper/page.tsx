"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import FlowSteps from "@/components/leads/FlowSteps";
import KpiCards from "@/components/leads/KpiCards";
import {
  fetchHopperKpis,
  fetchHopperLeads,
  KpiItem,
  HopperLead,
} from "@/lib/services/lead-recycle.service";
import { campaignService, Campaign } from "@/lib/services/campaign.service";
import { RefreshCw, Search, PhoneForwarded, User, Clock, Radio, PhoneCall, ArrowLeft } from "lucide-react";

const FLOW_STEPS = ["1 Recycle Complete", "2 Lead Hopper", "3 Agent Routing", "4 Live Call"];

export default function LeadHopperPage() {
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [leads, setLeads] = useState<HopperLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [campaignsList, setCampaignsList] = useState<Campaign[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [queue, setQueue] = useState("");
  const [campaign, setCampaign] = useState("");
  const [status, setStatus] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [kpisData, leadsData, campsData] = await Promise.all([
        fetchHopperKpis().catch((err) => {
          console.warn("fetchHopperKpis warning:", err?.message || err);
          return null;
        }),
        fetchHopperLeads({ search, queue, campaign, status }).catch((err) => {
          console.warn("fetchHopperLeads warning:", err?.message || err);
          return null;
        }),
        campaignService.list().catch((err) => {
          console.warn("campaignService.list warning:", err?.message || err);
          return null;
        }),
      ]);
      if (kpisData) setKpis(kpisData);
      if (leadsData) setLeads(leadsData);
      if (campsData) setCampaignsList(campsData);
    } catch (err: any) {
      console.warn("Failed to load hopper data:", err?.message || err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load and filter reaction
  useEffect(() => {
    loadData();
  }, [search, queue, campaign, status]);

  // Real-time live polling every 3 seconds for continuous updates
  useEffect(() => {
    const timer = setInterval(() => {
      loadData(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [search, queue, campaign, status]);

  const getQueueBadge = (queueCls: string) => {
    switch (queueCls) {
      case "b-r":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "b-i":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "b-p":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getPriorityBadge = (priorityCls: string) => {
    switch (priorityCls) {
      case "red":
        return "text-rose-600 font-extrabold";
      case "orange":
        return "text-amber-600 font-bold";
      case "green":
        return "text-emerald-600 font-bold";
      default:
        return "text-slate-600 font-semibold";
    }
  };

  const getStatusBadge = (statusCls: string) => {
    switch (statusCls) {
      case "b-g":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold";
      case "b-w":
        return "bg-amber-50 text-amber-700 border-amber-200 font-bold";
      case "b-i":
        return "bg-blue-50 text-blue-700 border-blue-200 font-bold";
      case "b-r":
        return "bg-rose-50 text-rose-700 border-rose-200 font-extrabold";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 font-semibold";
    }
  };

  const liveDialingLeads = leads.filter(
    (l) => l.status === "Dialing" || l.status === "In Call" || l.status === "Ringing"
  );

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-[200] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-extrabold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Back navigation */}
        <div>
          <Link
            href="/leads/recycle"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-indigo-600 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Recycle Lists</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Lead Hopper</span>
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Calling Queue
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Real-time calling hopper: active campaign leads, live dialing in progress, callbacks and prioritized queues.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                loadData();
                showToast("Lead Hopper refreshed");
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Flow Steps Banner */}
        <FlowSteps
          title="Calling Hopper Engine"
          subtitle="Real-time synchronized hopper delivering live campaign leads, active dialing, and prioritized recycle pools to agents."
          steps={FLOW_STEPS}
          activeIndex={1}
        />

        {/* KPI Cards */}
        <KpiCards items={kpis} />

        {/* Live Calling Alert Banner */}
        {liveDialingLeads.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-rose-50 via-rose-50/60 to-white border border-rose-200/80 rounded-xl text-xs text-rose-900 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold uppercase tracking-wide text-[11px] text-rose-700 flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5 inline" /> Live In-Progress:
                </span>
                <span className="font-black text-slate-900">{liveDialingLeads[0].name}</span>
                <span className="text-slate-400 font-mono">({liveDialingLeads[0].sub.split("|")[0]?.trim() || liveDialingLeads[0].sub})</span>
                <span className="px-2 py-0.5 bg-rose-100/80 text-rose-800 rounded font-bold text-[10px]">
                  Campaign: {liveDialingLeads[0].campaign}
                </span>
                <span className="text-slate-500 text-[11px]">
                  handled by <span className="font-bold text-slate-800">{liveDialingLeads[0].agent}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="text-[11px] font-mono font-black px-2.5 py-1 bg-rose-100 text-rose-800 rounded-md border border-rose-200">
                {liveDialingLeads.length} Live Call{liveDialingLeads.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 font-medium"
                placeholder="Search hopper lead by name, phone, campaign, agent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                value={queue}
                onChange={(e) => setQueue(e.target.value)}
              >
                <option value="">All Queues</option>
                <option value="Live Calling">Live Calling</option>
                <option value="Priority">Priority Queue</option>
                <option value="Callback">Callback Queue</option>
                <option value="General">General Queue</option>
              </select>
            </div>

            <div>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
              >
                <option value="">All Campaigns</option>
                {campaignsList.map((camp) => (
                  <option key={camp.id} value={camp.name}>
                    {camp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Dialing">Dialing</option>
                <option value="In Call">In Call</option>
                <option value="Ready">Ready</option>
                <option value="Call Back">Call Back</option>
                <option value="Waiting">Waiting</option>
              </select>

              <button
                onClick={() => {
                  setSearch("");
                  setQueue("");
                  setCampaign("");
                  setStatus("");
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs shrink-0 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Hopper Leads Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-200 select-none">
                <tr>
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5">Lead / Contact</th>
                  <th className="p-3.5">Campaign</th>
                  <th className="p-3.5">Queue</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Wait Time</th>
                  <th className="p-3.5">Assigned Agent</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {leads.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400">
                      <PhoneForwarded className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-pulse" />
                      <div className="font-bold text-sm text-slate-700">No Leads in Calling Hopper</div>
                      <div className="text-xs text-slate-400 mt-1">
                        Leads from active campaigns and prioritized recycle queues will appear here automatically.
                      </div>
                    </td>
                  </tr>
                )}
                {leads.map((lead) => {
                  const isLiveActive =
                    lead.status === "Dialing" ||
                    lead.status === "In Call" ||
                    lead.status === "Ringing";

                  return (
                    <tr
                      key={lead.id || lead.no}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLiveActive ? "bg-rose-50/25 font-semibold" : ""
                      }`}
                    >
                      <td className="p-3.5 text-center font-black text-indigo-600 font-mono">
                        {lead.no}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isLiveActive
                                ? "bg-rose-100 text-rose-700 ring-2 ring-rose-300"
                                : "bg-indigo-100 text-indigo-700"
                            }`}
                          >
                            {lead.initials}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              {lead.lead_id && !lead.lead_id.startsWith("call-") ? (
                                <Link
                                  href={`/leads/${lead.lead_id}?from=hopper`}
                                  className="hover:text-indigo-600 hover:underline flex items-center gap-1.5 transition-colors"
                                >
                                  <span>{lead.name}</span>
                                </Link>
                              ) : (
                                <span>{lead.name}</span>
                              )}
                              {isLiveActive && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono font-medium">
                              {lead.sub}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <Link
                          href="/campaigns"
                          className="font-semibold text-slate-800 hover:text-indigo-600 hover:underline transition-colors"
                        >
                          {lead.campaign}
                        </Link>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-md border font-bold text-[10px] uppercase ${getQueueBadge(
                            lead.queueCls
                          )}`}
                        >
                          {lead.queue}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`flex items-center gap-1.5 ${getPriorityBadge(lead.priorityCls)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span>{lead.priority}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono font-bold">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{lead.wait}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{lead.agent}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] uppercase tracking-wider ${getStatusBadge(
                            lead.statusCls
                          )}`}
                        >
                          {isLiveActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                          )}
                          <span>{lead.status}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {lead.lead_id && !lead.lead_id.startsWith("call-") ? (
                          <Link
                            href={`/leads/${lead.lead_id}?from=hopper`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-md font-bold text-[11px] transition-colors border border-transparent hover:border-indigo-200"
                          >
                            View
                          </Link>
                        ) : (
                          <Link
                            href="/live-calls"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md font-bold text-[11px] transition-colors border border-rose-200"
                          >
                            Live
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

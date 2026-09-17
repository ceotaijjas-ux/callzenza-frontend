"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  PhoneCall,
  PhoneIncoming,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface TenantAnalyticsResponse {
  tenant_id: string;
  tenant_name: string;
  time_range: string;
  total_calls: number;
  completed_calls: number;
  failed_calls: number;
  total_call_duration_minutes: number;
  total_leads: number;
  qualified_leads: number;
  active_agents: number;
  call_volume_trends: Array<{ date: string; calls: number }>;
}

export default function SuperAdminTenantAnalyticsPage() {
  const params = useParams();
  const tenantId = params.id as string;

  const [data, setData] = useState<TenantAnalyticsResponse | null>(null);
  const [timeRange, setTimeRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<TenantAnalyticsResponse>(
        `/api/super-admin/tenants/${tenantId}/analytics?time_range=${timeRange}`
      );
      setData(res);
    } catch (err: any) {
      console.error("Tenant analytics error:", err);
      setError(err?.message || "Failed to load tenant analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [tenantId, timeRange]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-xs">Computing tenant telemetry &amp; analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900/50 text-rose-400 text-xs">
          {error || "Tenant analytics unavailable"}
        </div>
        <Link href={`/super-admin/tenants/${tenantId}`}>
          <Button variant="outline" className="text-xs bg-slate-900 border-slate-800">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Tenant Dossier
          </Button>
        </Link>
      </div>
    );
  }

  const completionRate =
    data.total_calls > 0
      ? Math.round((data.completed_calls / data.total_calls) * 100)
      : 0;

  const qualRate =
    data.total_leads > 0
      ? Math.round((data.qualified_leads / data.total_leads) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={`/super-admin/tenants/${tenantId}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors font-semibold group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Tenant Dossier</span>
        </Link>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          {["7d", "30d", "month", "all"].map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                timeRange === r
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {r === "7d"
                ? "Last 7 Days"
                : r === "30d"
                ? "Last 30 Days"
                : r === "month"
                ? "This Month"
                : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">{data.tenant_name}</h1>
              <span className="text-xs text-slate-400 font-mono">({data.tenant_id.slice(0, 13)}...)</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live engagement, qualification, and voice telemetry records.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calls */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Calls Logged</span>
          <div className="text-2xl font-black text-white">{data.total_calls}</div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Completed: <strong className="text-emerald-400">{data.completed_calls}</strong></span>
            <span>Failed: <strong className="text-rose-400">{data.failed_calls}</strong></span>
          </div>
        </div>

        {/* Total Duration */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Talk Time</span>
          <div className="text-2xl font-black text-blue-400">{data.total_call_duration_minutes} min</div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            Completion Rate: <strong className="text-indigo-400">{completionRate}%</strong>
          </div>
        </div>

        {/* Leads */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Leads Ingested</span>
          <div className="text-2xl font-black text-white">{data.total_leads}</div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            Qualified: <strong className="text-emerald-400">{data.qualified_leads}</strong> ({qualRate}%)
          </div>
        </div>

        {/* Active Agents */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Voice Agents</span>
          <div className="text-2xl font-black text-purple-300">{data.active_agents}</div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            Deployed AI Phone Agents
          </div>
        </div>
      </div>

      {/* Call Volume Trend Bar Chart */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Call Volume Activity Trend</h3>
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-4 items-end h-44">
          {data.call_volume_trends.map((point, i) => {
            const maxCalls = Math.max(...data.call_volume_trends.map((p) => p.calls), 1);
            const heightPct = Math.max(Math.round((point.calls / maxCalls) * 100), 8);
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {point.calls}
                </div>
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full bg-indigo-600/80 hover:bg-indigo-500 rounded-t-lg transition-all"
                />
                <span className="text-[9px] text-slate-500 truncate w-full text-center">{point.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

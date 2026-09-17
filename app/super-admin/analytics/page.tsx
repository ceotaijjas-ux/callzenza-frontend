"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  PhoneCall,
  Users,
  Building2,
  HardDrive,
  CreditCard,
  TrendingUp,
  Clock,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface SuperAdminAnalyticsResponse {
  time_range: string;
  total_calls: number;
  completed_calls: number;
  failed_calls: number;
  total_call_duration_seconds: number;
  total_call_duration_minutes: number;
  total_leads: number;
  qualified_leads: number;
  active_voice_agents: number;
  total_tenants: number;
  tenant_growth: Array<{ date: string; count: number }>;
  subscription_distribution: Array<{ name: string; value: number }>;
  storage_distribution: Array<{ category: string; percentage: number }>;
  call_volume_trends: Array<{ date: string; calls: number }>;
}

export default function SuperAdminAnalyticsPage() {
  const [data, setData] = useState<SuperAdminAnalyticsResponse | null>(null);
  const [timeRange, setTimeRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<SuperAdminAnalyticsResponse>(
        `/api/super-admin/analytics?time_range=${timeRange}`
      );
      setData(res);
    } catch (err: any) {
      console.error("Platform analytics error:", err);
      setError(err?.message || "Failed to query platform analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const completionRate =
    data && data.total_calls > 0
      ? Math.round((data.completed_calls / data.total_calls) * 100)
      : 0;

  const qualRate =
    data && data.total_leads > 0
      ? Math.round((data.qualified_leads / data.total_leads) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Platform-Wide Intelligence &amp; Analytics</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7C5CFF]/20 text-[#C9BEFF] border border-[#7C5CFF]/40 shrink-0 shadow-sm shadow-[#7C5CFF]/20">
              Aggregated Metrics
            </span>
          </div>
          <p className="text-xs text-[#9096AC] mt-1 max-w-2xl">
            Global call completion, lead progression, storage allocation, and tenant trajectory across all deployments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {["today", "7d", "30d", "month", "all"].map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                timeRange === r
                  ? "bg-gradient-to-r from-[#7C5CFF] to-[#3B6EF6] text-white shadow-lg shadow-[#7C5CFF]/30 border border-[#C9BEFF]/30"
                  : "bg-[#10132A] text-[#9096AC] hover:text-white hover:border-[#7C5CFF]/40 border border-[#1E2555]"
              }`}
            >
              {r === "today"
                ? "Today"
                : r === "7d"
                ? "Last 7 Days"
                : r === "30d"
                ? "Last 30 Days"
                : r === "month"
                ? "This Month"
                : "All Time"}
            </button>
          ))}
          <Button
            onClick={fetchAnalytics}
            disabled={loading}
            variant="outline"
            size="sm"
            className="bg-[#10132A] border-[#1E2555] text-[#9096AC] hover:text-white hover:border-[#7C5CFF]/40 text-xs gap-1 shrink-0 h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#7C5CFF]" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-900/50 rounded-2xl text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Main KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calls */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#10132A]/85 border border-[#1E2555] hover:border-[#7C5CFF]/40 space-y-2 transition-all shadow-md shadow-[#0A0E2E]/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9096AC]">Total Calls Logged</span>
            <div className="p-2 rounded-xl bg-[#3B6EF6]/15 text-[#5B8DF7] border border-[#3B6EF6]/30 shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{data?.total_calls.toLocaleString() ?? 0}</div>
          <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-[#9096AC] pt-1 border-t border-[#1E2555]">
            <span>Completed: <strong className="text-[#4ADE80]">{data?.completed_calls ?? 0}</strong></span>
            <span>Failed: <strong className="text-[#EF5B5B]">{data?.failed_calls ?? 0}</strong></span>
          </div>
        </div>

        {/* Duration */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#10132A]/85 border border-[#1E2555] hover:border-[#7C5CFF]/40 space-y-2 transition-all shadow-md shadow-[#0A0E2E]/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9096AC]">Total Talk Time</span>
            <div className="p-2 rounded-xl bg-[#7C5CFF]/15 text-[#C9BEFF] border border-[#7C5CFF]/30 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#8FB3FF]">
            {data?.total_call_duration_minutes ?? 0} min
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-[#9096AC] pt-1 border-t border-[#1E2555]">
            <span>Completion:</span>
            <span className="font-bold text-[#C9BEFF]">{completionRate}%</span>
          </div>
        </div>

        {/* Leads */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#10132A]/85 border border-[#1E2555] hover:border-[#7C5CFF]/40 space-y-2 transition-all shadow-md shadow-[#0A0E2E]/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9096AC]">Global Leads Ingested</span>
            <div className="p-2 rounded-xl bg-[#5B8DF7]/15 text-[#8FB3FF] border border-[#5B8DF7]/30 shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{data?.total_leads.toLocaleString() ?? 0}</div>
          <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-[#9096AC] pt-1 border-t border-[#1E2555]">
            <span>Qualified: <strong className="text-[#4ADE80]">{data?.qualified_leads ?? 0}</strong></span>
            <span>Rate: <strong className="text-[#C9BEFF]">{qualRate}%</strong></span>
          </div>
        </div>

        {/* Tenants & Agents */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#10132A]/85 border border-[#1E2555] hover:border-[#7C5CFF]/40 space-y-2 transition-all shadow-md shadow-[#0A0E2E]/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9096AC]">Active Entities</span>
            <div className="p-2 rounded-xl bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{data?.total_tenants ?? 0}</div>
          <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-[#9096AC] pt-1 border-t border-[#1E2555]">
            <span>Voice Agents:</span>
            <span className="font-bold text-[#F5A623]">{data?.active_voice_agents ?? 0} deployed</span>
          </div>
        </div>
      </div>

      {/* Call Volume Trends Chart */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#10132A]/85 border border-[#1E2555] space-y-4 shadow-md shadow-[#0A0E2E]/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white">Call Volume Activity (Selected Range)</h3>
          <span className="text-xs text-[#7C5CFF] font-mono">Normalized interval</span>
        </div>
        <div className="pt-4 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="flex items-end gap-1.5 sm:gap-2 h-44 min-w-[500px] sm:min-w-0 w-full">
            {data?.call_volume_trends.map((point, i) => {
              const maxCalls = Math.max(...(data?.call_volume_trends.map((p) => p.calls) || [1]), 1);
              const heightPct = Math.max(Math.round((point.calls / maxCalls) * 100), 8);
              return (
                <div key={i} className="flex-1 min-w-[24px] sm:min-w-0 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="text-[9px] text-[#C9BEFF] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {point.calls}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-gradient-to-t from-[#5B3FE0] via-[#7C5CFF] to-[#8FB3FF] hover:brightness-125 rounded-t-lg transition-all shadow-sm shadow-[#7C5CFF]/25"
                  />
                  <span className="text-[9px] text-[#9096AC] font-mono truncate w-full text-center">{point.date}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Distributions (Subscription and Storage) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Subscription Distribution */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#10132A]/85 border border-[#1E2555] space-y-4 shadow-md shadow-[#0A0E2E]/40">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <CreditCard className="w-4 h-4 text-[#7C5CFF] shrink-0" />
            <span className="truncate">Subscription Tier Distribution</span>
          </div>
          <div className="space-y-3">
            {data?.subscription_distribution.map((sub, i) => {
              const totalSubs = data.subscription_distribution.reduce((acc, x) => acc + x.value, 0) || 1;
              const pct = Math.round((sub.value / totalSubs) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs gap-2">
                    <span className="text-slate-300 font-medium truncate">{sub.name}</span>
                    <span className="font-mono text-[#C9BEFF] shrink-0">
                      {sub.value} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#0A0E2E] border border-[#1E2555] overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-[#7C5CFF] to-[#3B6EF6] rounded-full shadow-sm shadow-[#7C5CFF]/25" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Storage Distribution */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#10132A]/85 border border-[#1E2555] space-y-4 shadow-md shadow-[#0A0E2E]/40">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <HardDrive className="w-4 h-4 text-[#3B6EF6] shrink-0" />
            <span className="truncate">Storage Allocation by Category</span>
          </div>
          <div className="space-y-3">
            {data?.storage_distribution.map((st, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs gap-2">
                  <span className="text-slate-300 font-medium truncate">{st.category}</span>
                  <span className="font-mono text-[#8FB3FF] shrink-0">{st.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#0A0E2E] border border-[#1E2555] overflow-hidden">
                  <div
                    style={{ width: `${st.percentage}%` }}
                    className="h-full bg-gradient-to-r from-[#3B6EF6] to-[#5B8DF7] rounded-full shadow-sm shadow-[#3B6EF6]/25"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

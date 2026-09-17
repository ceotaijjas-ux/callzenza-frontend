"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  PhoneCall,
  HardDrive,
  CreditCard,
  TrendingUp,
  Server,
  Activity,
  ArrowRight,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardMetrics {
  total_tenants: number;
  super_admin_created_tenants: number;
  self_registered_tenants: number;
  active_tenants: number;
  inactive_tenants: number;
  total_voice_agents: number;
  total_calls: number;
  total_call_minutes: number;
  total_storage_used_bytes: number;
  total_storage_used_formatted: string;
  active_subscriptions: number;
  mrr_formatted: string;
  mrr_cents: number;
  server_health: {
    api_status: string;
    db_status: string;
    cpu_percent: number;
    memory_percent: number;
    uptime: string;
  };
}

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  registration_source: string;
  subscription_plan: string;
  is_active: boolean;
  user_count: number;
  created_at: string;
}

export default function SuperAdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTenants, setRecentTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashData, tenantsData] = await Promise.all([
        apiFetch<DashboardMetrics>("/api/super-admin/dashboard"),
        apiFetch<{ tenants: TenantItem[] }>("/api/super-admin/tenants?page=1&limit=5"),
      ]);
      setMetrics(dashData);
      setRecentTenants(tenantsData?.tenants || []);
    } catch (err: any) {
      console.error("Dashboard error:", err);
      setError(err?.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              CallZenza Super Admin Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Live Production
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Monitor tenants, platform usage, server health, and subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchDashboardData}
            disabled={loading}
            className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            Refresh Telemetry
          </Button>

          <Link href="/super-admin/tenants">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5 shadow-lg shadow-indigo-600/30">
              <Building2 className="w-3.5 h-3.5" />
              Manage Tenants
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-900/50 rounded-2xl text-rose-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchDashboardData} className="text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tenants */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tenants</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {loading ? "..." : metrics?.total_tenants ?? 0}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">registered orgs</span>
          </div>
          <div className="flex items-center gap-2 pt-1 text-[11px] border-t border-slate-800/60 text-slate-400">
            <span className="text-indigo-400 font-semibold">{metrics?.super_admin_created_tenants ?? 0} Admin</span>
            <span>•</span>
            <span className="text-purple-400 font-semibold">{metrics?.self_registered_tenants ?? 0} Self-Serve</span>
          </div>
        </div>

        {/* Active vs Inactive */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tenants</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">
              {loading ? "..." : metrics?.active_tenants ?? 0}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">live active</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-800/60 text-slate-400">
            <span>Suspended:</span>
            <span className="font-bold text-amber-400">{metrics?.inactive_tenants ?? 0}</span>
          </div>
        </div>

        {/* Total Calls & Minutes */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Calls</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {loading ? "..." : metrics?.total_calls?.toLocaleString() ?? 0}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">calls handled</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-800/60 text-slate-400">
            <span>Duration:</span>
            <span className="font-bold text-blue-400">{metrics?.total_call_minutes ?? 0} mins</span>
          </div>
        </div>

        {/* Total Storage Used */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Application Storage</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-300">
              {loading ? "..." : metrics?.total_storage_used_formatted ?? "0 KB"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-800/60 text-slate-400">
            <span>Files & RAG Docs</span>
            <Link href="/super-admin/storage" className="text-indigo-400 hover:underline">
              Inspect →
            </Link>
          </div>
        </div>

        {/* Active Voice Agents */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Voice Agents</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {loading ? "..." : metrics?.total_voice_agents ?? 0}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">deployed models</span>
          </div>
          <div className="text-[11px] border-t border-slate-800/60 pt-1 text-slate-400">
            Autonomous Voice Assistants
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscriptions</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {loading ? "..." : metrics?.active_subscriptions ?? 0}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">active plans</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-800/60 text-slate-400">
            <span>Plans:</span>
            <Link href="/super-admin/subscriptions" className="text-indigo-400 hover:underline">
              Manage tiers →
            </Link>
          </div>
        </div>

        {/* Monthly Recurring Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3 sm:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Platform MRR (Active Subscriptions)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">
              {loading ? "..." : metrics?.mrr_formatted || "$0.00"}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ month recurring</span>
          </div>
          <div className="text-[11px] border-t border-slate-800/60 pt-1 text-slate-400">
            Computed strictly from active enterprise &amp; pro tenant billing records.
          </div>
        </div>
      </div>

      {/* Real Server Health Bar */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">System Telemetry &amp; Resource Usage</h3>
              <p className="text-xs text-slate-400">Actual live metrics from FastAPI &amp; Database</p>
            </div>
          </div>
          <Link href="/super-admin/server-status">
            <Button variant="ghost" size="sm" className="text-xs text-indigo-400 hover:text-indigo-300 gap-1">
              Detailed Server Diagnostics <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">API Status</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200">
                {metrics?.server_health?.api_status || "Online"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Database Engine</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200">
                {metrics?.server_health?.db_status || "Connected"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Host CPU Load</span>
            <div className="text-xs font-bold text-slate-200">
              {metrics?.server_health?.cpu_percent ?? 0}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Uptime</span>
            <div className="text-xs font-bold text-slate-200">
              {metrics?.server_health?.uptime || "Running"}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tenants Table Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Organizations</h3>
            <p className="text-xs text-slate-400">Latest tenants registered on the platform</p>
          </div>
          <Link href="/super-admin/tenants" className="text-xs font-semibold text-indigo-400 hover:underline">
            View All Tenants ({metrics?.total_tenants ?? 0}) →
          </Link>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Organization</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Owner / Email</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Registration</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Plan</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Status</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {loading ? "Loading organizations..." : "No organizations registered yet."}
                  </td>
                </tr>
              ) : (
                recentTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">{tenant.name}</div>
                      <div className="font-mono text-[10px] text-indigo-400">{tenant.slug}.callzenza.com</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 font-medium">{tenant.owner_email || "System"}</div>
                      <div className="text-[10px] text-slate-400">{tenant.user_count} team members</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          tenant.registration_source === "SELF_REGISTERED"
                            ? "bg-purple-950/60 text-purple-300 border border-purple-800/50"
                            : "bg-indigo-950/60 text-indigo-300 border border-indigo-800/50"
                        }`}
                      >
                        {tenant.registration_source === "SELF_REGISTERED" ? "Self-Serve" : "Super Admin"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-200">{tenant.subscription_plan}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tenant.is_active
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                            : "bg-amber-950/60 text-amber-400 border border-amber-800/50"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${tenant.is_active ? "bg-emerald-400" : "bg-amber-400"}`} />
                        {tenant.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/super-admin/tenants/${tenant.id}`}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

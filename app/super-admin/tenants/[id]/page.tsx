"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Copy,
  CheckCircle2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  CreditCard,
  Settings,
  HardDrive,
  PhoneCall,
  Users,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Mail,
  Lock,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface TenantDetailResponse {
  tenant: {
    id: string;
    name: string;
    slug: string;
    subdomain: string;
    industry: string;
    status: string;
    is_active: boolean;
    current_plan: string;
    wallet_balance: number;
    cluster_id: string;
    isolation_strategy: string;
    created_at: string;
    updated_at: string;
  };
  owner: {
    name: string;
    email: string;
    is_verified: boolean;
  };
  stats: {
    total_calls: number;
    total_call_minutes: number;
    total_leads: number;
    qualified_leads: number;
    voice_agents: number;
    storage_used_bytes: number;
    storage_used_formatted: string;
  };
  configuration: {
    server_url?: string;
    database_url_masked?: string;
    permissions?: Record<string, boolean>;
  };
}

export default function SuperAdminTenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [data, setData] = useState<TenantDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchTenantDetails = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<TenantDetailResponse>(`/api/super-admin/tenants/${tenantId}`);
      setData(res);
    } catch (err: any) {
      console.error("Tenant detail error:", err);
      setError(err?.message || "Failed to load tenant details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantDetails();
  }, [tenantId]);

  const handleCopyId = () => {
    if (!tenantId) return;
    navigator.clipboard.writeText(tenantId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleStatus = async () => {
    if (!data) return;
    const nextStatus = !data.tenant.is_active;
    try {
      await apiFetch(`/api/super-admin/tenants/${tenantId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: nextStatus }),
      });
      setData({
        ...data,
        tenant: { ...data.tenant, is_active: nextStatus },
      });
    } catch (err: any) {
      setError(err?.message || "Failed to update tenant status");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-xs">Loading tenant dossier &amp; telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900/50 text-rose-400 text-xs">
          {error || "Tenant not found"}
        </div>
        <Link href="/super-admin/tenants">
          <Button variant="outline" className="text-xs bg-slate-900 border-slate-800">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Tenants List
          </Button>
        </Link>
      </div>
    );
  }

  const { tenant, owner, stats, configuration } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/super-admin/tenants"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors font-semibold group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Tenants List</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/super-admin/tenants/${tenant.id}/analytics`}>
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-900 border-slate-800 text-indigo-400 hover:text-white text-xs gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Tenant Analytics
            </Button>
          </Link>
          <Link href={`/super-admin/tenants/${tenant.id}/billing`}>
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-900 border-slate-800 text-teal-400 hover:text-white text-xs gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" /> Billing &amp; Usage
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Tenant Banner Card */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
            {tenant.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black text-white">{tenant.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  tenant.is_active
                    ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                    : "bg-amber-950/60 text-amber-400 border border-amber-800/50"
                }`}
              >
                {tenant.is_active ? "Active Organization" : "Suspended"}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {tenant.current_plan}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
              <span className="font-mono text-indigo-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {tenant.subdomain || tenant.slug}.callzenza.com
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                ID: {tenant.id.slice(0, 16)}...
                <button onClick={handleCopyId} className="hover:text-indigo-400 cursor-pointer ml-1">
                  <Copy className="w-3 h-3" />
                </button>
                {copied && <span className="text-emerald-400 text-[10px] font-bold">Copied!</span>}
              </span>
              <span className="text-[11px]">Cluster: <strong>{tenant.cluster_id}</strong></span>
              <span className="text-[11px] text-purple-400">({tenant.isolation_strategy})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={handleToggleStatus}
            variant="outline"
            className={`text-xs font-semibold gap-1.5 ${
              tenant.is_active
                ? "border-amber-900/50 text-amber-400 bg-amber-950/30 hover:bg-amber-900/50"
                : "border-emerald-900/50 text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/50"
            }`}
          >
            {tenant.is_active ? (
              <>
                <ToggleRight className="w-4 h-4 text-amber-400" /> Suspend Tenant
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-emerald-400" /> Activate Tenant
              </>
            )}
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid for this tenant */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Calls Handled</span>
          <div className="text-2xl font-black text-white">{stats.total_calls}</div>
          <div className="text-[11px] text-slate-400">{stats.total_call_minutes} minutes logged</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Leads</span>
          <div className="text-2xl font-black text-white">{stats.total_leads}</div>
          <div className="text-[11px] text-emerald-400 font-semibold">{stats.qualified_leads} qualified</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Voice Agents</span>
          <div className="text-2xl font-black text-white">{stats.voice_agents}</div>
          <div className="text-[11px] text-slate-400">Active assistants</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Storage Consumed</span>
          <div className="text-2xl font-black text-purple-300">{stats.storage_used_formatted}</div>
          <div className="text-[11px] text-slate-400">Knowledge-base &amp; CSV files</div>
        </div>
      </div>

      {/* Technical Configuration & Owner Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Owner Information */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Organization Owner</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Owner Name:</span>
              <span className="font-semibold text-slate-200">{owner.name || "Default Administrator"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Contact Email:</span>
              <span className="font-mono text-indigo-400">{owner.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Email Verified:</span>
              <span className={`font-bold ${owner.is_verified ? "text-emerald-400" : "text-amber-400"}`}>
                {owner.is_verified ? "Verified ✓" : "Pending Verification"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Provisioned On:</span>
              <span className="text-slate-300">{new Date(tenant.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Database & Infrastructure */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Data Boundary &amp; Storage</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Isolation Strategy:</span>
              <span className="font-semibold text-slate-200">{tenant.isolation_strategy}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Server Cluster:</span>
              <span className="font-mono text-slate-300">{tenant.cluster_id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Database Connection:</span>
              <span className="font-mono text-slate-400">
                {configuration.database_url_masked || "Configured in Cluster Pool"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Wallet Balance:</span>
              <span className="font-mono font-bold text-emerald-400">${tenant.wallet_balance?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

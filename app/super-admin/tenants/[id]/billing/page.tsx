"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface TenantBillingResponse {
  tenant_id: string;
  tenant_name: string;
  current_plan: string;
  subscription_status: string;
  billing_cycle: string;
  start_date?: string;
  renewal_date?: string;
  wallet_balance: number;
  limits: {
    max_agents: number;
    max_calls: number;
    max_minutes: number;
    max_leads: number;
    max_storage_mb: number;
  };
  usage: {
    agents_used: number;
    calls_used: number;
    minutes_used: number;
    leads_used: number;
    storage_used_mb: number;
  };
  invoices: Array<{
    id: string;
    invoice_number: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  }>;
}

export default function SuperAdminTenantBillingPage() {
  const params = useParams();
  const tenantId = params.id as string;

  const [data, setData] = useState<TenantBillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBilling = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<TenantBillingResponse>(
        `/api/super-admin/tenants/${tenantId}/billing`
      );
      setData(res);
    } catch (err: any) {
      console.error("Billing fetch error:", err);
      setError(err?.message || "Failed to load billing records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
        <p className="text-xs">Accessing ledger &amp; quota metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900/50 text-rose-400 text-xs">
          {error || "Billing records unavailable"}
        </div>
        <Link href={`/super-admin/tenants/${tenantId}`}>
          <Button variant="outline" className="text-xs bg-slate-900 border-slate-800">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Tenant Dossier
          </Button>
        </Link>
      </div>
    );
  }

  const { limits, usage } = data;

  const renderUsageBar = (
    label: string,
    used: number,
    max: number,
    unit: string = ""
  ) => {
    const pct = max > 0 ? Math.min(Math.round((used / max) * 100), 100) : 0;
    const isHigh = pct >= 90;
    const isMed = pct >= 70;

    return (
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold">{label}</span>
          <span className="font-mono text-slate-200">
            <strong>{used.toLocaleString()}</strong> / {max === 0 || max === 999999 ? "Unlimited" : max.toLocaleString()}{" "}
            {unit}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            style={{ width: `${pct}%` }}
            className={`h-full rounded-full transition-all ${
              isHigh
                ? "bg-rose-500"
                : isMed
                ? "bg-amber-500"
                : "bg-indigo-500"
            }`}
          />
        </div>
        <div className="flex justify-end text-[10px] text-slate-500 font-mono">{pct}% allocated</div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/super-admin/tenants/${tenantId}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors font-semibold group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Tenant Dossier</span>
        </Link>
      </div>

      {/* Plan & Subscription Card */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-white">{data.tenant_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {data.current_plan}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                {data.subscription_status}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Billing Cadence: <strong className="text-slate-200 uppercase">{data.billing_cycle}</strong>
            </p>
          </div>
        </div>

        <div className="text-left md:text-right space-y-1 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Prepaid Wallet Balance</div>
          <div className="text-2xl font-black text-emerald-400">
            ${data.wallet_balance?.toFixed(2) || "0.00"}
          </div>
        </div>
      </div>

      {/* Quotas & Resource Consumption */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white">Tier Quotas vs. Real Consumption</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderUsageBar("Voice Agents Deployed", usage.agents_used, limits.max_agents, "agents")}
          {renderUsageBar("Calls Handled", usage.calls_used, limits.max_calls, "calls")}
          {renderUsageBar("Talk Minutes Logged", usage.minutes_used, limits.max_minutes, "mins")}
          {renderUsageBar("Leads Ingested", usage.leads_used, limits.max_leads, "leads")}
          {renderUsageBar("Application Storage", usage.storage_used_mb, limits.max_storage_mb, "MB")}
        </div>
      </div>

      {/* Invoice History */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white">Invoice Ledger</h3>
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Billing Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4 text-right">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.invoices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No custom invoices issued for this tenant. (Subscription managed through platform tier rules)
                  </td>
                </tr>
              ) : (
                data.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-slate-300 font-semibold">{inv.invoice_number}</td>
                    <td className="py-3 px-4 text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-bold text-white">${inv.amount?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                        {inv.status}
                      </span>
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

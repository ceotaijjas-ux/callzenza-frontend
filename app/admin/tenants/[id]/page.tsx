"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import {
  ArrowLeft,
  Building2,
  PhoneCall,
  Clock,
  Users,
  CheckCircle2,
  Play,
  Bot,
  CreditCard,
  Layers,
  ShieldCheck,
  RefreshCw,
  Copy,
  ExternalLink,
  Plus,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  BarChart3,
  Calendar,
  DollarSign,
  AlertCircle
} from "lucide-react";

interface TenantDetailsData {
  tenant: {
    id: string;
    name: string;
    slug: string;
    subdomain: string;
    custom_domain?: string | null;
    status: string;
    is_active: boolean;
    cluster_id: string;
    server_url?: string | null;
    region: string;
    isolation_strategy: string;
    industry: string;
    created_at: string;
    permissions: Record<string, boolean>;
  };
  pricing: {
    current_plan: string;
    wallet_balance: number;
    billing_company_name?: string;
    billing_email?: string;
    billing_tax_id?: string;
    invoices: Array<{
      id: string;
      invoice_number: string;
      date: string;
      description: string;
      amount: string;
      status: string;
    }>;
    available_plans: Array<{
      name: string;
      price: string;
      minutes_included: number;
      concurrent_calls: number;
      ai_agents: number;
      features: string[];
    }>;
  };
  analytics: {
    total_calls: number;
    total_call_minutes: number;
    total_leads: number;
    qualified_leads: number;
    qualification_rate: number;
    total_campaigns: number;
    active_campaigns: number;
    total_users: number;
    total_agents: number;
  };
  users: Array<{
    id: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
    email_verified: boolean;
  }>;
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // Guard: Only Super Admin can access Tenancy details
  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN" && user.email !== "admin@callzenza.com") {
      router.replace("/admin");
    }
  }, [user, router]);

  const [data, setData] = useState<TenantDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analytics" | "pricing" | "infrastructure" | "users">("analytics");
  const [copied, setCopied] = useState(false);

  // Plan switch & wallet top-up state
  const [switchingPlan, setSwitchingPlan] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");
  const [addingBalance, setAddingBalance] = useState(false);

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<TenantDetailsData>(`/api/businesses/${id}/details`);
      setData(res);
    } catch (err: any) {
      console.error("Failed to load tenant details:", err);
      setError(err?.message || "Failed to load tenant organization details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchPlan = async (planName: string) => {
    if (!data) return;
    setSwitchingPlan(true);
    setError(null);
    try {
      const res = await apiFetch<{ message: string; current_plan: string; wallet_balance: number }>(
        `/api/businesses/${id}/plan`,
        {
          method: "PATCH",
          body: JSON.stringify({ current_plan: planName }),
        }
      );
      setData((prev) =>
        prev
          ? {
              ...prev,
              pricing: {
                ...prev.pricing,
                current_plan: res.current_plan,
                wallet_balance: res.wallet_balance,
              },
            }
          : null
      );
      setSuccess(`Successfully updated tenant plan to "${res.current_plan}"`);
    } catch (err: any) {
      setError(err?.message || "Failed to switch plan");
    } finally {
      setSwitchingPlan(false);
    }
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !balanceInput) return;
    const amount = parseFloat(balanceInput);
    if (isNaN(amount) || amount <= 0) return;
    setAddingBalance(true);
    setError(null);
    try {
      const res = await apiFetch<{ message: string; current_plan: string; wallet_balance: number }>(
        `/api/businesses/${id}/plan`,
        {
          method: "PATCH",
          body: JSON.stringify({
            current_plan: data.pricing.current_plan,
            add_balance: amount,
          }),
        }
      );
      setData((prev) =>
        prev
          ? {
              ...prev,
              pricing: {
                ...prev.pricing,
                wallet_balance: res.wallet_balance,
              },
            }
          : null
      );
      setBalanceInput("");
      setSuccess(`Added $${amount.toFixed(2)} to tenant wallet balance!`);
    } catch (err: any) {
      setError(err?.message || "Failed to add balance");
    } finally {
      setAddingBalance(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!data) return;
    const nextStatus = !data.tenant.is_active;
    try {
      await apiFetch(`/api/businesses/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: nextStatus }),
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              tenant: {
                ...prev.tenant,
                is_active: nextStatus,
                status: nextStatus ? "active" : "suspended",
              },
            }
          : null
      );
      setSuccess(`Tenant status updated to ${nextStatus ? "Active" : "Suspended"}`);
    } catch (err: any) {
      setError(err?.message || "Failed to update status");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-slate-500 font-medium text-sm">Loading tenant pricing &amp; analytics...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="p-8 max-w-4xl mx-auto space-y-6">
          <Link
            href="/admin/tenants"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tenants
          </Link>
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              Tenant Not Found or Error Loading Details
            </h3>
            <p className="text-sm">{error || "Could not retrieve tenant data."}</p>
            <Button onClick={fetchDetails} className="bg-rose-600 text-white hover:bg-rose-500">
              Try Again
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const { tenant, pricing, analytics, users: tenantUsers } = data;

  return (
    <AppShell>
      <div className="space-y-8 w-full max-w-[1700px] mx-auto p-2">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4">
          <Link
            href="/admin/tenants"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tenants List
          </Link>

          {/* Top Banner Card */}
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                {tenant.name.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {tenant.name}
                  </h1>

                  {/* Status Badge */}
                  {tenant.status === "pending_verification" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Pending Verification
                    </span>
                  ) : tenant.is_active ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      Suspended
                    </span>
                  )}

                  {/* Current Plan Badge */}
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Sparkles className="w-3.5 h-3.5" />
                    {pricing.current_plan}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                  <span className="font-mono text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100 font-semibold">
                    {tenant.subdomain || tenant.slug}.callzenza.com
                  </span>
                  <span className="flex items-center gap-1 font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    ID: {tenant.id.slice(0, 13)}...
                    <button
                      onClick={() => handleCopyId(tenant.id)}
                      className="hover:text-indigo-600 transition-colors cursor-pointer"
                      title="Copy Full ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copied && <span className="text-emerald-600 font-bold ml-1">Copied!</span>}
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-medium">
                    Cluster: <strong>{tenant.cluster_id}</strong>
                  </span>
                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-medium">
                    {tenant.isolation_strategy}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={handleToggleStatus}
                className={`gap-1.5 font-semibold text-xs py-2 px-3.5 rounded-xl border transition-all cursor-pointer ${
                  tenant.is_active
                    ? "text-amber-700 bg-amber-50/80 border-amber-200 hover:bg-amber-100"
                    : "text-emerald-700 bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                {tenant.is_active ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-amber-600" /> Suspend Tenant
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-emerald-600" /> Activate Tenant
                  </>
                )}
              </Button>

              <Button
                onClick={fetchDetails}
                variant="outline"
                className="gap-2 border-slate-200 hover:bg-slate-50 font-medium text-xs py-2 px-3.5 rounded-xl cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)}>✕</button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics &amp; Usage
          </button>

          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === "pricing"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Pricing &amp; Plans
          </button>

          <button
            onClick={() => setActiveTab("infrastructure")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === "infrastructure"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            Infrastructure &amp; Isolation
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            Team Members ({tenantUsers.length})
          </button>
        </div>

        {/* TAB 1: ANALYTICS & USAGE */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            {/* Top 6 KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Calls</span>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{analytics.total_calls.toLocaleString()}</div>
                <div className="text-[11px] text-slate-500 font-medium">Across all outbound/inbound</div>
              </Card>

              <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Talk Time</span>
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{analytics.total_call_minutes} min</div>
                <div className="text-[11px] text-slate-500 font-medium">Billed talk time duration</div>
              </Card>

              <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Leads</span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{analytics.total_leads.toLocaleString()}</div>
                <div className="text-[11px] text-slate-500 font-medium">Contact pool in hopper</div>
              </Card>

              <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Qualified Leads</span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600">{analytics.qualified_leads.toLocaleString()}</div>
                <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <span className="text-emerald-600 font-bold">{analytics.qualification_rate}%</span> conversion
                </div>
              </Card>

              <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Campaigns</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Play className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{analytics.total_campaigns}</div>
                <div className="text-[11px] text-blue-600 font-bold">{analytics.active_campaigns} currently active</div>
              </Card>

              <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">AI Voice Agents</span>
                  <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                    <Bot className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{analytics.total_agents}</div>
                <div className="text-[11px] text-slate-500 font-medium">Configured autonomous agents</div>
              </Card>
            </div>

            {/* Performance Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white border-slate-200 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Lead Qualification &amp; Conversion Health
                </h3>
                <p className="text-xs text-slate-500">
                  Measures the percentage of uploaded contacts successfully qualified by voice agents or supervisors.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Qualification Conversion Rate</span>
                    <span className="text-indigo-600 font-bold">{analytics.qualification_rate}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(analytics.qualification_rate, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-xs text-slate-400 font-medium">Qualified Leads</div>
                    <div className="text-xl font-extrabold text-emerald-600 mt-1">{analytics.qualified_leads}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-xs text-slate-400 font-medium">Total Pool</div>
                    <div className="text-xl font-extrabold text-slate-800 mt-1">{analytics.total_leads}</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <Play className="w-4 h-4 text-indigo-600" />
                  Campaign Execution Velocity
                </h3>
                <p className="text-xs text-slate-500">
                  Live state of outbound dialing campaigns, active dialing hoppers, and lead distribution.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Active Campaign Saturation</span>
                    <span className="text-blue-600 font-bold">
                      {analytics.total_campaigns > 0
                        ? Math.round((analytics.active_campaigns / analytics.total_campaigns) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          analytics.total_campaigns > 0
                            ? Math.min((analytics.active_campaigns / analytics.total_campaigns) * 100, 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-xs text-slate-400 font-medium">Active Campaigns</div>
                    <div className="text-xl font-extrabold text-blue-600 mt-1">{analytics.active_campaigns}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-xs text-slate-400 font-medium">Total Configured</div>
                    <div className="text-xl font-extrabold text-slate-800 mt-1">{analytics.total_campaigns}</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: PRICING & PLANS */}
        {activeTab === "pricing" && (
          <div className="space-y-8">
            {/* Wallet & Plan Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Current Plan</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      Active
                    </span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white">{pricing.current_plan}</h2>
                    <p className="text-xs text-indigo-300 mt-1">Multi-Tenant Quota &amp; Rate Limits Enabled</p>
                  </div>
                  <div className="pt-2 border-t border-indigo-800/80 text-xs text-indigo-300 flex justify-between">
                    <span>Billing Contact:</span>
                    <span className="font-semibold text-white">{pricing.billing_email || tenant.name}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Wallet Balance</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    ${pricing.wallet_balance.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-400">Automated telephony, DID and model deduction balance</p>
                </div>

                <form onSubmit={handleAddBalance} className="flex gap-2 pt-2 border-t border-slate-100">
                  <Input
                    placeholder="Amount ($)"
                    type="number"
                    step="5"
                    min="1"
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <Button
                    type="submit"
                    disabled={addingBalance || !balanceInput}
                    className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 cursor-pointer shrink-0"
                  >
                    {addingBalance ? "Adding..." : "+ Top Up"}
                  </Button>
                </form>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Billing Profile</span>
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Company:</span>
                      <span className="font-semibold text-slate-800">{pricing.billing_company_name || tenant.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tax ID:</span>
                      <span className="font-mono text-slate-700">{pricing.billing_tax_id || "Not Provided"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Invoices:</span>
                      <span className="font-bold text-indigo-600">{pricing.invoices.length} Paid</span>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  Invoices are generated upon subscription renewal or wallet top-ups.
                </div>
              </Card>
            </div>

            {/* Available Plans Comparison & SuperAdmin Switcher */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Available Subscription Tiers</h3>
                  <p className="text-xs text-slate-500">SuperAdmin can instantaneously switch or provision any subscription tier for this tenant.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {pricing.available_plans.map((plan) => {
                  const isCurrent = pricing.current_plan.toLowerCase() === plan.name.toLowerCase();
                  return (
                    <Card
                      key={plan.name}
                      className={`p-6 rounded-3xl flex flex-col justify-between transition-all ${
                        isCurrent
                          ? "border-2 border-indigo-600 bg-indigo-50/20 shadow-md ring-4 ring-indigo-500/10"
                          : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-base">{plan.name}</h4>
                            <div className="text-2xl font-black text-indigo-600 mt-1">{plan.price}</div>
                          </div>
                          {isCurrent && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                              Current
                            </span>
                          )}
                        </div>

                        <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                          {plan.features.map((feat, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-6">
                        {isCurrent ? (
                          <Button disabled className="w-full bg-slate-100 text-slate-400 text-xs font-bold py-2 rounded-xl">
                            Active Plan
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleSwitchPlan(plan.name)}
                            disabled={switchingPlan}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-xl cursor-pointer shadow-sm"
                          >
                            {switchingPlan ? "Updating..." : `Switch to ${plan.name}`}
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Invoices History Table */}
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">Invoices &amp; Billing History</h3>
              <Card className="border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-6">Invoice #</th>
                        <th className="py-3 px-6">Date</th>
                        <th className="py-3 px-6">Description</th>
                        <th className="py-3 px-6">Amount</th>
                        <th className="py-3 px-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pricing.invoices.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                            No billing invoice records generated yet for this tenant.
                          </td>
                        </tr>
                      ) : (
                        pricing.invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors text-xs">
                            <td className="py-3.5 px-6 font-mono font-bold text-slate-800">{inv.invoice_number}</td>
                            <td className="py-3.5 px-6 text-slate-500">{inv.date}</td>
                            <td className="py-3.5 px-6 text-slate-700 font-medium">{inv.description}</td>
                            <td className="py-3.5 px-6 font-bold text-slate-900">{inv.amount}</td>
                            <td className="py-3.5 px-6 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 3: INFRASTRUCTURE & ISOLATION */}
        {activeTab === "infrastructure" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white border-slate-200 rounded-3xl shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Cluster &amp; Routing Topology
                </h3>
                <div className="space-y-3 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Workspace Subdomain:</span>
                    <span className="font-mono font-bold text-indigo-600">{tenant.subdomain}.callzenza.com</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Cluster Node:</span>
                    <span className="font-semibold text-slate-800">{tenant.cluster_id}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Geographic Region:</span>
                    <span className="font-semibold text-slate-800">{tenant.region}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Server Ingress URL:</span>
                    <span className="font-mono text-slate-600">{tenant.server_url || "Default Ingress Gateway"}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Data Isolation:</span>
                    <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {tenant.isolation_strategy}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Module Permissions Checklist
                </h3>
                <p className="text-xs text-slate-500">
                  Active functional modules enabled for this tenant workspace.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {Object.entries(tenant.permissions).map(([mod, enabled]) => (
                    <span
                      key={mod}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                        enabled
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60"
                      }`}
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 4: USERS */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">Tenant Users</h3>
            <Card className="border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-6">Name</th>
                      <th className="py-3 px-6">Email</th>
                      <th className="py-3 px-6">Role</th>
                      <th className="py-3 px-6">Email Verified</th>
                      <th className="py-3 px-6 text-right">Account Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tenantUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          No users registered under this tenant.
                        </td>
                      </tr>
                    ) : (
                      tenantUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors text-xs">
                          <td className="py-3.5 px-6 font-bold text-slate-800">{u.full_name || "Unnamed User"}</td>
                          <td className="py-3.5 px-6 font-mono text-slate-600">{u.email}</td>
                          <td className="py-3.5 px-6">
                            <span className="px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-6">
                            {u.email_verified ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                              </span>
                            ) : (
                              <span className="text-amber-600 font-medium">Unverified</span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Plus,
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  Building2,
  RefreshCw,
  X,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PlanItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  annual_price_cents: number;
  billing_interval: string;
  max_agents: number;
  max_concurrent_calls: number;
  max_minutes_monthly: number;
  max_leads: number;
  max_storage_mb: number;
  features: Record<string, any>;
  is_active: boolean;
  subscriber_count: number;
  created_at: string;
}

export default function SuperAdminSubscriptionsPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [monthlyPriceDollars, setMonthlyPriceDollars] = useState("49");
  const [annualPriceDollars, setAnnualPriceDollars] = useState("470");
  const [maxAgents, setMaxAgents] = useState(5);
  const [maxCalls, setMaxCalls] = useState(10);
  const [maxMinutes, setMaxMinutes] = useState(500);
  const [maxLeads, setMaxLeads] = useState(2500);
  const [maxStorageMb, setMaxStorageMb] = useState(5000);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<PlanItem[]>("/api/super-admin/subscriptions");
      setPlans(res || []);
    } catch (err: any) {
      console.error("Subscription plans error:", err);
      setError(err?.message || "Failed to load subscription tiers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleToggleStatus = async (plan: PlanItem) => {
    const nextStatus = !plan.is_active;
    try {
      await apiFetch(`/api/super-admin/subscriptions/${plan.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: nextStatus }),
      });
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, is_active: nextStatus } : p))
      );
      setSuccess(`Plan "${plan.name}" is now ${nextStatus ? "ACTIVE" : "INACTIVE"}.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to update plan status");
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setCreating(true);
    setError(null);
    try {
      await apiFetch("/api/super-admin/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim(),
          price_cents: Math.round(parseFloat(monthlyPriceDollars) * 100),
          annual_price_cents: Math.round(parseFloat(annualPriceDollars) * 100),
          billing_interval: "monthly",
          max_agents: maxAgents,
          max_concurrent_calls: maxCalls,
          max_minutes_monthly: maxMinutes,
          max_leads: maxLeads,
          max_storage_mb: maxStorageMb,
          features: {
            unlimited_campaigns: true,
            dedicated_subdomain: true,
            custom_voice_models: maxAgents > 2,
          },
        }),
      });

      setSuccess(`Subscription Plan "${name}" registered successfully!`);
      setShowCreateModal(false);
      setName("");
      setSlug("");
      setDescription("");
      fetchPlans();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err?.message || "Failed to create subscription plan");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Subscription Plans &amp; Tiers</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              PostgreSQL Managed Tiers
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure tenant pricing tiers, agent concurrency caps, talk minute allowances, and storage quotas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={fetchPlans}
            disabled={loading}
            variant="outline"
            className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-400" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5 shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            Create New Tier
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-900/50 rounded-xl text-rose-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-emerald-400 text-xs flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const monthlyPrice = (plan.price_cents / 100).toFixed(2);
          const annualPrice = (plan.annual_price_cents / 100).toFixed(2);

          return (
            <div
              key={plan.id}
              className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${
                plan.is_active
                  ? "bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-xl"
                  : "bg-slate-950/60 border-slate-900 opacity-60"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    {plan.slug}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(plan)}
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                      plan.is_active
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                        : "bg-slate-900 text-slate-500 border border-slate-800"
                    }`}
                  >
                    {plan.is_active ? "ACTIVE" : "DISABLED"}
                  </button>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">${monthlyPrice}</span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-0.5 font-mono">
                    ${annualPrice} / year billed annually
                  </div>
                </div>

                {/* Quota Highlights */}
                <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Voice Agents:</span>
                    <strong>{plan.max_agents} deployed</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Concurrent Calls:</span>
                    <strong>{plan.max_concurrent_calls} streams</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Monthly Minutes:</span>
                    <strong>{plan.max_minutes_monthly} mins</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Lead Storage:</span>
                    <strong>{plan.max_leads.toLocaleString()} records</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">File Storage:</span>
                    <strong>{(plan.max_storage_mb / 1024).toFixed(1)} GB</strong>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between text-xs">
                <span className="text-slate-400">Active Tenants:</span>
                <span className="font-bold text-indigo-400">{plan.subscriber_count || 0} orgs</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Subscription Tier</h3>
                  <p className="text-xs text-slate-400">Define tenant quotas and pricing</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Plan Name *
                  </label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                      }
                    }}
                    placeholder="Scale Enterprise"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Slug *
                  </label>
                  <Input
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="scale-enterprise"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  Description
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Advanced voice operations for high-volume enterprises"
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Monthly Price ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={monthlyPriceDollars}
                    onChange={(e) => setMonthlyPriceDollars(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Annual Price ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={annualPriceDollars}
                    onChange={(e) => setAnnualPriceDollars(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Max Agents
                  </label>
                  <Input
                    type="number"
                    value={maxAgents}
                    onChange={(e) => setMaxAgents(parseInt(e.target.value) || 1)}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Concurrent Calls
                  </label>
                  <Input
                    type="number"
                    value={maxCalls}
                    onChange={(e) => setMaxCalls(parseInt(e.target.value) || 1)}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Monthly Mins
                  </label>
                  <Input
                    type="number"
                    value={maxMinutes}
                    onChange={(e) => setMaxMinutes(parseInt(e.target.value) || 100)}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-slate-900 border-slate-800 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  {creating ? "Saving..." : "Create Plan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

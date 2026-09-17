"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  ShieldCheck,
  Users,
  RefreshCw,
  X,
  ExternalLink,
  CreditCard,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  Filter,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  owner_name: string;
  owner_email: string;
  registration_source: string; // SUPER_ADMIN_CREATED, SELF_REGISTERED
  subscription_plan: string;
  status: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  user_count: number;
  wallet_balance: number;
  cluster_id: string;
  isolation_strategy: string;
}

interface TenantListResponse {
  tenants: TenantItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create Tenant Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantSubdomain, setNewTenantSubdomain] = useState("");
  const [newTenantEmail, setNewTenantEmail] = useState("");
  const [newTenantPassword, setNewTenantPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newTenantPlan, setNewTenantPlan] = useState("Starter Free");
  const [newTenantCluster, setNewTenantCluster] = useState("default");
  const [newTenantIsolation, setNewTenantIsolation] = useState("SHARED_DATABASE");

  const fetchTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      if (search.trim()) params.set("search", search.trim());
      if (sourceFilter !== "ALL") params.set("registration_source", sourceFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (planFilter !== "ALL") params.set("plan", planFilter);

      const res = await apiFetch<TenantListResponse>(`/api/super-admin/tenants?${params.toString()}`);
      setTenants(res.tenants || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      console.error("Failed to load tenants:", err);
      setError(err?.message || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [page, limit, sourceFilter, statusFilter, planFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTenants();
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (tenant: TenantItem) => {
    const nextStatus = !tenant.is_active;
    try {
      await apiFetch(`/api/super-admin/tenants/${tenant.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: nextStatus }),
      });
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, is_active: nextStatus } : t))
      );
      setSuccess(`Tenant "${tenant.name}" is now ${nextStatus ? "ACTIVE" : "SUSPENDED"}.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to update tenant status");
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      await apiFetch("/api/super-admin/tenants", {
        method: "POST",
        body: JSON.stringify({
          name: newTenantName.trim(),
          subdomain: newTenantSubdomain.trim() || undefined,
          email: newTenantEmail.trim() || undefined,
          password: newTenantPassword || undefined,
          current_plan: newTenantPlan,
          cluster_id: newTenantCluster,
          isolation_strategy: newTenantIsolation,
        }),
      });

      setSuccess(`Organization "${newTenantName}" provisioned successfully!`);
      setShowCreateModal(false);
      setNewTenantName("");
      setNewTenantSubdomain("");
      setNewTenantEmail("");
      setNewTenantPassword("");
      fetchTenants();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err?.message || "Failed to create tenant");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Tenants &amp; Organizations</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {total} Organizations
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Displaying all organizations across Super Admin-provisioned and Self-Serve registrations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchTenants}
            disabled={loading}
            className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5 shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            Provision Tenant
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-900/50 rounded-xl text-rose-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-emerald-400 text-xs flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="w-full md:w-96 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <Input
            type="text"
            placeholder="Search by name, slug, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-600 focus-visible:ring-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-medium"
          >
            <option value="ALL">All Sources</option>
            <option value="SELF_REGISTERED">Self-Registered</option>
            <option value="SUPER_ADMIN_CREATED">Super Admin Created</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-medium"
          >
            <option value="ALL">All Plans</option>
            <option value="Starter Free">Starter Free</option>
            <option value="Growth Pro">Growth Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Organization</th>
              <th className="py-3.5 px-4">Tenant ID</th>
              <th className="py-3.5 px-4">Owner &amp; Email</th>
              <th className="py-3.5 px-4">Source</th>
              <th className="py-3.5 px-4">Plan</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Created Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  {loading ? "Loading organizations..." : "No organizations match the selected criteria."}
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Organization & Slug */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-100">{t.name}</div>
                    <div className="font-mono text-[10px] text-indigo-400">{t.slug || t.subdomain}.callzenza.com</div>
                  </td>

                  {/* Tenant ID */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 w-fit">
                      <span>{t.id.slice(0, 13)}...</span>
                      <button
                        onClick={() => handleCopy(t.id)}
                        className="text-slate-500 hover:text-indigo-400 cursor-pointer"
                        title="Copy full Tenant ID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {copiedId === t.id && <span className="text-emerald-400 text-[9px] font-bold">✓</span>}
                    </div>
                  </td>

                  {/* Owner & Email */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-200">{t.owner_name || "Owner"}</div>
                    <div className="text-[11px] text-slate-400">{t.owner_email || "system"}</div>
                  </td>

                  {/* Registration Source */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.registration_source === "SELF_REGISTERED"
                          ? "bg-purple-950/60 text-purple-300 border border-purple-800/50"
                          : "bg-indigo-950/60 text-indigo-300 border border-indigo-800/50"
                      }`}
                    >
                      {t.registration_source === "SELF_REGISTERED" ? "Self-Serve" : "Super Admin"}
                    </span>
                  </td>

                  {/* Subscription Plan */}
                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    {t.subscription_plan || "Starter Free"}
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleStatus(t)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                        t.is_active
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/40"
                          : "bg-amber-950/60 text-amber-400 border border-amber-800/50 hover:bg-amber-900/40"
                      }`}
                      title="Click to toggle tenant status"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${t.is_active ? "bg-emerald-400" : "bg-amber-400"}`} />
                      {t.is_active ? "Active" : "Suspended"}
                    </button>
                  </td>

                  {/* Created Date */}
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/super-admin/tenants/${t.id}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors"
                      >
                        Details
                      </Link>
                      <Link
                        href={`/super-admin/tenants/${t.id}/analytics`}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                        title="View Tenant Analytics"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/super-admin/tenants/${t.id}/billing`}
                        className="p-1 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors"
                        title="View Tenant Billing & Limits"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <span>
            Showing page {page} of {totalPages} ({total} total tenants)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="bg-slate-900 border-slate-800 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="bg-slate-900 border-slate-800 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Provision New Tenant</h3>
                  <p className="text-xs text-slate-400">Assign multi-tenant space and credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  Organization Name *
                </label>
                <Input
                  required
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="Acme Financial Corp"
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  Subdomain / Slug (Optional)
                </label>
                <Input
                  value={newTenantSubdomain}
                  onChange={(e) => setNewTenantSubdomain(e.target.value)}
                  placeholder="acme-corp"
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Admin Email (Optional)
                  </label>
                  <Input
                    type="email"
                    value={newTenantEmail}
                    onChange={(e) => setNewTenantEmail(e.target.value)}
                    placeholder="admin@acme.com"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Password (Optional)
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newTenantPassword}
                      onChange={(e) => setNewTenantPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Initial Plan
                  </label>
                  <select
                    value={newTenantPlan}
                    onChange={(e) => setNewTenantPlan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="Starter Free">Starter Free</option>
                    <option value="Growth Pro">Growth Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Isolation Strategy
                  </label>
                  <select
                    value={newTenantIsolation}
                    onChange={(e) => setNewTenantIsolation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="SHARED_DATABASE">Shared DB (Row-Level)</option>
                    <option value="SEPARATE_DATABASE">Dedicated Database</option>
                  </select>
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
                  {creating ? "Provisioning..." : "Create Tenant"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

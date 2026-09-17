"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  ShieldCheck,
  Users,
  ArrowLeft,
  RefreshCw,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  X,
  Trash2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  BarChart3,
  ExternalLink,
  CreditCard
} from "lucide-react";

export interface TenantItem {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  cluster_id?: string;
  server_url?: string;
  isolation_strategy?: string;
  industry: string;
  is_active: boolean;
  status?: string;
  current_plan: string;
  wallet_balance: number;
  created_at: string;
  user_count: number;
  permissions?: Record<string, boolean>;
}

export const AVAILABLE_PAGE_PERMISSIONS = [
  { id: "dashboard", label: "Dashboard", description: "Main dashboard & live overview" },
  { id: "campaigns", label: "Campaigns", description: "Outbound campaigns & dialer" },
  { id: "leads", label: "Lists & Leads", description: "Lead management, hopper, recycle" },
  { id: "live_calls", label: "Live Calls", description: "Live monitoring & call recordings" },
  { id: "reports", label: "Reports & Analytics", description: "Performance reports & analytics" },
  { id: "inbound", label: "Inbound Routing", description: "Inbound DIDs & routing logic" },
  { id: "user_groups", label: "User Groups", description: "Agent groups & queues" },
  { id: "chatbot", label: "AI Chatbot", description: "AI chatbot conversations & RAG" },
  { id: "agents", label: "Remote AI Agents", description: "Autonomous AI employee agents" },
  { id: "voice_agents", label: "Remote Voice Agents", description: "Voice agent expert portal" },
  { id: "users", label: "User Management", description: "Manage tenant users & roles" },
  { id: "clients", label: "Clients", description: "Client relationship manager" },
  { id: "scripts", label: "Scripts & Knowledge", description: "Call scripts & library" },
  { id: "supervisors", label: "Quality Control", description: "Call scoring & supervisor review" },
  { id: "admin", label: "Administration Hub", description: "Admin settings (tenants hidden)" },
  { id: "billing", label: "Billing & Invoices", description: "Billing preference & payments" },
  { id: "settings", label: "Settings", description: "Tenant settings & preferences" },
];

export default function AdminTenantsPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // Guard: Only Super Admin can access Tenancy management
  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN" && user.email !== "admin@callzenza.com") {
      router.replace("/admin");
    }
  }, [user, router]);

  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantSubdomain, setNewTenantSubdomain] = useState("");
  const [newTenantCluster, setNewTenantCluster] = useState("default");
  const [newTenantIsolation, setNewTenantIsolation] = useState("SHARED_DATABASE");
  const [newTenantServerUrl, setNewTenantServerUrl] = useState("");
  const [newTenantDbUrl, setNewTenantDbUrl] = useState("");
  const [newTenantEmail, setNewTenantEmail] = useState("");
  const [newTenantPassword, setNewTenantPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newTenantIndustry, setNewTenantIndustry] = useState("General Business");
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});

  const handleSelectAllPermissions = () => {
    const all: Record<string, boolean> = {};
    AVAILABLE_PAGE_PERMISSIONS.forEach((p) => {
      all[p.id] = true;
    });
    setSelectedPermissions(all);
  };

  const handleClearAllPermissions = () => {
    setSelectedPermissions({});
  };

  // Edit Permissions Modal
  const [tenantToEditPerms, setTenantToEditPerms] = useState<TenantItem | null>(null);
  const [editPermissions, setEditPermissions] = useState<Record<string, boolean>>({});
  const [savingPermissions, setSavingPermissions] = useState(false);

  const handleOpenEditPermissions = (t: TenantItem) => {
    setTenantToEditPerms(t);
    setEditPermissions(t.permissions || {});
  };

  const handleSelectAllEditPermissions = () => {
    const all: Record<string, boolean> = {};
    AVAILABLE_PAGE_PERMISSIONS.forEach((p) => {
      all[p.id] = true;
    });
    setEditPermissions(all);
  };

  const handleClearAllEditPermissions = () => {
    setEditPermissions({});
  };

  const handleSavePermissions = async () => {
    if (!tenantToEditPerms) return;
    setSavingPermissions(true);
    setError(null);
    try {
      await apiFetch(`/api/businesses/${tenantToEditPerms.id}/permissions`, {
        method: "PATCH",
        body: JSON.stringify({ permissions: editPermissions }),
      });
      setTenants((prev) =>
        prev.map((item) =>
          item.id === tenantToEditPerms.id
            ? { ...item, permissions: editPermissions }
            : item
        )
      );
      setSuccess(`Permissions updated successfully for "${tenantToEditPerms.name}".`);
      setTenantToEditPerms(null);
    } catch (err: any) {
      console.error("Failed to update permissions:", err);
      setError(err?.message || "Failed to update tenant permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  // Delete Modal
  const [tenantToDelete, setTenantToDelete] = useState<TenantItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<TenantItem[]>("/api/businesses");
      setTenants(data || []);
    } catch (err: any) {
      console.error("Failed to load tenants:", err);
      setError(err?.message || "Failed to load organizations from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const cleanSub = newTenantSubdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || undefined;
      await apiFetch("/api/businesses/tenant", {
        method: "POST",
        body: JSON.stringify({
          name: newTenantName.trim(),
          subdomain: cleanSub,
          cluster_id: newTenantCluster,
          isolation_strategy: newTenantIsolation,
          server_url: newTenantServerUrl.trim() || undefined,
          database_url: newTenantDbUrl.trim() || undefined,
          email: newTenantEmail.trim() || undefined,
          password: newTenantPassword || undefined,
          industry: newTenantIndustry,
          current_plan: "Free Plan",
          permissions: selectedPermissions,
        }),
      });

      setSuccess(`Tenant "${newTenantName}" created successfully (${newTenantIsolation} mode, cluster: ${newTenantCluster}).`);
      setShowCreateModal(false);
      setNewTenantName("");
      setNewTenantSubdomain("");
      setNewTenantCluster("default");
      setNewTenantIsolation("SHARED_DATABASE");
      setNewTenantServerUrl("");
      setNewTenantDbUrl("");
      setNewTenantEmail("");
      setNewTenantPassword("");
      setShowPassword(false);
      setSelectedPermissions({});
      await fetchTenants();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err?.message || "Failed to create tenant");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenCreateModal = () => {
    setNewTenantName("");
    setNewTenantSubdomain("");
    setNewTenantCluster("default");
    setNewTenantIsolation("SHARED_DATABASE");
    setNewTenantServerUrl("");
    setNewTenantDbUrl("");
    setNewTenantEmail("");
    setNewTenantPassword("");
    setShowPassword(false);
    setSelectedPermissions({});
    setShowCreateModal(true);
  };

  const handleToggleStatus = async (tenant: TenantItem) => {
    const newStatus = !tenant.is_active;
    try {
      await apiFetch(`/api/businesses/${tenant.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: newStatus }),
      });

      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, is_active: newStatus } : t))
      );
      setSuccess(`Tenant "${tenant.name}" is now ${newStatus ? "ACTIVE" : "SUSPENDED"}.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to update tenant status");
    }
  };

  const handleDeleteTenant = (tenant: TenantItem) => {
    setTenantToDelete(tenant);
  };

  const confirmDeleteTenant = async () => {
    if (!tenantToDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await apiFetch(`/api/businesses/${tenantToDelete.id}`, {
        method: "DELETE",
      });
      setTenants((prev) => prev.filter((t) => t.id !== tenantToDelete.id));
      setSuccess(`Tenant "${tenantToDelete.name}" was permanently deleted.`);
      setTenantToDelete(null);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to delete tenant");
    } finally {
      setDeleting(false);
    }
  };

  const cleanTenants = tenants.filter(
    (t) =>
      t.id !== "c3dce06c-8330-4724-ba33-b5282b3c3596" &&
      t.name !== "Default Business" &&
      t.slug !== "c3dce06c"
  );

  const filteredTenants = cleanTenants.filter((t) => {
    const matchesQuery =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "ACTIVE") return matchesQuery && t.is_active;
    if (statusFilter === "SUSPENDED") return matchesQuery && !t.is_active;
    return matchesQuery;
  });

  const totalTenants = cleanTenants.length;
  const activeTenants = cleanTenants.filter((t) => t.is_active).length;
  const suspendedTenants = totalTenants - activeTenants;

  return (
    <AppShell>
      <div className="space-y-8 w-full max-w-[1700px] mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Administration
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Tenants & Organizations
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Row-Level Isolation
                  </span>
                </div>
                <p className="text-slate-500 font-medium text-sm mt-1">
                  Manage multi-tenant boundaries, isolated databases, organizations, and plans.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchTenants}
                disabled={loading}
                className="gap-2 border-slate-200 hover:bg-slate-50 font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                onClick={handleOpenCreateModal}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4" />
                Create New Tenant
              </Button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between animate-fadeIn">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center justify-between animate-fadeIn">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="p-5 border-slate-200/80 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tenants</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-slate-800">{totalTenants}</div>
            <span className="text-xs text-slate-400 font-medium mt-1 inline-block">Registered Organizations</span>
          </Card>

          <Card className="p-5 border-slate-200/80 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Tenants</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-emerald-600">{activeTenants}</div>
            <span className="text-xs text-slate-400 font-medium mt-1 inline-block">Operating normally</span>
          </Card>

          <Card className="p-5 border-slate-200/80 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Suspended Tenants</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-amber-600">{suspendedTenants}</div>
            <span className="text-xs text-slate-400 font-medium mt-1 inline-block">Access blocked</span>
          </Card>

          <Card className="p-5 border-slate-200/80 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Isolation Layer</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-xl font-black text-slate-800">Tenant-ID Scoped</div>
            <span className="text-xs text-slate-400 font-medium mt-1 inline-block">No cross-tenant leakage</span>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, slug, or tenant ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-50/70 border-slate-200 text-sm focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({totalTenants})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "ACTIVE"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              Active ({activeTenants})
            </button>
            <button
              onClick={() => setStatusFilter("SUSPENDED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "SUSPENDED"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              Suspended ({suspendedTenants})
            </button>
          </div>
        </div>

        {/* Tenants Table */}
        <Card className="border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  <th className="py-4 px-6">Organization</th>
                  <th className="py-4 px-6">Tenant ID</th>
                  <th className="py-4 px-6">Users</th>
                  <th className="py-4 px-6">Permissions</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                        <span className="font-medium text-slate-500">Loading tenant records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Building2 className="w-10 h-10 text-slate-300" />
                        <span className="font-semibold text-slate-600">No tenants found</span>
                        <span className="text-xs text-slate-400">Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 min-w-[280px]">
                        <Link
                          href={`/admin/tenants/${t.id}`}
                          className="flex items-center gap-3 group cursor-pointer"
                          title="Click to view pricing & analytics details"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:shadow-indigo-200 group-hover:shadow-md transition-all">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                              <span>{t.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 opacity-60 group-hover:opacity-100 transition-all" />
                              {t.slug === "callzenza" && (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  Default Primary
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100/80">
                                {t.subdomain || t.slug}.callzenza.com
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {t.cluster_id || "default"}
                              </span>
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-200">
                                {t.current_plan || "Free Plan"}
                              </span>
                              {t.isolation_strategy && t.isolation_strategy !== "SHARED_DATABASE" && (
                                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                  {t.isolation_strategy}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {t.id}
                          </span>
                          <button
                            onClick={() => handleCopy(t.id)}
                            title="Copy Tenant ID"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {copiedId === t.id && (
                            <span className="text-[10px] text-emerald-600 font-bold animate-fadeIn">
                              Copied!
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>{t.user_count} User{t.user_count === 1 ? "" : "s"}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        {(() => {
                          const enabledCount = t.permissions
                            ? Object.values(t.permissions).filter(Boolean).length
                            : 0;
                          return (
                            <button
                              onClick={() => handleOpenEditPermissions(t)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                enabledCount > 0
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 shadow-xs"
                                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600"
                              }`}
                              title="Click to view or edit permissions"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{enabledCount} / {AVAILABLE_PAGE_PERMISSIONS.length} Modules</span>
                            </button>
                          );
                        })()}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        {t.status === "pending_verification" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending Verification
                          </span>
                        ) : t.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            Suspended
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap pr-6">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link href={`/admin/tenants/${t.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              title="View Tenant Pricing & Analytics"
                              className="gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-purple-200 text-purple-700 bg-purple-50/70 hover:bg-purple-100 hover:border-purple-300 transition-all shadow-xs"
                            >
                              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                              Pricing & Analytics
                            </Button>
                          </Link>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditPermissions(t)}
                            title="Edit Permissions Checklist"
                            className="gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 hover:border-indigo-300 transition-all shadow-xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            Permissions
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(t)}
                            className={`gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                              t.is_active
                                ? "text-amber-700 bg-amber-50/80 border-amber-200/80 hover:bg-amber-100"
                                : "text-emerald-700 bg-emerald-50/80 border-emerald-200/80 hover:bg-emerald-100"
                            }`}
                          >
                            {t.is_active ? (
                              <>
                                <ToggleRight className="w-4 h-4 text-amber-600" />
                                Suspend
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-4 h-4 text-emerald-600" />
                                Activate
                              </>
                            )}
                          </Button>

                          {t.id === "c3dce06c-8330-4724-ba33-b5282b3c3596" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              title="Primary Default Organization cannot be deleted"
                              className="gap-1.5 text-xs font-semibold text-slate-300 border-slate-200 bg-slate-50/40 rounded-lg px-2.5 py-1.5 cursor-not-allowed opacity-60"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-slate-300" />
                              Delete
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTenant(t)}
                              title="Delete Tenant"
                              className="gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50/60 hover:bg-rose-600 hover:text-white border-rose-200 hover:border-rose-600 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all duration-150 shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* CREATE TENANT MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">Create New Tenant</h3>
                    <p className="text-xs text-slate-400 font-medium">Add an isolated organization workspace</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTenant} autoComplete="off" className="p-6 space-y-4 overflow-y-auto cz-scroll flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    className="border-slate-200"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Tenant Subdomain</span>
                    <span className="text-[10px] text-indigo-600 font-semibold normal-case">
                      https://{newTenantSubdomain.toLowerCase().replace(/[^a-z0-9-]/g, "") || (newTenantName ? newTenantName.toLowerCase().replace(/[^a-z0-9-]/g, "") : "subdomain")}.callzenza.com
                    </span>
                  </label>
                  <div className="flex items-center">
                    <Input
                      type="text"
                      value={newTenantSubdomain}
                      onChange={(e) => setNewTenantSubdomain(e.target.value)}
                      className="border-slate-200 rounded-r-none font-mono text-sm"
                      autoComplete="off"
                    />
                    <span className="inline-flex items-center px-3 py-2 border border-l-0 border-slate-200 bg-slate-50 text-slate-500 text-xs font-medium rounded-r-md">
                      .callzenza.com
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Dedicated subdomain routing for this tenant workspace.</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Cluster / Server Node
                    </label>
                    <select
                      value={newTenantCluster}
                      onChange={(e) => setNewTenantCluster(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="default">Default Cluster (us-east)</option>
                      <option value="us-west-1">US-West Cluster (Oregon)</option>
                      <option value="eu-central-1">EU-Central Cluster (Frankfurt)</option>
                      <option value="ap-south-1">Asia-Pacific Cluster (Mumbai)</option>
                      <option value="dedicated-node">Dedicated Enterprise Node</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Data Isolation Mode
                    </label>
                    <select
                      value={newTenantIsolation}
                      onChange={(e) => setNewTenantIsolation(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="SHARED_DATABASE">Shared DB (Row-Level)</option>
                      <option value="SEPARATE_SCHEMA">Separate Schema</option>
                      <option value="SEPARATE_DATABASE">Dedicated Database</option>
                    </select>
                  </div>
                </div>

                {newTenantIsolation === "SEPARATE_DATABASE" && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Dedicated Database URL
                    </label>
                    <Input
                      type="text"
                      value={newTenantDbUrl}
                      onChange={(e) => setNewTenantDbUrl(e.target.value)}
                      className="border-slate-200 font-mono text-xs"
                      autoComplete="off"
                    />
                    <span className="text-[11px] text-slate-400">Queries for this tenant will route to this isolated database.</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Admin Email <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="email"
                    required
                    value={newTenantEmail}
                    onChange={(e) => setNewTenantEmail(e.target.value)}
                    className="border-slate-200 text-sm"
                    autoComplete="off"
                    name="new_tenant_admin_email_nofill"
                    id="new_tenant_admin_email_nofill"
                  />
                  <span className="text-[11px] text-slate-400">Primary administrator login for this tenant workspace.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Admin Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newTenantPassword}
                      onChange={(e) => setNewTenantPassword(e.target.value)}
                      className="border-slate-200 pr-10 text-sm"
                      autoComplete="new-password"
                      name="new_tenant_admin_password_nofill"
                      id="new_tenant_admin_password_nofill"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">Initial password for the organization admin.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Industry
                  </label>
                  <select
                    value={newTenantIndustry}
                    onChange={(e) => setNewTenantIndustry(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="General Business">General Business</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Finance & Insurance">Finance & Insurance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Call Center / BPO">Call Center / BPO</option>
                    <option value="SaaS & Technology">SaaS & Technology</option>
                  </select>
                </div>

                {/* Page & Module Permissions Checklist */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        Page & Module Permissions
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Only checked pages will be visible to this tenant. Unchecked pages will remain completely hidden.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleSelectAllPermissions}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllPermissions}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto cz-scroll border border-slate-200 rounded-xl p-3 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AVAILABLE_PAGE_PERMISSIONS.map((perm) => {
                      const isChecked = !!selectedPermissions[perm.id];
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                            isChecked
                              ? "bg-white border-indigo-400 shadow-xs ring-1 ring-indigo-400/20"
                              : "bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              setSelectedPermissions((prev) => ({
                                ...prev,
                                [perm.id]: e.target.checked,
                              }))
                            }
                            className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-bold leading-tight ${isChecked ? "text-indigo-950" : "text-slate-800"}`}>
                              {perm.label}
                            </div>
                            <div className="text-[10.5px] text-slate-400 truncate">
                              {perm.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>The new tenant will immediately be isolated at row-level for all campaigns, leads, and call records.</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating || !newTenantName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    {creating ? "Creating Tenant..." : "Create Tenant"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT TENANT PERMISSIONS MODAL */}
        {tenantToEditPerms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">Edit Tenant Permissions</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Configure visible pages for <span className="font-bold text-slate-800">{tenantToEditPerms.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTenantToEditPerms(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto cz-scroll flex-1">
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Accessible Pages ({Object.values(editPermissions).filter(Boolean).length} / {AVAILABLE_PAGE_PERMISSIONS.length} Enabled)
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Unchecked items will remain completely hidden from this tenant workspace.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllEditPermissions}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllEditPermissions}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto cz-scroll p-1">
                  {AVAILABLE_PAGE_PERMISSIONS.map((perm) => {
                    const isChecked = !!editPermissions[perm.id];
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-white border-indigo-400 shadow-xs ring-1 ring-indigo-400/20"
                            : "bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setEditPermissions((prev) => ({
                              ...prev,
                              [perm.id]: e.target.checked,
                            }))
                          }
                          className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-bold leading-tight ${isChecked ? "text-indigo-950" : "text-slate-800"}`}>
                            {perm.label}
                          </div>
                          <div className="text-[10.5px] text-slate-400 truncate">
                            {perm.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTenantToEditPerms(null)}
                  disabled={savingPermissions}
                  className="border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={savingPermissions}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 shadow-sm"
                >
                  {savingPermissions ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving Permissions...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Save Permissions
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE TENANT CONFIRMATION MODAL */}
        {tenantToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">Delete Tenant</h3>
                    <p className="text-xs text-rose-600 font-semibold">Permanent deletion</p>
                  </div>
                </div>
                <button
                  onClick={() => setTenantToDelete(null)}
                  disabled={deleting}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">
                  Are you sure you want to delete organization{" "}
                  <strong className="text-slate-900 font-bold underline">
                    {tenantToDelete.name}
                  </strong>
                  ?
                </p>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Tenant ID:</span>
                    <span className="text-slate-800 font-bold">{tenantToDelete.id}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Slug:</span>
                    <span className="text-slate-800">/{tenantToDelete.slug || "n/a"}</span>
                  </div>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    This action <strong>cannot be undone</strong>. All isolated data including leads, campaigns, calls, and agent records will be permanently removed.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTenantToDelete(null)}
                    disabled={deleting}
                    className="border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={confirmDeleteTenant}
                    disabled={deleting}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-2 shadow-sm"
                  >
                    {deleting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Yes, Delete Tenant
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

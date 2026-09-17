"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminService, AdminUser } from "@/lib/services/admin.service";
import {
  ShieldCheck,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Trash2,
  Settings,
  X,
} from "lucide-react";
import { formatISTDate } from "@/lib/date-utils";

export default function AdminSupervisorsPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [supervisors, setSupervisors] = useState<AdminUser[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  
  const [editingSupervisor, setEditingSupervisor] = useState<AdminUser | null>(null);
  const [editPermissions, setEditPermissions] = useState<Record<string, boolean>>({});
  
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    dashboard: true,
    user_management: true,
    voice_agent: true,
    reports: false,
    campaigns: false,
    lists: false,
  });

  const PERMISSION_OPTIONS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "user_management", label: "User Management" },
    { id: "voice_agent", label: "Voice Agent" },
    { id: "reports", label: "Reports" },
    { id: "campaigns", label: "Campaigns" },
    { id: "lists", label: "Lists" },
  ];

  const loadSupervisors = async () => {
    setTableLoading(true);
    try {
      const data = await adminService.getUsers("SUPERVISOR");
      setSupervisors(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to fetch supervisors:", err);
      setSupervisors([]);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    loadSupervisors();
  }, []);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCreateSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      await adminService.inviteUser({
        email: email.trim(),
        full_name: fullName.trim(),
        password: password.trim(),
        role: "SUPERVISOR",
        phone: "",
        permissions,
      });

      setSuccess(`Supervisor account for ${email.trim()} created successfully!`);
      setEmail("");
      setFullName("");
      setPassword("");

      await loadSupervisors();
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to create supervisor account. Ensure the email is not already registered."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupervisor = async (id: string, supEmail: string) => {
    if (!confirm(`Are you sure you want to delete supervisor ${supEmail}?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await adminService.deleteUser(id);
      setSuccess(`Supervisor ${supEmail} deleted successfully`);
      await loadSupervisors();
    } catch (err: any) {
      setError(err.message || "Failed to delete supervisor");
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    setError(null);
    setSuccess(null);

    try {
      const updated = await adminService.updateUser(user.id, {
        is_active: !user.is_active,
      });

      setSuccess(
        `Supervisor ${user.email} is now ${
          updated.is_active ? "Active" : "Suspended"
        }`
      );

      await loadSupervisors();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    }
  };

  const handleSaveEditPermissions = async () => {
    if (!editingSupervisor) return;
    try {
      await adminService.updateUser(editingSupervisor.id, {
        permissions: editPermissions
      });
      setSuccess(`Permissions updated for ${editingSupervisor.email}`);
      setEditingSupervisor(null);
      await loadSupervisors();
    } catch (err: any) {
      setError(err.message || "Failed to update permissions");
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-8 animate-in fade-in duration-300 max-w-7xl mx-auto mt-4 w-full">
        {/* Header */}
        <div className="flex flex-col gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <ShieldCheck className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Manage Supervisors
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Create and manage supervisor accounts with elevated monitoring access.
              </p>
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-sm font-semibold animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl p-4 flex items-center gap-3 text-sm font-semibold animate-in fade-in">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Create Form */}
        <Card className="p-6 border border-slate-100 shadow-sm rounded-3xl bg-white">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-600" />
              Create New Supervisor
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              The user will automatically be assigned the Supervisor role.
            </p>
          </div>

          <form
            onSubmit={handleCreateSupervisor}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Full Name
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder=""
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Email ID *
              </label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                type="email"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Password *
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  required
                  className="h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="md:col-span-3 pt-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                Supervisor Modules & Permissions
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PERMISSION_OPTIONS.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer p-2 border border-slate-100 rounded hover:bg-slate-50">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 cursor-pointer"
                      checked={permissions[opt.id]}
                      onChange={(e) => setPermissions(prev => ({ ...prev, [opt.id]: e.target.checked }))}
                    />
                    <span className="text-sm text-slate-700 font-semibold">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 px-6 text-sm rounded-xl cursor-pointer transition-premium"
              >
                {loading ? "Creating..." : "Create Supervisor"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Supervisor Directory */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
          <h3 className="font-bold text-slate-900 text-md uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Supervisor Directory ({supervisors.length})</span>
            <button
              onClick={loadSupervisors}
              className="text-xs font-extrabold text-indigo-600 hover:underline"
            >
              Refresh List
            </button>
          </h3>

          {tableLoading ? (
            <div className="py-12 flex flex-col justify-center items-center gap-3">
              <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Loading supervisors...
              </span>
            </div>
          ) : supervisors.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium text-sm">
              No supervisor accounts found. Create one using the form above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Supervisor</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Created Date</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {supervisors.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/50 transition-premium"
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                            {u.full_name
                              ? u.full_name[0].toUpperCase()
                              : u.email[0].toUpperCase()}
                          </div>

                          <div>
                            <p className="font-bold text-slate-900">
                              {u.full_name || u.email.split("@")[0]}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                              <Mail className="h-3 w-3" />
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          SUPERVISOR
                        </span>
                      </td>

                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                            u.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          {u.is_active ? "Active" : "Suspended"}
                        </span>
                      </td>

                      <td className="py-3.5 text-xs text-slate-400 font-semibold">
                        {formatISTDate(u.created_at)}
                      </td>

                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-premium"
                          >
                            {u.is_active ? "Suspend" : "Activate"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingSupervisor(u);
                              setEditPermissions(u.permissions || {
                                dashboard: true,
                                user_management: true,
                                voice_agent: true,
                                reports: false,
                                campaigns: false,
                                lists: false,
                              });
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-premium cursor-pointer"
                            title="Edit Permissions"
                          >
                            <Settings className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSupervisor(u.id, u.email)
                            }
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-premium cursor-pointer"
                            title="Delete Supervisor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Permissions Modal */}
      {editingSupervisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-[500px] overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Edit Permissions: {editingSupervisor.full_name || editingSupervisor.email}</h3>
              <button onClick={() => setEditingSupervisor(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {PERMISSION_OPTIONS.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 cursor-pointer"
                      checked={editPermissions[opt.id] || false}
                      onChange={(e) => setEditPermissions(prev => ({ ...prev, [opt.id]: e.target.checked }))}
                    />
                    <span className="text-sm text-slate-700 font-semibold">{opt.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingSupervisor(null)}>Cancel</Button>
                <Button onClick={handleSaveEditPermissions} className="bg-indigo-600 hover:bg-indigo-500 text-white">Save Permissions</Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}

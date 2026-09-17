"use client";
// Force HMR re-compile for Admin Users Page

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminService, AdminUser } from "@/lib/services/admin.service";
import { useAuthStore } from "@/lib/store";
import { 
  Users, UserPlus, Shield, UserMinus, ToggleLeft, ToggleRight, 
  Trash2, Mail, FileText, CheckCircle2, AlertTriangle, ShieldCheck, X, Settings2, Edit2, Eye, EyeOff
} from "lucide-react";
import { formatISTDate } from "@/lib/date-utils";

const ROLE_OPTIONS = [
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "VOICE_AGENT", label: "Voice Agent" },
];

const normalizeRole = (role: string): string => {
  const r = (role || "").toUpperCase();
  if (r === "VOICE_AGENT" || r.includes("EXPERT")) return "VOICE_AGENT";
  if (r.includes("SUPERVISOR")) return "SUPERVISOR";
  if (r.includes("ADMIN")) return "ADMIN";
  return "USER";
};

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite Form state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState("USER");
  const [inviteBusinessId, setInviteBusinessId] = useState("");
  const [invitePermissions, setInvitePermissions] = useState({
    viewAnalytics: false,
    runCampaigns: false,
    manageBilling: false,
    viewRecordings: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  // Edit User Modal state
  const [editTargetUser, setEditTargetUser] = useState<AdminUser | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("USER");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPermissions, setEditPermissions] = useState({
    viewAnalytics: false,
    runCampaigns: false,
    manageBilling: false,
    viewRecordings: false,
  });
  const [editPassword, setEditPassword] = useState("");

  // Permission Modal state
  const [permissionTarget, setPermissionTarget] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState({
    viewAnalytics: true,
    runCampaigns: true,
    manageBilling: false,
    viewRecordings: true,
  });

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!inviteEmail.trim() || !invitePassword.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      await adminService.inviteUser({
        email: inviteEmail,
        full_name: inviteFullName,
        phone: invitePhone,
        password: invitePassword,
        role: inviteRole,
        business_id: inviteBusinessId.trim() || undefined,
        permissions: invitePermissions,
      });
      setSuccess(`User ${inviteEmail} created successfully!`);
      setInviteEmail("");
      setInviteFullName("");
      setInvitePhone("");
      setInvitePassword("");
      setInviteRole("USER");
      setInviteBusinessId("");
      setInvitePermissions({
        viewAnalytics: false,
        runCampaigns: false,
        manageBilling: false,
        viewRecordings: false,
      });
      setShowInvite(false);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    setError(null);
    setSuccess(null);
    try {
      const updated = await adminService.updateUser(user.id, {
        is_active: !user.is_active,
      });
      setSuccess(`User ${user.email} is now ${updated.is_active ? "Active" : "Suspended"}`);
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update user status");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setError(null);
    setSuccess(null);
    try {
      await adminService.updateUser(userId, { role: newRole });
      setSuccess("User role updated successfully");
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await adminService.deleteUser(userId);
      setSuccess(`User ${email} deleted successfully`);
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    }
  };

  const handleOpenEditModal = (u: AdminUser) => {
    setEditTargetUser(u);
    setEditFullName(u.full_name || "");
    setEditEmail(u.email || "");
    setEditRole(u.role || "VOICE_AGENT");
    setEditIsActive(u.is_active);
    setEditPassword("");
    setEditPermissions({
      viewAnalytics: u.permissions?.viewAnalytics || false,
      runCampaigns: u.permissions?.runCampaigns || false,
      manageBilling: u.permissions?.manageBilling || false,
      viewRecordings: u.permissions?.viewRecordings || false,
    });
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTargetUser) return;
    setError(null);
    setSuccess(null);
    try {
      await adminService.updateUser(editTargetUser.id, {
        full_name: editFullName,
        email: editEmail,
        role: editRole,
        is_active: editIsActive,
        password: editPassword.trim() ? editPassword.trim() : undefined,
        permissions: editPermissions,
      });
      setSuccess(`User ${editEmail} updated successfully!`);
      setEditTargetUser(null);
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    }
  };

  const handleSavePermissions = async () => {
    if (!permissionTarget) return;
    try {
      await adminService.updateUser(permissionTarget.id, {
        permissions,
      });
      setSuccess(`Permissions updated for ${permissionTarget.email}`);
      setPermissionTarget(null);
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update permissions");
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-505/10 text-indigo-600 rounded-2xl bg-indigo-50 border border-indigo-100">
              <Shield className="h-6.5 w-6.5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Manage Users & Roles</h1>
              <p className="text-sm text-slate-500 mt-1">Configure workspace accounts, default permissions, and roles</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowInvite((v) => !v)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 rounded-xl self-start sm:self-center font-bold px-4 py-2.5 shadow-sm"
          >
            <UserPlus className="h-4 w-4" /> Create User
          </Button>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-sm font-semibold">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl p-4 flex items-center gap-3 text-sm font-semibold">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Create User Card/Form */}
        {showInvite && (
          <Card className="p-6 border border-slate-100 shadow-lg rounded-2xl bg-white max-w-3xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" /> Create New User
              </h3>
              <button 
                onClick={() => setShowInvite(false)}
                className="text-slate-400 hover:text-slate-600 transition-premium p-1 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <Input 
                  value={inviteEmail} 
                  onChange={(e) => setInviteEmail(e.target.value)} 
                  placeholder="" 
                  type="email"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <Input 
                  value={inviteFullName} 
                  onChange={(e) => setInviteFullName(e.target.value)} 
                  placeholder="" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={invitePassword} 
                    onChange={(e) => setInvitePassword(e.target.value)} 
                    placeholder="" 
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-11 bg-white font-semibold text-slate-700 cursor-pointer"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Business ID (Optional)</label>
                <Input 
                  value={inviteBusinessId} 
                  onChange={(e) => setInviteBusinessId(e.target.value)} 
                  placeholder="" 
                />
              </div>
              <div className="lg:col-span-3 space-y-3 mt-2 border-t border-slate-50 pt-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-indigo-600" /> Granular Permissions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "viewAnalytics", label: "View Analytics & Metrics" },
                    { key: "runCampaigns", label: "Create & Run Calling Campaigns" },
                    { key: "manageBilling", label: "Manage Billing & Top-Up Credits" },
                    { key: "viewRecordings", label: "View Audio Recordings" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex gap-2.5 items-center select-none cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-premium">
                      <input
                        type="checkbox"
                        checked={(invitePermissions as any)[key]}
                        onChange={(e) => setInvitePermissions({ ...invitePermissions, [key]: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-3 flex justify-end gap-3.5 mt-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                  Create User Account
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Directory Table Wrapper */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col justify-center items-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading user files...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-4">User Details</th>
                    <th className="pb-4">Role</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Account Created</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-premium">
                      <td className="py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                            {u.full_name ? u.full_name[0].toUpperCase() : u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.full_name || u.email.split("@")[0]}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-semibold">
                              <Mail className="h-3.5 w-3.5 text-slate-400" /> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <select
                          className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-indigo-500 bg-white font-semibold text-slate-700 cursor-pointer"
                          value={normalizeRole(u.role)}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={currentAdmin?.id === u.id}
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                          u.is_active 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}>
                          {u.is_active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-slate-400 font-semibold">
                        {formatISTDate(u.created_at)}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setPermissionTarget(u);
                              setPermissions({
                                viewAnalytics: u.permissions?.viewAnalytics ?? (u.role !== "VIEWER"),
                                runCampaigns: u.permissions?.runCampaigns ?? (u.role === "ADMIN" || u.role === "SUPER_ADMIN" || u.role === "BUSINESS"),
                                manageBilling: u.permissions?.manageBilling ?? (u.role === "ADMIN" || u.role === "SUPER_ADMIN"),
                                viewRecordings: u.permissions?.viewRecordings ?? (u.role !== "VIEWER"),
                              });
                            }}
                            className="text-indigo-600 hover:text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 transition-premium cursor-pointer flex items-center gap-1"
                          >
                            <Settings2 className="w-3.5 h-3.5" /> Permissions
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-premium cursor-pointer"
                            title="Edit User Details & Credentials"
                          >
                            <Edit2 className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={currentAdmin?.id === u.id}
                            className={`p-1.5 rounded-lg hover:bg-slate-100 transition-premium cursor-pointer ${
                              u.is_active ? "text-amber-500" : "text-emerald-500"
                            } disabled:opacity-50`}
                            title={u.is_active ? "Suspend Account" : "Activate Account"}
                          >
                            {u.is_active ? <ToggleLeft className="h-5.5 w-5.5" /> : <ToggleRight className="h-5.5 w-5.5" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            disabled={currentAdmin?.id === u.id}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-rose-500 hover:text-rose-600 transition-premium disabled:opacity-50 cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
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

        {/* Edit User Modal */}
        {editTargetUser && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <Card className="p-6 border border-slate-100 shadow-2xl rounded-3xl bg-white max-w-md w-full animate-in zoom-in-95 duration-250">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-indigo-600" /> Edit User Account
                </h3>
                <button 
                  onClick={() => setEditTargetUser(null)}
                  className="text-slate-400 hover:text-slate-600 transition-premium p-1 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditUserSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <Input 
                    value={editFullName} 
                    onChange={(e) => setEditFullName(e.target.value)} 
                    placeholder="User full name" 
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <Input 
                    value={editEmail} 
                    onChange={(e) => setEditEmail(e.target.value)} 
                    placeholder="email@domain.com" 
                    type="email"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-11 bg-white font-semibold text-slate-700 cursor-pointer"
                    value={normalizeRole(editRole)}
                    onChange={(e) => setEditRole(e.target.value)}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Status</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-11 bg-white font-semibold text-slate-700 cursor-pointer"
                    value={editIsActive ? "active" : "suspended"}
                    onChange={(e) => setEditIsActive(e.target.value === "active")}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password (Optional)</label>
                  <Input 
                    value={editPassword} 
                    onChange={(e) => setEditPassword(e.target.value)} 
                    placeholder="Leave blank to keep unchanged" 
                    type="password"
                  />
                </div>

                <div className="space-y-3 mt-4 border-t border-slate-50 pt-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-indigo-600" /> Granular Permissions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "viewAnalytics", label: "View Analytics & Metrics" },
                      { key: "runCampaigns", label: "Create & Run Calling Campaigns" },
                      { key: "manageBilling", label: "Manage Billing & Top-Up Credits" },
                      { key: "viewRecordings", label: "View Audio Recordings" },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex gap-2.5 items-center select-none cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-premium">
                        <input
                          type="checkbox"
                          checked={(editPermissions as any)[key]}
                          onChange={(e) => setEditPermissions({ ...editPermissions, [key]: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setEditTargetUser(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Permissions Modal */}
        {permissionTarget && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <Card className="p-6 border border-slate-100 shadow-2xl rounded-3xl bg-white max-w-md w-full animate-in zoom-in-95 duration-250">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-5.5 w-5.5 text-indigo-600" /> User Permissions
                </h3>
                <button 
                  onClick={() => setPermissionTarget(null)}
                  className="text-slate-400 hover:text-slate-600 transition-premium p-1 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 font-semibold mb-6">
                Configure fine-grained resource parameters for <strong className="text-slate-700">{permissionTarget.email}</strong>
              </p>

              <div className="space-y-4 mb-6">
                {[
                  { key: "viewAnalytics", label: "View Analytics & Metrics", desc: "Allow reading real-time dashboard analytics charts" },
                  { key: "runCampaigns", label: "Create & Run Calling Campaigns", desc: "Deploy AI voice calling agents to active leads" },
                  { key: "manageBilling", label: "Manage Billing & Top-Up Credits", desc: "Add wallet balances and modify subscription tier" },
                  { key: "viewRecordings", label: "View AI Call Audio Recordings", desc: "Access call details logs and listen to conversation WAVs" },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex gap-3.5 items-start select-none cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 transition-premium">
                    <input
                      type="checkbox"
                      checked={(permissions as any)[key]}
                      onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                      className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{label}</p>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-50 pt-4">
                <Button variant="outline" onClick={() => setPermissionTarget(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePermissions} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  Save Permissions
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}


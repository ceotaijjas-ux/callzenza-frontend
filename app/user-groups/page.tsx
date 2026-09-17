"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { 
  userGroupService, 
  UserGroup, 
  UserGroupDetail, 
  GroupStats,
  UserGroupCreateInput,
  UserGroupUpdateInput
} from "@/lib/services/user-group.service";
import { adminService, AdminUser } from "@/lib/services/admin.service";
import { 
  Users, UserPlus, Plus, Search, Filter, RefreshCw, CheckCircle2, 
  XCircle, UserMinus, Shield, PhoneIncoming, Edit, Trash2, 
  Eye, AlertCircle, Sparkles, UserCheck, PhoneCall
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserGroupsPage() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [stats, setStats] = useState<GroupStats>({
    total_groups: 0,
    active_groups: 0,
    total_members: 0,
    available_agents: 0,
  });
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [formMemberIds, setFormMemberIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Details & Member Management Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedGroupDetail, setSelectedGroupDetail] = useState<UserGroupDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedAddUserId, setSelectedAddUserId] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // Delete Modal State
  const [deletingGroup, setDeletingGroup] = useState<UserGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load All Users for member selection
  const loadUsers = async () => {
    try {
      const usersData = await adminService.getUsers();
      setAllUsers(usersData);
    } catch (e) {
      console.warn("Could not load users list:", e);
    }
  };

  // Load Groups & Stats
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [groupsList, statsRes] = await Promise.all([
        userGroupService.list(statusFilter === "ALL" ? undefined : statusFilter),
        userGroupService.getStats(),
      ]);

      setGroups(groupsList);
      setStats(statsRes);
    } catch (err: any) {
      setError(err.message || "Failed to load user groups");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
    loadUsers();
  }, [loadData]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingGroup(null);
    setFormName("");
    setFormDesc("");
    setFormStatus("ACTIVE");
    setFormMemberIds([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = async (grp: UserGroup) => {
    setEditingGroup(grp);
    setFormName(grp.name);
    setFormDesc(grp.description || "");
    setFormStatus(grp.status);
    setFormError(null);
    setIsModalOpen(true);

    // Fetch existing member IDs for this group
    try {
      const detail = await userGroupService.get(grp.id);
      setFormMemberIds(detail.members.map((m) => m.user_id));
    } catch (e) {
      setFormMemberIds([]);
    }
  };

  // Toggle user in member selection checklist
  const handleToggleMemberSelection = (userId: string) => {
    setFormMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Submit Create or Edit Form
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setError(null);
    setSuccess(null);

    const nameClean = formName.trim();
    if (!nameClean) {
      setFormError("Group name is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload: UserGroupCreateInput = {
        name: nameClean,
        description: formDesc.trim(),
        status: formStatus,
        member_ids: formMemberIds,
      };

      if (editingGroup) {
        await userGroupService.update(editingGroup.id, payload as UserGroupUpdateInput);
        setSuccess(`User group '${nameClean}' updated successfully`);
      } else {
        await userGroupService.create(payload);
        setSuccess(`User group '${nameClean}' created successfully with ${formMemberIds.length} members`);
      }

      setIsModalOpen(false);
      loadData(true);
    } catch (err: any) {
      setFormError(err.message || "Failed to save user group");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Details & Manage Members
  const handleOpenDetails = async (grp: UserGroup) => {
    setLoadingDetail(true);
    setSelectedGroupDetail(null);
    setDetailsModalOpen(true);
    setSelectedAddUserId("");

    try {
      const detail = await userGroupService.get(grp.id);
      setSelectedGroupDetail(detail);
    } catch (err: any) {
      setError(err.message || "Failed to load group details");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Add Member in Details Modal
  const handleAddMemberToGroup = async () => {
    if (!selectedGroupDetail || !selectedAddUserId) return;
    setIsAddingMember(true);
    setError(null);

    try {
      await userGroupService.addMembers(selectedGroupDetail.id, [selectedAddUserId]);
      const updated = await userGroupService.get(selectedGroupDetail.id);
      setSelectedGroupDetail(updated);
      setSelectedAddUserId("");
      setSuccess("Member added successfully");
      loadData(true);
    } catch (err: any) {
      setError(err.message || "Failed to add member to group");
    } finally {
      setIsAddingMember(false);
    }
  };

  // Remove Member in Details Modal
  const handleRemoveMemberFromGroup = async (userId: string, memberName: string) => {
    if (!selectedGroupDetail) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from this group?`)) return;

    setRemovingUserId(userId);
    setError(null);

    try {
      await userGroupService.removeMember(selectedGroupDetail.id, userId);
      const updated = await userGroupService.get(selectedGroupDetail.id);
      setSelectedGroupDetail(updated);
      setSuccess(`Removed ${memberName} from group`);
      loadData(true);
    } catch (err: any) {
      setError(err.message || "Failed to remove member from group");
    } finally {
      setRemovingUserId(null);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deletingGroup) return;
    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await userGroupService.delete(deletingGroup.id);
      setSuccess(res.message || `User group '${deletingGroup.name}' deleted`);
      setDeletingGroup(null);
      loadData(true);
    } catch (err: any) {
      setError(err.message || "Failed to delete group");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Groups
  const filteredGroups = groups.filter((g) => {
    const s = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(s) ||
      (g.description || "").toLowerCase().includes(s)
    );
  });

  // Non-member users for the Add Member dropdown
  const availableUsersToAdd = allUsers.filter(
    (u) => !selectedGroupDetail?.members.some((m) => m.user_id === u.id)
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-lg border border-purple-800/40">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <Users className="w-7 h-7 text-indigo-200" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-['Space_Grotesk']">
                  User Groups
                </h1>
                <p className="text-sm text-indigo-200/90 mt-1 max-w-xl font-medium">
                  Organize agents and supervisors into routing pools, teams, and departments.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                + Create Group
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3 text-sm font-semibold shadow-sm animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-center gap-3 text-sm font-semibold shadow-sm animate-in fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Groups</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.total_groups}</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Groups</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.active_groups}</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Members</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.total_members}</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Agents</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.available_agents}</p>
            </div>
          </Card>
        </div>

        {/* Search & Filter Toolbar */}
        <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search user groups by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Groups Data Table */}
        <Card className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Group Name</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-center">Members</th>
                  <th className="px-6 py-4 text-center">Inbound Routing</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                        <span>Loading user groups from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Users className="w-10 h-10 text-slate-300" />
                        <p className="font-bold text-base text-slate-700">No user groups found</p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {searchQuery || statusFilter !== "ALL"
                            ? "No user groups match your search criteria."
                            : "Create your first user group to route inbound calls and organize agents."}
                        </p>
                        {!searchQuery && statusFilter === "ALL" && (
                          <button
                            onClick={handleOpenCreateModal}
                            className="mt-2 px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-500 transition-colors"
                          >
                            + Create Group
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((grp) => (
                    <tr key={grp.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Group Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center font-bold text-xs border border-purple-200">
                            {grp.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{grp.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500 max-w-xs truncate block">
                          {grp.description || "No description provided"}
                        </span>
                      </td>

                      {/* Member Count */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleOpenDetails(grp)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold border border-indigo-100 transition-colors"
                          title="Click to view/manage members"
                        >
                          <Users className="w-3.5 h-3.5" />
                          {grp.member_count} {grp.member_count === 1 ? "Agent" : "Agents"}
                        </button>
                      </td>

                      {/* Inbound Routing Lines */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          grp.assigned_inbound_count > 0 
                            ? "bg-purple-50 text-purple-700 border-purple-200" 
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}>
                          <PhoneIncoming className="w-3 h-3" />
                          {grp.assigned_inbound_count} {grp.assigned_inbound_count === 1 ? "Number" : "Numbers"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          grp.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${grp.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {grp.status}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {grp.created_at ? new Date(grp.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetails(grp)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Manage Members & Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(grp)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Group"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingGroup(grp)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Group"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Create / Edit Group Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 font-['Space_Grotesk']">
                      {editingGroup ? "Edit User Group" : "Create New User Group"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveGroup} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  {formError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Group Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Group Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sales Team Alpha, Tier 2 Support"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Group purpose or departmental notes..."
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  {/* Member Picker */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Select Group Members ({formMemberIds.length} selected)
                      </label>
                      <span className="text-[11px] text-slate-400">Total available users: {allUsers.length}</span>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50 p-1">
                      {allUsers.length === 0 ? (
                        <p className="text-xs text-slate-400 p-4 text-center">No users available</p>
                      ) : (
                        allUsers.map((u) => {
                          const selected = formMemberIds.includes(u.id);
                          return (
                            <div
                              key={u.id}
                              onClick={() => handleToggleMemberSelection(u.id)}
                              className={`p-2.5 flex items-center justify-between rounded-lg transition-colors cursor-pointer ${
                                selected ? "bg-purple-100/60 text-purple-900" : "hover:bg-slate-100 text-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => {}} // handled by row click
                                  className="rounded text-purple-600 focus:ring-purple-500 pointer-events-none"
                                />
                                <div>
                                  <p className="text-xs font-bold">{u.full_name || u.email}</p>
                                  <p className="text-[10px] text-slate-400">{u.email}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200">
                                {u.role}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      {editingGroup ? "Update Group" : "Save Group"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Group Details & Members Management Modal */}
        <AnimatePresence>
          {detailsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 font-['Space_Grotesk']">
                        {selectedGroupDetail?.name || "Group Details & Members"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {selectedGroupDetail?.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDetailsModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                  {loadingDetail ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                      <span>Loading group members...</span>
                    </div>
                  ) : selectedGroupDetail ? (
                    <>
                      {/* Add Member Bar */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <div className="flex-1">
                          <select
                            value={selectedAddUserId}
                            onChange={(e) => setSelectedAddUserId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          >
                            <option value="">Select user to add to this group...</option>
                            {availableUsersToAdd.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.full_name || u.email} — {u.email} ({u.role})
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={handleAddMemberToGroup}
                          disabled={!selectedAddUserId || isAddingMember}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          {isAddingMember ? "Adding..." : "Add Member"}
                        </button>
                      </div>

                      {/* Members List Table */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Group Members ({selectedGroupDetail.members.length})
                          </h4>
                          <span className="text-[11px] text-slate-400 font-medium">
                            Role-based group assignments
                          </span>
                        </div>

                        {selectedGroupDetail.members.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                            No users have been added to this group yet.
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                                  <th className="px-4 py-2.5">User</th>
                                  <th className="px-4 py-2.5">Role</th>
                                  <th className="px-4 py-2.5">Status</th>
                                  <th className="px-4 py-2.5 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {selectedGroupDetail.members.map((m) => (
                                  <tr key={m.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-2.5">
                                      <div className="font-bold text-slate-900">{m.full_name}</div>
                                      <div className="text-[11px] text-slate-400">{m.email}</div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold">
                                        {m.role}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        m.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                                      }`}>
                                        {m.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                      <button
                                        onClick={() => handleRemoveMemberFromGroup(m.user_id, m.full_name)}
                                        disabled={removingUserId === m.user_id}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="Remove from group"
                                      >
                                        <UserMinus className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setDetailsModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deletingGroup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 p-6 space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 font-['Space_Grotesk']">Delete User Group</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to delete <span className="font-bold text-slate-900">"{deletingGroup.name}"</span>?
                  </p>
                  {deletingGroup.assigned_inbound_count > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                      ⚠️ This group is assigned to {deletingGroup.assigned_inbound_count} inbound numbers. Deleting it will safely unassign the group from those inbound lines.
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    Note: Deleting a group will NOT delete the member accounts.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    onClick={() => setDeletingGroup(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Delete Group
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AppShell>
  );
}

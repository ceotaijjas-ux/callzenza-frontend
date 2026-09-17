"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  inboundService, 
  InboundNumber, 
  InboundDetail, 
  InboundStats,
  InboundCreateInput,
  InboundUpdateInput
} from "@/lib/services/inbound.service";
import { userGroupService, UserGroup } from "@/lib/services/user-group.service";
import { adminService, AdminUser } from "@/lib/services/admin.service";
import { agentService, Agent } from "@/lib/services/agent.service";
import { 
  PhoneIncoming, Plus, Search, Filter, RefreshCw, CheckCircle2, 
  XCircle, Clock, ShieldAlert, PhoneCall, Bot, Users, UserCheck, 
  Layers, Edit, Trash2, Eye, Calendar, Sparkles, AlertCircle, ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocketSync, WebSocketEventMessage } from "@/lib/hooks/useWebSocketSync";

export default function InboundPage() {
  const [inbounds, setInbounds] = useState<InboundNumber[]>([]);
  const [stats, setStats] = useState<InboundStats>({
    total_numbers: 0,
    active_numbers: 0,
    calls_today: 0,
    total_inbound_calls: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [routingFilter, setRoutingFilter] = useState("ALL");

  // Selection targets for forms
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [agents, setAgents] = useState<AdminUser[]>([]);
  const [aiAgents, setAiAgents] = useState<Agent[]>([]);

  // Create / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInbound, setEditingInbound] = useState<InboundNumber | null>(null);
  const [formPhone, setFormPhone] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [formRoutingType, setFormRoutingType] = useState<"VOICE_AGENT" | "HUMAN_AGENT" | "USER_GROUP" | "QUEUE" | "IVR">("VOICE_AGENT");
  const [formAssignedAgentId, setFormAssignedAgentId] = useState("");
  const [formAssignedAiAgentId, setFormAssignedAiAgentId] = useState("");
  const [formAssignedGroupId, setFormAssignedGroupId] = useState("");
  const [formWorkingHoursStart, setFormWorkingHoursStart] = useState("09:00");
  const [formWorkingHoursEnd, setFormWorkingHoursEnd] = useState("18:00");
  const [formFallbackAction, setFormFallbackAction] = useState("VOICEMAIL");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Details Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedInboundDetail, setSelectedInboundDetail] = useState<InboundDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete Confirmation Modal state
  const [deletingInbound, setDeletingInbound] = useState<InboundNumber | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Reference Data
  const loadReferenceData = async () => {
    try {
      const [groupsRes, usersRes, aiRes] = await Promise.allSettled([
        userGroupService.list(),
        adminService.getUsers(),
        agentService.list(),
      ]);

      if (groupsRes.status === "fulfilled") {
        setUserGroups(groupsRes.value);
      }
      if (usersRes.status === "fulfilled") {
        setAgents(usersRes.value);
      }
      if (aiRes.status === "fulfilled") {
        setAiAgents(aiRes.value);
      }
    } catch (e) {
      console.warn("Failed to load some reference datasets:", e);
    }
  };

  // Load Inbound Data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [inboundList, statsRes] = await Promise.all([
        inboundService.list(
          statusFilter === "ALL" ? undefined : statusFilter,
          routingFilter === "ALL" ? undefined : routingFilter
        ),
        inboundService.getStats(),
      ]);

      setInbounds(inboundList);
      setStats(statsRes);
    } catch (err: any) {
      setError(err.message || "Failed to load inbound configurations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, routingFilter]);

  useEffect(() => {
    loadData();
    loadReferenceData();
  }, [loadData]);

  // Real-time auto-refresh when calls are transferred to inbound agents
  useWebSocketSync((msg: WebSocketEventMessage) => {
    if (
      msg.event === "voice_agent_transferred" ||
      msg.event === "TRANSFER_REQUESTED" ||
      msg.event === "inbound_number_updated" ||
      msg.event === "call_transferred" ||
      msg.event === "voice_agent_transfer_initiated"
    ) {
      loadData(true);
    }
  });

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingInbound(null);
    setFormPhone("");
    setFormName("");
    setFormDesc("");
    setFormStatus("ACTIVE");
    setFormRoutingType("VOICE_AGENT");
    setFormAssignedAgentId(agents.length > 0 ? agents[0].id : "");
    setFormAssignedAiAgentId(aiAgents.length > 0 ? aiAgents[0].id : "");
    setFormAssignedGroupId(userGroups.length > 0 ? userGroups[0].id : "");
    setFormWorkingHoursStart("09:00");
    setFormWorkingHoursEnd("18:00");
    setFormFallbackAction("VOICEMAIL");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (inb: InboundNumber) => {
    setEditingInbound(inb);
    setFormPhone(inb.phone_number);
    setFormName(inb.name);
    setFormDesc(inb.description || "");
    setFormStatus(inb.status);
    setFormRoutingType(inb.routing_type);
    setFormAssignedAgentId(inb.assigned_agent_id || (agents.length > 0 ? agents[0].id : ""));
    setFormAssignedAiAgentId(inb.assigned_ai_agent_id || (aiAgents.length > 0 ? aiAgents[0].id : ""));
    setFormAssignedGroupId(inb.assigned_group_id || (userGroups.length > 0 ? userGroups[0].id : ""));
    setFormWorkingHoursStart(inb.working_hours?.start || "09:00");
    setFormWorkingHoursEnd(inb.working_hours?.end || "18:00");
    setFormFallbackAction(inb.fallback_action || "VOICEMAIL");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Create or Edit Form
  const handleSaveInbound = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setError(null);
    setSuccess(null);

    const nameTrimmed = formName.trim();
    const phoneTrimmed = formPhone.trim();

    if (!nameTrimmed) {
      setFormError("Inbound line name is required");
      return;
    }
    if (!phoneTrimmed || phoneTrimmed.replace(/[^\d]/g, "").length < 6) {
      setFormError("Please enter a valid phone number (at least 6 digits)");
      return;
    }

    setSubmitting(true);
    try {
      const payload: InboundCreateInput = {
        name: nameTrimmed,
        phone_number: phoneTrimmed,
        description: formDesc.trim(),
        status: formStatus,
        routing_type: formRoutingType,
        assigned_agent_id: formRoutingType === "HUMAN_AGENT" ? formAssignedAgentId : null,
        assigned_ai_agent_id: formRoutingType === "VOICE_AGENT" ? formAssignedAiAgentId : null,
        assigned_group_id: formRoutingType === "USER_GROUP" ? formAssignedGroupId : null,
        working_hours: {
          start: formWorkingHoursStart,
          end: formWorkingHoursEnd,
          days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        },
        fallback_action: formFallbackAction,
      };

      if (editingInbound) {
        await inboundService.update(editingInbound.id, payload as InboundUpdateInput);
        setSuccess(`Inbound number '${nameTrimmed}' updated successfully`);
      } else {
        await inboundService.create(payload);
        setSuccess(`Inbound number '${nameTrimmed}' created successfully`);
      }

      setIsModalOpen(false);
      loadData(true);
    } catch (err: any) {
      setFormError(err.message || "Failed to save inbound number");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active / Inactive Status
  const handleToggleStatus = async (inb: InboundNumber) => {
    const nextStatus = inb.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setError(null);
    try {
      await inboundService.toggleStatus(inb.id, nextStatus);
      setSuccess(`Inbound number ${inb.phone_number} is now ${nextStatus.toLowerCase()}`);
      loadData(true);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    }
  };

  // View Details & Call History
  const handleViewDetails = async (inb: InboundNumber) => {
    setLoadingDetail(true);
    setSelectedInboundDetail(null);
    setDetailsModalOpen(true);
    try {
      const detail = await inboundService.get(inb.id);
      setSelectedInboundDetail(detail);
    } catch (err: any) {
      setError(err.message || "Failed to load inbound details");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deletingInbound) return;
    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await inboundService.delete(deletingInbound.id);
      setSuccess(res.message || `Inbound number '${deletingInbound.name}' deleted`);
      setDeletingInbound(null);
      loadData(true);
    } catch (err: any) {
      setError(err.message || "Failed to delete inbound number");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter Data
  const filteredInbounds = inbounds.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(searchLower) ||
      item.phone_number.toLowerCase().includes(searchLower) ||
      (item.assigned_agent_name || "").toLowerCase().includes(searchLower) ||
      (item.assigned_group_name || "").toLowerCase().includes(searchLower) ||
      (item.assigned_ai_agent_name || "").toLowerCase().includes(searchLower) ||
      (item.description || "").toLowerCase().includes(searchLower);

    return matchesSearch;
  });

  const getRoutingBadge = (type: string) => {
    switch (type) {
      case "VOICE_AGENT":
        return { label: "Voice Agent (AI)", icon: Bot, cls: "bg-purple-100 text-purple-700 border-purple-200" };
      case "HUMAN_AGENT":
        return { label: "Human Agent", icon: UserCheck, cls: "bg-blue-100 text-blue-700 border-blue-200" };
      case "USER_GROUP":
        return { label: "User Group", icon: Users, cls: "bg-indigo-100 text-indigo-700 border-indigo-200" };
      case "QUEUE":
        return { label: "Call Queue", icon: Layers, cls: "bg-amber-100 text-amber-700 border-amber-200" };
      default:
        return { label: "IVR Routing", icon: PhoneCall, cls: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 sm:p-8 text-white shadow-lg border border-indigo-700/40">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <PhoneIncoming className="w-7 h-7 text-indigo-200" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-['Space_Grotesk']">
                  Inbound Calls
                </h1>
                <p className="text-sm text-indigo-200/90 mt-1 max-w-xl font-medium">
                  Manage inbound numbers, routing configuration, and assigned agents/groups.
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-900/40 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                + Add Inbound Number
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
              <PhoneIncoming className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Inbound Numbers</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.total_numbers}</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Numbers</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.active_numbers}</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Calls Today</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.calls_today}</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Inbound Calls</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.total_inbound_calls}</p>
            </div>
          </Card>
        </div>

        {/* Toolbar (Search & Filter) */}
        <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, phone number, agent or user group..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Routing Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Routing:</span>
                <select
                  value={routingFilter}
                  onChange={(e) => setRoutingFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="ALL">All Routing Types</option>
                  <option value="VOICE_AGENT">Voice Agent (AI)</option>
                  <option value="HUMAN_AGENT">Human Agent</option>
                  <option value="USER_GROUP">User Group</option>
                  <option value="QUEUE">Call Queue</option>
                  <option value="IVR">IVR</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <Card className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Name / Description</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Routing Type</th>
                  <th className="px-6 py-4">Assigned Target</th>
                  <th className="px-6 py-4 text-center">Calls Today</th>
                  <th className="px-6 py-4">Last Call</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                        <span>Loading inbound configurations from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredInbounds.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <PhoneIncoming className="w-10 h-10 text-slate-300" />
                        <p className="font-bold text-base text-slate-700">No inbound numbers found</p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {searchQuery || statusFilter !== "ALL" || routingFilter !== "ALL"
                            ? "No inbound numbers match your active filters. Try resetting search."
                            : "Click '+ Add Inbound Number' to configure your first inbound routing number."}
                        </p>
                        {!searchQuery && statusFilter === "ALL" && routingFilter === "ALL" && (
                          <button
                            onClick={handleOpenCreateModal}
                            className="mt-2 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500 transition-colors"
                          >
                            + Add Inbound Number
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInbounds.map((inb) => {
                    const routing = getRoutingBadge(inb.routing_type);
                    const RoutingIcon = routing.icon;
                    const assignedTarget =
                      inb.routing_type === "USER_GROUP"
                        ? inb.assigned_group_name || "Unassigned Group"
                        : inb.routing_type === "HUMAN_AGENT"
                        ? inb.assigned_agent_name || "Unassigned Agent"
                        : inb.routing_type === "VOICE_AGENT"
                        ? inb.assigned_ai_agent_name || "Default AI Agent"
                        : inb.routing_type;

                    return (
                      <tr key={inb.id} className="hover:bg-slate-50/60 transition-colors group">
                        {/* Phone Number */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-900 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100 text-xs">
                              {inb.phone_number}
                            </span>
                          </div>
                        </td>

                        {/* Name & Desc */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{inb.name}</div>
                          {inb.description && (
                            <div className="text-xs text-slate-400 truncate max-w-xs">{inb.description}</div>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(inb)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                              inb.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            }`}
                            title="Click to toggle status"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${inb.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"}`} />
                            {inb.status}
                          </button>
                        </td>

                        {/* Routing Type */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${routing.cls}`}>
                            <RoutingIcon className="w-3.5 h-3.5" />
                            {routing.label}
                          </span>
                        </td>

                        {/* Assigned Target */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {assignedTarget}
                          </span>
                        </td>

                        {/* Calls Today */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100/70 px-2 py-0.5 rounded-md text-xs">
                            {inb.calls_today}
                          </span>
                        </td>

                        {/* Last Call */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          {inb.last_call_at ? new Date(inb.last_call_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "No calls yet"}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewDetails(inb)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View Details & Calls"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(inb)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Inbound"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingInbound(inb)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Inbound"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add / Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      <PhoneIncoming className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 font-['Space_Grotesk']">
                      {editingInbound ? "Edit Inbound Number" : "Add Inbound Number"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveInbound} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  {formError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Inbound Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sales Inbound Hotline"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +1 555 019 2834 or +91 98765 43210"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Notes or operational description..."
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Status & Routing Type in Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Routing Type</label>
                      <select
                        value={formRoutingType}
                        onChange={(e) => setFormRoutingType(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        <option value="VOICE_AGENT">Voice Agent (AI)</option>
                        <option value="HUMAN_AGENT">Human Agent</option>
                        <option value="USER_GROUP">User Group</option>
                        <option value="QUEUE">Call Queue</option>
                        <option value="IVR">IVR</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Assignment based on Routing Type */}
                  {formRoutingType === "VOICE_AGENT" && (
                    <div className="space-y-1.5 bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
                      <label className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                        Assigned AI Agent
                      </label>
                      <select
                        value={formAssignedAiAgentId}
                        onChange={(e) => setFormAssignedAiAgentId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-sm font-medium text-purple-950 outline-none"
                      >
                        <option value="">Default AI Voice Agent</option>
                        {aiAgents.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.type || "AI Voice"})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formRoutingType === "HUMAN_AGENT" && (
                    <div className="space-y-1.5 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                      <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                        Assigned Human Agent
                      </label>
                      <select
                        value={formAssignedAgentId}
                        onChange={(e) => setFormAssignedAgentId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-medium text-blue-950 outline-none"
                      >
                        <option value="">Select Agent...</option>
                        {agents.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name || u.email} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formRoutingType === "USER_GROUP" && (
                    <div className="space-y-1.5 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
                      <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Assigned User Group
                      </label>
                      <select
                        value={formAssignedGroupId}
                        onChange={(e) => setFormAssignedGroupId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-sm font-medium text-indigo-950 outline-none"
                      >
                        <option value="">Select User Group...</option>
                        {userGroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.member_count || 0} members)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Fallback Option */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Fallback Action</label>
                    <select
                      value={formFallbackAction}
                      onChange={(e) => setFormFallbackAction(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="VOICEMAIL">Route to Voicemail</option>
                      <option value="AI_AGENT">Fallback to AI Agent</option>
                      <option value="HANGUP">Play Announcement and Hangup</option>
                    </select>
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
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      {editingInbound ? "Update Configuration" : "Save Inbound Number"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Inbound Details & Call History Modal */}
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
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      <PhoneIncoming className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 font-['Space_Grotesk']">
                        {selectedInboundDetail?.name || "Inbound Number Details"}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono font-bold">
                        {selectedInboundDetail?.phone_number}
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
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      <span>Loading call records from database...</span>
                    </div>
                  ) : selectedInboundDetail ? (
                    <>
                      {/* Configuration Details Summary */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Routing Type</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedInboundDetail.routing_type}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Target</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">
                            {selectedInboundDetail.assigned_group_name ||
                              selectedInboundDetail.assigned_agent_name ||
                              selectedInboundDetail.assigned_ai_agent_name ||
                              "Default"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Calls</p>
                          <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{selectedInboundDetail.total_calls}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                            selectedInboundDetail.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          }`}>
                            {selectedInboundDetail.status}
                          </span>
                        </div>
                      </div>

                      {/* Recent Inbound Calls */}
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-600" />
                          Recent Inbound Call Logs
                        </h4>

                        {selectedInboundDetail.recent_calls.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                            No inbound calls recorded for this phone number yet.
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                                  <th className="px-4 py-2.5">Caller (From)</th>
                                  <th className="px-4 py-2.5">Status</th>
                                  <th className="px-4 py-2.5">Duration</th>
                                  <th className="px-4 py-2.5">Time</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {selectedInboundDetail.recent_calls.map((c) => (
                                  <tr key={c.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{c.from_number}</td>
                                    <td className="px-4 py-2.5">
                                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase">
                                        {c.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 font-mono font-semibold text-slate-800">
                                      {Math.floor((c.duration_seconds || 0) / 60)}m {(c.duration_seconds || 0) % 60}s
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-500">
                                      {c.created_at ? new Date(c.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—"}
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
          {deletingInbound && (
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
                  <h3 className="text-lg font-black text-slate-900 font-['Space_Grotesk']">Delete Inbound Number</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to delete <span className="font-bold text-slate-900">"{deletingInbound.name}" ({deletingInbound.phone_number})</span>? Inbound calls will no longer route to this destination.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    onClick={() => setDeletingInbound(null)}
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
                    Delete Inbound
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

"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { expertService, Expert } from "@/lib/services/expert.service";
import { voiceAgentService } from "@/lib/services/voice-agent.service";
import { mgmtAgentService } from "@/lib/services/agent.service";
import { adminService } from "@/lib/services/admin.service";
import { leadAssignmentService } from "@/lib/services/lead-assignment.service";
import { campaignService } from "@/lib/services/campaign.service";
import { useAuthStore } from "@/lib/store";
import { 
  UserCheck, 
  PhoneCall, 
  PhoneOff, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  User, 
  Phone, 
  Mail, 
  Building2, 
  X, 
  RefreshCw, 
  ShieldAlert,
  ArrowUpRight,
  UserPlus,
  Users,
  Search,
  Edit2,
  Trash2,
  Filter,
  Check,
  ArrowLeft,
  Calendar,
  TrendingUp,
  Layers,
  Award,
  History,
  PhoneIncoming,
  PhoneOutgoing,
  Eye,
  EyeOff,
  Radio,
  Zap,
} from "lucide-react";

export default function VoiceAgentPortalPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Expert | null>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [allExperts, setAllExperts] = useState<Expert[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Predictive Dialer (PD) & Refresh state
  const [pdActive, setPdActive] = useState<boolean>(false);
  const [activePdCount, setActivePdCount] = useState<number>(0);
  const [isPdLoading, setIsPdLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showPdSelector, setShowPdSelector] = useState<boolean>(false);
  const [pdSearchQuery, setPdSearchQuery] = useState<string>("");
  const [togglingAgentPdId, setTogglingAgentPdId] = useState<string | null>(null);

  const handleRefreshAvailability = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await loadPortalData();
      await fetchPdStatus();
      setSuccess("Current Availability & Voice Agent Roster synced with live server!");
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err?.message || "Failed to refresh availability status.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchPdStatus = async () => {
    try {
      const res = await campaignService.getActivePdStatus();
      if (typeof res.active_agents_count === "number") {
        setActivePdCount(res.active_agents_count);
        setPdActive(res.active_agents_count > 0);
      } else {
        setPdActive(Boolean(res.auto_dial_enabled || res.status === "ACTIVE"));
      }
    } catch (err) {
      console.error("Error fetching PD status in expert portal:", err);
    }
  };

  useEffect(() => {
    fetchPdStatus();
  }, []);

  const handleToggleAgentPd = async (agentId: string, enable?: boolean) => {
    setTogglingAgentPdId(agentId);
    setError(null);
    try {
      const updatedAgent = await voiceAgentService.togglePd(agentId, enable);
      setAllExperts((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, auto_dial_enabled: updatedAgent.auto_dial_enabled } : a))
      );
      if (profile && profile.id === agentId) {
        setProfile((prev) => prev ? { ...prev, auto_dial_enabled: updatedAgent.auto_dial_enabled } : null);
      }
      if (agentOverview && agentOverview.agent && agentOverview.agent.id === agentId) {
        setAgentOverview((prev: any) =>
          prev ? { ...prev, agent: { ...prev.agent, auto_dial_enabled: updatedAgent.auto_dial_enabled } } : null
        );
      }
      setAllExperts((latest) => {
        const count = latest.filter((a) => Boolean(a.id === agentId ? updatedAgent.auto_dial_enabled : a.auto_dial_enabled)).length;
        setActivePdCount(count);
        setPdActive(count > 0);
        return latest;
      });
      setSuccess(`Predictive Dialer ${updatedAgent.auto_dial_enabled ? "ACTIVATED" : "DEACTIVATED"} for ${updatedAgent.name}`);
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      console.error("Failed to toggle agent PD:", err);
      setError(err?.message || "Failed to toggle Predictive Dialer for agent.");
    } finally {
      setTogglingAgentPdId(null);
    }
  };

  const handleDeactivateAllPd = async () => {
    setIsPdLoading(true);
    setError(null);
    try {
      const activeAgents = allExperts.filter((a) => a.auto_dial_enabled);
      for (const ag of activeAgents) {
        await voiceAgentService.togglePd(ag.id, false).catch(() => null);
      }
      await loadPortalData();
      setSuccess("All Voice Agent Predictive Dialers have been deactivated.");
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err?.message || "Failed to deactivate all PDs.");
    } finally {
      setIsPdLoading(false);
    }
  };

  const handleTogglePd = async () => {
    // Open selector modal so user can choose specifically which agent gets PD
    setShowPdSelector(true);
  };

  // Voice Agents Management Directory Modal State
  const [showAgentsModal, setShowAgentsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Edit Agent Modal State
  const [editingAgent, setEditingAgent] = useState<Expert | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editStatus, setEditStatus] = useState("AVAILABLE");
  const [editDirection, setEditDirection] = useState("Inbound");
  const [editCampaignId, setEditCampaignId] = useState("");
  const [editAutoDialEnabled, setEditAutoDialEnabled] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [allCampaigns, setAllCampaigns] = useState<any[]>([]);
  const [rosterSubTab, setRosterSubTab] = useState<"ROSTER" | "TRANSFERS">("ROSTER");

  // Create Voice Agent Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentPhone, setNewAgentPhone] = useState("");
  const [newAgentPassword, setNewAgentPassword] = useState("");
  const [newAgentDirection, setNewAgentDirection] = useState("Inbound");
  const [creatingAgent, setCreatingAgent] = useState(false);

  // Complete Call Modal State
  const [selectedCall, setSelectedCall] = useState<any | null>(null);
  const [voiceNotes, setVoiceNotes] = useState("");
  const [finalOutcome, setFinalOutcome] = useState("Qualified - Sales Closed");
  const [leadStatus, setLeadStatus] = useState("QUALIFIED");
  const [submittingOutcome, setSubmittingOutcome] = useState(false);

  // Selected Agent Details View State
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentOverview, setAgentOverview] = useState<any | null>(null);
  const [agentCampaigns, setAgentCampaigns] = useState<any[]>([]);
  const [agentLeads, setAgentLeads] = useState<any[]>([]);
  const [agentQualifiedCalls, setAgentQualifiedCalls] = useState<any[]>([]);
  const [agentCallHistory, setAgentCallHistory] = useState<any[]>([]);
  const [loadingAgentDetails, setLoadingAgentDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "campaigns" | "leads" | "qualified" | "history">("overview");

  // Detail Tab Filters
  const [campaignStatusFilter, setCampaignStatusFilter] = useState("ALL");
  const [leadsSearch, setLeadsSearch] = useState("");
  const [historyRangeFilter, setHistoryRangeFilter] = useState("all_time");

  const loadAgentDetails = async (agentId: string) => {
    setLoadingAgentDetails(true);
    try {
      const [agentDirect, overviewData, campaignsData, leadsData, qualData, histData] = await Promise.all([
        voiceAgentService.get(agentId).catch(() => null),
        voiceAgentService.getOverview(agentId).catch(() => null),
        voiceAgentService.getCampaigns(agentId).catch(() => []),
        voiceAgentService.getLeads(agentId).catch(() => []),
        voiceAgentService.getQualifiedCalls(agentId).catch(() => []),
        voiceAgentService.getCallHistory(agentId).catch(() => []),
      ]);

      const finalOverview = overviewData || {
        agent: agentDirect,
        total_campaigns: campaignsData.length,
        total_leads_worked: leadsData.length,
        qualified_calls: qualData.length,
        calls_handled: histData.length,
        active_calls: 0,
      };

      if (!finalOverview.agent && agentDirect) {
        finalOverview.agent = agentDirect;
      }

      setAgentOverview(finalOverview);
      setAgentCampaigns(campaignsData);
      setAgentLeads(leadsData);
      setAgentQualifiedCalls(qualData);
      setAgentCallHistory(histData);
    } catch (err: any) {
      console.error("Failed to load agent details", err);
    } finally {
      setLoadingAgentDetails(false);
    }
  };

  useEffect(() => {
    if (selectedAgentId) {
      loadAgentDetails(selectedAgentId);
    }
  }, [selectedAgentId]);

  const loadPortalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await expertService.getMe().catch(() => null);
      if (me) setProfile(me);

      let [c, l, expList, assignList, qList, campList] = await Promise.all([
        me ? expertService.getMeCalls().catch(() => []) : [],
        me ? expertService.getMeLeads().catch(() => []) : [],
        voiceAgentService.list().catch(() => []),
        leadAssignmentService.getAssignments().catch(() => []),
        leadAssignmentService.getQueue("WAITING").catch(() => []),
        campaignService.list().catch(() => []),
      ]);
      if (expList.length === 0) {
        expList = await expertService.list().catch(() => []);
      }
      setCalls(c);
      setLeads(l);
      setAllExperts(expList);
      setAssignments(assignList);
      setQueueItems(qList);
      setAllCampaigns(campList);

      const activeCount = expList.filter((e: any) => Boolean(e.auto_dial_enabled)).length;
      setActivePdCount(activeCount);
      setPdActive(activeCount > 0);
    } catch (err: any) {
      console.error("Failed to load portal data", err);
      setError(err.message || "Failed to load voice agent profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
    const interval = setInterval(() => {
      loadPortalData();
    }, 10000); // Polling status updates every 10s
    return () => clearInterval(interval);
  }, []);

  const handleStatusToggle = async (newStatus: string) => {
    if (!profile) return;
    setUpdatingStatus(true);
    setError(null);
    try {
      const updated = await expertService.updateStatus(newStatus);
      setProfile(updated);
      setSuccess(`Status updated to ${newStatus}`);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCompleteCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCall) return;
    setSubmittingOutcome(true);
    setError(null);
    try {
      await expertService.completeCall(selectedCall.id, {
        voice_notes: voiceNotes,
        final_outcome: finalOutcome,
        lead_status: leadStatus,
      });
      setSuccess(`Call details & outcome recorded for ${selectedCall.lead_name || "Lead"}`);
      setSelectedCall(null);
      setVoiceNotes("");
      loadPortalData();
    } catch (err: any) {
      setError(err.message || "Failed to save call outcome");
    } finally {
      setSubmittingOutcome(false);
    }
  };

  const handleCreateVoiceAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentEmail.trim()) return;
    setCreatingAgent(true);
    setError(null);
    try {
      await voiceAgentService.create({
        name: newAgentName || newAgentEmail,
        email: newAgentEmail,
        password: newAgentPassword,
        phone: newAgentPhone,
        status: "AVAILABLE"
      });
      await mgmtAgentService.create({
        type: "VOICE",
        name: newAgentName || newAgentEmail,
        email: newAgentEmail,
        password: newAgentPassword,
      }).catch(() => null);

      setSuccess(`Voice Agent "${newAgentName || newAgentEmail}" created successfully!`);
      setShowCreateModal(false);
      setNewAgentName("");
      setNewAgentEmail("");
      setNewAgentPhone("");
      setNewAgentPassword("");
      await loadPortalData();
    } catch (err: any) {
      setError(err.message || "Failed to create voice agent");
    } finally {
      setCreatingAgent(false);
    }
  };

  const handleAgentStatusChange = async (agentId: string, newStatus: string) => {
    setError(null);
    try {
      await voiceAgentService.updateStatus(agentId, newStatus);
      setSuccess(`Agent status updated to ${newStatus}`);
      loadPortalData();
    } catch (err: any) {
      setError(err.message || "Failed to update agent status");
    }
  };

  const handleAgentDirectionChange = async (agentId: string, newDirection: string) => {
    setError(null);
    try {
      await voiceAgentService.updateDirection(agentId, newDirection);
      setSuccess(`Agent direction updated to ${newDirection}`);
      // Optimistically update allExperts
      setAllExperts((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? {
                ...a,
                direction: newDirection.toUpperCase(),
                agent_type: newDirection.toUpperCase() as any,
                skills: [newDirection.toUpperCase()],
              }
            : a
        )
      );
      await loadPortalData();
    } catch (err: any) {
      setError(err.message || "Failed to update agent direction");
    }
  };

  const handleAssignCampaignToAgent = async (agentId: string, campaignId: string) => {
    setError(null);
    try {
      if (campaignId) {
        await campaignService.update(campaignId, { voice_agent_id: agentId });
        setSuccess("Voice Agent campaign assignment updated successfully!");
      } else {
        const assignedCamps = allCampaigns.filter(
          (c) => c.voice_agent_id === agentId || (c.voice_agent_id && c.voice_agent_id.split(",").includes(agentId))
        );
        for (const c of assignedCamps) {
          await campaignService.update(c.id, { voice_agent_id: null });
        }
        setSuccess("Voice Agent unassigned from campaign.");
      }
      await loadPortalData();
    } catch (err: any) {
      setError(err.message || "Failed to update campaign assignment");
    }
  };

  const handleOpenEdit = (agent: any) => {
    setEditingAgent(agent);
    setEditName(agent.name);
    setEditEmail(agent.email);
    setEditPassword(agent.password || "");
    setShowEditPassword(false);
    setEditStatus(agent.status);
    const rawDir = (agent.direction || agent.agent_type || (agent.skills?.includes("OUTBOUND") ? "OUTBOUND" : "INBOUND") || "INBOUND").toUpperCase();
    setEditDirection(rawDir === "OUTBOUND" ? "Outbound" : "Inbound");
    const assigned = allCampaigns.find(
      (c) => c.voice_agent_id === agent.id || (c.voice_agent_id && c.voice_agent_id.split(",").includes(agent.id))
    );
    setEditCampaignId(assigned ? assigned.id : "");
    setEditAutoDialEnabled(Boolean(agent.auto_dial_enabled));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    setSavingEdit(true);
    setError(null);
    try {
      await voiceAgentService.update(editingAgent.id, {
        name: editName,
        email: editEmail,
        password: editPassword,
        status: editStatus,
        direction: editDirection,
        agent_type: editDirection.toUpperCase(),
        auto_dial_enabled: editAutoDialEnabled,
      } as any);
      if (editCampaignId) {
        await campaignService.update(editCampaignId, { voice_agent_id: editingAgent.id });
      }
      setSuccess(`Voice Agent "${editName}" updated successfully`);
      setEditingAgent(null);
      loadPortalData();
    } catch (err: any) {
      setError(err.message || "Failed to update voice agent");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to delete Voice Agent "${agentName}"?`)) return;
    setError(null);
    try {
      await voiceAgentService.delete(agentId);
      setSuccess(`Voice Agent "${agentName}" deleted successfully`);
      loadPortalData();
    } catch (err: any) {
      setError(err.message || "Failed to delete voice agent");
    }
  };

  const filteredExperts = allExperts.filter((agent) => {
    // Strictly ensure only voice agents created for handling calls appear here - never show supervisors or admins
    const agentRole = ((agent as any).role || "").toUpperCase();
    const agentType = ((agent as any).agent_type || "").toUpperCase();
    const emailLower = (agent.email || "").toLowerCase();
    if (
      agentType === "ADMIN" ||
      agentRole === "SUPER_ADMIN" ||
      agentRole === "ADMIN" ||
      agentRole === "SUPERVISOR" ||
      agentRole === "BUSINESS_OWNER" ||
      agentRole === "USER" ||
      emailLower.includes("admin@callzenza.com") ||
      emailLower.includes("admin@callmira.com") ||
      emailLower.includes("superadmin@") ||
      emailLower.includes("superv@")
    ) {
      return false;
    }

    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const computedStatus =
      ((agent as any).active_calls && (agent as any).active_calls > 0) || agent.status === "ON_CALL" || agent.status === "BUSY"
        ? "BUSY"
        : agent.status;

    const matchesStatus =
      statusFilter === "ALL" ||
      computedStatus === statusFilter ||
      (statusFilter === "AVAILABLE" && (computedStatus === "AVAILABLE" || computedStatus === "FREE" || computedStatus === "PAUSED" || computedStatus === "IDLE")) ||
      (statusFilter === "BUSY" && (computedStatus === "BUSY" || computedStatus === "ON_CALL")) ||
      (statusFilter === "OFFLINE" && (computedStatus === "OFFLINE" || computedStatus === "UNAVAILABLE"));

    return matchesSearch && matchesStatus;
  });

  const activeCall = calls.find(
    (c) => c.status === "TRANSFERRING" || c.status === "IN_PROGRESS"
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        {selectedAgentId ? (
          /* ========================================================================= */
          /* VOICE AGENT DETAILS PAGE (FULL PROFILE & HISTORICAL AUDIT LOGS)           */
          /* ========================================================================= */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Navigation Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <Button
                variant="outline"
                onClick={() => setSelectedAgentId(null)}
                className="gap-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl font-bold text-xs cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="h-4 w-4 text-indigo-600" /> ← Back to Voice Agents
              </Button>
              <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
                Voice Agent Detailed History & Audit Roster
              </span>
            </div>

            {/* Loading State */}
            {loadingAgentDetails && (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" />
                <span className="text-xs font-semibold text-gray-400">Loading Voice Agent Details & History...</span>
              </div>
            )}

            {/* Agent Summary Card */}
            {agentOverview && (
              <Card className="p-6 border-gray-200 shadow-md rounded-3xl bg-white overflow-hidden">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-150">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-indigo-200 shrink-0">
                      {agentOverview.agent.name ? agentOverview.agent.name[0].toUpperCase() : "V"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-extrabold text-gray-900">{agentOverview.agent.name}</h2>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                          agentOverview.agent.status === "AVAILABLE"
                            ? "bg-emerald-100 text-emerald-800"
                            : agentOverview.agent.status === "BUSY" || agentOverview.agent.status === "ON_CALL"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${
                            agentOverview.agent.status === "AVAILABLE" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                          }`} />
                          ● {agentOverview.agent.status}
                        </span>

                        <button
                          type="button"
                          disabled={togglingAgentPdId === agentOverview.agent.id}
                          onClick={() => handleToggleAgentPd(agentOverview.agent.id, !agentOverview.agent.auto_dial_enabled)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border cursor-pointer transition-all ${
                            agentOverview.agent.auto_dial_enabled
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                              : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                          }`}
                          title="Click to toggle Predictive Dialer for this agent"
                        >
                          <span className={`h-2 w-2 rounded-full ${
                            agentOverview.agent.auto_dial_enabled ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                          }`} />
                          {togglingAgentPdId === agentOverview.agent.id ? "Updating PD..." : `PD: ${agentOverview.agent.auto_dial_enabled ? "ACTIVE" : "INACTIVE"}`}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 flex flex-wrap items-center gap-3 font-medium">
                        <span>Voice Agent ID: <strong className="font-mono text-gray-700">VA-{agentOverview.agent.id.slice(0, 6)}</strong></span>
                        <span>•</span>
                        <span>Email: <strong className="text-gray-700">{agentOverview.agent.email}</strong></span>
                        <span>•</span>
                        <span>Phone/Extension: <strong className="text-gray-700">{agentOverview.agent.phone || "1001"}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(agentOverview.agent)}
                      className="border-gray-200 font-bold text-xs rounded-xl gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-indigo-600" /> Edit Profile
                    </Button>
                  </div>
                </div>

                {/* Metric Summary Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-6">
                  <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                    <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">Total Campaigns</span>
                    <span className="text-2xl font-extrabold text-indigo-950">{agentOverview.total_campaigns}</span>
                  </div>
                  <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">Total Leads Worked</span>
                    <span className="text-2xl font-extrabold text-emerald-950">{agentOverview.total_leads_worked}</span>
                  </div>
                  <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-2xl">
                    <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block mb-1">Qualified Calls</span>
                    <span className="text-2xl font-extrabold text-purple-950">{agentOverview.qualified_calls}</span>
                  </div>
                  <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl">
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">Calls Handled</span>
                    <span className="text-2xl font-extrabold text-blue-950">{agentOverview.calls_handled}</span>
                  </div>
                  <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1">Active Calls</span>
                    <span className="text-2xl font-extrabold text-amber-950">{agentOverview.active_calls}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Navigation Tabs Bar */}
            <div className="flex border border-gray-200 overflow-x-auto gap-2 bg-white p-2 rounded-2xl shadow-xs">
              {[
                { id: "overview", label: "Overview", icon: Layers },
                { id: "campaigns", label: "Campaigns", icon: Building2 },
                { id: "leads", label: "Leads Worked", icon: Users },
                { id: "qualified", label: "Qualified Calls", icon: Award },
                { id: "history", label: "Call History", icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT SECTIONS */}

            {/* 1. OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 border-gray-200 shadow-sm rounded-3xl bg-white lg:col-span-2 space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" /> Performance & Qualification Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Qualification Conversion Rate</p>
                      <h4 className="text-2xl font-extrabold text-gray-900 mt-1">
                        {agentOverview?.calls_handled ? Math.round((agentOverview.qualified_calls / agentOverview.calls_handled) * 100) : 0}%
                      </h4>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Average Call Duration</p>
                      <h4 className="text-2xl font-extrabold text-gray-900 mt-1">04:15 min</h4>
                    </div>
                  </div>
                  <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed font-medium">
                    <strong className="block text-indigo-950 font-bold mb-1">Permanent Audit Guarantee:</strong>
                    All calls, campaigns, and lead qualification history handled by <strong>{agentOverview?.agent?.name}</strong> remain permanently saved in the database even after campaigns conclude or status changes.
                  </div>
                </Card>

                <Card className="p-6 border-gray-200 shadow-sm rounded-3xl bg-white space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-emerald-600" /> Agent Credentials
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Agent Name:</span>
                      <span className="font-bold text-gray-900">{agentOverview?.agent?.name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Login Email:</span>
                      <span className="font-mono text-gray-900">{agentOverview?.agent?.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Phone / Extension:</span>
                      <span className="font-mono text-gray-900">{agentOverview?.agent?.phone || "1001"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Created Date:</span>
                      <span className="font-semibold text-gray-700">
                        {agentOverview?.agent?.created_at ? new Date(agentOverview.agent.created_at).toLocaleDateString() : "—"}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* 2. CAMPAIGNS TAB */}
            {activeTab === "campaigns" && (
              <Card className="p-6 border-gray-200 shadow-sm rounded-3xl bg-white space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-600" /> Campaigns History
                  </h3>
                  <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                    {["ALL", "ACTIVE", "COMPLETED"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setCampaignStatusFilter(st)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          campaignStatusFilter === st ? "bg-white text-gray-900 shadow-xs" : "text-gray-500"
                        }`}
                      >
                        {st === "ALL" ? "All Campaigns" : st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-3">Campaign Name</th>
                        <th className="pb-3">Campaign ID</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Assigned Date</th>
                        <th className="pb-3">Total Leads</th>
                        <th className="pb-3">Leads Worked</th>
                        <th className="pb-3">Qualified</th>
                        <th className="pb-3">Calls Handled</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {agentCampaigns
                        .filter((c) => campaignStatusFilter === "ALL" || c.status.toUpperCase() === campaignStatusFilter)
                        .map((camp) => (
                          <tr key={camp.id} className="hover:bg-gray-50/70">
                            <td className="py-3.5 font-bold text-gray-900">{camp.name}</td>
                            <td className="py-3.5 text-xs font-mono text-gray-400">{camp.id.slice(0, 8)}...</td>
                            <td className="py-3.5">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                camp.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                              }`}>
                                {camp.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-xs text-gray-500">{camp.assigned_date}</td>
                            <td className="py-3.5 text-xs font-semibold">{camp.total_leads}</td>
                            <td className="py-3.5 text-xs font-bold text-indigo-600">{camp.leads_worked}</td>
                            <td className="py-3.5 text-xs font-bold text-emerald-600">{camp.qualified_leads}</td>
                            <td className="py-3.5 text-xs font-bold text-gray-900">{camp.calls_handled}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* 3. LEADS WORKED TAB */}
            {activeTab === "leads" && (
              <Card className="p-6 border-gray-200 shadow-sm rounded-3xl bg-white space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" /> Historical Leads Handled
                  </h3>
                  <div className="relative w-full sm:w-72">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      value={leadsSearch}
                      onChange={(e) => setLeadsSearch(e.target.value)}
                      placeholder="Search lead name or phone..."
                      className="pl-9 bg-gray-50 border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-3">Lead Name</th>
                        <th className="pb-3">Phone Number</th>
                        <th className="pb-3">Campaign</th>
                        <th className="pb-3">Call Date/Time</th>
                        <th className="pb-3">Duration</th>
                        <th className="pb-3">Call Status</th>
                        <th className="pb-3">AI Result</th>
                        <th className="pb-3">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {agentLeads
                        .filter((l) => !leadsSearch || l.lead_name.toLowerCase().includes(leadsSearch.toLowerCase()) || l.phone.includes(leadsSearch))
                        .map((lead, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/70">
                            <td className="py-3.5 font-bold text-gray-900">{lead.lead_name}</td>
                            <td className="py-3.5 text-xs font-mono text-gray-600">{lead.phone}</td>
                            <td className="py-3.5 text-xs font-semibold text-gray-500">{lead.campaign_name}</td>
                            <td className="py-3.5 text-xs text-gray-400">{lead.call_date_time}</td>
                            <td className="py-3.5 text-xs font-mono">{lead.duration}</td>
                            <td className="py-3.5">
                              <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold">
                                {lead.call_status}
                              </span>
                            </td>
                            <td className="py-3.5 text-xs font-bold text-emerald-600">{lead.ai_qualification_result}</td>
                            <td className="py-3.5 text-xs text-gray-600 truncate max-w-xs">{lead.voice_agent_outcome}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* 4. QUALIFIED CALLS TAB */}
            {activeTab === "qualified" && (
              <Card className="p-6 border-gray-200 shadow-sm rounded-3xl bg-white space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-600" /> Qualified & Transferred Calls History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-3">Lead Name</th>
                        <th className="pb-3">Phone</th>
                        <th className="pb-3">Campaign</th>
                        <th className="pb-3">Qualification Date</th>
                        <th className="pb-3">Transfer Date/Time</th>
                        <th className="pb-3">Duration</th>
                        <th className="pb-3">Final Outcome</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {agentQualifiedCalls.map((c, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/70">
                          <td className="py-3.5 font-bold text-gray-900">{c.lead_name}</td>
                          <td className="py-3.5 text-xs font-mono text-gray-600">{c.phone}</td>
                          <td className="py-3.5 text-xs font-semibold text-gray-500">{c.campaign_name}</td>
                          <td className="py-3.5 text-xs text-gray-400">{c.qualification_date}</td>
                          <td className="py-3.5 text-xs text-gray-500 font-mono">{c.call_transfer_date}</td>
                          <td className="py-3.5 text-xs font-mono">{c.duration}</td>
                          <td className="py-3.5 text-xs font-bold text-emerald-700">{c.final_outcome}</td>
                          <td className="py-3.5">
                            <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                              QUALIFIED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* 5. CALL HISTORY TAB */}
            {activeTab === "history" && (
              <Card className="p-6 border-gray-200 shadow-sm rounded-3xl bg-white space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <History className="h-5 w-5 text-indigo-600" /> Permanent Working Audit Log
                  </h3>
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                    {[
                      { id: "all_time", label: "All Time" },
                      { id: "today", label: "Today" },
                      { id: "yesterday", label: "Yesterday" },
                      { id: "7days", label: "7 Days" },
                      { id: "30days", label: "30 Days" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setHistoryRangeFilter(f.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          historyRangeFilter === f.id ? "bg-white text-gray-900 shadow-xs" : "text-gray-500"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-3">Date & Time</th>
                        <th className="pb-3">Campaign</th>
                        <th className="pb-3">Lead</th>
                        <th className="pb-3">Call Type</th>
                        <th className="pb-3">AI Duration</th>
                        <th className="pb-3">Transfer Status</th>
                        <th className="pb-3">Voice Agent Duration</th>
                        <th className="pb-3">Total Duration</th>
                        <th className="pb-3">Final Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {agentCallHistory.map((h, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/70">
                          <td className="py-3.5 text-xs font-mono text-gray-500">{h.date_time}</td>
                          <td className="py-3.5 text-xs font-semibold text-gray-600">{h.campaign_name}</td>
                          <td className="py-3.5 font-bold text-gray-900">{h.lead_name}</td>
                          <td className="py-3.5 text-xs font-bold text-indigo-600">{h.call_type}</td>
                          <td className="py-3.5 text-xs font-mono text-gray-400">{h.ai_handling_duration}</td>
                          <td className="py-3.5 text-xs font-semibold text-emerald-600">{h.transfer_status}</td>
                          <td className="py-3.5 text-xs font-mono font-bold text-gray-900">{h.voice_agent_call_duration}</td>
                          <td className="py-3.5 text-xs font-mono text-gray-700">{h.total_duration}</td>
                          <td className="py-3.5 text-xs font-bold text-emerald-700">{h.outcome}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* REGULAR PORTAL VIEW                                                        */
          /* ========================================================================= */
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                  <UserCheck className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
                    Voice Agent Portal <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">Live human agent dashboard for call transfers and lead qualification</p>
                </div>
              </div>

              {/* Action Header Controls */}
              <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
                <Button
                  onClick={() => setShowAgentsModal(true)}
                  variant={showAgentsModal ? "default" : "outline"}
                  className={`font-bold gap-2 rounded-2xl shadow-sm px-4 py-2.5 transition-all cursor-pointer ${
                    showAgentsModal 
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-200 border-indigo-600" 
                      : "border-gray-200 text-gray-700 hover:bg-gray-50 bg-white"
                  }`}
                >
                  <Users className={`h-4.5 w-4.5 ${showAgentsModal ? "text-white" : "text-indigo-600"}`} /> Voice Agents ({allExperts.length})
                </Button>

                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 rounded-2xl px-4 py-2.5 shadow-sm transition-all cursor-pointer"
                >
                  <UserPlus className="h-4.5 w-4.5" /> Create Agent
                </Button>

                {/* PD Status Button */}
                <button
                  onClick={() => setShowPdSelector(true)}
                  disabled={isPdLoading}
                  className={`font-bold gap-2 rounded-2xl shadow-sm px-4 py-2.5 transition-all cursor-pointer flex items-center ${
                    activePdCount > 0
                      ? "bg-emerald-500/10 text-emerald-700 border border-emerald-300 hover:bg-emerald-500/20 shadow-xs"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                  title="Predictive Dialer State - Click to choose which agents have PD active"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${activePdCount > 0 ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                  <span className="text-xs uppercase tracking-wider font-extrabold">
                    PD: {activePdCount > 0 ? `${activePdCount} ACTIVE` : "INACTIVE"}
                  </span>
                </button>

                {/* Status Control Pill */}
                {profile && (
                  <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">Status:</span>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleStatusToggle("AVAILABLE")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        profile.status === "AVAILABLE"
                          ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Available
                    </button>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleStatusToggle("BUSY")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        profile.status === "BUSY" || profile.status === "ON_CALL"
                          ? "bg-amber-500 text-white shadow-sm shadow-amber-200"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Busy
                    </button>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleStatusToggle("OFFLINE")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        profile.status === "OFFLINE"
                          ? "bg-rose-500 text-white shadow-sm shadow-rose-200"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Offline
                    </button>
                  </div>
                )}
              </div>
            </div>

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-sm font-semibold">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-center gap-3 text-sm font-semibold">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Card & Quick Stats */}
            {profile && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Card className="p-5 border-gray-150 shadow-sm rounded-2xl bg-gradient-to-br from-white to-gray-50/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900">{profile.name}</h3>
                      <p className="text-xs text-gray-500">{profile.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 font-medium">
                    Phone Number: <strong className="text-gray-700">{profile.phone || "Not configured"}</strong>
                  </p>
                </Card>

                <Card className="p-5 border-gray-150 shadow-sm rounded-2xl bg-white flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Leads Handled</p>
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{profile.active_lead_count || 0}</h3>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                    <PhoneCall className="h-6 w-6 text-emerald-600" />
                  </div>
                </Card>

                <Card className="p-5 border-gray-150 shadow-sm rounded-2xl bg-white flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Availability</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                          profile.status === "AVAILABLE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : profile.status === "BUSY" || profile.status === "ON_CALL"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${
                            profile.status === "AVAILABLE" ? "bg-emerald-500 animate-pulse" : profile.status === "BUSY" || profile.status === "ON_CALL" ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                          }`} />
                          {profile.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl">
                      {["AVAILABLE", "BUSY", "OFFLINE"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleStatusToggle(st)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                            profile.status === st
                              ? st === "AVAILABLE"
                                ? "bg-emerald-500 text-white shadow-xs"
                                : st === "BUSY"
                                ? "bg-amber-500 text-white shadow-xs"
                                : "bg-rose-500 text-white shadow-xs"
                              : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          {st.slice(0, 4)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-[11px] text-gray-400 font-medium">Status Live Sync: Active</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isRefreshing}
                      onClick={handleRefreshAvailability}
                      className="gap-1.5 text-xs font-bold border-gray-200 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 cursor-pointer rounded-xl h-8"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isRefreshing ? "animate-spin" : ""}`} />
                      {isRefreshing ? "Syncing..." : "Refresh"}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* ASSIGNMENT QUEUE BANNER */}
            {queueItems.length > 0 && (
              <Card className="p-4 border border-amber-200 shadow-sm rounded-2xl bg-amber-50/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl font-bold text-sm">
                    <Clock className="h-5 w-5 animate-spin" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-amber-950 text-sm">
                      {queueItems.length} Lead(s) Waiting in Agent Assignment Queue
                    </h4>
                    <p className="text-xs text-amber-800 font-medium">
                      Leads requested "Talk to Agent" when no agent was available.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    await leadAssignmentService.processQueue();
                    loadPortalData();
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Process Queue Now
                </Button>
              </Card>
            )}

            {/* AI HANDOFF & TRANSFERRED LEADS CARD */}
            <Card className="p-6 border-gray-200 shadow-sm rounded-3xl bg-white space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <PhoneIncoming className="h-5 w-5 text-indigo-600" /> Transferred Leads & AI Call Context
                  </h3>
                  <p className="text-xs text-gray-500">
                    Real-time roster of registered human voice agents, campaign assignments, and transferred leads.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRosterSubTab("ROSTER")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        rosterSubTab === "ROSTER"
                          ? "bg-white text-indigo-600 shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Voice Agents Directory ({allExperts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRosterSubTab("TRANSFERS")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        rosterSubTab === "TRANSFERS"
                          ? "bg-white text-indigo-600 shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Transferred Calls ({assignments.length})
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateModal(true)}
                    className="text-xs font-bold border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 gap-1.5 cursor-pointer rounded-xl"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> + Create Agent
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadPortalData}
                    className="text-xs font-bold border-gray-200 hover:bg-gray-50 gap-1.5 cursor-pointer rounded-xl"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-indigo-600" /> Refresh Roster
                  </Button>
                </div>
              </div>

              {/* VIEW 1: VOICE AGENTS DIRECTORY & CAMPAIGN ASSIGNMENTS */}
              {rosterSubTab === "ROSTER" && (
                <div className="space-y-4">
                  {/* Filters & Search Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/70 p-2.5 rounded-2xl border border-gray-100">
                    <div className="relative w-full sm:w-72">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by agent name or email..."
                        className="pl-9 bg-white border-gray-200 rounded-xl text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 bg-gray-200/60 p-1 rounded-xl w-full sm:w-auto">
                      {["ALL", "AVAILABLE", "BUSY", "OFFLINE"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusFilter(st)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            statusFilter === st
                              ? "bg-white text-gray-900 shadow-xs"
                              : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Agents Roster Table */}
                  <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                    {filteredExperts.length === 0 ? (
                      <div className="py-12 text-center text-gray-400 text-sm">
                        No voice agents found matching your query.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Agent Name</th>
                            <th className="py-3 px-4">Email / ID</th>
                            <th className="py-3 px-4">Assigned Campaign</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Direction</th>
                            <th className="py-3 px-4">Active Calls</th>
                            <th className="py-3 px-4">Created Date</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                          {filteredExperts.map((exp) => {
                            const assignedCamp = allCampaigns.find(
                              (c) => c.voice_agent_id === exp.id || (c.voice_agent_id && c.voice_agent_id.split(",").includes(exp.id))
                            );

                            return (
                              <tr key={exp.id} className="hover:bg-gray-50/70 transition-all">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="h-8 w-8 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                                      {exp.name ? exp.name[0].toUpperCase() : "A"}
                                    </div>
                                    <div>
                                      <span 
                                        onClick={() => { setSelectedAgentId(exp.id); }}
                                        className="font-bold text-gray-900 block hover:text-indigo-600 cursor-pointer transition-colors"
                                      >
                                        {exp.name}
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-mono">ID: {exp.id.slice(0, 8)}...</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-xs font-mono text-gray-600">
                                  {exp.email}
                                </td>
                                <td className="py-3 px-4">
                                  <select
                                    value={assignedCamp ? assignedCamp.id : ""}
                                    onChange={(e) => handleAssignCampaignToAgent(exp.id, e.target.value)}
                                    className="text-xs font-bold px-2.5 py-1 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 text-gray-800 cursor-pointer max-w-[200px] truncate"
                                  >
                                    <option value="">Unassigned (No Campaign)</option>
                                    {allCampaigns.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name} ({c.status})
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-3 px-4">
                                  {(() => {
                                    const computedStatus =
                                      ((exp as any).active_calls && (exp as any).active_calls > 0) || exp.status === "ON_CALL" || exp.status === "BUSY"
                                        ? "BUSY"
                                        : exp.status;
                                    return (
                                      <select
                                        value={computedStatus}
                                        onChange={(e) => handleAgentStatusChange(exp.id, e.target.value)}
                                        className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer ${
                                          computedStatus === "AVAILABLE"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : computedStatus === "BUSY" || computedStatus === "ON_CALL"
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                        }`}
                                      >
                                        <option value="AVAILABLE">AVAILABLE</option>
                                        <option value="BUSY">BUSY</option>
                                        <option value="OFFLINE">OFFLINE</option>
                                      </select>
                                    );
                                  })()}
                                </td>
                                <td className="py-3 px-4">
                                  {(() => {
                                    const rawDir = (exp.direction || exp.agent_type || (exp.skills && exp.skills.includes("OUTBOUND") ? "OUTBOUND" : "INBOUND") || "INBOUND").toUpperCase();
                                    const currentDir = rawDir === "OUTBOUND" ? "Outbound" : "Inbound";
                                    return (
                                      <select
                                        value={currentDir}
                                        onChange={(e) => handleAgentDirectionChange(exp.id, e.target.value)}
                                        className={`text-xs font-bold px-2.5 py-1 rounded-xl border cursor-pointer transition-all shadow-xs ${
                                          currentDir === "Inbound"
                                            ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-300"
                                            : "bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300"
                                        }`}
                                      >
                                        <option value="Inbound">Inbound</option>
                                        <option value="Outbound">Outbound</option>
                                      </select>
                                    );
                                  })()}
                                </td>
                                <td className="py-3 px-4">
                                  {(() => {
                                    const live = (exp as any).active_calls || 0;
                                    const handled = (exp as any).calls_handled ?? exp.active_lead_count ?? 0;
                                    if (live > 0) {
                                      return (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                                          {live} Live Active {handled > 0 ? `(${handled} handled)` : ""}
                                        </span>
                                      );
                                    }
                                    if (handled > 0) {
                                      return (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-xl">
                                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                          {handled} call(s) handled
                                        </span>
                                      );
                                    }
                                    return <span className="text-xs text-gray-400 font-medium">0 call(s)</span>;
                                  })()}
                                </td>
                                <td className="py-3 px-4 text-xs text-gray-400">
                                  {new Date(exp.created_at).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => { setSelectedAgentId(exp.id); }}
                                      className="h-8 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 font-bold text-xs rounded-lg gap-1 cursor-pointer"
                                    >
                                      <User className="h-3.5 w-3.5" /> Profile
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleOpenEdit(exp)}
                                      className="h-8 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 font-bold text-xs rounded-lg gap-1 cursor-pointer"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" /> Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteAgent(exp.id, exp.name)}
                                      className="h-8 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 font-bold text-xs rounded-lg gap-1 cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" /> Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 2: TRANSFERRED LEADS LOG */}
              {rosterSubTab === "TRANSFERS" && (
                <div>
                  {assignments.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 text-sm">
                      No lead transfers recorded yet. When a customer requests "Talk to Agent", transferred lead details will appear here.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Assigned Lead</th>
                            <th className="py-3 px-4">Assigned Agent</th>
                            <th className="py-3 px-4">AI Agent Source</th>
                            <th className="py-3 px-4">Qualification Stage</th>
                            <th className="py-3 px-4">Trigger Source</th>
                            <th className="py-3 px-4">Transfer Time</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Call Notes & Transcript</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                          {assignments.map((assign: any) => (
                            <tr key={assign.id} className="hover:bg-gray-50/70">
                              <td className="py-3 px-4 font-bold text-gray-900">
                                <div>{assign.context?.lead_name || assign.lead_id.slice(0, 8)}</div>
                                <div className="text-[11px] font-mono text-gray-400">{assign.context?.phone || assign.context?.email || "—"}</div>
                              </td>
                              <td className="py-3 px-4 text-xs font-bold text-gray-800">
                                {assign.expert_name || "Agent"}
                              </td>
                              <td className="py-3 px-4 text-xs font-semibold text-indigo-600">
                                {assign.ai_agent_name || "Voice AI"}
                              </td>
                              <td className="py-3 px-4 text-xs">
                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                                  {assign.qualification_stage || "QUALIFIED"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs font-mono text-gray-500">
                                {assign.trigger_source}
                              </td>
                              <td className="py-3 px-4 text-xs font-mono text-gray-400">
                                {new Date(assign.assigned_at).toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  assign.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                                }`}>
                                  {assign.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs max-w-xs">
                                {assign.notes && (
                                  <div className="truncate text-gray-600 font-medium" title={assign.notes}>
                                    📝 {assign.notes}
                                  </div>
                                )}
                                {assign.transcript && (
                                  <div className="truncate font-mono text-[10px] text-gray-400 mt-0.5" title={assign.transcript}>
                                    💬 {assign.transcript}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </Card>


          </>
        )}

        {/* RECORD CALL OUTCOME MODAL */}
        {selectedCall && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <Card className="p-6 border border-gray-200 shadow-2xl rounded-3xl bg-white max-w-lg w-full animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" /> Record Call Outcome
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedCall(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCompleteCall} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Customer / Lead Name
                  </label>
                  <Input value={selectedCall.lead_name || "Lead"} disabled className="bg-gray-50 font-bold" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Final Call Outcome
                  </label>
                  <select
                    value={finalOutcome}
                    onChange={(e) => setFinalOutcome(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-white h-11"
                  >
                    <option value="Qualified - Sales Closed">Qualified - Sales Closed</option>
                    <option value="Qualified - Meeting Scheduled">Qualified - Meeting Scheduled</option>
                    <option value="Qualified - Quote Sent">Qualified - Quote Sent</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Callback Required">Callback Required</option>
                    <option value="Unqualified">Unqualified</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Update Lead Status
                  </label>
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-white h-11"
                  >
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CALLBACK_REQUIRED">CALLBACK_REQUIRED</option>
                    <option value="UNQUALIFIED">UNQUALIFIED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Voice Agent Conversation Notes
                  </label>
                  <textarea
                    value={voiceNotes}
                    onChange={(e) => setVoiceNotes(e.target.value)}
                    placeholder="Enter detailed notes from your conversation with the customer..."
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedCall(null)}
                    className="border-gray-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingOutcome}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                  >
                    {submittingOutcome ? "Saving..." : "Save Outcome & Complete"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* CREATE VOICE AGENT MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <Card className="p-6 border border-gray-200 shadow-2xl rounded-3xl bg-white max-w-md w-full animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-emerald-600" /> Create New Voice Agent
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateVoiceAgent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Agent Name
                  </label>
                  <Input
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="Enter agent name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <Input
                    value={newAgentEmail}
                    onChange={(e) => setNewAgentEmail(e.target.value)}
                    placeholder="Enter email address"
                    type="email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={newAgentPassword}
                    onChange={(e) => setNewAgentPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
                    Voice Agent role and live transfer capabilities will automatically be enabled for this account.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="border-gray-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creatingAgent}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    {creatingAgent ? "Creating..." : "Create Voice Agent Account"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* PREDICTIVE DIALER (PD) AGENT ASSIGNMENT MODAL */}
        {showPdSelector && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <Card className="p-6 border border-gray-200 shadow-2xl rounded-3xl bg-white max-w-2xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                    <Zap className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                      Predictive Dialer (PD) Agent Control
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Enable or disable auto-dialing specifically for each voice agent. Only agents with PD Active will receive outbound auto-dialed leads.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPdSelector(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Stats & Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {activePdCount} Active Agent{activePdCount === 1 ? "" : "s"}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-gray-50 text-gray-600 border border-gray-200">
                    {allExperts.length - activePdCount} Inactive
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                    <Input
                      value={pdSearchQuery}
                      onChange={(e) => setPdSearchQuery(e.target.value)}
                      placeholder="Search agents..."
                      className="pl-9 h-9 bg-gray-50/50 border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                  {activePdCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeactivateAllPd}
                      disabled={isPdLoading}
                      className="h-9 px-3 text-xs font-bold border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer"
                    >
                      Turn Off All
                    </Button>
                  )}
                </div>
              </div>

              {/* Agent List */}
              <div className="overflow-y-auto flex-1 divide-y divide-gray-100 border border-gray-100 rounded-2xl">
                {allExperts
                  .filter((exp) => {
                    if (!pdSearchQuery.trim()) return true;
                    const q = pdSearchQuery.toLowerCase();
                    return exp.name?.toLowerCase().includes(q) || exp.email?.toLowerCase().includes(q);
                  })
                  .map((exp) => {
                    const isSelf = profile?.id === exp.id || user?.email === exp.email;
                    const isUpdating = togglingAgentPdId === exp.id;
                    const isPdOn = Boolean(exp.auto_dial_enabled);

                    return (
                      <div
                        key={exp.id}
                        className={`p-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors ${
                          isPdOn ? "bg-emerald-50/30" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                              isPdOn
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200 shadow-xs"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            }`}
                          >
                            {exp.name ? exp.name[0].toUpperCase() : "A"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-gray-900 truncate">
                                {exp.name}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                                  You
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  exp.status === "AVAILABLE"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : exp.status === "BUSY" || exp.status === "ON_CALL"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {exp.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 font-mono truncate">
                              {exp.email} • {((exp as any).active_calls && (exp as any).active_calls > 0) ? `${(exp as any).active_calls} live active` : `${(exp as any).calls_handled ?? exp.active_lead_count ?? 0} call(s) handled`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleToggleAgentPd(exp.id, !isPdOn)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                              isPdOn
                                ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500 shadow-emerald-200"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${isPdOn ? "bg-white animate-pulse" : "bg-gray-400"}`} />
                            {isUpdating ? "Updating..." : isPdOn ? "PD Active" : "PD Inactive"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 mt-3 border-t border-gray-100 text-xs text-gray-500 shrink-0">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                  Dialer worker will only dial campaign leads for agents with PD Active.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPdSelector(false)}
                  className="border-gray-200 font-bold text-xs rounded-xl"
                >
                  Done
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* VOICE AGENTS MANAGEMENT DIRECTORY MODAL */}
        {showAgentsModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <Card className="p-6 border border-gray-200 shadow-2xl rounded-3xl bg-white max-w-4xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                      Voice Agents Directory
                    </h3>
                    <p className="text-xs text-gray-500">Manage all registered human voice agents, status, and credentials</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    onClick={() => setShowAgentsModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filters & Search Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 shrink-0">
                <div className="relative w-full sm:w-72">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by agent name or email..."
                    className="pl-9 bg-gray-50/50 border-gray-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl w-full sm:w-auto">
                  {["ALL", "AVAILABLE", "BUSY", "OFFLINE"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        statusFilter === st
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agents Table */}
              <div className="overflow-y-auto flex-1 border border-gray-100 rounded-2xl">
                {filteredExperts.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    No voice agents found matching your query.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Agent Name</th>
                        <th className="py-3 px-4">Email / ID</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Predictive Dialer (PD)</th>
                        <th className="py-3 px-4">Active Calls</th>
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {filteredExperts.map((exp) => (
                        <tr key={exp.id} className="hover:bg-gray-50/70 transition-all">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                                {exp.name ? exp.name[0].toUpperCase() : "A"}
                              </div>
                              <div>
                                <span 
                                  onClick={() => { setSelectedAgentId(exp.id); setShowAgentsModal(false); }}
                                  className="font-bold text-gray-900 block hover:text-indigo-600 cursor-pointer transition-colors"
                                >
                                  {exp.name}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">ID: {exp.id.slice(0, 8)}...</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-gray-600">
                            {exp.email}
                          </td>
                          <td className="py-3 px-4">
                            {(() => {
                              const computedStatus =
                                ((exp as any).active_calls && (exp as any).active_calls > 0) || exp.status === "ON_CALL" || exp.status === "BUSY"
                                  ? "BUSY"
                                  : exp.status;
                              return (
                                <select
                                  value={computedStatus}
                                  onChange={(e) => handleAgentStatusChange(exp.id, e.target.value)}
                                  className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer ${
                                    computedStatus === "AVAILABLE"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : computedStatus === "BUSY" || computedStatus === "ON_CALL"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}
                                >
                                  <option value="AVAILABLE">AVAILABLE</option>
                                  <option value="BUSY">BUSY</option>
                                  <option value="OFFLINE">OFFLINE</option>
                                </select>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              disabled={togglingAgentPdId === exp.id}
                              onClick={() => handleToggleAgentPd(exp.id, !exp.auto_dial_enabled)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
                                exp.auto_dial_enabled
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                  : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                              }`}
                              title={exp.auto_dial_enabled ? "PD Active for this agent (Click to disable)" : "PD Inactive for this agent (Click to enable)"}
                            >
                              <span className={`h-2 w-2 rounded-full ${exp.auto_dial_enabled ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                              {togglingAgentPdId === exp.id ? (
                                <span>Updating...</span>
                              ) : (
                                <span>{exp.auto_dial_enabled ? "PD Active" : "PD Inactive"}</span>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            {(() => {
                              const live = (exp as any).active_calls || 0;
                              const handled = (exp as any).calls_handled ?? exp.active_lead_count ?? 0;
                              if (live > 0) {
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                                    {live} Live Active {handled > 0 ? `(${handled} handled)` : ""}
                                  </span>
                                );
                              }
                              if (handled > 0) {
                                return (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-xl">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                    {handled} call(s) handled
                                  </span>
                                );
                              }
                              return <span className="text-xs text-gray-400 font-medium">0 call(s)</span>;
                            })()}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-400">
                            {new Date(exp.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setSelectedAgentId(exp.id); setShowAgentsModal(false); }}
                                className="h-8 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 font-bold text-xs rounded-lg gap-1.5 cursor-pointer"
                              >
                                <User className="h-3.5 w-3.5" /> Profile
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEdit(exp)}
                                className="h-8 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 font-bold text-xs rounded-lg gap-1.5 cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteAgent(exp.id, exp.name)}
                                className="h-8 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 font-bold text-xs rounded-lg gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex justify-end pt-3 mt-3 border-t border-gray-100 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setShowAgentsModal(false)}
                  className="border-gray-200 text-xs font-bold"
                >
                  Close Directory
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* EDIT VOICE AGENT MODAL */}
        {editingAgent && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <Card className="p-6 border border-gray-200 shadow-2xl rounded-3xl bg-white max-w-md w-full animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-indigo-600" /> Edit Voice Agent Details
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Agent Name
                  </label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <Input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    type="email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Login Password
                  </label>
                  <div className="relative">
                    <Input
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      type={showEditPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Availability Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-white h-11 cursor-pointer"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="BUSY">BUSY</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Call Direction
                  </label>
                  <select
                    value={editDirection}
                    onChange={(e) => setEditDirection(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-white h-11 cursor-pointer"
                  >
                    <option value="Inbound">Inbound (Receives Transferred Calls)</option>
                    <option value="Outbound">Outbound (Dialer / Campaign Outbound)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Assign to Campaign
                  </label>
                  <select
                    value={editCampaignId}
                    onChange={(e) => setEditCampaignId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-white h-11 cursor-pointer"
                  >
                    <option value="">No Campaign Assigned (Unassigned)</option>
                    {allCampaigns.map((camp) => (
                      <option key={camp.id} value={camp.id}>
                        {camp.name} ({camp.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl">
                  <div>
                    <label className="text-xs font-bold text-gray-800 block">
                      Predictive Dialer (PD)
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Enable outbound automated dialer calls for this agent
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditAutoDialEnabled(!editAutoDialEnabled)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
                      editAutoDialEnabled
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${editAutoDialEnabled ? "bg-white animate-pulse" : "bg-gray-400"}`} />
                    {editAutoDialEnabled ? "PD Active" : "PD Inactive"}
                  </button>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingAgent(null)}
                    className="border-gray-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingEdit}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                  >
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// @ts-nocheck
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminService, AdminCampaign, AdminLead, AdminCall, AdminLeadGroup } from "@/lib/services/admin.service";
import { campaignService } from "@/lib/services/campaign.service";
import { leadService } from "@/lib/services/lead.service";
import { agentService, Agent } from "@/lib/services/agent.service";
import { voiceAgentService, VoiceAgent } from "@/lib/services/voice-agent.service";
import { LocalVoiceTestModal } from "@/components/campaign/LocalVoiceTestModal";
import { 
  Play, Users, PhoneCall, Shield, PhoneIncoming, PhoneOutgoing, 
  Trash2, CheckCircle2, AlertTriangle, Pause, Plus, Eye, FolderOpen, X, Phone, Edit2, FileText
} from "lucide-react";
import { formatDateTime } from "@/lib/date-utils";

function AdminCampaignsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"campaigns" | "leads" | "calls" | "uploads">("campaigns");
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [calls, setCalls] = useState<AdminCall[]>([]);
  const [leadGroups, setLeadGroups] = useState<AdminLeadGroup[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [voiceAgents, setVoiceAgents] = useState<VoiceAgent[]>([]);
  const [activeVoiceTestingCampaign, setActiveVoiceTestingCampaign] = useState<AdminCampaign | null>(null);

  // Edit Campaign State
  const [editingCampaign, setEditingCampaign] = useState<AdminCampaign | null>(null);
  const [editName, setEditName] = useState("");
  const [editTwilioNumber, setEditTwilioNumber] = useState("");
  const [editStatus, setEditStatus] = useState("IDLE");

  // View Campaign Details State
  const [viewingCampaign, setViewingCampaign] = useState<any | null>(null);
  const [viewingCampaignLeads, setViewingCampaignLeads] = useState<any[]>([]);
  const [loadingCampaignDetails, setLoadingCampaignDetails] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const runTestingCampaignId = searchParams.get("run_testing");
    if (runTestingCampaignId) {
      campaignService
        .get(runTestingCampaignId)
        .then((campaign: any) => {
          if (campaign) {
            window.history.replaceState({}, "", "/admin/campaigns");
            setActiveVoiceTestingCampaign(campaign as any);
          }
        })
        .catch((err: any) => {
          console.warn("Failed to load testing campaign by ID:", err);
        });
    }
  }, [searchParams]);

  // New Campaign Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    description: "",
    objective: "",
    agent_type: "AI_AGENT",
    agent_id: "",
    voice_agent_id: "",
    twilio_number: "",
    selected_lead_ids: [] as string[],
    default_language: "auto",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "campaigns") {
        const data = await adminService.getCampaigns();
        setCampaigns(data);
        const agentData = await agentService.list().catch(() => []);
        setAgents(agentData);
        const voiceData = await voiceAgentService.list().catch(() => []);
        setVoiceAgents(voiceData);
        const leadData = await adminService.getLeads();
        setLeads(leadData);
        // Default Twilio phone number configuration
        try {
          const twilioData = await campaignService.getTwilioNumber();
          if (twilioData?.twilio_phone_number) {
            setCampaignForm((f) => ({ ...f, twilio_number: twilioData.twilio_phone_number }));
          }
        } catch (e) {}
      } else if (activeTab === "leads") {
        const data = await adminService.getLeads();
        setLeads(data);
      } else if (activeTab === "calls") {
        const data = await adminService.getCalls();
        setCalls(data);
      } else if (activeTab === "uploads") {
        const data = await adminService.getLeadUploads();
        setLeadGroups(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to retrieve logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleStartCampaign = async (id: string, name: string) => {
    setError(null);
    setSuccess(null);
    try {
      await campaignService.start(id);
      setSuccess(`Campaign "${name}" has been started`);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to start campaign");
    }
  };

  const handlePauseCampaign = async (id: string, name: string) => {
    setError(null);
    setSuccess(null);
    try {
      await campaignService.pause(id);
      setSuccess(`Campaign "${name}" has been paused`);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to pause campaign");
    }
  };

  const handleOpenEdit = (c: AdminCampaign) => {
    router.push(`/admin/campaigns/create?edit=${c.id}`);
  };

  const handleSaveEdit = async () => {
    if (!editingCampaign) return;
    setError(null);
    setSuccess(null);
    try {
      await campaignService.update(editingCampaign.id, {
        name: editName,
        twilio_number: editTwilioNumber,
        status: editStatus as any,
      });
      setSuccess(`Campaign "${editName}" updated successfully`);
      setEditingCampaign(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update campaign");
    }
  };

  const handleOpenView = async (c: AdminCampaign) => {
    setViewingCampaign(c);
    setViewingCampaignLeads([]);
    setLoadingCampaignDetails(true);
    try {
      const details = await campaignService.get(c.id);
      setViewingCampaign(details);
      const leadsList = await campaignService.getLeads(c.id).catch(() => []);
      setViewingCampaignLeads(leadsList);
    } catch (err: any) {
      console.warn("Failed to load details:", err);
    } finally {
      setLoadingCampaignDetails(false);
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete campaign "${name}"?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await campaignService.remove(id);
      setSuccess(`Campaign "${name}" deleted successfully`);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete campaign");
    }
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete lead "${name}"?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await leadService.remove(id);
      setSuccess(`Lead "${name}" deleted successfully`);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete lead");
    }
  };

  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!campaignForm.name || !campaignForm.twilio_number || !campaignForm.agent_type) {
      setError("Please fill out Campaign Name, Agent Type, and Twilio Number");
      return;
    }

    if (campaignForm.agent_type === "AI_AGENT" && !campaignForm.agent_id) {
      setError("Please select an AI Agent");
      return;
    }

    if (campaignForm.agent_type === "VOICE_AGENT" && !campaignForm.voice_agent_id) {
      setError("Please select a Voice Agent");
      return;
    }

    try {
      await campaignService.create({
        name: campaignForm.name,
        calling_mode: campaignForm.agent_type === "VOICE_AGENT" ? "VOICE" : "AI",
        agent_id: campaignForm.agent_type === "AI_AGENT" ? campaignForm.agent_id : undefined,
        voice_agent_id: campaignForm.agent_type === "VOICE_AGENT" ? campaignForm.voice_agent_id : undefined,
        twilio_number: campaignForm.twilio_number,
        lead_ids: campaignForm.selected_lead_ids,
        schedule: {
          default_language: campaignForm.default_language,
        }
      });
      setSuccess(`Campaign "${campaignForm.name}" created successfully`);
      setShowCreateForm(false);
      setCampaignForm({
        name: "",
        description: "",
        objective: "",
        agent_type: "AI_AGENT",
        agent_id: "",
        voice_agent_id: "",
        twilio_number: "",
        selected_lead_ids: [] as string[],
        default_language: "auto",
      });
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create campaign");
    }
  };

  const handleSelectLeadToggle = (id: string) => {
    setCampaignForm((f) => {
      const ids = f.selected_lead_ids.includes(id)
        ? f.selected_lead_ids.filter((x) => x !== id)
        : [...f.selected_lead_ids, id];
      return { ...f, selected_lead_ids: ids };
    });
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl">
              <Shield className="h-6.5 w-6.5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Overall System Operations</h1>
              <p className="text-sm text-slate-500 mt-1">outbound campaigns, lead registers, and calls overview</p>
            </div>
          </div>
          {activeTab === "campaigns" && (
            <Button 
              onClick={() => router.push("/admin/campaigns/create")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 rounded-xl self-start sm:self-center cursor-pointer font-bold"
            >
              <Plus className="h-4 w-4" /> New Campaign
            </Button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 self-start w-full sm:w-auto overflow-x-auto gap-1">
          {[
            { id: "campaigns", label: "All Campaigns", icon: Play },
            { id: "leads", label: "All Leads", icon: Users },
            { id: "calls", label: "All Calls", icon: PhoneCall },
            { id: "uploads", label: "Uploaded Files", icon: FolderOpen },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === id
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/10 font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
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

        {/* Campaign Creation Card */}
        {showCreateForm && activeTab === "campaigns" && (
          <Card className="p-6 border border-slate-100 shadow-lg rounded-2xl bg-white max-w-4xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                🚀 Create & Launch New Global Outbound Campaign
              </h3>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="text-slate-400 hover:text-slate-600 transition-premium p-1 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCampaignSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign Name</label>
                  <Input
                    placeholder="Sales campaign"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agent Type</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-11 bg-white font-semibold text-slate-700 cursor-pointer"
                    value={campaignForm.agent_type}
                    onChange={(e) => {
                      const type = e.target.value;
                      setCampaignForm((prev) => ({
                        ...prev,
                        agent_type: type,
                        agent_id: "",
                        voice_agent_id: "",
                      }));
                    }}
                    required
                  >
                    <option value="AI_AGENT">AI Agent</option>
                    <option value="VOICE_AGENT">Voice Agent</option>
                  </select>
                </div>

                {campaignForm.agent_type === "AI_AGENT" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SELECT AI AGENT</label>
                    <select
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-11 bg-white font-semibold text-slate-700 cursor-pointer"
                      value={campaignForm.agent_id}
                      onChange={(e) => setCampaignForm({ ...campaignForm, agent_id: e.target.value })}
                      required
                    >
                      <option value="">Select AI Agent...</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({agent.type || "SALES"})
                        </option>
                      ))}
                    </select>
                    {agents.length === 0 && (
                      <p className="text-[11px] font-bold text-rose-500 mt-1">
                        No AI Agents available. Please create an AI Agent first.
                      </p>
                    )}
                  </div>
                ) : campaignForm.agent_type === "VOICE_AGENT" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SELECT VOICE AGENT</label>
                    <select
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-11 bg-white font-semibold text-slate-700 cursor-pointer"
                      value={campaignForm.voice_agent_id}
                      onChange={(e) => setCampaignForm({ ...campaignForm, voice_agent_id: e.target.value })}
                      required
                    >
                      <option value="">Select Voice Agent...</option>
                      {voiceAgents.map((expert) => (
                        <option key={expert.id} value={expert.id}>
                          {expert.name} — {expert.status || "AVAILABLE"}
                        </option>
                      ))}
                    </select>
                    {voiceAgents.length === 0 && (
                      <p className="text-[11px] font-bold text-rose-500 mt-1">
                        No Voice Agents available. Please create a Voice Agent first.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5 opacity-60">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SELECT AGENT</label>
                    <select
                      disabled
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm h-11 bg-slate-100 font-semibold text-slate-400 cursor-not-allowed"
                      value=""
                    >
                      <option value="">Select Agent Type First...</option>
                    </select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Twilio Caller Number</label>
                  <Input
                    placeholder="+18392615369"
                    value={campaignForm.twilio_number}
                    onChange={(e) => setCampaignForm({ ...campaignForm, twilio_number: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Regional Language</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-11 bg-white font-semibold text-slate-700 cursor-pointer"
                    value={campaignForm.default_language}
                    onChange={(e) => setCampaignForm({ ...campaignForm, default_language: e.target.value })}
                    required
                  >
                    <option value="auto">Auto Detect</option>
                    <option value="en">English</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                    <option value="ml">Malayalam</option>
                    <option value="kn">Kannada</option>
                    <option value="hi">Hindi</option>
                    <option value="bn">Bengali</option>
                    <option value="mr">Marathi</option>
                    <option value="gu">Gujarati</option>
                    <option value="pa">Punjabi</option>
                    <option value="ur">Urdu</option>
                    <option value="or">Odia</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Select Campaign Leads ({campaignForm.selected_lead_ids.length} selected)
                </label>
                <div className="border border-slate-100 rounded-2xl overflow-y-auto max-h-48 p-4 divide-y divide-slate-50 bg-slate-50/50">
                  {leads.map((l) => (
                    <label key={l.id} className="flex items-center gap-3.5 py-2.5 text-sm select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={campaignForm.selected_lead_ids.includes(l.id)}
                        onChange={() => handleSelectLeadToggle(l.id)}
                        className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <p className="font-bold text-slate-800">{l.first_name} {l.last_name}</p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{l.company} &middot; {l.phone}</p>
                      </div>
                    </label>
                  ))}
                  {leads.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">No leads available &mdash; create leads first.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-50 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  Launch Campaign
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Operations Tables Display */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col justify-center items-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Fetching operations log...</span>
            </div>
          ) : (
            <>
              {/* Campaigns Table */}
              {activeTab === "campaigns" && (
                <div className="overflow-x-auto font-medium text-slate-700">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-4">Campaign Name</th>
                        <th className="pb-4">Target Client</th>
                        <th className="pb-4">Lead List</th>
                        <th className="pb-4">Assigned Agent</th>
                        <th className="pb-4">Twilio Number</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Created Date</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {campaigns.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-premium">
                          <td 
                            className="py-4 font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => router.push(`/admin/campaigns/create?edit=${c.id}&step=6`)}
                            title="Click to Review Campaign"
                          >
                            {c.name}
                          </td>
                          <td className="py-4 font-bold text-indigo-700">{c.client_name || "—"}</td>
                          <td className="py-4 font-semibold text-slate-700">{(c as any).lead_group_name || "Lead Library"}</td>
                          <td className="py-4 font-bold text-emerald-700">{(c as any).voice_agent_name || "AI Agent"}</td>
                          <td className="py-4 font-mono text-xs text-slate-400">{c.twilio_number}</td>
                          <td className="py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                              c.status === "RUNNING" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                              c.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                              c.status === "PAUSED" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                              "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-4 text-xs text-slate-400">
                            {formatDateTime(c.created_at)}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {c.status === "RUNNING" ? (
                                <button
                                  onClick={() => handlePauseCampaign(c.id, c.name)}
                                  className="p-1.5 rounded-lg hover:bg-slate-50 text-amber-600 transition-premium cursor-pointer"
                                  title="Pause Campaign"
                                >
                                  <Pause className="h-4.5 w-4.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStartCampaign(c.id, c.name)}
                                  className="p-1.5 rounded-lg hover:bg-slate-50 text-indigo-600 transition-premium cursor-pointer"
                                  title="Start Campaign"
                                >
                                  <Play className="h-4.5 w-4.5" />
                                </button>
                              )}
                              <button
                                onClick={() => router.push(`/admin/campaigns/create?edit=${c.id}&step=6`)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-premium cursor-pointer"
                                title="Review Campaign Details"
                              >
                                <Eye className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => router.push(`/admin/campaigns/create?edit=${c.id}&step=6`)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-indigo-600 transition-premium cursor-pointer"
                                title="Review & Edit Campaign"
                              >
                                <Edit2 className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => setActiveVoiceTestingCampaign(c)}
                                className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-premium cursor-pointer"
                                title="Local Voice Test"
                              >
                                <Phone className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCampaign(c.id, c.name)}
                                className="p-1.5 rounded-lg hover:bg-slate-50 text-rose-500 hover:text-rose-600 transition-premium cursor-pointer"
                                title="Delete Campaign"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {campaigns.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            No campaigns found in the system.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Leads Table */}
              {activeTab === "leads" && (
                <div className="overflow-x-auto font-medium text-slate-700">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-4">Lead Details</th>
                        <th className="pb-4">Associated Business</th>
                        <th className="pb-4">Company</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Imported Date</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {leads.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/50 transition-premium">
                          <td className="py-4">
                            <p className="font-bold text-slate-900">{l.first_name} {l.last_name}</p>
                            <p className="text-xs text-slate-400 mt-1 font-semibold">{l.phone} &middot; {l.email}</p>
                          </td>
                          <td className="py-4 text-slate-500">{l.business_name}</td>
                          <td className="py-4 text-slate-600">{l.company}</td>
                          <td className="py-4">
                            <Badge className="font-bold">{l.status}</Badge>
                          </td>
                          <td className="py-4 text-xs text-slate-400">
                            {formatDateTime(l.created_at)}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDeleteLead(l.id, `${l.first_name} ${l.last_name}`)}
                                className="p-1.5 rounded-lg hover:bg-slate-50 text-rose-500 hover:text-rose-600 transition-premium cursor-pointer"
                                title="Delete Lead"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {leads.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            No leads found in the system.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Calls Table */}
              {activeTab === "calls" && (
                <div className="overflow-x-auto font-medium text-slate-700">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-4">Direction</th>
                        <th className="pb-4">Associated Business</th>
                        <th className="pb-4">From / To</th>
                        <th className="pb-4">Duration</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {calls.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-premium">
                          <td className="py-4">
                            <span className="flex items-center gap-1.5">
                              {c.direction === "OUTBOUND" ? (
                                <PhoneOutgoing className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                              ) : (
                                <PhoneIncoming className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                              )}
                              <span className="font-bold text-slate-900">{c.direction}</span>
                            </span>
                          </td>
                          <td className="py-4 text-slate-500">{c.business_name}</td>
                          <td className="py-4">
                            <p className="text-slate-900 font-semibold">To: {c.to_number}</p>
                            <p className="text-xs text-slate-450 mt-1 font-mono">From: {c.from_number}</p>
                          </td>
                          <td className="py-4 text-slate-700 font-bold font-mono">
                            {Math.floor((c.duration_seconds || 0) / 60)}m {(c.duration_seconds || 0) % 60}s
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                              c.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                              c.status === "FAILED" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                              "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-4 text-xs text-slate-400">
                            {formatDateTime(c.created_at)}
                          </td>
                        </tr>
                      ))}
                      {calls.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            No voice calls logged in the system.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Uploaded Files Table */}
              {activeTab === "uploads" && (
                <div className="overflow-x-auto font-medium text-slate-700">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-4">File Name</th>
                        <th className="pb-4">Associated Business</th>
                        <th className="pb-4">Lead Count</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Uploaded Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {leadGroups.map((g) => (
                        <tr key={g.id} className="hover:bg-slate-50/50 transition-premium">
                          <td className="py-4 font-bold text-slate-900">{g.filename}</td>
                          <td className="py-4 text-slate-500">{g.business_name}</td>
                          <td className="py-4 text-slate-900 font-bold">{g.lead_count}</td>
                          <td className="py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                              g.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                              g.status === "PROCESSING" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                              g.status === "FAILED" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                              "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}>
                              {g.status}
                            </span>
                          </td>
                          <td className="py-4 text-xs text-slate-400">
                            {formatDateTime(g.created_at)}
                          </td>
                        </tr>
                      ))}
                      {leadGroups.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            No uploaded file records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {activeVoiceTestingCampaign && (
        <LocalVoiceTestModal
          campaignId={activeVoiceTestingCampaign.id}
          campaignName={activeVoiceTestingCampaign.name}
          agentId={activeVoiceTestingCampaign.agent_id}
          onClose={() => setActiveVoiceTestingCampaign(null)}
        />
      )}

      {/* View Campaign Details Modal */}
      {viewingCampaign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl border border-slate-100 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xl text-slate-900">{viewingCampaign.name}</h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                    {viewingCampaign.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {viewingCampaign.id}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewingCampaign(null)} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100">
                <span className="font-extrabold text-indigo-600 block uppercase text-[10px]">Target Client</span>
                <span className="font-bold text-indigo-950 text-sm">{viewingCampaign.client_name || "—"}</span>
                {viewingCampaign.client_phone && (
                  <span className="font-mono text-slate-500 text-[11px] block mt-0.5">{viewingCampaign.client_phone}</span>
                )}
              </div>
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
                <span className="font-extrabold text-emerald-600 block uppercase text-[10px]">Assigned Voice Agent</span>
                <span className="font-bold text-emerald-950 text-sm">{viewingCampaign.voice_agent_name || "AI Agent"}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="font-bold text-slate-400 block uppercase text-[10px]">Lead List</span>
                <span className="font-bold text-slate-800 text-sm">{viewingCampaign.lead_group_name || "Lead Library"}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="font-bold text-slate-400 block uppercase text-[10px]">Total Leads</span>
                <span className="font-bold text-slate-800 text-sm">{viewingCampaignLeads.length} lead(s)</span>
              </div>
            </div>

            {viewingCampaign.schedule?.script && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Campaign Script</span>
                <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                  {viewingCampaign.schedule.script}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setViewingCampaign(null)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-xl text-slate-900">Edit Campaign</h3>
              <Button variant="ghost" size="icon" onClick={() => setEditingCampaign(null)} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block mb-1">Campaign Name *</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Campaign Name"
                  className="text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block mb-1">Twilio Caller Number</label>
                <Input
                  value={editTwilioNumber}
                  onChange={(e) => setEditTwilioNumber(e.target.value)}
                  placeholder="+18392615369"
                  className="text-xs font-semibold font-mono"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block mb-1">Campaign Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 bg-white"
                >
                  <option value="IDLE">IDLE</option>
                  <option value="RUNNING">RUNNING</option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingCampaign(null)} className="text-xs font-bold px-4">
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function AdminCampaignsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400 font-semibold">Loading...</div>}>
      <AdminCampaignsContent />
    </Suspense>
  );
}

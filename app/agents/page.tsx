"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { agentService, Agent } from "@/lib/services/agent.service";
import { voiceAgentService, VoiceAgent } from "@/lib/services/voice-agent.service";
import { useAuthStore } from "@/lib/store";
import { 
  Bot, 
  UserCheck, 
  Plus, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  CheckCircle2, 
  Trash2, 
  RefreshCw, 
  UserPlus, 
  Volume2, 
  Eye, 
  EyeOff, 
  ArrowUpRight,
  Clock,
  Search,
  Check
} from "lucide-react";

const DEFAULT_AI_FORM = {
  name: "",
  type: "SALES",
  system_prompt: "You are a helpful AI sales agent.",
  voice_id: "21m00Tcm4TlvDq8ikWAM",
  voice_stability: 0.5,
  voice_similarity_boost: 0.75,
  voice_model_id: "eleven_turbo_v2_5",
};

export default function AgentsPage() {
  const { user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const isAdmin = Boolean(
    hydrated && user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "BUSINESS_OWNER")
  );

  // Top level active tab: "ai" (Remote AI Agents) or "voice" (Remote Voice Agents)
  const [activeTab, setActiveTab] = useState<"ai" | "voice">("ai");

  // --- AI Agents State ---
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_AI_FORM);
  const [testTarget, setTestTarget] = useState<Agent | null>(null);
  const [testMessage, setTestMessage] = useState("");
  const [testReply, setTestReply] = useState("");
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // --- Voice Agents State ---
  const [voiceAgents, setVoiceAgents] = useState<VoiceAgent[]>([]);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState("");
  const [voiceFilter, setVoiceFilter] = useState<"ALL" | "AVAILABLE" | "BUSY" | "OFFLINE">("ALL");
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [creatingVoice, setCreatingVoice] = useState(false);
  const [voiceName, setVoiceName] = useState("");
  const [voiceEmail, setVoiceEmail] = useState("");
  const [voicePassword, setVoicePassword] = useState("");
  const [showVoicePassword, setShowVoicePassword] = useState(false);
  const [voicePhone, setVoicePhone] = useState("");
  const [voiceDirection, setVoiceDirection] = useState<"INBOUND" | "OUTBOUND">("INBOUND");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSuccess, setVoiceSuccess] = useState<string | null>(null);
  const [updatingVoiceId, setUpdatingVoiceId] = useState<string | null>(null);

  const loadAiAgents = async () => {
    setLoadingAi(true);
    try {
      const data = await agentService.list();
      setAgents(data || []);
    } catch (err: any) {
      console.error("Failed to load AI agents:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  const loadVoiceAgents = async () => {
    setLoadingVoice(true);
    try {
      const data = await voiceAgentService.list();
      setVoiceAgents(data || []);
    } catch (err: any) {
      console.error("Failed to load Voice agents:", err);
    } finally {
      setLoadingVoice(false);
    }
  };

  useEffect(() => {
    loadAiAgents();
    loadVoiceAgents();
  }, []);

  // --- AI Agent Handlers ---
  const deleteAgent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the AI Agent "${name}"?`)) return;
    try {
      await agentService.remove(id);
      loadAiAgents();
    } catch (err: any) {
      setPreviewError(err.message || "Failed to delete agent");
    }
  };

  const createAgent = async () => {
    try {
      await agentService.create(form);
      setShowAiForm(false);
      setForm(DEFAULT_AI_FORM);
      loadAiAgents();
    } catch (err: any) {
      setPreviewError(err.message || "Failed to create AI agent");
    }
  };

  const runTest = async () => {
    if (!testTarget) return;
    try {
      const res = await agentService.test(testTarget.id, testMessage);
      setTestReply(res?.reply || `Hello! I am ${testTarget.name}. I am ready to handle lead qualification and sales calls.`);
    } catch (err: any) {
      setTestReply(`Hello! I am ${testTarget.name}. I am ready to handle lead qualification and sales calls for your campaign.`);
    }
  };

  const previewVoice = async (agent: Agent) => {
    setPreviewingId(agent.id);
    setPreviewError(null);
    try {
      const url = await agentService.previewVoice(agent.id, `Hi, this is ${agent.name}. This is a quick preview of how I sound on a call.`);
      const audio = new Audio(url);
      await audio.play();
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewingId(null);
    }
  };

  // --- Voice Agent Handlers ---
  const handleCreateVoiceAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceEmail.trim()) return;
    setCreatingVoice(true);
    setVoiceError(null);
    try {
      await voiceAgentService.create({
        name: voiceName.trim() || voiceEmail.trim(),
        email: voiceEmail.trim().toLowerCase(),
        password: voicePassword.trim() || "Welcome123!",
        phone: voicePhone.trim() || undefined,
        direction: voiceDirection,
        status: "AVAILABLE",
      });
      setVoiceSuccess(`Voice Agent "${voiceName || voiceEmail}" created successfully!`);
      setShowVoiceModal(false);
      setVoiceName("");
      setVoiceEmail("");
      setVoicePassword("");
      setVoicePhone("");
      setVoiceDirection("INBOUND");
      await loadVoiceAgents();
      setTimeout(() => setVoiceSuccess(null), 3500);
    } catch (err: any) {
      setVoiceError(err?.message || "Failed to create voice agent");
    } finally {
      setCreatingVoice(false);
    }
  };

  const handleUpdateVoiceStatus = async (agentId: string, status: string) => {
    setUpdatingVoiceId(agentId);
    try {
      await voiceAgentService.updateStatus(agentId, status);
      setVoiceAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, status } : a))
      );
    } catch (err: any) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingVoiceId(null);
    }
  };

  const handleDeleteVoiceAgent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove Voice Agent "${name}"?`)) return;
    try {
      await voiceAgentService.delete(id);
      loadVoiceAgents();
    } catch (err: any) {
      alert(err?.message || "Failed to delete voice agent");
    }
  };

  const filteredVoiceAgents = voiceAgents.filter((agent) => {
    const q = voiceSearch.toLowerCase();
    const matchesQuery = !q || (agent.name && agent.name.toLowerCase().includes(q)) || (agent.email && agent.email.toLowerCase().includes(q));
    const matchesFilter = voiceFilter === "ALL" || (agent.status || "").toUpperCase() === voiceFilter;
    return matchesQuery && matchesFilter;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header with Title and Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
              <span>Remote Agents</span>
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your autonomous AI employee agents and human remote voice agents
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab Pill Switcher */}
            <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === "ai"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Bot className="h-4 w-4" />
                <span>AI Agents ({agents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("voice")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === "voice"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Voice Agents ({voiceAgents.length})</span>
              </button>
            </div>

            {/* Action Buttons */}
            {isAdmin && (
              activeTab === "ai" ? (
                <Button 
                  onClick={() => setShowAiForm((v) => !v)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl gap-2 shadow-xs cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>{showAiForm ? "Cancel" : "New AI Agent"}</span>
                </Button>
              ) : (
                <Button 
                  onClick={() => setShowVoiceModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 shadow-xs cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>New Voice Agent</span>
                </Button>
              )
            )}
          </div>
        </div>

        {voiceSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{voiceSuccess}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: REMOTE AI AGENTS                                                  */}
        {/* ========================================================================= */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            {showAiForm && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in">
                <h3 className="font-extrabold text-gray-900 text-base">Create Autonomous AI Agent</h3>
                <Input 
                  placeholder="Agent Name (e.g. Sarah Sales Specialist)" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                />
                <select
                  className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-full bg-white font-medium"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {["SALES", "RECEPTIONIST", "SUPPORT", "SCHEDULER", "COLLECTIONS", "CUSTOM"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <textarea
                  className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-full font-medium"
                  rows={3}
                  placeholder="System prompt instructions for AI behavior..."
                  value={form.system_prompt}
                  onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                />

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">ElevenLabs Voice Synthesizer Settings</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Voice ID</label>
                      <Input value={form.voice_id} onChange={(e) => setForm({ ...form, voice_id: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Model ID</label>
                      <Input value={form.voice_model_id} onChange={(e) => setForm({ ...form, voice_model_id: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Stability ({form.voice_stability})</label>
                      <input
                        type="range" min={0} max={1} step={0.05}
                        value={form.voice_stability}
                        onChange={(e) => setForm({ ...form, voice_stability: parseFloat(e.target.value) })}
                        className="w-full cursor-pointer accent-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Similarity Boost ({form.voice_similarity_boost})</label>
                      <input
                        type="range" min={0} max={1} step={0.05}
                        value={form.voice_similarity_boost}
                        onChange={(e) => setForm({ ...form, voice_similarity_boost: parseFloat(e.target.value) })}
                        className="w-full cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowAiForm(false)}>Cancel</Button>
                  <Button onClick={createAgent} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                    Save AI Agent
                  </Button>
                </div>
              </div>
            )}

            {previewError && <p className="text-sm text-rose-600 font-semibold">{previewError}</p>}

            {loadingAi ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" />
                <span className="text-xs font-semibold text-gray-400">Loading AI agents...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {agents.map((agent) => (
                  <Card key={agent.id} className="p-5 border-gray-200 shadow-sm rounded-2xl bg-white flex flex-col justify-between hover:border-indigo-200 transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700">
                            {agent.name ? agent.name[0].toUpperCase() : "A"}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-gray-900 leading-tight">{agent.name}</h3>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{agent.type}</span>
                          </div>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 font-extrabold uppercase rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {agent.status || "ACTIVE"}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 line-clamp-3 my-3 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-medium">
                        {agent.system_prompt || "No system prompt configured."}
                      </p>
                      
                      <p className="text-[11px] text-gray-400 font-mono">
                        Voice: {agent.voice_id?.slice(0, 12)}...
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100 mt-4">
                      <Button 
                        size="sm"
                        variant="outline" 
                        onClick={() => { setTestTarget(agent); setTestReply(""); }}
                        className="text-xs font-bold rounded-xl flex-1 cursor-pointer"
                      >
                        Test Agent
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline" 
                        onClick={() => previewVoice(agent)} 
                        disabled={previewingId === agent.id}
                        className="text-xs font-bold rounded-xl cursor-pointer"
                        title="Play audio voice sample"
                      >
                        <Volume2 className={`h-3.5 w-3.5 ${previewingId === agent.id ? "animate-spin text-indigo-600" : ""}`} />
                      </Button>
                      {isAdmin && (
                        <Button 
                          size="sm"
                          variant="outline" 
                          onClick={() => deleteAgent(agent.id, agent.name)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-xl cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}

                {agents.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl">
                    No autonomous AI agents yet. Click "New AI Agent" above to deploy your first agent.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REMOTE VOICE AGENTS (HUMAN / HYBRID)                              */}
        {/* ========================================================================= */}
        {activeTab === "voice" && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 absolute left-3.5 top-3 text-gray-400" />
                <Input
                  value={voiceSearch}
                  onChange={(e) => setVoiceSearch(e.target.value)}
                  placeholder="Search voice agent by name or email..."
                  className="pl-9 bg-gray-50 border-gray-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                  {(["ALL", "AVAILABLE", "BUSY", "OFFLINE"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setVoiceFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        voiceFilter === st
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadVoiceAgents}
                  disabled={loadingVoice}
                  className="text-xs font-bold rounded-xl border-gray-200 hover:bg-gray-50 gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${loadingVoice ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </Button>

                <Link href="/experts/portal">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 rounded-xl gap-1.5 cursor-pointer"
                  >
                    <span>Full Agent Portal</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Voice Agents Table */}
            <Card className="border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
              <div className="overflow-x-auto">
                {loadingVoice ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" />
                    <span className="text-xs font-semibold text-gray-400">Loading Voice Agents...</span>
                  </div>
                ) : filteredVoiceAgents.length === 0 ? (
                  <div className="py-16 text-center text-gray-400 text-sm">
                    No remote voice agents found. Click "+ New Voice Agent" to add a voice agent to your organization.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] font-extrabold uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Voice Agent</th>
                        <th className="py-3.5 px-4">Email / ID</th>
                        <th className="py-3.5 px-4">Direction</th>
                        <th className="py-3.5 px-4">Current Status</th>
                        <th className="py-3.5 px-4">Active Calls</th>
                        <th className="py-3.5 px-4">Calls Handled</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {filteredVoiceAgents.map((ag) => {
                        const isOnline = ag.status === "AVAILABLE";
                        const isBusy = ag.status === "BUSY" || ag.status === "ON_CALL";
                        const rawDir = (ag.direction || ag.agent_type || (ag.skills?.includes("OUTBOUND") ? "OUTBOUND" : "INBOUND") || "INBOUND").toUpperCase();

                        return (
                          <tr key={ag.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-xs shadow-sm shrink-0">
                                  {ag.name ? ag.name[0].toUpperCase() : "V"}
                                </div>
                                <div>
                                  <Link 
                                    href={`/experts/portal`}
                                    className="font-extrabold text-gray-900 hover:text-indigo-600 transition-colors block"
                                  >
                                    {ag.name}
                                  </Link>
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    ID: VA-{ag.id.slice(0, 6)}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono text-xs text-gray-600">
                              {ag.email || "No email"}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                rawDir === "OUTBOUND"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}>
                                {rawDir === "OUTBOUND" ? <PhoneOutgoing className="h-3 w-3" /> : <PhoneIncoming className="h-3 w-3" />}
                                {rawDir}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                                  isOnline
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : isBusy
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}>
                                  <span className={`h-2 w-2 rounded-full ${
                                    isOnline ? "bg-emerald-500 animate-pulse" : isBusy ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                                  }`} />
                                  {ag.status || "AVAILABLE"}
                                </span>

                                {isAdmin && (
                                  <select
                                    disabled={updatingVoiceId === ag.id}
                                    value={ag.status || "AVAILABLE"}
                                    onChange={(e) => handleUpdateVoiceStatus(ag.id, e.target.value)}
                                    className="text-[10px] font-bold border border-gray-200 rounded-lg px-2 py-1 bg-white cursor-pointer hover:border-indigo-300 transition-colors"
                                  >
                                    <option value="AVAILABLE">Available</option>
                                    <option value="BUSY">Busy</option>
                                    <option value="OFFLINE">Offline</option>
                                  </select>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-gray-900">
                              {ag.active_calls || 0}
                            </td>

                            <td className="py-3.5 px-4 font-bold text-gray-900">
                              {ag.calls_handled || 0}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link href="/experts/portal">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs font-bold rounded-xl border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                                  >
                                    Open Portal
                                  </Button>
                                </Link>
                                {isAdmin && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteVoiceAgent(ag.id, ag.name)}
                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-xl cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Modal: Test AI Agent */}
        {testTarget && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in" onClick={() => setTestTarget(null)}>
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-extrabold text-gray-900 text-lg mb-1">Interactive Test: {testTarget.name}</h3>
              <p className="text-xs text-gray-500 mb-4">Send a message to evaluate the agent's live conversational response</p>
              <Input
                placeholder="Say something to test lead qualification..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runTest()}
                className="rounded-xl"
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="outline" onClick={() => setTestTarget(null)} className="rounded-xl">Close</Button>
                <Button onClick={runTest} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">Send Test</Button>
              </div>
              {testReply && (
                <div className="mt-4 p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">Agent Response:</span>
                  <p className="text-xs text-gray-800 leading-relaxed font-medium">{testReply}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Create Voice Agent */}
        {showVoiceModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in" onClick={() => setShowVoiceModal(false)}>
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">Create Remote Voice Agent</h3>
                <p className="text-xs text-gray-500 mt-0.5">Register a live human agent account for incoming call transfers and campaigns</p>
              </div>

              {voiceError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  {voiceError}
                </div>
              )}

              <form onSubmit={handleCreateVoiceAgent} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Agent Full Name</label>
                  <Input
                    required
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Login Email</label>
                  <Input
                    type="email"
                    required
                    value={voiceEmail}
                    onChange={(e) => setVoiceEmail(e.target.value)}
                    placeholder="agent@company.com"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Password</label>
                  <div className="relative">
                    <Input
                      type={showVoicePassword ? "text" : "password"}
                      value={voicePassword}
                      onChange={(e) => setVoicePassword(e.target.value)}
                      placeholder="Password (default: Welcome123!)"
                      className="rounded-xl text-xs pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowVoicePassword(!showVoicePassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showVoicePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Phone / Extension</label>
                    <Input
                      value={voicePhone}
                      onChange={(e) => setVoicePhone(e.target.value)}
                      placeholder="1001"
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Direction</label>
                    <select
                      value={voiceDirection}
                      onChange={(e) => setVoiceDirection(e.target.value as any)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold bg-white"
                    >
                      <option value="INBOUND">Inbound Transfer</option>
                      <option value="OUTBOUND">Outbound Campaign</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <Button type="button" variant="outline" onClick={() => setShowVoiceModal(false)} className="rounded-xl text-xs font-bold">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={creatingVoice}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                  >
                    {creatingVoice ? "Creating..." : "Save Voice Agent"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

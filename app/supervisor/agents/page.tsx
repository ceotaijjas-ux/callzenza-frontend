"use client";

import { useEffect, useState } from "react";
import { Bot, Headphones, Plus, RefreshCw, UserCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { voiceAgentService, VoiceAgent } from "@/lib/services/voice-agent.service";
import { agentService, Agent } from "@/lib/services/agent.service";
import { AppShell } from "@/components/AppShell";

export default function SupervisorAgentsPage() {
  const [voiceAgents, setVoiceAgents] = useState<VoiceAgent[]>([]);
  const [aiAgents, setAiAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"ALL" | "VOICE" | "AI">("ALL");

  const loadAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const [voiceRes, aiRes] = await Promise.all([
        voiceAgentService.list().catch(() => []),
        agentService.list().catch(() => []),
      ]);
      setVoiceAgents(voiceRes);
      setAiAgents(aiRes);
    } catch (err: any) {
      setError(err.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const combinedAgents = [
    ...voiceAgents.map((v) => ({
      id: v.id,
      name: v.name || v.email,
      type: "Voice Agent",
      status: v.status || "AVAILABLE",
      rawType: "VOICE",
      email: v.email,
    })),
    ...aiAgents.map((a) => ({
      id: a.id,
      name: a.name,
      type: `AI Agent (${a.type || "SALES"})`,
      status: a.status || "ACTIVE",
      rawType: "AI",
      email: a.voice_id ? `Voice ID: ${a.voice_id}` : "AI Sales Model",
    })),
  ];

  const filteredAgents = combinedAgents.filter((agent) => {
    if (filterType === "VOICE") return agent.rawType === "VOICE";
    if (filterType === "AI") return agent.rawType === "AI";
    return true;
  });

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Bot className="h-6 w-6 text-indigo-600" /> Agent Management Directory
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live directory of Voice Agents and AI Sales Agents currently active in your workspace.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadAgents}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 rounded-xl"
            >
              <RefreshCw className="h-3.5 w-3.5 text-indigo-600" /> Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border-slate-200 shadow-xs rounded-2xl bg-white flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Active Agents</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{combinedAgents.length}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Bot className="w-6 h-6" />
            </div>
          </Card>

          <Card className="p-5 border-slate-200 shadow-xs rounded-2xl bg-white flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Human Voice Agents</p>
              <h3 className="text-3xl font-black text-emerald-600 mt-1">{voiceAgents.length}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Headphones className="w-6 h-6" />
            </div>
          </Card>

          <Card className="p-5 border-slate-200 shadow-xs rounded-2xl bg-white flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">AI Calling Models</p>
              <h3 className="text-3xl font-black text-purple-600 mt-1">{aiAgents.length}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
          </Card>
        </div>

        {/* Directory Table */}
        <Card className="p-6 border-slate-200 shadow-xs rounded-2xl bg-white">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Filter:</span>
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterType === "ALL" ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All ({combinedAgents.length})
              </button>
              <button
                onClick={() => setFilterType("VOICE")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterType === "VOICE" ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Voice Agents ({voiceAgents.length})
              </button>
              <button
                onClick={() => setFilterType("AI")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterType === "AI" ? "bg-purple-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                AI Agents ({aiAgents.length})
              </button>
            </div>

            <span className="text-xs font-bold text-slate-400 font-mono">
              Live Database Integration
            </span>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Agent Name / Identifier</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Details / Metadata</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs font-bold">
                      Loading agent directory from database...
                    </td>
                  </tr>
                ) : filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs font-bold">
                      No agents found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                          agent.rawType === "VOICE" ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"
                        }`}>
                          {agent.rawType === "VOICE" ? <Headphones className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div>
                          <span>{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          agent.rawType === "VOICE" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        }`}>
                          {agent.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {agent.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          ["AVAILABLE", "ACTIVE", "FREE"].includes(agent.status.toUpperCase())
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : ["BUSY", "ON_CALL", "IN_CALL"].includes(agent.status.toUpperCase())
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-rose-50 text-rose-600 border-rose-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            ["AVAILABLE", "ACTIVE", "FREE"].includes(agent.status.toUpperCase())
                              ? "bg-emerald-500 animate-pulse"
                              : ["BUSY", "ON_CALL", "IN_CALL"].includes(agent.status.toUpperCase())
                              ? "bg-amber-500 animate-pulse"
                              : "bg-rose-500"
                          }`} />
                          {agent.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}


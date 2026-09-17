"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Agent } from "@/lib/services/agent.service";
import { Expert as HumanExpert } from "@/lib/services/expert.service";
import { Bot, UserCheck, Info, Loader2, Play } from "lucide-react";

interface AgentStepProps {
  callingAgentMode: "AI" | "VOICE";
  setCallingAgentMode: (mode: "AI" | "VOICE") => void;
  agents: Agent[];
  voiceAgents: HumanExpert[];
  agentId: string;
  setAgentId: (id: string) => void;
  voiceAgentId: string;
  setVoiceAgentId: (id: string) => void;
  autoDialRatio: string;
  setAutoDialRatio: (ratio: string) => void;
  agentGender: string;
  setAgentGender: (gender: string) => void;
  previewingVoice: boolean;
  onCheckVoice: () => void;
}

export function AgentStep({
  callingAgentMode,
  setCallingAgentMode,
  agents,
  voiceAgents,
  agentId,
  setAgentId,
  voiceAgentId,
  setVoiceAgentId,
  autoDialRatio,
  setAutoDialRatio,
  agentGender,
  setAgentGender,
  previewingVoice,
  onCheckVoice,
}: AgentStepProps) {
  const selectedVoiceAgentIds = voiceAgentId ? voiceAgentId.split(",").filter(Boolean) : [];

  const handleToggleVoiceAgent = (id: string) => {
    if (selectedVoiceAgentIds.includes(id)) {
      const updated = selectedVoiceAgentIds.filter((x) => x !== id);
      setVoiceAgentId(updated.join(","));
    } else {
      const updated = [...selectedVoiceAgentIds, id];
      setVoiceAgentId(updated.join(","));
    }
  };

  return (
    <Card className="p-6 space-y-5 shadow-sm border-gray-200/80 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <Bot className="h-5 w-5 text-indigo-500" /> Step 3: Agent Selection & Calling Mode
      </h3>

      {/* Agent Type Selector */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
          Select Agent Type
        </label>
        <select
          value={callingAgentMode}
          onChange={(e) => {
            const mode = e.target.value as "AI" | "VOICE";
            setCallingAgentMode(mode);
            setAgentId("");
            setVoiceAgentId("");
          }}
          className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-semibold mb-3 cursor-pointer"
        >
          <option value="AI">AI Agent</option>
          <option value="VOICE">Voice Agent</option>
        </select>
      </div>

      {callingAgentMode === "AI" ? (
        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              SELECT AI AGENT
            </label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-semibold mb-1 cursor-pointer"
            >
              <option value="">Select AI Agent...</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.type || "SALES"})
                </option>
              ))}
            </select>
            {agents.length === 0 && (
              <p className="text-xs font-bold text-rose-500 mt-1">
                No AI Agents available. Please create an AI Agent first.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Assigned Transfer Voice Agents (Human Backup)
              </label>
              {voiceAgents.length > 0 && (
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {selectedVoiceAgentIds.length} Selected
                </span>
              )}
            </div>
            
            <div className="border border-input rounded-xl p-3 bg-background max-h-48 overflow-y-auto space-y-1.5 shadow-inner">
              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none pb-2 border-b border-gray-100 font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={voiceAgents.length > 0 && selectedVoiceAgentIds.length === voiceAgents.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setVoiceAgentId(voiceAgents.map((a) => a.id).join(","));
                    } else {
                      setVoiceAgentId("");
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                Select All Voice Agents
              </label>
              {voiceAgents.map((expert) => {
                const isChecked = selectedVoiceAgentIds.includes(expert.id);
                return (
                  <label key={expert.id} className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 px-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleVoiceAgent(expert.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{expert.name}</span>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        expert.status === "AVAILABLE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : expert.status === "BUSY" || expert.status === "ON_CALL"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        ● {expert.status || "AVAILABLE"}
                      </span>
                    </div>
                  </label>
                );
              })}
              {voiceAgents.length === 0 && (
                <p className="text-xs text-slate-400 py-2 text-center">No Voice Agents available.</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
              Auto Dial Ratio
            </label>
            <select
              value={autoDialRatio}
              onChange={(e) => setAutoDialRatio(e.target.value)}
              className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm font-medium cursor-pointer"
            >
              {[...Array(10)].map((_, i) => (
                <option key={`1:${i+1}`} value={`1:${i+1}`}>
                  1:{i + 1}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
              Assign AI Voice Gender
            </label>
            <select
              value={agentGender}
              onChange={(e) => setAgentGender(e.target.value)}
              className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm font-medium cursor-pointer"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onCheckVoice}
              disabled={previewingVoice}
              className="w-full md:w-auto border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold gap-1.5 cursor-pointer"
            >
              {previewingVoice ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating voice sample...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Listen to Voice Sample
                </>
              )}
            </Button>
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
            <Info className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
            <p className="text-xs text-indigo-700 leading-relaxed font-medium">
              The AI Agent greets the lead, qualifies based on your script, and seamlessly bridges the active call to selected human Voice Agents upon qualification.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                SELECT VOICE AGENTS (SELECT MULTIPLE)
              </label>
              {voiceAgents.length > 0 && (
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {selectedVoiceAgentIds.length} Selected
                </span>
              )}
            </div>
            
            <div className="border border-input rounded-xl p-3 bg-background max-h-48 overflow-y-auto space-y-1.5 shadow-inner">
              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none pb-2 border-b border-gray-100 font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={voiceAgents.length > 0 && selectedVoiceAgentIds.length === voiceAgents.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setVoiceAgentId(voiceAgents.map((a) => a.id).join(","));
                    } else {
                      setVoiceAgentId("");
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                Select All Voice Agents
              </label>
              {voiceAgents.map((expert) => {
                const isChecked = selectedVoiceAgentIds.includes(expert.id);
                return (
                  <label key={expert.id} className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 px-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleVoiceAgent(expert.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{expert.name}</span>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        expert.status === "AVAILABLE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : expert.status === "BUSY" || expert.status === "ON_CALL"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        ● {expert.status || "AVAILABLE"}
                      </span>
                    </div>
                  </label>
                );
              })}
              {voiceAgents.length === 0 && (
                <p className="text-xs font-bold text-rose-500 py-2 text-center">
                  No Voice Agents available. Please create a Voice Agent first.
                </p>
              )}
            </div>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
            <UserCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
              Direct Voice Agent Mode connects outbound calls directly to the selected Voice Agents' lines.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

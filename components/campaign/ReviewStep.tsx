"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Agent } from "@/lib/services/agent.service";
import { Expert as HumanExpert } from "@/lib/services/expert.service";
import { LeadGroup } from "@/lib/services/lead-group.service";
import { Eye } from "lucide-react";

interface ReviewStepProps {
  name: string;
  description: string;
  objective: string;
  customObjective: string;
  customScript: string;
  clientName?: string;
  clientPhone?: string;
  callingAgentMode: "AI" | "VOICE";
  agentId: string;
  agents: Agent[];
  voiceAgentId: string;
  voiceAgents: HumanExpert[];
  agentGender: string;
  leadSelectionMode: "ALL" | "LIBRARY" | "MANUAL";
  targetLeadsCount: number;
  libraryId: string;
  leadLibraries: LeadGroup[];
  defaultLanguage: string;
  callingMode: string;
  twilioNumber: string;
  callingHours: string;
  timezone: string;
  maxAttempts: string;
  retryDelay: string;
  concurrency: string;
  onGotoStep?: (step: number) => void;
}

export function ReviewStep({
  name,
  description,
  objective,
  customObjective,
  customScript,
  clientName,
  clientPhone,
  callingAgentMode,
  agentId,
  agents,
  voiceAgentId,
  voiceAgents,
  agentGender,
  leadSelectionMode,
  targetLeadsCount,
  libraryId,
  leadLibraries,
  defaultLanguage,
  callingMode,
  twilioNumber,
  callingHours,
  timezone,
  maxAttempts,
  retryDelay,
  concurrency,
  onGotoStep,
}: ReviewStepProps) {
  const selectedAgent = agents.find((a) => a.id === agentId);
  const selectedVoiceAgentIds = voiceAgentId ? voiceAgentId.split(",").filter(Boolean) : [];
  const selectedVoiceAgents = voiceAgents.filter((e) => selectedVoiceAgentIds.includes(e.id));
  const voiceAgentNames = selectedVoiceAgents.length > 0
    ? selectedVoiceAgents.map((e) => e.name).join(", ")
    : (selectedVoiceAgentIds.length > 0 ? `${selectedVoiceAgentIds.length} Voice Agents Selected` : "None selected");
  const selectedLibrary = leadLibraries.find((g) => g.id === libraryId);

  const langNames: Record<string, string> = {
    auto: "Auto Detect",
    en: "English",
    ta: "Tamil",
    te: "Telugu",
    ml: "Malayalam",
    kn: "Kannada",
    hi: "Hindi",
    bn: "Bengali",
    mr: "Marathi",
    gu: "Gujarati",
    pa: "Punjabi",
    ur: "Urdu",
    or: "Odia",
  };

  return (
    <Card className="p-6 space-y-6 shadow-sm border-gray-200/80 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between border-b pb-4 border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Eye className="h-5 w-5 text-indigo-500" /> Step 6: Review & Edit Campaign Details
          </h3>
          <p className="text-xs text-gray-400 mt-1">Review your configuration. Click "Edit" on any section below to change parameters.</p>
        </div>
      </div>

      {/* Basic Info Section */}
      <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">1. Basic Information & Client</h4>
          {onGotoStep && (
            <button
              type="button"
              onClick={() => onGotoStep(1)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              ✏️ Edit Basic Info
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-gray-400 block font-semibold">Campaign Name</span>
            <span className="font-bold text-gray-800">{name || "—"}</span>
          </div>
          <div>
            <span className="text-xs text-indigo-600 block font-semibold">Target Client</span>
            <span className="font-bold text-indigo-900">{clientName || "—"} {clientPhone ? `(${clientPhone})` : ""}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-semibold">Objective</span>
            <span className="font-semibold text-gray-700">{objective === "Custom" ? customObjective : (objective || "Not specified")}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-semibold">Regional Language</span>
            <span className="font-bold text-gray-800">{langNames[defaultLanguage] || "Auto Detect"}</span>
          </div>
          <div className="col-span-2">
            <span className="text-xs text-gray-400 block font-semibold">Description</span>
            <span className="text-gray-600">{description || "No description provided"}</span>
          </div>
        </div>
      </div>

      {/* Script Section */}
      <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">2. Campaign Script</h4>
          {onGotoStep && (
            <button
              type="button"
              onClick={() => onGotoStep(2)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              ✏️ Edit Script
            </button>
          )}
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-150 font-mono text-xs text-gray-700 max-h-32 overflow-y-auto leading-relaxed">
          {customScript || "No script entered"}
        </div>
      </div>

      {/* Agent Section */}
      <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">3. Agent Selection & Mode</h4>
          {onGotoStep && (
            <button
              type="button"
              onClick={() => onGotoStep(3)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              ✏️ Edit Agent
            </button>
          )}
        </div>
        <div className="text-sm">
          {callingAgentMode === "AI" ? (
            <div>
              <span className="font-bold text-indigo-600 block">
                AI Agent: {selectedAgent ? selectedAgent.name : "None selected"}
              </span>
              <span className="text-xs text-gray-400 font-medium">
                Gender: <span className="capitalize text-gray-600 font-bold">{agentGender}</span>
                {selectedVoiceAgentIds.length > 0 && ` • Backup Human: ${voiceAgentNames}`}
              </span>
            </div>
          ) : (
            <div>
              <span className="font-bold text-emerald-600 block">
                Direct Voice Agent(s): {voiceAgentNames}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Leads Section */}
      <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">4. Target Leads</h4>
          {onGotoStep && (
            <button
              type="button"
              onClick={() => onGotoStep(4)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              ✏️ Edit Leads
            </button>
          )}
        </div>
        <div className="text-sm">
          <span className="font-bold text-emerald-600">
            {leadSelectionMode === "ALL" && `All Created Leads (${targetLeadsCount} Leads)`}
            {leadSelectionMode === "LIBRARY" && `${selectedLibrary?.filename || "Lead Library"} (${targetLeadsCount} Leads)`}
            {leadSelectionMode === "MANUAL" && `Manually Selected (${targetLeadsCount} Leads)`}
          </span>
        </div>
      </div>

      {/* Calling Config Section */}
      <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">5. Calling Configuration</h4>
          {onGotoStep && (
            <button
              type="button"
              onClick={() => onGotoStep(5)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              ✏️ Edit Config
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-gray-400 block font-semibold uppercase">Calling Mode</span>
            <span className="font-bold text-indigo-700 capitalize">
              {callingMode === "local" ? "Local Test Mode" : "Twilio Outbound"}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-semibold uppercase">Caller ID</span>
            <span className="font-mono font-bold text-gray-800">
              {callingMode === "local" ? "LOCAL_TEST (Simulated)" : (twilioNumber || "Default")}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-semibold uppercase">Allowed Hours / Timezone</span>
            <span className="font-semibold text-gray-700">
              {callingHours} ({timezone})
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-semibold uppercase">Max Attempts / Delay</span>
            <span className="font-semibold text-gray-700">
              {maxAttempts} attempts / {retryDelay} mins
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-semibold uppercase">Concurrency</span>
            <span className="font-bold text-gray-800">{concurrency} Parallel channel(s)</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

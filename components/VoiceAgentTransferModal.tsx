"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  X, Search, PhoneForwarded, UserCheck, AlertCircle, Loader2, 
  ArrowRightLeft, ShieldCheck, CheckCircle2, User
} from "lucide-react";
import { voiceAgentService, VoiceAgent } from "@/lib/services/voice-agent.service";
import { transferService } from "@/lib/services/transfer.service";
import { useAuthStore } from "@/lib/store";
import { useWebSocketSync, WebSocketEventMessage } from "@/lib/hooks/useWebSocketSync";

interface VoiceAgentTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  callId?: string;
  clientId?: string;
  leadId?: string;
  onTransferSuccess?: (targetAgent: VoiceAgent, transferType: "warm" | "cold") => void;
}

export function VoiceAgentTransferModal({
  isOpen,
  onClose,
  callId,
  clientId,
  leadId,
  onTransferSuccess,
}: VoiceAgentTransferModalProps) {
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [transferType, setTransferType] = useState<"warm" | "cold">("warm");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchInboundAgents = useCallback((showLoading = true) => {
    if (showLoading) setLoading(true);
    voiceAgentService
      .list({ agent_type: "INBOUND" })
      .then((res) => {
        const currentUser = useAuthStore.getState().user;
        const currentUserId = currentUser?.id;
        const currentUserEmail = currentUser?.email?.toLowerCase();

        // Strictly filter for Inbound Voice Agents only
        const inboundOnly = (res || []).filter((agent) => {
          // Exclude current user who is initiating the transfer
          if (currentUserId && (agent.user_id === currentUserId || agent.id === currentUserId)) return false;
          if (currentUserEmail && agent.email?.toLowerCase() === currentUserEmail) return false;

          // Exclude Admins
          const name = (agent.name || "").toLowerCase();
          const email = (agent.email || "").toLowerCase();
          if (name.includes("admin") || email.includes("admin")) return false;

          // Exclude Outbound agents
          const dir = (agent.direction || "").toUpperCase();
          const type = (agent.agent_type || "").toUpperCase();
          if (dir === "OUTBOUND" || type === "OUTBOUND" || dir === "ADMIN" || type === "ADMIN") return false;

          const skills = (agent.skills || []).map((s: string) => String(s).toUpperCase());
          if (skills.includes("OUTBOUND") || skills.includes("ADMIN")) return false;

          return true;
        });

        setAgents(inboundOnly);
      })
      .catch((err: any) => {
        console.error("Failed to load inbound voice agents:", err);
        setErrorMsg(err?.message || "Failed to load active inbound voice agents list.");
      })
      .finally(() => {
        if (showLoading) setLoading(false);
      });
  }, []);

  // Listen to WebSocket events so changes in directory update the modal in real-time
  useWebSocketSync((msg: WebSocketEventMessage) => {
    if (!isOpen) return;
    if (msg.event === "voice_agent_status_updated" || msg.event === "agent_status_changed") {
      fetchInboundAgents(false);
    }
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setSelectedAgentId(null);
      fetchInboundAgents(true);
    }
  }, [isOpen, fetchInboundAgents]);

  if (!isOpen) return null;

  const filteredAgents = agents.filter((agent) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (agent.name && agent.name.toLowerCase().includes(q)) ||
      (agent.email && agent.email.toLowerCase().includes(q)) ||
      (agent.phone && agent.phone.includes(q))
    );
  });

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  const getStatusBadge = (status?: string) => {
    const s = (status || "available").toLowerCase();
    if (s === "available" || s === "online" || s === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Available
        </span>
      );
    } else if (s === "busy" || s === "in_call" || s === "on_call") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Busy
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          Offline
        </span>
      );
    }
  };

  const handleConfirmTransfer = async () => {
    if (!selectedAgentId || !selectedAgent) {
      setErrorMsg("Please select a Voice Agent to transfer the call.");
      return;
    }
    const effectiveCallId = callId || "active-live-call";

    const s = (selectedAgent.status || "available").toLowerCase();
    if (s === "offline") {
      setErrorMsg(`Agent "${selectedAgent.name}" is currently offline. Please choose an available agent.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const currentUser = useAuthStore.getState().user;
    const fromAgentId = currentUser?.id || "CURRENT_VOICE_AGENT";

    try {
      // Call dedicated Voice Agent to Voice Agent transfer endpoint with full lead reference
      await transferService.transferVoiceAgentToVoiceAgent({
        call_session_id: effectiveCallId,
        from_voice_agent_id: fromAgentId,
        to_voice_agent_id: selectedAgentId,
        transfer_type: transferType,
        lead_id: leadId || (effectiveCallId !== "active-call-session" ? effectiveCallId : undefined),
        client_id: clientId,
      });

      setSuccessMsg(`Call transfer request (${transferType.toUpperCase()}) initiated to ${selectedAgent.name}!`);
      
      if (onTransferSuccess) {
        onTransferSuccess(selectedAgent, transferType);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Transfer failed:", err);
      setErrorMsg(err?.message || "Call transfer failed. Target agent may be unavailable or offline.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <PhoneForwarded className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Transfer to Voice Agent</h3>
              <p className="text-xs text-slate-400">Select an agent and transfer mode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 animate-in slide-in-from-top-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* Transfer Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Transfer Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTransferType("warm")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  transferType === "warm"
                    ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-500"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" /> Warm Transfer
                  </span>
                  {transferType === "warm" && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Consult with agent before handing over the live call.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTransferType("cold")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  transferType === "cold"
                    ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-500"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold flex items-center gap-1.5">
                    <PhoneForwarded className="w-3.5 h-3.5 text-indigo-600" /> Cold / Blind Transfer
                  </span>
                  {transferType === "cold" && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Transfer immediately to target agent without consultation.
                </p>
              </button>
            </div>
          </div>

          {/* Agent Search & List */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Select Destination Inbound Voice Agent</label>
              <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                {filteredAgents.length} Inbound {filteredAgents.length === 1 ? "Agent" : "Agents"}
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search inbound agent by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-xs font-medium">Loading available inbound voice agents...</span>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="py-8 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <User className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                <p className="text-xs font-medium">No available inbound voice agents found.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filteredAgents.map((agent) => {
                  const isSelected = selectedAgentId === agent.id;
                  const isOffline = (agent.status || "").toLowerCase() === "offline";
                  return (
                    <div
                      key={agent.id}
                      onClick={() => !isOffline && setSelectedAgentId(agent.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isOffline 
                          ? "opacity-50 border-slate-200 bg-slate-50 cursor-not-allowed"
                          : isSelected
                          ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500"
                          : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                        }`}>
                          {agent.name ? agent.name.charAt(0).toUpperCase() : "A"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{agent.name || "Inbound Voice Agent"}</span>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              INBOUND
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">{agent.email || agent.phone || "Inbound Voice Specialist"}</div>
                        </div>
                      </div>

                      <div>{getStatusBadge(agent.status)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmTransfer}
            disabled={!selectedAgentId || isSubmitting}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Initiating Transfer...
              </>
            ) : (
              <>
                <PhoneForwarded className="w-3.5 h-3.5" />
                Transfer Call
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

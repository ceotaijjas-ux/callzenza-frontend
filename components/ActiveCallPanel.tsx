"use client";

import { useActiveCallStore, parseIsoTimestampMs } from "@/lib/store";
import { useState, useEffect } from "react";
import { useWebSocketSync, ConnectionStatus, WebSocketEventMessage } from "@/lib/hooks/useWebSocketSync";
import { callService } from "@/lib/services/call.service";
import { campaignService } from "@/lib/services/campaign.service";
import { transferService } from "@/lib/services/transfer.service";
import { agentDashboardService } from "@/lib/services/agent-dashboard.service";
import { 
  Phone, Pause, Play, PhoneOff, UserCheck, AlertCircle, 
  RefreshCw, CheckCircle2, Shield, Loader2, Save, X, PhoneForwarded, Music
} from "lucide-react";
import { VoiceAgentTransferModal } from "@/components/VoiceAgentTransferModal";

export type CallStatusState = 
  | "PENDING"
  | "INITIATING"
  | "RINGING"
  | "CONNECTED"
  | "CALLING"
  | "AI_HANDLING"
  | "TRANSFER_REQUESTED"
  | "ON_HOLD"
  | "HUMAN_HANDLING"
  | "QUALIFIED"
  | "NOT_QUALIFIED"
  | "CLIENT_ADDING"
  | "CONFERENCE_3WAY_ACTIVE"
  | "CLIENT_ADD_FAILED"
  | "COMPLETED"
  | "FAILED";

interface ActiveCallPanelProps {
  callId?: string;
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  initialStatus?: CallStatusState;
  campaignId?: string;
  campaignClientName?: string;
  campaignClientPhone?: string;
  customerDurationFormatted?: string;
  clientDurationFormatted?: string;
  clientDisconnectedAt?: string | null;
  onDisconnectClient?: () => void;
  onClientConnected?: (connectedAt: string, clientName?: string, clientPhone?: string) => void;
  agentName?: string;
  onCallEnded?: () => void;
  onStatusChange?: (newStatus: CallStatusState) => void;
}

export function ActiveCallPanel({
  callId,
  leadId,
  leadName = "John Doe",
  leadPhone = "+15550192834",
  initialStatus = "HUMAN_HANDLING",
  campaignId,
  campaignClientName = "SunPower Client Rep",
  campaignClientPhone = "+15550193333",
  customerDurationFormatted = "00:00",
  clientDurationFormatted = "00:00",
  clientDisconnectedAt,
  onDisconnectClient,
  onClientConnected,
  agentName = "Current Agent",
  onCallEnded,
  onStatusChange,
}: ActiveCallPanelProps) {
  const [callStatus, setCallStatus] = useState<CallStatusState>(initialStatus);
  const [addingClient, setAddingClient] = useState(false);
  const [addClientError, setAddClientError] = useState<string | null>(null);
  const [transferId, setTransferId] = useState<string | null>(null);

  // Client Contact Settings
  const [clientName, setClientName] = useState(campaignClientName);
  const [clientPhone, setClientPhone] = useState(campaignClientPhone);
  const [savingClient, setSavingClient] = useState(false);
  const [clientSaveMsg, setClientSaveMsg] = useState<string | null>(null);

  // Voice Agent Internal Transfer state
  const [showVoiceAgentTransferModal, setShowVoiceAgentTransferModal] = useState(false);
  const [transferredInfo, setTransferredInfo] = useState<{
    targetAgentName: string;
    transferType: "warm" | "cold";
    transferredAt: string;
  } | null>(null);

  useEffect(() => {
    setCallStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setClientName(campaignClientName);
    setClientPhone(campaignClientPhone);
  }, [campaignClientName, campaignClientPhone]);

  // REST Resync handler on WebSocket reconnect
  const handleRestResync = async () => {
    if (!callId) return;
    try {
      const call = await callService.get(callId);
      if (call?.status) {
        setCallStatus(call.status as CallStatusState);
        if (onStatusChange) onStatusChange(call.status as CallStatusState);
      }
    } catch (_) {}
  };

  const liveClientDuration = useActiveCallStore((s) => s.clientDuration);
  const liveCallDuration = useActiveCallStore((s) => s.callDuration);

  const formatSeconds = (seconds: number) => {
    return `${seconds * 1000} ms`;
  };

  const displayClientDuration = liveClientDuration > 0 ? formatSeconds(liveClientDuration) : clientDurationFormatted;
  const displayCustomerDuration = liveCallDuration > 0 ? formatSeconds(liveCallDuration) : customerDurationFormatted;

  // WebSocket Live Listener
  const { status: connStatus } = useWebSocketSync(
    (msg: WebSocketEventMessage) => {
      if (callId && msg.call_id && msg.call_id !== callId) return;

      if (msg.event === "TRANSFER_REQUESTED" && msg.transfer_id) {
        setTransferId(msg.transfer_id);
        setCallStatus("TRANSFER_REQUESTED");
        if (onStatusChange) onStatusChange("TRANSFER_REQUESTED");
      } else if (msg.event === "THREE_WAY_ACTIVE" || msg.event === "CLIENT_CONNECTED") {
        if (msg.transfer_id) setTransferId(msg.transfer_id);
        setCallStatus("CONFERENCE_3WAY_ACTIVE");
        if (onStatusChange) onStatusChange("CONFERENCE_3WAY_ACTIVE");
        const connAt = (msg as any).client_connected_at || new Date().toISOString();
        const cName = (msg as any).client_name || clientName;
        const cPhone = (msg as any).client_phone || clientPhone;
        if (cName) setClientName(cName);
        if (cPhone) setClientPhone(cPhone);
        useActiveCallStore.getState().setCallState({
          clientConnectedAt: connAt,
          clientDisconnectedAt: null,
          telephonyStatus: "CONFERENCE_3WAY_ACTIVE",
        });
        if (onClientConnected) {
          onClientConnected(connAt, cName, cPhone);
        }
      } else if (msg.event === "TARGET_REJECTED") {
        setCallStatus("HUMAN_HANDLING");
        if (onStatusChange) onStatusChange("HUMAN_HANDLING");
        setAddClientError(`Failed to connect client contact: ${msg.rejected_agent_name || "D2"}`);
      } else if (msg.event === "TARGET_NO_ANSWER") {
        setCallStatus("HUMAN_HANDLING");
        if (onStatusChange) onStatusChange("HUMAN_HANDLING");
        setAddClientError("No answer from target client contact. Call remains connected.");
      } else if (msg.event === "TRANSFER_CANCELLED") {
        setCallStatus("HUMAN_HANDLING");
        if (onStatusChange) onStatusChange("HUMAN_HANDLING");
      } else if (msg.event === "TRANSFER_COMPLETED") {
        setCallStatus("COMPLETED");
        if (onStatusChange) onStatusChange("COMPLETED");
        if (onCallEnded) onCallEnded();
      } else if (msg.event === "CALL_STATUS_CHANGED" && msg.status) {
        const nextStatus = msg.status as CallStatusState;
        setCallStatus(nextStatus);
        if (onStatusChange) onStatusChange(nextStatus);
        if (nextStatus === "COMPLETED" || nextStatus === "FAILED") {
          if (onCallEnded) onCallEnded();
        }
      } else if (msg.event === "QUALIFICATION_CHANGED" && msg.status) {
        const nextStatus = msg.status as CallStatusState;
        setCallStatus(nextStatus);
        if (onStatusChange) onStatusChange(nextStatus);
      } else if (msg.event === "CLIENT_EDITED") {
        if (msg.client_name) setClientName(msg.client_name);
        if (msg.client_phone) setClientPhone(msg.client_phone);
      }
    },
    handleRestResync
  );

  // Handlers for state matrix action buttons
  const handleSetQualification = async (status: "QUALIFIED" | "NOT_QUALIFIED") => {
    setCallStatus(status);
    if (onStatusChange) onStatusChange(status);
    if (callId) {
      try {
        await callService.updateQualification(callId, status);
      } catch (err: any) {
        setAddClientError(err.message || "Failed to set qualification status.");
      }
    }
  };

  const storeSelectedName = useActiveCallStore((s) => s.selectedClientName);
  const storeSelectedPhone = useActiveCallStore((s) => s.selectedClientPhone);
  const openClientSelectionModal = useActiveCallStore((s) => s.openClientSelectionModal);

  const displayClientName = storeSelectedName || clientName || campaignClientName || "Selected Client";
  const displayClientPhone = storeSelectedPhone || clientPhone || campaignClientPhone || "";

  const handleAddClientToCall = async () => {
    // Open the shared SelectClientModal
    openClientSelectionModal();
  };

  const handleWrapUpCall = async () => {
    setCallStatus("COMPLETED");
    if (onStatusChange) onStatusChange("COMPLETED");
    if (onCallEnded) onCallEnded();
  };

  const handleCancelTransfer = async () => {
    if (!transferId) return;
    try {
      await transferService.cancelTransfer(transferId);
      setCallStatus("HUMAN_HANDLING");
      if (onStatusChange) onStatusChange("HUMAN_HANDLING");
    } catch (err: any) {
      setAddClientError(err.message || "Failed to cancel transfer.");
    }
  };

  const handleLeaveTransfer = async () => {
    if (!callId) return;
    try {
      await transferService.leaveTransfer(callId);
      setCallStatus("COMPLETED");
      if (onStatusChange) onStatusChange("COMPLETED");
      if (onCallEnded) onCallEnded();
    } catch (err: any) {
      setAddClientError(err.message || "Failed to complete transfer.");
    }
  };

  const handleSaveClientSettings = async () => {
    if (!campaignId) {
      setClientSaveMsg("No active campaign selected to save client credentials.");
      return;
    }
    setSavingClient(true);
    setClientSaveMsg(null);
    try {
      await campaignService.update(campaignId, {
        client_name: clientName,
        client_phone: clientPhone,
      });
      setClientSaveMsg("Client contact credentials saved successfully!");
      setTimeout(() => setClientSaveMsg(null), 3000);
    } catch (err: any) {
      setClientSaveMsg(err.message || "Failed to save client credentials.");
    } finally {
      setSavingClient(false);
    }
  };

  // Status badge style helper
  const getStatusBadge = () => {
    switch (callStatus) {
      case "RINGING":
      case "INITIATING":
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold uppercase text-[10px] flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Ringing...
          </span>
        );
      case "ON_HOLD":
        return (
          <span className="px-2.5 py-1 bg-amber-500 text-white rounded font-bold uppercase text-[10px] flex items-center gap-1.5 animate-pulse">
            <Music className="w-3 h-3 animate-spin" />
            Call on Hold (Music Playing)
          </span>
        );
      case "AI_HANDLING":
        return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded font-bold uppercase text-[10px]">AI Handling</span>;
      case "TRANSFER_REQUESTED":
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded font-bold uppercase text-[10px]">Transfer Requested</span>;
      case "HUMAN_HANDLING":
      case "CONNECTED":
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold uppercase text-[10px]">Human Agent Active</span>;
      case "QUALIFIED":
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded font-bold uppercase text-[10px]">Lead Qualified</span>;
      case "CLIENT_ADDING":
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded font-bold uppercase text-[10px] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Dialing Client...</span>;
      case "CONFERENCE_3WAY_ACTIVE":
        return <span className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold uppercase text-[10px] animate-pulse">3-Way Conference Live</span>;
      case "CLIENT_ADD_FAILED":
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded font-bold uppercase text-[10px]">Client Dial Failed</span>;
      case "NOT_QUALIFIED":
        return <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded font-bold uppercase text-[10px]">Not Qualified</span>;
      case "COMPLETED":
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded font-bold uppercase text-[10px]">Call Completed</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded font-bold uppercase text-[10px]">{callStatus}</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-300 rounded shadow-sm flex flex-col shrink-0 overflow-hidden">
      {/* Active Call Header */}
      <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${connStatus === "connected" ? "bg-emerald-400" : (connStatus === "reconnecting" ? "bg-amber-400 animate-ping" : "bg-rose-500")}`} />
            <span className="text-[10px] font-bold uppercase text-slate-400">
              {connStatus === "connected" ? "Live WebSocket" : (connStatus === "reconnecting" ? "Reconnecting..." : "Offline")}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <span className="text-xs font-bold text-slate-200">Active Call Workspace</span>
        </div>
        <div className="flex items-center gap-2">
          {transferredInfo && (
            <span className="px-2.5 py-1 bg-purple-600 text-white rounded font-bold uppercase text-[10px] flex items-center gap-1 shadow-xs">
              <PhoneForwarded className="w-3 h-3" /> Transferred to {transferredInfo.targetAgentName}
            </span>
          )}
          {getStatusBadge()}
        </div>
      </div>

      {/* Non-intrusive Call Transferred Indicator Tag */}
      {transferredInfo && (
        <div className="px-4 py-2 bg-purple-50 border-b border-purple-200 text-purple-900 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
            Call transferred to Voice Agent <strong className="font-extrabold">{transferredInfo.targetAgentName}</strong> ({transferredInfo.transferType.toUpperCase()} TRANSFER)
          </span>
          <span className="text-[11px] text-purple-700 font-mono font-medium">Transferred at {transferredInfo.transferredAt}</span>
        </div>
      )}

      {/* Main Call Info & Single State Action Button */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-600 font-extrabold text-sm">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">{leadName}</h3>
            <p className="text-xs font-mono text-slate-500">{leadPhone}</p>
          </div>
        </div>

        {/* State-Driven Single Action Area */}
        <div className="flex items-center gap-2">
          {/* Transfer to Voice Agent action available for active Voice Agent */}
          {(callStatus === "HUMAN_HANDLING" || callStatus === "CONNECTED" || callStatus === "RINGING" || callStatus === "INITIATING" || callStatus === "QUALIFIED") && (
            <button
              onClick={() => setShowVoiceAgentTransferModal(true)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <PhoneForwarded className="w-3.5 h-3.5" /> Transfer to Voice Agent
            </button>
          )}

          {(callStatus === "HUMAN_HANDLING" || callStatus === "CONNECTED" || callStatus === "RINGING" || callStatus === "INITIATING") && (
            <>
              <button
                onClick={() => handleSetQualification("NOT_QUALIFIED")}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Mark Not Qualified
              </button>
              <button
                onClick={() => handleSetQualification("QUALIFIED")}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
              >
                Mark Qualified
              </button>
            </>
          )}

          {callStatus === "QUALIFIED" && (
            <button
              onClick={handleAddClientToCall}
              disabled={addingClient}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {addingClient ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
              + Add Client to Call
            </button>
          )}

          {callStatus === "CLIENT_ADDING" && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded text-xs font-bold text-amber-800">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span>Dialing Client ({clientPhone})... Customer & Agent remain connected</span>
            </div>
          )}

          {callStatus === "TRANSFER_REQUESTED" && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded text-xs font-bold text-indigo-850">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Calling Client Contacts... Customer & Agent remain connected</span>
              </div>
              <button
                onClick={handleCancelTransfer}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          )}

          {callStatus === "CONFERENCE_3WAY_ACTIVE" && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleLeaveTransfer}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
              >
                Leave & Complete Transfer
              </button>
              <button
                onClick={handleWrapUpCall}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
              >
                End Call for All
              </button>
            </div>
          )}

          {callStatus === "CLIENT_ADD_FAILED" && (
            <button
              onClick={handleAddClientToCall}
              disabled={addingClient}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {addingClient ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Retry Add Client to Call
            </button>
          )}

          {callStatus === "NOT_QUALIFIED" && (
            <button
              onClick={handleWrapUpCall}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
            >
              Wrap Up Call
            </button>
          )}
        </div>
      </div>

      {/* 3-Way Conference Live Visual Layout */}
      {callStatus === "CONFERENCE_3WAY_ACTIVE" && (
        <div className="p-4 bg-emerald-950/20 border-b border-emerald-800/40">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              3-Way Live Conference Connected
            </h4>
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">3 Active Participants</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
            {/* Participant 1: Customer */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col items-center justify-center">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Customer / Lead</span>
              <h5 className="text-xs font-extrabold text-slate-900 truncate max-w-full">{leadName}</h5>
              <span className="text-[11px] font-mono font-bold text-slate-600 mt-0.5">{leadPhone}</span>
              <div className="mt-2 flex flex-col items-center">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold uppercase">Connected</span>
                <span className="text-xs font-mono font-bold text-slate-700 mt-1">Call Duration: {displayCustomerDuration}</span>
              </div>
            </div>

            {/* Participant 2: Voice Agent */}
            <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg shadow-xs flex flex-col items-center justify-center">
              <span className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-wider mb-1">Voice Agent (Host)</span>
              <h5 className="text-xs font-extrabold text-indigo-950">{agentName}</h5>
              <span className="text-[11px] font-mono font-bold text-indigo-700 mt-0.5">Live Line</span>
              <div className="mt-2 flex flex-col items-center">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-300 rounded text-[9px] font-bold uppercase">Moderating</span>
                <span className="text-xs font-mono font-bold text-indigo-900 mt-1">Agent Duration: {displayCustomerDuration}</span>
              </div>
            </div>

            {/* Participant 3: Selected Client */}
            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg shadow-xs flex flex-col items-center justify-center relative">
              <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider mb-1">Selected Client</span>
              <h5 className="text-xs font-extrabold text-emerald-950 truncate max-w-full">{displayClientName}</h5>
              <span className="text-[11px] font-mono font-bold text-emerald-700 mt-0.5">{displayClientPhone}</span>
              <div className="mt-2 flex flex-col items-center">
                {clientDisconnectedAt ? (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-300 rounded text-[9px] font-bold uppercase">Disconnected</span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[9px] font-bold uppercase">Client Connected</span>
                )}
                <span className="text-xs font-mono font-bold text-emerald-900 mt-1">Client Duration: {displayClientDuration}</span>
                {onDisconnectClient && !clientDisconnectedAt && (
                  <button
                    type="button"
                    onClick={onDisconnectClient}
                    className="mt-2 px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 rounded text-[10px] font-bold uppercase cursor-pointer"
                  >
                    Disconnect Client
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Failure Retry Alert Banner */}
      {addClientError && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 p-3 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{addClientError}</span>
          </div>
          <button
            onClick={handleAddClientToCall}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded uppercase text-[10px] cursor-pointer"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* Client Phone Number Section (Identical on both dashboards, single write path) */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-600" /> Client Contact Details (Single Write Path)
          </h4>
          {clientSaveMsg && (
            <span className={`text-xs font-bold ${clientSaveMsg.includes("success") ? "text-emerald-600" : "text-rose-600"}`}>
              {clientSaveMsg}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Client Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. SunPower Client Rep"
              className="w-full h-9 px-3 border border-slate-300 rounded text-xs font-semibold bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Client Phone Number (E.164)</label>
            <input
              type="text"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="e.g. +15550193333"
              className="w-full h-9 px-3 border border-slate-300 rounded text-xs font-semibold bg-white font-mono"
            />
          </div>
          <div>
            <button
              onClick={handleSaveClientSettings}
              disabled={savingClient}
              className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {savingClient ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <VoiceAgentTransferModal
        isOpen={showVoiceAgentTransferModal}
        onClose={() => setShowVoiceAgentTransferModal(false)}
        callId={callId}
        clientId={campaignId}
        leadId={leadId || callId}
        onTransferSuccess={(targetAgent, type) => {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setTransferredInfo({
            targetAgentName: targetAgent.name || "Voice Agent",
            transferType: type,
            transferredAt: nowStr,
          });
          if (type === "cold") {
            setCallStatus("COMPLETED");
            if (onStatusChange) onStatusChange("COMPLETED");
          } else {
            setCallStatus("ON_HOLD");
            if (onStatusChange) onStatusChange("ON_HOLD");
            if (callId) {
              agentDashboardService.holdCall(callId, `Transfer initiated to ${targetAgent.name || "Voice Agent"}`).catch((e) => {
                console.error("Failed to hold call during transfer:", e);
              });
            }
          }
        }}
      />
    </div>
  );
}

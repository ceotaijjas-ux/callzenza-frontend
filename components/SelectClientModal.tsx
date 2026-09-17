"use client";

import { useState, useEffect } from "react";
import { X, Search, Phone, UserCheck, Loader2, AlertCircle, CheckCircle2, Building } from "lucide-react";
import { useActiveCallStore } from "@/lib/store";
import { callService } from "@/lib/services/call.service";
import { agentDashboardService } from "@/lib/services/agent-dashboard.service";
import { CampaignClientOption } from "@/components/DialControlPanel";

interface SelectClientModalProps {
  callId?: string;
  campaignId?: string;
  campaignClients?: CampaignClientOption[];
  onClientConnected?: (connectedAt: string, name?: string, phone?: string) => void;
  onStatusChange?: (status: string) => void;
}

export function SelectClientModal({
  callId,
  campaignId,
  campaignClients: initialCampaignClients,
  onClientConnected,
  onStatusChange,
}: SelectClientModalProps) {
  const showModal = useActiveCallStore((s) => s.showSelectClientModal);
  const closeModal = useActiveCallStore((s) => s.closeClientSelectionModal);
  const activeCallId = useActiveCallStore((s) => s.activeCallId) || callId;

  const [campaignClients, setCampaignClients] = useState<CampaignClientOption[]>(initialCampaignClients || []);
  const [loadingClients, setLoadingClients] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedClient, setSelectedClient] = useState<CampaignClientOption | null>(null);
  const [customName, setCustomName] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch campaign clients if not provided
  useEffect(() => {
    if (initialCampaignClients && initialCampaignClients.length > 0) {
      setCampaignClients(initialCampaignClients);
    } else if (campaignId) {
      setLoadingClients(true);
      agentDashboardService
        .getCampaignClients(campaignId)
        .then((res) => {
          if (res && res.clients) {
            setCampaignClients(res.clients);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingClients(false));
    }
  }, [campaignId, initialCampaignClients]);

  if (!showModal) return null;

  const filteredClients = campaignClients.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q) ||
      (c.company || "").toLowerCase().includes(q)
    );
  });

  const handleConnectClient = async () => {
    const targetName = useCustom ? customName.trim() : selectedClient?.name || "";
    const targetPhone = useCustom ? customPhone.trim() : selectedClient?.phone || "";

    if (!targetPhone) {
      setErrorMsg("Please select a client or enter a valid client phone number.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const targetCallId = activeCallId || "demo-call-id";

    // Set temporary state to CLIENT_ADDING
    useActiveCallStore.getState().setCallState({
      telephonyStatus: "CLIENT_ADDING",
      selectedClientName: targetName,
      selectedClientPhone: targetPhone,
      selectedClientId: selectedClient?.client_id || selectedClient?.id || null,
      isCallParked: true,
    });
    if (onStatusChange) onStatusChange("CLIENT_ADDING");

    try {
      const res = await callService.addClientToCall(targetCallId, targetName, targetPhone);
      const connAt = res.client_connected_at || new Date().toISOString();

      useActiveCallStore.getState().setCallState({
        clientConnectedAt: connAt,
        clientDisconnectedAt: null,
        telephonyStatus: "CONFERENCE_3WAY_ACTIVE",
        selectedClientName: targetName,
        selectedClientPhone: targetPhone,
        selectedClientId: selectedClient?.client_id || selectedClient?.id || null,
        isCallParked: true,
        showSelectClientModal: false,
      });

      if (onStatusChange) onStatusChange("CONFERENCE_3WAY_ACTIVE");
      if (onClientConnected) onClientConnected(connAt, targetName, targetPhone);

      closeModal();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect client to call.");
      useActiveCallStore.getState().setCallState({
        telephonyStatus: "CLIENT_ADD_FAILED",
      });
      if (onStatusChange) onStatusChange("CLIENT_ADD_FAILED");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-900/70 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-indigo-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Select Client to Add / Park Call
              </h3>
              <p className="text-[11px] text-slate-400">
                Choose a client from the campaign directory to connect into a 3-way conference.
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Toggle between Campaign Directory & Custom Entry */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-indigo-950">
            <button
              type="button"
              onClick={() => setUseCustom(false)}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                !useCustom
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Campaign Directory ({campaignClients.length})
            </button>
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                useCustom
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Enter Custom Contact
            </button>
          </div>

          {!useCustom ? (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search client by name, phone, or company..."
                  className="w-full h-9 pl-9 pr-4 bg-slate-950 border border-indigo-900/60 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Client List */}
              {loadingClients ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  Loading campaign clients...
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-indigo-950">
                  No campaign clients found matching search.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {filteredClients.map((client) => {
                    const isSelected = selectedClient?.id === client.id;

                    return (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-950/60 border-indigo-500 text-white shadow-md"
                            : "bg-slate-950/60 border-indigo-900/40 text-slate-300 hover:border-indigo-700/60 hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold flex items-center gap-2">
                            <span>{client.name}</span>
                            {client.company && (
                              <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                                <Building className="w-3 h-3" /> {client.company}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono font-medium text-slate-400">
                            {client.phone}
                          </div>
                        </div>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Custom Contact Form */
            <div className="space-y-3 p-3 bg-slate-950/60 border border-indigo-900/50 rounded-xl">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Client Rep Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. SunPower Client Rep"
                  className="w-full h-9 px-3 bg-slate-900 border border-indigo-900/60 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Client Phone Number (E.164)
                </label>
                <input
                  type="text"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="e.g. +15550193333"
                  className="w-full h-9 px-3 bg-slate-900 border border-indigo-900/60 rounded-lg text-xs font-semibold text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-indigo-900/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConnectClient}
            disabled={isSubmitting || (!useCustom && !selectedClient) || (useCustom && !customPhone.trim())}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Dialing & Connecting...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4" /> Connect Client to Call
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import { apiFetch } from "@/lib/api-client";

export interface CallTransfer {
  id: string;
  business_id: string;
  call_id: string;
  lead_id: string | null;
  from_agent_id: string;
  to_agent_id: string;
  transfer_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TransferHistoryItem {
  timestamp: string;
  event: string;
  status: string;
}

export interface FormattedCallTransfer {
  transfer_id: string;
  call_id: string;
  lead_id: string | null;
  customer_name: string;
  mobile: string;
  from_agent_name: string;
  reason: string;
  status: string;
  time: string;
}

export const transferService = {
  listTransfers: () => apiFetch<FormattedCallTransfer[]>("/api/voice/transfers"),
  acceptTransfer: (transferId: string) =>
    apiFetch<{ status: string; message: string }>(`/api/voice/transfers/${transferId}/accept`, {
      method: "POST",
    }),
  rejectTransfer: (transferId: string) =>
    apiFetch<{ status: string; message: string }>(`/api/voice/transfers/${transferId}/reject`, {
      method: "POST",
    }),
  noAnswerTransfer: (transferId: string) =>
    apiFetch<{ status: string; message: string }>(`/api/voice/transfers/${transferId}/no-answer`, {
      method: "POST",
    }),
  cancelTransfer: (transferId: string) =>
    apiFetch<{ status: string; message: string }>(`/api/voice/transfers/${transferId}/cancel`, {
      method: "POST",
    }),
  leaveTransfer: (callId: string) =>
    apiFetch<{ status: string; message: string }>(`/api/voice/calls/${callId}/leave-transfer`, {
      method: "POST",
    }),
  initiateTransfer: (
    callId: string,
    data: { target_agent_id: string; transfer_type: "warm" | "cold" | "three_way"; client_id?: string }
  ) =>
    apiFetch<{ status: string; transfer_id?: string; message?: string }>(`/api/voice/calls/${callId}/transfer`, {
      method: "POST",
      body: JSON.stringify({
        target_agent_id: data.target_agent_id,
        destination_agent_id: data.target_agent_id,
        transfer_type: data.transfer_type,
        client_id: data.client_id,
      }),
    }),
  transferVoiceAgentToVoiceAgent: (data: {
    call_session_id: string;
    from_voice_agent_id: string;
    to_voice_agent_id: string;
    transfer_type: "warm" | "cold";
    notes?: string;
    lead_id?: string;
    client_id?: string;
    campaign_id?: string;
  }) =>
    apiFetch<{ success: boolean; status: string; transfer_id: string; message: string; lead?: any }>("/api/call/voice-agent-transfer", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getTransferHistory: (callId: string) =>
    apiFetch<TransferHistoryItem[]>(`/api/voice/calls/${callId}/transfer-history`),
};

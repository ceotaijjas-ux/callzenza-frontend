import { apiFetch } from "@/lib/api-client";
import { Expert } from "./expert.service";

export interface VoiceAgent extends Expert {
  agent_type?: "INBOUND" | "OUTBOUND" | "ADMIN" | string;
  direction?: "INBOUND" | "OUTBOUND" | string;
}

export const voiceAgentService = {
  list: (params?: { agent_type?: string }) => {
    const q = params?.agent_type ? `?agent_type=${params.agent_type}` : "";
    return apiFetch<VoiceAgent[]>(`/api/voice-agents${q}`);
  },
  get: (id: string) => apiFetch<VoiceAgent>(`/api/voice-agents/${id}`),
  create: (data: { name: string; email: string; phone?: string; password?: string; status?: string; direction?: string }) =>
    apiFetch<VoiceAgent>("/api/voice-agents", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; email?: string; password?: string; status?: string; direction?: string; agent_type?: string }) =>
    apiFetch<VoiceAgent>(`/api/voice-agents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    apiFetch<VoiceAgent>(`/api/voice-agents/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  updateDirection: (id: string, direction: string) =>
    apiFetch<VoiceAgent>(`/api/voice-agents/${id}/direction`, { method: "PATCH", body: JSON.stringify({ direction: direction.toUpperCase() }) }),
  togglePd: (id: string, auto_dial_enabled?: boolean) =>
    apiFetch<VoiceAgent>(`/api/voice-agents/${id}/pd`, { method: "PATCH", body: JSON.stringify({ auto_dial_enabled }) }),
  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/api/voice-agents/${id}`, { method: "DELETE" }),

  getOverview: (id: string) =>
    apiFetch<{
      agent: VoiceAgent;
      total_campaigns: number;
      total_leads_worked: number;
      qualified_calls: number;
      calls_handled: number;
      active_calls: number;
    }>(`/api/voice-agents/${id}/overview`),

  getCampaigns: (id: string, status?: string) =>
    apiFetch<any[]>(`/api/voice-agents/${id}/campaigns${status ? `?status=${status}` : ""}`),

  getLeads: (id: string, params?: { search?: string; call_status?: string; lead_status?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.call_status) q.append("call_status", params.call_status);
    if (params?.lead_status) q.append("lead_status", params.lead_status);
    const str = q.toString();
    return apiFetch<any[]>(`/api/voice-agents/${id}/leads${str ? `?${str}` : ""}`);
  },

  getQualifiedCalls: (id: string) =>
    apiFetch<any[]>(`/api/voice-agents/${id}/qualified-calls`),

  getCallHistory: (id: string, rangeFilter?: string) =>
    apiFetch<any[]>(`/api/voice-agents/${id}/call-history${rangeFilter ? `?range_filter=${rangeFilter}` : ""}`),
};

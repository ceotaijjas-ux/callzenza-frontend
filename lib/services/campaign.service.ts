import { apiFetch, apiUpload } from "@/lib/api-client";

export interface Campaign {
  id: string;
  business_id?: string;
  name: string;
  status: "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED";
  calling_mode?: "AI" | "VOICE";
  agent_type?: "AI_VOICE" | "HUMAN";
  agent_id?: string | null;
  voice_agent_id?: string | null;
  lead_group_id?: string | null;
  client_id?: string | null;
  client_name?: string;
  client_phone?: string;
  client_company?: string;
  twilio_number: string;
  schedule?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  auto_dial_enabled?: boolean;
  auto_dial_ratio?: number;
  dialable_leads?: number;
  total_leads?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignLead {
  id: string;
  campaign_id: string;
  lead_id: string;
  status: "PENDING" | "CALLING" | "COMPLETED" | "FAILED" | "NO_ANSWER" | "BUSY";
  call_id: string | null;
  created_at: string;
}

export const campaignService = {
  getTwilioNumber: () => apiFetch<{ twilio_phone_number: string; configured: boolean }>("/api/integrations/twilio/number"),
  list: () => apiFetch<Campaign[]>("/api/campaigns"),
  get: (id: string) => apiFetch<Campaign>(`/api/campaigns/${id}`),
  create: (data: {
    name: string;
    calling_mode?: string;
    agent_type?: string;
    agent_id?: string | null;
    voice_agent_id?: string | null;
    lead_group_id?: string | null;
    client_id?: string | null;
    client_name?: string;
    client_phone?: string;
    client_company?: string;
    twilio_number: string;
    lead_ids: string[];
    schedule?: Record<string, any>;
  }) => apiFetch<Campaign>("/api/campaigns", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Campaign> & { lead_ids?: string[] }) =>
    apiFetch<Campaign>(`/api/campaigns/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  getLeads: (id: string) => apiFetch<CampaignLead[]>(`/api/campaigns/${id}/leads`),
  getClients: (id: string) =>
    apiFetch<{
      campaign_id: string;
      campaign_name: string;
      total_clients: number;
      clients: {
        id: string;
        client_id: string;
        name: string;
        phone: string;
        email?: string;
        company?: string;
        location?: string;
        status?: string;
        qualification_status?: string;
      }[];
    }>(`/api/campaigns/${id}/clients`),
  start: (id: string) => apiFetch<Campaign>(`/api/campaigns/${id}/start`, { method: "POST" }),
  pause: (id: string) => apiFetch<Campaign>(`/api/campaigns/${id}/pause`, { method: "POST" }),
  remove: (id: string) => apiFetch<void>(`/api/campaigns/${id}`, { method: "DELETE" }),
  getDialerStatus: (id: string) =>
    apiFetch<{ status: string; auto_dial_enabled: boolean; ratio: number; active_calls: number; available_slots: number }>(
      `/api/campaigns/${id}/dialer/status`
    ),
  startDialer: (id: string) => apiFetch<{ message: string }>(`/api/campaigns/${id}/dialer/start`, { method: "POST" }),
  pauseDialer: (id: string) => apiFetch<{ message: string }>(`/api/campaigns/${id}/dialer/pause`, { method: "POST" }),
  stopDialer: (id: string) => apiFetch<{ message: string }>(`/api/campaigns/${id}/dialer/stop`, { method: "POST" }),
  getActivePdStatus: (agent_id?: string) =>
    apiFetch<{
      status: string;
      auto_dial_enabled: boolean;
      agent_id?: string;
      active_agents_count?: number;
      total_agents_count?: number;
      campaign_status?: string;
      ratio: number;
      campaign_id?: string;
      campaign_name?: string;
    }>(`/api/voice-agents/pd-status${agent_id ? `?agent_id=${agent_id}` : ""}`),
  toggleActivePdStatus: (enable?: boolean, agent_id?: string) =>
    apiFetch<{
      message: string;
      status: string;
      auto_dial_enabled: boolean;
      agent_id?: string;
      agent_name?: string;
      active_agents_count?: number;
      total_agents_count?: number;
      campaign_id?: string;
    }>("/api/voice-agents/pd-toggle", {
      method: "POST",
      body: JSON.stringify({ enable, agent_id }),
    }),
  uploadPdf: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiUpload<{ filename: string; url: string }>("/api/campaigns/upload-pdf", formData);
  },
  previewSpeech: (data: {
    script: string;
    lang?: string;
    lead_name?: string;
    agent_name?: string;
    voice_id?: string;
  }) =>
    apiFetch<{
      audio_url: string;
      segments: Array<{ type: string; text?: string; emotion?: string; duration?: number }>;
      total_speech_segments: number;
      total_pause_duration: number;
      detected_emotions: string[];
    }>("/api/campaigns/speech-preview", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
import { apiFetch } from "@/lib/api-client";

export interface Expert {
  id: string;
  business_id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  status: string;
  agent_type?: "INBOUND" | "OUTBOUND" | "ADMIN" | string;
  direction?: "INBOUND" | "OUTBOUND" | string;
  active_lead_count: number;
  active_calls?: number;
  calls_handled?: number;
  total_leads?: number;
  auto_dial_enabled?: boolean;
  created_at: string;
}

export const expertService = {
  list: () => apiFetch<Expert[]>("/api/experts"),
  create: (data: { name: string; email?: string; phone?: string; skills?: string[] }) =>
    apiFetch<Expert>("/api/experts", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => apiFetch<Expert>("/api/experts/me"),
  updateStatus: (status: string) =>
    apiFetch<Expert>("/api/experts/me/status", { method: "PATCH", body: JSON.stringify({ status }) }),
  getMeLeads: () => apiFetch<any[]>("/api/experts/me/leads"),
  getMeCalls: () => apiFetch<any[]>("/api/experts/me/calls"),
  getLeads: (expertId: string) => apiFetch<any[]>(`/api/experts/${expertId}/leads`),
  completeCall: (callId: string, payload: { voice_notes: string; final_outcome: string; lead_status: string }) =>
    apiFetch<{ success: boolean; message: string }>(`/api/experts/me/calls/${callId}/complete`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

import { apiFetch } from "@/lib/api-client";

export interface InboundCallSummary {
  id: string;
  call_sid: string;
  from_number: string;
  to_number: string;
  status: string;
  duration_seconds: number;
  client_name: string;
  agent_name: string;
  created_at: string;
}

export interface InboundNumber {
  id: string;
  business_id: string;
  phone_number: string;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  routing_type: "VOICE_AGENT" | "HUMAN_AGENT" | "USER_GROUP" | "QUEUE" | "IVR";
  assigned_agent_id: string | null;
  assigned_agent_name: string | null;
  assigned_ai_agent_id: string | null;
  assigned_ai_agent_name: string | null;
  assigned_group_id: string | null;
  assigned_group_name: string | null;
  working_hours: {
    start?: string;
    end?: string;
    days?: string[];
  };
  fallback_action: string;
  calls_today: number;
  total_calls: number;
  last_call_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InboundDetail extends InboundNumber {
  recent_calls: InboundCallSummary[];
}

export interface InboundCreateInput {
  phone_number: string;
  name: string;
  description?: string;
  status?: string;
  routing_type?: string;
  assigned_agent_id?: string | null;
  assigned_ai_agent_id?: string | null;
  assigned_group_id?: string | null;
  working_hours?: {
    start?: string;
    end?: string;
    days?: string[];
  };
  fallback_action?: string;
}

export interface InboundUpdateInput {
  phone_number?: string;
  name?: string;
  description?: string;
  status?: string;
  routing_type?: string;
  assigned_agent_id?: string | null;
  assigned_ai_agent_id?: string | null;
  assigned_group_id?: string | null;
  working_hours?: {
    start?: string;
    end?: string;
    days?: string[];
  };
  fallback_action?: string;
}

export interface InboundStats {
  total_numbers: number;
  active_numbers: number;
  calls_today: number;
  total_inbound_calls: number;
}

export const inboundService = {
  getStats: () => apiFetch<InboundStats>("/api/inbound/stats/summary"),

  list: (statusFilter?: string, routingFilter?: string) => {
    const params = new URLSearchParams();
    if (statusFilter) params.append("status_filter", statusFilter);
    if (routingFilter) params.append("routing_filter", routingFilter);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<InboundNumber[]>(`/api/inbound${queryString}`);
  },

  get: (id: string) => apiFetch<InboundDetail>(`/api/inbound/${id}`),

  create: (data: InboundCreateInput) =>
    apiFetch<InboundDetail>("/api/inbound", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: InboundUpdateInput) =>
    apiFetch<InboundDetail>(`/api/inbound/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  toggleStatus: (id: string, status: "ACTIVE" | "INACTIVE") =>
    apiFetch<InboundNumber>(`/api/inbound/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/api/inbound/${id}`, {
      method: "DELETE",
    }),

  getCalls: (id: string, limit: number = 25) =>
    apiFetch<InboundCallSummary[]>(`/api/inbound/${id}/calls?limit=${limit}`),
};

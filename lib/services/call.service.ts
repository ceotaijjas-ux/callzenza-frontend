import { apiFetch } from "@/lib/api-client";

export interface Call {
  id: string;
  business_id: string;
  lead_id: string;
  agent_id: string | null;
  conversation_id: string | null;
  call_sid: string;
  conference_sid?: string | null;
  direction: "OUTBOUND" | "INBOUND";
  agent_type?: string;
  lead_name?: string;
  client_name?: string;
  client_phone?: string;
  from_number: string;
  to_number: string;
  status: string;
  duration_seconds: number;
  recording_url: string;
  transcript: string;
  turn_count: number;
  created_at: string;
  updated_at: string;
  agent_name?: string;
}

export const callService = {
  listForLead: (leadId: string) => apiFetch<Call[]>(`/api/voice/calls?lead_id=${leadId}`),
  list: () => apiFetch<Call[]>("/api/voice/calls"),
  get: (id: string) => apiFetch<Call>(`/api/voice/calls/${id}`),
  trigger: (leadId: string, agentId?: string) =>
    apiFetch<Call>("/api/voice/outbound", {
      method: "POST",
      body: JSON.stringify({ lead_id: leadId, agent_id: agentId }),
    }),
  updateQualification: (id: string, qualification_status: "QUALIFIED" | "NOT_QUALIFIED") =>
    apiFetch<Call>(`/api/voice/calls/${id}/qualification`, {
      method: "POST",
      body: JSON.stringify({ qualification_status }),
    }),
  addClientToCall: (id: string, client_name?: string, client_phone?: string) =>
    apiFetch<{ status: string; message: string; call_id: string; conference_sid?: string; client_connected_at?: string }>(
      `/api/voice/calls/${id}/add-client`,
      {
        method: "POST",
        body: JSON.stringify({ client_name, client_phone }),
      }
    ),
  getDispositions: async (): Promise<string[]> => {
    try {
      const res = await apiFetch<{ options: string[]; items: any[] } | string[]>("/api/dispositions");
      if (res && typeof res === "object") {
        if ("options" in res && Array.isArray(res.options) && res.options.length > 0) {
          if (typeof window !== "undefined") {
            localStorage.setItem("admin_dispositions", JSON.stringify(res.options));
          }
          return res.options;
        }
        if (Array.isArray(res)) {
          const names = res.map((r: any) => (typeof r === "string" ? r : r.name || r.status_name));
          if (typeof window !== "undefined") {
            localStorage.setItem("admin_dispositions", JSON.stringify(names));
          }
          return names;
        }
      }
    } catch (err) {
      console.warn("Could not fetch dispositions from server, checking local cache:", err);
    }
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("admin_dispositions");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return [
      "Sale / Success",
      "Callback Required",
      "Interested / Follow Up",
      "Customer Busy / Call Later",
      "Not Interested",
      "Voicemail / No Answer",
      "Invalid Number",
      "Do Not Call (DNC)"
    ];
  },
  adminGetDispositions: async (category?: string, search?: string) => {
    let url = "/api/admin/dispositions";
    const params = new URLSearchParams();
    if (category && category !== "ALL") params.append("category", category);
    if (search) params.append("search", search);
    if (params.toString()) url += `?${params.toString()}`;
    return apiFetch<Array<{
      id: string;
      code: string;
      name: string;
      description: string;
      category: string;
      color: string;
      is_selectable: boolean;
      is_active: boolean;
      is_system: boolean;
      order_index: number;
      created_at: string;
      updated_at: string;
    }>>(url);
  },
  adminCreateDisposition: async (payload: {
    status_name: string;
    status_code?: string;
    description?: string;
    category?: string;
    color?: string;
    is_selectable?: boolean;
    is_active?: boolean;
  }) => {
    return apiFetch<{ success: boolean; message: string; item: any }>("/api/admin/dispositions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  adminUpdateDisposition: async (
    id: string,
    payload: {
      status_name?: string;
      status_code?: string;
      description?: string;
      category?: string;
      color?: string;
      is_selectable?: boolean;
      is_active?: boolean;
      order_index?: number;
    }
  ) => {
    return apiFetch<{ success: boolean; message: string; item: any }>(`/api/admin/dispositions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  adminDeleteDisposition: async (id: string) => {
    return apiFetch<{ success: boolean; message: string }>(`/api/admin/dispositions/${id}`, {
      method: "DELETE",
    });
  },
  adminResetDefaults: async () => {
    return apiFetch<{ success: boolean; message: string }>("/api/admin/dispositions/reset-defaults", {
      method: "POST",
    });
  },
};


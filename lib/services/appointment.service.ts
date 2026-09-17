import { apiFetch } from "@/lib/api-client";

export interface Appointment {
  id: string;
  business_id: string;
  lead_id: string;
  agent_id: string | null;
  expert_id: string | null;
  scheduled_at: string;
  status: string;
  notes: string;
  created_at: string;
}

export const appointmentService = {
  list: () => apiFetch<Appointment[]>("/api/appointments"),
  create: (data: { lead_id: string; scheduled_at: string; agent_id?: string; expert_id?: string; notes?: string }) =>
    apiFetch<Appointment>("/api/appointments", { method: "POST", body: JSON.stringify(data) }),
};

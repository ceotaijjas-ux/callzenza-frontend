import { apiFetch } from "@/lib/api-client";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  business_id?: string | null;
  permissions?: Record<string, boolean>;
  created_at: string;
}

export interface AdminCampaign {
  id: string;
  name: string;
  status: string;
  twilio_number: string;
  business_name: string;
  client_name?: string;
  agent_id?: string;
  created_at: string;
}

export interface AdminLead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  company: string;
  status: string;
  business_name: string;
  created_at: string;
}

export interface AdminCall {
  id: string;
  direction: string;
  from_number: string;
  to_number: string;
  status: string;
  duration_seconds: number;
  business_name: string;
  created_at: string;
}

export interface AdminLeadGroup {
  id: string;
  filename: string;
  lead_count: number;
  status: string;
  business_name: string;
  created_at: string;
}

export const adminService = {
  getUsers: (role?: string) => apiFetch<AdminUser[]>(role ? `/api/admin/users?role=${role}` : "/api/admin/users"),
  getCampaigns: () => apiFetch<AdminCampaign[]>("/api/admin/campaigns"),
  getLeads: () => apiFetch<AdminLead[]>("/api/admin/leads"),
  getCalls: () => apiFetch<AdminCall[]>("/api/admin/calls"),
  getLeadUploads: () => apiFetch<AdminLeadGroup[]>("/api/admin/leads/uploads"),
  inviteUser: (payload: { email: string; role?: string; full_name?: string; phone?: string; password?: string; business_id?: string; permissions?: Record<string, boolean> }) => 
    apiFetch<AdminUser>("/api/admin/users/invite", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateUser: (id: string, payload: { role?: string; is_active?: boolean; full_name?: string; email?: string; password?: string; permissions?: Record<string, boolean> }) => 
    apiFetch<AdminUser>(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteUser: (id: string) => 
    apiFetch<void>(`/api/admin/users/${id}`, {
      method: "DELETE",
    }),
};

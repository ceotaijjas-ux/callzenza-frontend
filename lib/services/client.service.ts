import { apiFetch } from "@/lib/api-client";

export interface Client {
  id: string;
  business_id: string;
  name: string;
  company_name: string;
  contact_number: string;
  email: string;
  address: string;
  status: string;
  assigned_agent_id: string | null;
  assigned_agent_name: string | null;
  group_id?: string | null;
  original_filename?: string | null;
  created_at: string;
}

export interface ClientCreateInput {
  name: string;
  company_name?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  status?: string;
  assigned_agent_id?: string | null;
}

export interface ClientUpdateInput {
  name?: string;
  company_name?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  status?: string;
  assigned_agent_id?: string | null;
}

export const clientService = {
  list: () => apiFetch<Client[]>("/api/clients"),
  create: (data: ClientCreateInput) =>
    apiFetch<Client>("/api/clients", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: ClientUpdateInput) =>
    apiFetch<Client>(`/api/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    apiFetch<{ status: string; message: string }>(`/api/clients/${id}`, {
      method: "DELETE",
    }),
};

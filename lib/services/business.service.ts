import { apiFetch } from "@/lib/api-client";

export interface Business {
  id: string;
  name: string;
  industry: string;
  owner_user_id: string;
  is_active: boolean;
  created_at: string;
}

export const businessService = {
  create: (data: { name: string; industry?: string }) =>
    apiFetch<{ access_token: string; token_type: string }>("/api/businesses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  me: () => apiFetch<Business>("/api/businesses/me"),
  update: (data: { name: string; industry?: string }) =>
    apiFetch<Business>("/api/businesses/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

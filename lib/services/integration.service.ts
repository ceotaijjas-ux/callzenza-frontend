import { apiFetch } from "@/lib/api-client";

export interface Integration {
  id: string;
  business_id: string;
  provider: "twilio" | "elevenlabs" | "gemini" | "whatsapp" | "crm" | "sendgrid" | "sip";
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export const integrationService = {
  list: () => apiFetch<Integration[]>("/api/integrations"),
  save: (data: { provider: string; config: Record<string, any>; is_active?: boolean }) =>
    apiFetch<Integration>("/api/integrations", { method: "POST", body: JSON.stringify(data) }),
  update: (provider: string, data: Partial<Integration>) =>
    apiFetch<Integration>(`/api/integrations/${provider}`, { method: "PATCH", body: JSON.stringify(data) }),
};

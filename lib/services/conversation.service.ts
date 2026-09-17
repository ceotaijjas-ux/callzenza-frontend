import { apiFetch } from "@/lib/api-client";

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_type: "LEAD" | "AI" | "HUMAN" | "SYSTEM";
  sender_id: string;
  message_type: string;
  content: string;
  meta: Record<string, unknown>;
  timestamp: string;
}

export interface Conversation {
  id: string;
  business_id: string;
  lead_id: string;
  agent_id: string | null;
  channel: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SendMessageResult {
  lead_message: ConversationMessage;
  ai_message: ConversationMessage | null;
  lead: { id: string; score: number; qualification_status: string; status: string };
  handoff_triggered: boolean;
}

export const conversationService = {
  listForLead: (leadId: string) => apiFetch<Conversation[]>(`/api/conversations?lead_id=${leadId}`),
  create: (data: { lead_id: string; agent_id?: string | null; channel?: string }) =>
    apiFetch<Conversation>("/api/conversations", { method: "POST", body: JSON.stringify(data) }),
  messages: (conversationId: string) =>
    apiFetch<ConversationMessage[]>(`/api/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string) =>
    apiFetch<SendMessageResult>(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};

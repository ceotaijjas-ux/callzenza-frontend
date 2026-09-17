import { apiFetch } from "@/lib/api-client";

export interface KnowledgeAgent {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  created_at: string;
}

export interface KnowledgeEntry {
  id: string;
  agent_id: string;
  session_id?: string;
  question: string;
  answer: string;
  source_data?: string;
  created_at: string;
}

export interface AskResponse {
  answer: string;
  session_id: string;
  retrieved_context?: string;
}

export const knowledgeService = {
  listAgents: () => apiFetch<KnowledgeAgent[]>("/api/knowledge-agents"),
  
  createAgent: (data: { name: string; description?: string; system_prompt?: string }) =>
    apiFetch<KnowledgeAgent>("/api/knowledge-agents", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    
  getAgent: (id: string) => apiFetch<KnowledgeAgent>(`/api/knowledge-agents/${id}`),
  
  askAgent: (id: string, question: string, sessionId?: string) =>
    apiFetch<AskResponse>(`/api/knowledge-agents/${id}/ask`, {
      method: "POST",
      body: JSON.stringify({ question, session_id: sessionId }),
    }),
  uploadScript: (id: string, scriptText: string, filename?: string) =>
    apiFetch<{ status: string; count: number }>(`/api/knowledge-agents/${id}/upload-script`, {
      method: "POST",
      body: JSON.stringify({ script_text: scriptText, filename }),
    }),

  uploadEmotionScript: (id: string, scriptText: string, filename?: string) =>
    apiFetch<{ status: string; count: number }>(`/api/knowledge-agents/${id}/upload-script?is_emotion=true`, {
      method: "POST",
      body: JSON.stringify({ script_text: scriptText, filename }),
    }),

  listEntries: () => apiFetch<KnowledgeEntry[]>("/api/library/knowledge"),

  deleteEntry: (id: string) =>
    apiFetch<void>(`/api/library/knowledge/${id}`, {
      method: "DELETE",
    }),

  clearLibrary: (id: string, isEmotion: boolean = false) =>
    apiFetch<void>(`/api/knowledge-agents/${id}/clear-library?is_emotion=${isEmotion}`, {
      method: "DELETE",
    }),
};

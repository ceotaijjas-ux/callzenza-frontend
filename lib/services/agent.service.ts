import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store";

export interface Agent {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  type?: string;
  status?: string;
  voice_provider?: string;
  voice_id?: string;
  voice_stability?: number;
  voice_similarity_boost?: number;
  voice_model_id?: string;
  language?: string;
  system_prompt?: string;
  qualification_prompt?: string;
  working_hours?: Record<string, unknown>;
  transfer_enabled?: boolean;
  transfer_number?: string;
  created_at?: string;
  updated_at?: string;
}

const IS_BROWSER = typeof window !== "undefined";
const API_URL = IS_BROWSER ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000");

export const agentService = {
  list: () => apiFetch<Agent[]>("/api/agents"),
  get: (id: string) => apiFetch<Agent>(`/api/agents/${id}`),
  create: (data: Partial<Agent>) => apiFetch<Agent>("/api/agents", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Agent>) =>
    apiFetch<Agent>(`/api/agents/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/api/agents/${id}`, { method: "DELETE" }),
  test: (id: string, message: string) =>
    apiFetch<{ reply: string }>(`/api/agents/${id}/test`, { method: "POST", body: JSON.stringify({ message }) }),
  /** Returns a playable object URL for the agent's ElevenLabs voice preview. */
  previewVoice: async (id: string, text: string, voiceId?: string, gender?: string, lang?: string): Promise<string> => {
    const token = useAuthStore.getState().token;
    const path = `/api/agents/${id}/voice-preview`;
    const url = `${API_URL}${path}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text, voice_id: voiceId, gender, lang }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? body.detail ?? "Voice preview failed — is ELEVENLABS_API_KEY set?");
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};

export interface VoiceAgentGroup {
  id: string;
  voice_ids: string[];
}

export interface AIAgentGroup {
  id: string;
  names: string[];
}

export interface AgentChildren {
  voice_agents: VoiceAgentGroup[];
  ai_agents: AIAgentGroup[];
}

export interface MgmtAgent {
  id: string;
  name: string;
  type: string;
  children: AgentChildren;
}

export interface MgmtVoiceAgent {
  id: string;
  agent_id: string;
  voice_id: string;
}

export interface MgmtAIAgent {
  id: string;
  agent_id: string;
  name: string;
}

export const mgmtAgentService = {
  list: () => apiFetch<MgmtAgent[]>("/api/mgmt-agents"),
  get: (id: string) => apiFetch<MgmtAgent>(`/api/mgmt-agents/${id}`),
  create: (data: { name: string; type: string; user_id?: string; email?: string; password?: string }) => apiFetch<MgmtAgent>("/api/mgmt-agents", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; type?: string }) => apiFetch<MgmtAgent>(`/api/mgmt-agents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/api/mgmt-agents/${id}`, { method: "DELETE" }),
  
  createVoiceAgent: (agentId: string, voiceId: string) => apiFetch<MgmtVoiceAgent>(`/api/mgmt-agents/${agentId}/voice-ids`, { method: "POST", body: JSON.stringify({ voice_id: voiceId }) }),
  updateVoiceAgent: (id: string, voiceId: string) => apiFetch<MgmtVoiceAgent>(`/api/mgmt-agents/voice-ids/${id}`, { method: "PUT", body: JSON.stringify({ voice_id: voiceId }) }),
  removeVoiceAgent: (id: string) => apiFetch<void>(`/api/mgmt-agents/voice-ids/${id}`, { method: "DELETE" }),
  assignUsersToVoice: (id: string, user_ids: string[]) => apiFetch<void>(`/api/mgmt-agents/voice-ids/${id}/users`, { method: "POST", body: JSON.stringify({ user_ids }) }),
  
  createAIAgent: (agentId: string, name: string) => apiFetch<MgmtAIAgent>(`/api/mgmt-agents/${agentId}/ai-agents`, { method: "POST", body: JSON.stringify({ name }) }),
  updateAIAgent: (id: string, name: string) => apiFetch<MgmtAIAgent>(`/api/mgmt-agents/ai-agents/${id}`, { method: "PUT", body: JSON.stringify({ name }) }),
  removeAIAgent: (id: string) => apiFetch<void>(`/api/mgmt-agents/ai-agents/${id}`, { method: "DELETE" }),
  assignUsersToAI: (id: string, user_ids: string[]) => apiFetch<void>(`/api/mgmt-agents/ai-agents/${id}/users`, { method: "POST", body: JSON.stringify({ user_ids }) }),
};

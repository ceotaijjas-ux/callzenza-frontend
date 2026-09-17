import { apiFetch } from "@/lib/api-client";

export interface ScriptStepItem {
  name: string;
  status: "DONE" | "CURRENT" | "PENDING";
}

export interface StartTestSessionResponse {
  session_id: string;
  campaign_name: string;
  agent_name: string;
  agent_id: string;
  greeting: string;
  current_step: string;
  script_steps: ScriptStepItem[];
  collected_data: Record<string, string>;
  qualification_status: string;
}

export interface TestMessageResponse {
  response: string;
  current_step: string;
  progress_index: number;
  script_steps: ScriptStepItem[];
  collected_data: Record<string, string>;
  qualification_status: string;
}

export interface EndTestSessionResponse {
  success: boolean;
  session_id?: string;
  collected_data?: Record<string, string>;
  qualification_status?: string;
  conversation_count?: number;
}

export const localVoiceTestService = {
  start: (campaignId: string) =>
    apiFetch<StartTestSessionResponse>("/api/local-voice-test/start", {
      method: "POST",
      body: JSON.stringify({ campaign_id: campaignId }),
    }),

  sendMessage: (sessionId: string, message: string) =>
    apiFetch<TestMessageResponse>("/api/local-voice-test/message", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, user_message: message, message }),
    }),

  end: (sessionId: string, durationSeconds?: number) =>
    apiFetch<EndTestSessionResponse>("/api/local-voice-test/end", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, duration_seconds: durationSeconds }),
    }),
};

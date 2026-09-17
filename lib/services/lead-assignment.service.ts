import { apiFetch } from "@/lib/api-client";

export interface TransferToAgentPayload {
  lead_id: string;
  call_id?: string;
  campaign_id?: string;
  ai_agent_name?: string;
  qualification_stage?: string;
  transcript?: string;
  notes?: string;
  collected_answers?: Record<string, any>;
  requested_expert_name?: string;
}

export interface TransferToAgentResponse {
  success: boolean;
  status: "ASSIGNED" | "QUEUED" | "QUEUED_FOR_REQUESTED_AGENT" | "ALREADY_ASSIGNED" | "NOT_FOUND";
  message: string;
  lead_id: string;
  assignment_id?: string;
  assigned_expert?: {
    id: string;
    name: string;
    email: string;
    status: string;
  } | null;
  requested_expert?: {
    id: string;
    name: string;
    status?: string;
  } | null;
  previous_expert?: {
    id: string;
    name: string;
  } | null;
  queue_item_id?: string;
}

export interface QueueItem {
  id: string;
  business_id: string;
  lead_id: string;
  lead_name: string;
  phone: string;
  email: string;
  company: string;
  requested_expert_id?: string | null;
  requested_expert_name?: string | null;
  trigger_source: string;
  reason: string;
  status: string;
  created_at: string;
  assigned_at?: string | null;
  assigned_agent_id?: string | null;
  call_started_at?: string | null;
  call_completed_at?: string | null;
  call_duration?: number | null;
  call_session_id?: string | null;
}

export interface LeadAssignmentRecord {
  id: string;
  business_id?: string | null;
  lead_id: string;
  expert_id: string;
  expert_name?: string;
  expert_email?: string;
  previous_expert_id?: string | null;
  previous_expert_name?: string | null;
  strategy: string;
  status: string;
  trigger_source: string;
  ai_agent_name: string;
  qualification_stage: string;
  transcript: string;
  notes: string;
  context: Record<string, any>;
  assigned_at: string;
}

export const leadAssignmentService = {
  transferToAgent: (payload: TransferToAgentPayload) =>
    apiFetch<TransferToAgentResponse>("/api/lead-assignment/transfer-to-agent", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  completeAiCall: (payload: { lead_id: string; call_id?: string; qualification_status?: string; summary?: string; transcript?: string; notes?: string }) =>
    apiFetch<TransferToAgentResponse>("/api/lead-assignment/complete-ai-call", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getQueue: (statusFilter: string = "WAITING", expertId?: string) =>
    apiFetch<QueueItem[]>(`/api/lead-assignment/queue?status_filter=${statusFilter}${expertId ? `&expert_id=${expertId}` : ""}`),

  processQueue: () =>
    apiFetch<{ success: boolean; assigned_count: number; message: string }>("/api/lead-assignment/process-queue", {
      method: "POST",
    }),

  getAssignments: (triggerSource?: string) =>
    apiFetch<LeadAssignmentRecord[]>(`/api/lead-assignment/assignments${triggerSource ? `?trigger_source=${triggerSource}` : ""}`),

  getMyAssignments: (expertId?: string, statusFilter?: string) => {
    const params = new URLSearchParams();
    if (expertId) params.append("expert_id", expertId);
    if (statusFilter) params.append("status_filter", statusFilter);
    const qs = params.toString();
    return apiFetch<LeadAssignmentRecord[]>(`/api/lead-assignment/my-assignments${qs ? `?${qs}` : ""}`);
  },

  assignQueueItem: (queueId: string) =>
    apiFetch<{ success: boolean; status: string }>(`/api/lead-assignment/queue/${queueId}/assign`, {
      method: "POST",
    }),

  startQueueCall: (queueId: string) =>
    apiFetch<{ success: boolean; status: string }>(`/api/lead-assignment/queue/${queueId}/start`, {
      method: "POST",
    }),

  completeQueueCall: (queueId: string) =>
    apiFetch<{ success: boolean; status: string }>(`/api/lead-assignment/queue/${queueId}/complete`, {
      method: "POST",
    }),

  getLeadAssignmentHistory: (leadId: string) =>
    apiFetch<LeadAssignmentHistoryResponse>(`/api/lead-assignment/history/${leadId}`),
};

export interface AssignmentCustomerDetails {
  lead_id: string;
  name: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  company: string;
  city: string;
  requirement: string;
  status: string;
  qualification_status: string;
  qualification_reason?: string;
  created_at?: string;
}

export interface AssignmentMetaDetails {
  current_agent: string;
  assigned_by: string;
  assignment_source: string;
  previous_agent?: string | null;
  assigned_on?: string | null;
  transfer_reason?: string | null;
  status: string;
  qualification_status: string;
  qualification_reason?: string;
}

export interface AssignmentCallSummary {
  total_calls: number;
  last_call_at?: string | null;
  last_call_status: string;
  qualification: string;
  call_duration: number;
  formatted_duration: string;
  recording_url?: string | null;
}

export interface AssignmentTimelineEvent {
  id: string;
  timestamp?: string | null;
  title: string;
  type: "ASSIGNMENT" | "CALL_STARTED" | "CALL_COMPLETED" | "TRANSFER" | "QUEUE" | "STATUS_CHANGE" | "QUALIFICATION_UPDATE" | string;
  actor?: string;
  assigned_to?: string;
  assigned_by?: string;
  source?: string;
  status?: string;
  qualification?: string;
  duration?: string;
  description: string;
}

export interface LeadAssignmentHistoryResponse {
  customer: AssignmentCustomerDetails;
  assignment: AssignmentMetaDetails;
  call_summary: AssignmentCallSummary;
  timeline: AssignmentTimelineEvent[];
}


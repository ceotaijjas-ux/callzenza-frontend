import { apiFetch } from "@/lib/api-client";

export interface DashboardSummary {
  total_leads: number;
  new_leads: number;
  qualified_leads: number;
  qualification_rate: number;
  active_conversations: number;
  human_handoffs: number;
  open_deals: number;
  won_deals: number;
  revenue: number;
  conversion_rate: number;
  lead_sources: Record<string, number>;
  pipeline_by_stage: Record<string, number>;
  
  // Extended Real-Time Metrics
  active_calls_count?: number;
  calls_ringing_count?: number;
  ai_calls_in_progress?: number;
  completed_ai_calls?: number;
  assigned_leads?: number;
  unassigned_leads?: number;
  waiting_queue_count?: number;
  ivr_calls_count?: number;
  available_agents_count?: number;
  busy_agents_count?: number;
  offline_agents_count?: number;
  active_transfers_count?: number;
}

export const analyticsService = {
  dashboard: () => apiFetch<DashboardSummary>("/api/analytics/dashboard"),
};

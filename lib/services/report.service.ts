import { apiFetch } from "@/lib/api-client";

export interface ReportQueryParams {
  from_date?: string;
  to_date?: string;
  direction?: string;
  campaign_id?: string;
  agent_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CallReportResponse {
  success: boolean;
  data: any[];
  summary: Record<string, any>;
  total: number;
  page: number;
  limit: number;
}

export interface GenericReportResponse {
  success: boolean;
  slug?: string;
  data: any[];
  summary?: any;
  total?: number;
  [key: string]: any;
}

export const reportService = {
  getCallsReport: (params?: ReportQueryParams) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append("from_date", params.from_date);
    if (params?.to_date) q.append("to_date", params.to_date);
    if (params?.direction) q.append("direction", params.direction);
    if (params?.campaign_id) q.append("campaign_id", params.campaign_id);
    if (params?.agent_id) q.append("agent_id", params.agent_id);
    if (params?.status) q.append("status", params.status);
    if (params?.search) q.append("search", params.search);
    if (params?.page) q.append("page", String(params.page));
    if (params?.limit) q.append("limit", String(params.limit));
    const str = q.toString();
    return apiFetch<CallReportResponse>(`/api/reports/calls${str ? `?${str}` : ""}`);
  },

  getAgentPerformance: (params?: ReportQueryParams) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append("from_date", params.from_date);
    if (params?.to_date) q.append("to_date", params.to_date);
    if (params?.campaign_id) q.append("campaign_id", params.campaign_id);
    if (params?.agent_id) q.append("agent_id", params.agent_id);
    const str = q.toString();
    return apiFetch<GenericReportResponse>(`/api/reports/agent-performance${str ? `?${str}` : ""}`);
  },

  getInboundSummary: (params?: ReportQueryParams) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append("from_date", params.from_date);
    if (params?.to_date) q.append("to_date", params.to_date);
    if (params?.campaign_id) q.append("campaign_id", params.campaign_id);
    const str = q.toString();
    return apiFetch<GenericReportResponse>(`/api/reports/inbound-summary${str ? `?${str}` : ""}`);
  },

  getOutboundSummary: (params?: ReportQueryParams) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append("from_date", params.from_date);
    if (params?.to_date) q.append("to_date", params.to_date);
    if (params?.campaign_id) q.append("campaign_id", params.campaign_id);
    const str = q.toString();
    return apiFetch<GenericReportResponse>(`/api/reports/outbound-summary${str ? `?${str}` : ""}`);
  },

  getUserTimeclock: (params?: ReportQueryParams) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append("from_date", params.from_date);
    if (params?.to_date) q.append("to_date", params.to_date);
    const str = q.toString();
    return apiFetch<GenericReportResponse>(`/api/reports/user-timeclock${str ? `?${str}` : ""}`);
  },

  getUserGroupTimeclockStatus: (params?: { report_date?: string }) => {
    const q = new URLSearchParams();
    if (params?.report_date) q.append("report_date", params.report_date);
    const str = q.toString();
    return apiFetch<{
      success: boolean;
      data: any[];
      summary: any;
      recent_changes: any[];
    }>(`/api/reports/user-group-timeclock-status${str ? `?${str}` : ""}`);
  },

  getUserTimeclockDetail: (params?: { user_id?: string; from_date?: string; to_date?: string }) => {
    const q = new URLSearchParams();
    if (params?.user_id) q.append("user_id", params.user_id);
    if (params?.from_date) q.append("from_date", params.from_date);
    if (params?.to_date) q.append("to_date", params.to_date);
    const str = q.toString();
    return apiFetch<{
      success: boolean;
      users_list: any[];
      selected_user: any;
      summary: any;
      timeline: any[];
      time_distribution: any[];
      calling_activity: any;
      session_history: any[];
    }>(`/api/reports/user-timeclock-detail${str ? `?${str}` : ""}`);
  },

  getGenericReport: (slug: string, params?: ReportQueryParams) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append("from_date", params.from_date);
    if (params?.to_date) q.append("to_date", params.to_date);
    if (params?.campaign_id) q.append("campaign_id", params.campaign_id);
    if (params?.agent_id) q.append("agent_id", params.agent_id);
    if (params?.status) q.append("status", params.status);
    if (params?.search) q.append("search", params.search);
    const str = q.toString();
    return apiFetch<GenericReportResponse>(`/api/reports/generic/${encodeURIComponent(slug)}${str ? `?${str}` : ""}`);
  },
};

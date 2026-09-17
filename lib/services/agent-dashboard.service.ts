import { apiFetch } from "@/lib/api-client";

export interface DashboardStats {
  total_calls: number;
  today_calls?: number;
  total_time_seconds: number;
  today_time_seconds: number;
  calls_in_queue: number;
  calls_on_hold: number;
  agent_status: string;
}

export interface DetailedCallLog {
  id: string;
  customer_name: string;
  customer_phone: string;
  lead_name: string;
  campaign_name: string;
  agent_name: string;
  start_time: string;
  end_time: string;
  date_time: string;
  duration_seconds: number;
  formatted_duration: string;
  status: string;
  outcome: string;
  connected: boolean;
  qualification_status: string;
  recording_url: string;
  record_id: string;
  has_recording: boolean;
}

export interface IndividualCallDuration {
  call_id: string;
  customer_name: string;
  customer_phone: string;
  duration_seconds: number;
  formatted_duration: string;
  date: string;
}

export interface DateWiseDurationHistory {
  date: string;
  total_seconds: number;
  formatted_duration: string;
  call_count: number;
}

export interface TotalTimeBreakdown {
  total_duration_seconds: number;
  formatted_total_time: string;
  today_duration_seconds: number;
  formatted_today_time: string;
  individual_calls: IndividualCallDuration[];
  date_wise_history: DateWiseDurationHistory[];
}

export interface QueueCallItem {
  id: string;
  position: number;
  customer_name: string;
  customer_phone: string;
  lead_details: {
    id: string;
    company: string;
    requirement: string;
  };
  campaign_name: string;
  assigned_agent: string;
  assigned_status: string;
  waiting_time_seconds: number;
  formatted_waiting_time: string;
  queue_status: string;
  priority: string;
  date_time_added: string;
}

export interface HeldCallItem {
  id: string;
  call_id: string;
  customer_name: string;
  customer_number: string;
  agent_name: string;
  campaign_name: string;
  hold_start_time: string;
  time_on_hold_seconds: number;
  formatted_time_on_hold: string;
  hold_reason: string;
  call_status: string;
  slot: string;
}

export interface ClientConfigItem {
  id: string;
  business_id: string;
  slot: string;
  phone_number: string;
}

export type SlotMappings = {
  D1: string;  // phone number
  D2: string;  // phone number
  D3: string;  // phone number
};

export interface NextLeadResponse {
  total_count?: number;
  lead: {
    id: string;
    lead_name?: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    company: string;
    requirement: string;
    qualification_status: string;
    location?: string;
    status?: string;
    campaign_name?: string;
  } | null;
  campaign: {
    id: string;
    name: string;
    script: string;
    qualification_questions: string[];
    required_info: string[];
    transfer_rules: string;
    client_id?: string;
    client_name?: string;
    client_company?: string;
    client_phone?: string;
  } | null;
  message?: string;
}

export const agentDashboardService = {
  getStats: (campaignId?: string, leadGroupId?: string) => {
    const params = new URLSearchParams();
    if (campaignId) params.append("campaign_id", campaignId);
    if (leadGroupId) params.append("lead_group_id", leadGroupId);
    const qs = params.toString();
    return apiFetch<DashboardStats>(`/api/voice/dashboard/stats${qs ? `?${qs}` : ""}`);
  },
  getMyCalls: () => apiFetch<DetailedCallLog[]>("/api/voice/calls/my-calls"),
  getTotalTime: () => apiFetch<TotalTimeBreakdown>("/api/voice/dashboard/total-time"),
  updateAgentStatus: (status: string) =>
    apiFetch<{ status: string; message: string }>("/api/voice/agent/status", {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  getQueue: () => apiFetch<QueueCallItem[]>("/api/voice/queue"),
  getRequestedQueue: (expertId?: string) => {
    const qs = expertId ? `?expert_id=${expertId}&status_filter=WAITING` : "?status_filter=WAITING";
    return apiFetch<any[]>(`/api/lead-assignment/queue${qs}`);
  },
  getMyTransfers: () => apiFetch<import("@/lib/services/transfer.service").FormattedCallTransfer[]>("/api/voice/transfers"),
  getAssignmentHistory: () => apiFetch<any[]>("/api/lead-assignment/my-assignments?status_filter=HISTORY"),
  getOnHold: () => apiFetch<HeldCallItem[]>("/api/voice/on-hold"),
  getClientConfigs: () => apiFetch<ClientConfigItem[]>("/api/voice/client-configs"),
  getSlotMappings: () => apiFetch<SlotMappings>("/api/voice/client-configs/slot-mappings"),
  saveClientConfig: (slot: string, phone_number?: string) =>
    apiFetch<ClientConfigItem>("/api/voice/client-configs", {
      method: "POST",
      body: JSON.stringify({ slot, phone_number }),
    }),
  saveBatchSlotMappings: (slot_mappings: SlotMappings) =>
    apiFetch<SlotMappings>("/api/voice/client-configs/batch", {
      method: "POST",
      body: JSON.stringify({ slot_mappings }),
    }),
  deleteClientConfig: (slot: string) =>
    apiFetch<{ message: string }>(`/api/voice/client-configs/${slot}`, {
      method: "DELETE",
    }),
  parkCall: (callId: string, slot?: string, hold_reason?: string) =>
    apiFetch<{ status: string; parked_call_id: string; slot: string; message: string }>(
      `/api/voice/calls/${callId}/park`,
      {
        method: "POST",
        body: JSON.stringify({ slot, hold_reason }),
      }
    ),
  resumeParkedCall: (callId: string) =>
    apiFetch<{ status: string; message: string }>(`/api/voice/calls/${callId}/resume-park`, {
      method: "POST",
    }),
  getParkedConference: (callId: string) =>
    apiFetch<{ D1: string; D2: string; D3: string }>(`/api/voice/parked-call/${callId}/conference`),
  saveParkedConference: (callId: string, mappings: { D1: string; D2: string; D3: string }) =>
    apiFetch<{ D1: string; D2: string; D3: string }>(`/api/voice/parked-call/${callId}/conference`, {
      method: "POST",
      body: JSON.stringify(mappings),
    }),
  connectClientSlot: (callId: string, slot?: string, client_phone?: string, client_name?: string) =>
    apiFetch<{ status: string; message: string; call_id: string }>(
      `/api/voice/calls/${callId}/connect-client`,
      {
        method: "POST",
        body: JSON.stringify({ slot, client_phone, client_name }),
      }
    ),
  transferCall: (
    callId: string, 
    arg2?: any, 
    arg3?: any,
    arg4?: any,
    arg5?: any,
    arg6?: any,
    arg7?: any
  ) => {
    let transfer_type = "three_way";
    let participants: any = undefined;
    if (typeof arg2 === "string") {
      transfer_type = arg2;
      participants = arg3;
    } else if (typeof arg6 === "string") {
      transfer_type = arg6;
      participants = arg7;
    } else if (Array.isArray(arg2)) {
      participants = arg2;
    }
    return apiFetch<{ status: string; destinations?: any[]; message: string }>(
      `/api/voice/calls/${callId}/transfer`,
      {
        method: "POST",
        body: JSON.stringify({ transfer_type, participants }),
      }
    );
  },
  startRecording: (callId: string) =>
    apiFetch<{ status: string; recording_id: string; record_id?: string; message: string }>(
      `/api/voice/calls/${callId}/recording/start`,
      { method: "POST" }
    ),
  startCallRecording: (callId: string) =>
    apiFetch<{ status: string; recording_id: string; record_id?: string; message: string }>(
      `/api/voice/calls/${callId}/recording/start`,
      { method: "POST" }
    ),
  stopRecording: (callId: string) =>
    apiFetch<{ status: string; record_id?: string; recording_id?: string; message: string }>(
      `/api/voice/calls/${callId}/recording/stop`,
      { method: "POST" }
    ),
  stopCallRecording: (callId: string) =>
    apiFetch<{ status: string; record_id?: string; recording_id?: string; message: string }>(
      `/api/voice/calls/${callId}/recording/stop`,
      { method: "POST" }
    ),
  initiateCall: (payload: {
    lead_id?: string;
    phone_number?: string;
    campaign_id?: string;
    client_name?: string;
    client_phone?: string;
  }) =>
    apiFetch<{
      call_id: string;
      status: string;
      initiated_at: string;
      connected_at?: string;
      lead_id?: string;
      lead_name: string;
      phone: string;
    }>("/api/voice/calls/initiate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  markCallAnswered: (callId: string) =>
    apiFetch<{
      status: string;
      call_id: string;
      connected_at: string;
      message: string;
    }>(`/api/voice/calls/${callId}/answered`, {
      method: "POST",
    }),
  holdCall: (callId: string, reason?: string) =>
    apiFetch<{
      status: string;
      call_id: string;
      hold_music_url?: string;
      message: string;
    }>(`/api/voice/calls/${callId}/hold`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  resumeCall: (callId: string) =>
    apiFetch<{
      status: string;
      call_id: string;
      message: string;
    }>(`/api/voice/calls/${callId}/resume`, {
      method: "POST",
    }),
  getActiveCall: () =>
    apiFetch<{
      has_active_call: boolean;
      call_id?: string;
      lead_id?: string;
      lead_name?: string;
      lead_phone?: string;
      caller_number?: string;
      from_number?: string;
      campaign_id?: string;
      status?: string;
      direction?: string;
      initiated_at?: string;
      connected_at?: string;
      ended_at?: string;
      client_connected_at?: string;
      client_disconnected_at?: string;
      client_name?: string;
      client_phone?: string;
      client_duration_seconds?: number;
      is_parked?: boolean;
      slot?: string;
    }>("/api/voice/active-call"),
  disconnectClient: (callId: string) =>
    apiFetch<{
      status: string;
      client_duration_seconds: number;
      client_disconnected_at: string;
      message: string;
    }>(`/api/voice/calls/${callId}/disconnect-client`, {
      method: "POST",
    }),
  endCall: (callId: string, duration_seconds?: number, outcome?: string, qualification_status?: string, lead_id?: string) =>
    apiFetch<{ status: string; call_id: string; duration_seconds: number; message: string }>(
      `/api/voice/calls/${callId}/end`,
      {
        method: "POST",
        body: JSON.stringify({ duration_seconds, outcome, qualification_status, lead_id }),
      }
    ),
  getNextLead: (currentLeadId?: string, campaignId?: string, excludeLeadIds?: string[], leadGroupId?: string) => {
    const params = new URLSearchParams();
    if (currentLeadId) params.append("current_lead_id", currentLeadId);
    if (campaignId) params.append("campaign_id", campaignId);
    if (leadGroupId) params.append("lead_group_id", leadGroupId);
    if (excludeLeadIds && excludeLeadIds.length > 0) {
      params.append("exclude_lead_ids", excludeLeadIds.join(","));
    }
    const queryString = params.toString();
    return apiFetch<NextLeadResponse>(`/api/voice/leads/next${queryString ? `?${queryString}` : ""}`);
  },
  getLeadLists: () =>
    apiFetch<
      {
        id: string;
        campaign_id: string;
        name: string;
        campaign_name: string;
        total_leads: number;
        available_leads: number;
        called_leads: number;
        pending_leads: number;
        is_campaign_list?: boolean;
      }[]
    >(`/api/voice/leads/lists`),
  getLeadListCustomers: (campaignId?: string, leadGroupId?: string) => {
    const params = new URLSearchParams();
    if (campaignId) params.append("campaign_id", campaignId);
    if (leadGroupId) params.append("lead_group_id", leadGroupId);
    const qs = params.toString();
    return apiFetch<
      {
        id: string;
        first_name: string;
        last_name: string;
        phone: string;
        email: string;
        company: string;
        requirement: string;
        location: string;
        status: string;
        call_status: string;
        source: string;
      }[]
    >(`/api/voice/leads/list-customers${qs ? `?${qs}` : ""}`);
  },
  getCampaignScript: (campaignId: string) =>
    apiFetch<{
      campaign_id: string;
      campaign_name: string;
      script: string;
      qualification_questions: string[];
      required_info: string[];
      transfer_rules: string;
    }>(`/api/campaigns/${campaignId}/script`),
  getCampaignClients: (campaignId?: string) => {
    const params = new URLSearchParams();
    if (campaignId) params.append("campaign_id", campaignId);
    const queryString = params.toString();
    return apiFetch<{
      campaign_id: string;
      campaign_name: string;
      total_clients: number;
      clients: {
        id: string;
        client_id: string;
        name: string;
        phone: string;
        email?: string;
        company?: string;
        location?: string;
        status?: string;
        qualification_status?: string;
      }[];
    }>(`/api/voice/campaign-clients${queryString ? `?${queryString}` : ""}`);
  },
  getDailyReport: (date?: string, agentId?: string) => {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (agentId && agentId !== "ALL") params.append("agent_id", agentId);
    const queryString = params.toString();
    return apiFetch<any>(`/api/voice/dashboard/daily-report${queryString ? `?${queryString}` : ""}`);
  },
  exportLeadsCsv: async (format: "csv" | "xlsx" = "csv"): Promise<void> => {
    const authData = typeof window !== "undefined" ? sessionStorage.getItem("callzenza-auth") || localStorage.getItem("callzenza-auth") : null;
    let token = null;
    if (authData) {
      try { token = JSON.parse(authData)?.state?.token; } catch (_) {}
    }
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`/api/voice/leads/export?format=${format}`, { headers });
    if (!response.ok) throw new Error(`Failed to export ${format.toUpperCase()}`);

    const textContent = await response.text();
    let blob: Blob;
    let filename: string;

    if (format === "xlsx") {
      // Build a clean MS Excel HTML Spreadsheet Table
      const lines = textContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
      let tableRowsHtml = "";
      lines.forEach((line, index) => {
        // Splitting CSV line handling quotes
        const rawCols = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
        const cellTag = index === 0 ? "th" : "td";
        const bgStyle = index === 0 ? ' style="background-color: #1e293b; color: #ffffff; font-weight: bold; padding: 6px 12px;"' : ' style="padding: 4px 8px;"';
        const rowCells = rawCols
          .map((c) => {
            const cleanVal = c.replace(/^"|"$/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            return `<${cellTag}${bgStyle}>${cleanVal}</${cellTag}>`;
          })
          .join("");
        tableRowsHtml += `<tr>${rowCells}</tr>`;
      });

      const excelXml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Voice Agent Leads</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
        </head>
        <body>
          <table border="1">${tableRowsHtml}</table>
        </body>
        </html>
      `;

      blob = new Blob([excelXml], { type: "application/vnd.ms-excel;charset=utf-8;" });
      filename = "voice_agent_leads_latest.xls";
    } else {
      // Add UTF-8 BOM so Excel opens CSV directly with correct encoding and columns
      const bomCsv = "\uFEFF" + textContent;
      blob = new Blob([bomCsv], { type: "text/csv;charset=utf-8;" });
      filename = "voice_agent_leads_latest.csv";
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

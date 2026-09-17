import { apiFetch } from "@/lib/api-client";

export interface KpiItem {
  label: string;
  value: number | string;
  cls: string;
}

export interface RecycleListTag {
  label: string;
  cls: string;
}

export interface RecycleList {
  id: string;
  icon: string;
  status: string;
  statusBadge: string;
  title: string;
  description: string;
  tags: RecycleListTag[];
  campaign?: string;
  total: number;
  pending: number;
  recycled: number;
  created: string;
  reason: string;
  search: string;
  actionLabel: string;
  actionStyle: string;
}

export interface RecycleLead {
  id: string;
  name: string;
  initials: string;
  phone: string;
  agent: string;
  attempts: string;
  lastCall: string;
  email: string;
  status: string;
  disposition: string;
  eligibility?: string;
  qualification_status?: string;
}

export interface HopperLead {
  no: string;
  id: string;
  lead_id?: string;
  initials: string;
  name: string;
  sub: string;
  campaign: string;
  queue: string;
  queueCls: string;
  priority: string;
  priorityCls: string;
  wait: string;
  agent: string;
  status: string;
  statusCls: string;
}

export interface CreateRecycleListPayload {
  source_disposition: string;
  source_campaign: string;
  lead_selection?: string;
  retry_window?: string;
  default_hopper_queue?: string;
  list_name?: string;
}

export interface RecycleLeadsPayload {
  leadIds: string[];
  campaign: string;
  lane: string;
}

export async function fetchRecycleLists(filters?: {
  query?: string;
  disposition?: string;
  campaign?: string;
  status?: string;
}): Promise<RecycleList[]> {
  const params = new URLSearchParams();
  if (filters?.query) params.append("query", filters.query);
  if (filters?.disposition) params.append("disposition", filters.disposition);
  if (filters?.campaign) params.append("campaign", filters.campaign);
  if (filters?.status) params.append("status", filters.status);

  const queryStr = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<RecycleList[]>(`/api/leads/recycle/lists${queryStr}`);
}

export async function fetchKpis(): Promise<KpiItem[]> {
  return apiFetch<KpiItem[]>("/api/leads/recycle/kpis");
}

export async function fetchLeadsForList(listId: string): Promise<RecycleLead[]> {
  return apiFetch<RecycleLead[]>(`/api/leads/recycle/lists/${encodeURIComponent(listId)}/leads`);
}

export async function exportRecycleListCsv(listId: string): Promise<void> {
  const authData = typeof window !== "undefined" ? sessionStorage.getItem("callzenza-auth") || localStorage.getItem("callzenza-auth") : null;
  let token = null;
  if (authData) {
    try { token = JSON.parse(authData)?.state?.token; } catch (_) {}
  }
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`/api/leads/recycle/lists/${encodeURIComponent(listId)}/export`, { headers });
  if (!response.ok) throw new Error("Failed to export CSV");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `recycled_leads_${listId}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function createRecycleList(payload: CreateRecycleListPayload): Promise<any> {
  return apiFetch("/api/leads/recycle/lists", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function recycleLeads(payload: RecycleLeadsPayload): Promise<{
  success: boolean;
  count: number;
  campaign: string;
  lane: string;
}> {
  return apiFetch("/api/leads/recycle/execute", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchHopperKpis(): Promise<KpiItem[]> {
  return apiFetch<KpiItem[]>("/api/leads/hopper/kpis");
}

export async function fetchHopperLeads(filters?: {
  queue?: string;
  campaign?: string;
  status?: string;
  search?: string;
}): Promise<HopperLead[]> {
  const params = new URLSearchParams();
  if (filters?.queue) params.append("queue", filters.queue);
  if (filters?.campaign) params.append("campaign", filters.campaign);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.search) params.append("search", filters.search);

  const queryStr = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<HopperLead[]>(`/api/leads/hopper/leads${queryStr}`);
}

import { apiFetch, apiUpload } from "@/lib/api-client";
import { ImportSummary } from "@/lib/services/import-summary";
import { Lead } from "@/lib/services/lead.service";

export interface LeadGroup {
  id: string;
  business_id: string;
  filename: string;
  lead_count: number;
  status: string;
  created_at: string;
}

export const leadGroupService = {
  list: () => apiFetch<LeadGroup[]>("/api/lead-groups"),
  create: (filename: string, leads: Record<string, string>[], agentId?: string | null) => {
    return apiFetch<LeadGroup>("/api/lead-groups", {
      method: "POST",
      body: JSON.stringify({ filename, leads, agent_id: agentId }),
    });
  },
  importFile: (file: File, agentId?: string | null) => {
    const formData = new FormData();
    formData.append("file", file);
    if (agentId) formData.append("agent_id", agentId);
    return apiUpload<LeadGroup>("/api/lead-groups/import", formData);
  },
  update: (groupId: string, data: { filename: string }) => {
    return apiFetch<LeadGroup>(`/api/lead-groups/${groupId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  getLeads: (groupId: string) => apiFetch<Lead[]>(`/api/lead-groups/${groupId}/leads`),
  remove: (groupId: string) => apiFetch<void>(`/api/lead-groups/${groupId}`, { method: "DELETE" }),
  downloadUrl: (groupId: string) => {
    const IS_BROWSER = typeof window !== "undefined";
    const baseUrl = IS_BROWSER ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000");
    return `${baseUrl}/api/lead-groups/${groupId}/download`;
  },
};


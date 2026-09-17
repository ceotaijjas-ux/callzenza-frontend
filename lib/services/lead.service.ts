import { apiFetch } from "@/lib/api-client";
import { apiUpload } from "@/lib/api-client";
import { ImportSummary } from "@/lib/services/import-summary";

export interface Lead {
  id: string;
  business_id?: string;
  source?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  requirement?: string;
  budget?: string;
  timeline?: string;
  status?: string;
  score?: number;
  qualification_status?: string;
  ai_summary?: string;
  assigned_expert_id?: string | null;
  agent_id?: string | null;
  group_id?: string | null;
  original_filename?: string | null;
  location?: string;
  call_status?: string;
  call_result?: string;
  call_duration?: number;
  agent_name?: string;
  assigned_agent_name?: string;
  created_by_role?: string;
  uploaded_file_name?: string | null;
  uploaded_file_path?: string | null;
  uploaded_file_type?: string | null;
  uploaded_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const leadService = {
  list: (params?: { status?: string; search?: string }) => {
    const cleanParams: Record<string, string> = {};
    if (params?.status && params.status.trim() && params.status !== "undefined") {
      cleanParams.status = params.status.trim();
    }
    if (params?.search && params.search.trim() && params.search !== "undefined") {
      cleanParams.search = params.search.trim();
    }
    const qs = new URLSearchParams(cleanParams).toString();
    return apiFetch<Lead[]>(`/api/leads${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => apiFetch<Lead>(`/api/leads/${id}`),
  create: (data: Partial<Lead> & { campaign_id?: string }) => apiFetch<Lead>("/api/leads", { method: "POST", body: JSON.stringify(data) }),
  createWithFile: (formData: FormData) => apiUpload<Lead>("/api/leads", formData),
  update: (id: string, data: Partial<Lead>) =>
    apiFetch<Lead>(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/api/leads/${id}`, { method: "DELETE" }),
  importFile: (file: File, opts: { agentId?: string; autoCall?: boolean } = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    if (opts.agentId) formData.append("agent_id", opts.agentId);
    formData.append("auto_call", String(opts.autoCall ?? true));
    return apiUpload<ImportSummary>("/api/leads/import", formData);
  },
  preview: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiUpload<{ headers: string[]; rows: Record<string, string>[] }>("/api/leads/preview", formData);
  },
  importMapped: (leads: Record<string, string>[], agentId?: string | null, campaignId?: string | null, filename?: string) => {
    return apiFetch<ImportSummary>("/api/leads/import-mapped", {
      method: "POST",
      body: JSON.stringify({ leads, agent_id: agentId, campaign_id: campaignId, filename }),
    });
  },
};

export function extractLeadFieldsFromRow(row: Record<string, any>): Record<string, string> {
  const findVal = (aliases: string[]): string => {
    for (const [key, val] of Object.entries(row)) {
      if (!key || val === null || val === undefined) continue;
      const cleanKey = String(key).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const alias of aliases) {
        const cleanAlias = alias.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleanKey === cleanAlias) {
          return String(val).trim();
        }
      }
    }
    return "";
  };

  const firstName = findVal(["first_name", "first name", "firstname", "given_name", "given name", "fname", "first"]);
  const lastName = findVal(["last_name", "last name", "lastname", "surname", "lname", "last"]);
  const fullName = findVal(["full_name", "full name", "fullname", "lead_name", "lead name", "leadname", "customer_name", "customer name", "customername", "client_name", "client name", "clientname", "name", "contact_name", "contact name", "customer", "lead"]);

  const phone = findVal(["phone", "phone_number", "phone number", "phonenumber", "mobile", "mobile_number", "mobile number", "mobilenumber", "contact", "contact_number", "contact number", "cell", "telephone", "whatsapp", "number", "phone_no", "phone no", "mobile_no", "mobile no", "contact_no", "contact no", "cust_phone", "customer_phone", "num"]);
  const email = findVal(["email", "email_address", "email address", "emailaddress", "e-mail", "mail", "emailid", "email_id"]);
  const company = findVal(["company", "company_name", "company name", "companyname", "organization", "org", "business", "business_name", "business name", "client_company"]);
  const jobTitle = findVal(["job_title", "job title", "jobtitle", "title", "designation", "role", "position"]);
  const requirement = findVal(["requirement", "requirements", "notes", "remarks", "remark", "interest", "product_interest", "product interest", "inquiry", "message", "description"]);
  const budget = findVal(["budget", "monthly_budget", "monthly budget", "amount", "price"]);
  const timeline = findVal(["timeline", "timeframe", "schedule"]);
  const location = findVal(["location", "city", "place", "town", "address", "state", "country", "pincode", "zipcode"]);

  let resolvedFirst = firstName;
  let resolvedLast = lastName;

  if (!resolvedFirst && !resolvedLast && fullName) {
    const parts = fullName.split(/\s+/);
    resolvedFirst = parts[0] || "";
    resolvedLast = parts.slice(1).join(" ") || "";
  } else if (resolvedFirst && !resolvedLast) {
    const parts = resolvedFirst.split(/\s+/);
    if (parts.length > 1) {
      resolvedFirst = parts[0];
      resolvedLast = parts.slice(1).join(" ");
    }
  }

  if (resolvedFirst && resolvedLast && resolvedFirst.toLowerCase().endsWith(resolvedLast.toLowerCase())) {
    resolvedFirst = resolvedFirst.slice(0, resolvedFirst.length - resolvedLast.length).trim();
  }

  return {
    first_name: resolvedFirst,
    last_name: resolvedLast,
    phone,
    email,
    company,
    job_title: jobTitle,
    requirement,
    budget,
    timeline,
    location,
  };
}

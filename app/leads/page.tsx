"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { leadService, Lead, extractLeadFieldsFromRow } from "@/lib/services/lead.service";
import { leadGroupService, LeadGroup } from "@/lib/services/lead-group.service";
import { campaignService, Campaign } from "@/lib/services/campaign.service";
import { useAuthStore } from "@/lib/store";
import {
  Eye,
  Edit2,
  Download,
  Trash2,
  Loader2,
  FileSpreadsheet,
  Search,
  X,
  FileDown,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Upload,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ImportPreviewData {
  totalRecords: number;
  validCount: number;
  invalidCount: number;
  validLeads: Record<string, string>[];
  previewRows: Array<{
    name: string;
    phone: string;
    email: string;
    isValid: boolean;
    reason?: string;
  }>;
}

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<"leads" | "files">("leads");
  
  // Leads tab state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creationMethod, setCreationMethod] = useState<"manual" | "import">("manual");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");

  const toggleExpandGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // Manual Form state
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    company: "",
    requirement: "",
  });

  // Import File state
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewData | null>(null);

  const [filterSource, setFilterSource] = useState<"all" | "admin" | "user">("all");
  const [showConfig, setShowConfig] = useState(false);
  const [hideAdminLeads, setHideAdminLeads] = useState(false);
  const [restrictCampaignCalls, setRestrictCampaignCalls] = useState(false);
  const [autoAssignAdminLeads, setAutoAssignAdminLeads] = useState(false);

  const { user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  // Groups/Files tab state
  const [groups, setGroups] = useState<LeadGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  // Modals state
  const [selectedGroup, setSelectedGroup] = useState<LeadGroup | null>(null);
  const [groupLeads, setGroupLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  
  const [editingGroup, setEditingGroup] = useState<LeadGroup | null>(null);
  const [editFilename, setEditFilename] = useState("");
  
  // Status messages & operation states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHydrated(true);
    campaignService.list().then(setCampaigns).catch(() => []);
    if (typeof window !== "undefined") {
      setHideAdminLeads(localStorage.getItem("callzenza_config_hide_admin_leads") === "true");
      setRestrictCampaignCalls(localStorage.getItem("callzenza_config_restrict_campaign_calls") === "true");
      setAutoAssignAdminLeads(localStorage.getItem("callzenza_config_auto_assign_admin_leads") === "true");
    }
  }, []);

  const isAdmin = hydrated && user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");

  const toggleConfig = (key: string, val: boolean, setter: (b: boolean) => void) => {
    setter(val);
    localStorage.setItem(key, String(val));
  };

  const loadLeads = () => {
    setError(null);
    leadService
      .list({ search: search || undefined })
      .then(setLeads)
      .catch((e) => setError(e.message));
  };

  const loadGroups = () => {
    setError(null);
    setLoadingGroups(true);
    leadGroupService
      .list()
      .then(setGroups)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingGroups(false));
  };

  useEffect(() => {
    if (activeTab === "leads") {
      loadLeads();
    } else {
      loadGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Individual Lead File & Edit state
  const [creatingLead, setCreatingLead] = useState(false);
  const [selectedLeadForView, setSelectedLeadForView] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [updatingLead, setUpdatingLead] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    company: "",
    location: "",
    requirement: "",
    status: "NEW",
    qualification_status: "UNQUALIFIED",
  });

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setEditForm({
      first_name: lead.first_name || "",
      last_name: lead.last_name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      company: lead.company || "",
      location: lead.location || "",
      requirement: lead.requirement || "",
      status: lead.status || "NEW",
      qualification_status: lead.qualification_status || "UNQUALIFIED",
    });
  };

  const handleSaveEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    if (!editForm.first_name || !editForm.phone) {
      setError("First Name and Phone Number are required fields");
      return;
    }
    try {
      setUpdatingLead(true);
      setError(null);
      await leadService.update(editingLead.id, editForm);
      const leadNameStr = [editForm.first_name, editForm.last_name].filter(Boolean).join(" ").trim();
      setSuccess(`Lead "${leadNameStr}" updated successfully!`);
      setEditingLead(null);
      loadLeads();
    } catch (err: any) {
      setError(err.message || "Failed to update lead");
    } finally {
      setUpdatingLead(false);
    }
  };

  const handleCreateManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // If a CSV or Excel file is attached, import it
    if (selectedImportFile) {
      await handleConfirmImport();
      if (form.first_name && form.phone) {
        try {
          await leadService.create({
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone,
            email: form.email,
            company: form.company,
            requirement: form.requirement,
            source: "MANUAL",
          });
        } catch (_) {}
      }
      return;
    }

    if (!form.first_name || !form.phone) {
      setError("First Name and Phone Number are required fields");
      return;
    }
    try {
      setCreatingLead(true);
      await leadService.create({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        email: form.email,
        company: form.company,
        requirement: form.requirement,
        source: "MANUAL",
      });
      const leadNameStr = [form.first_name, form.last_name].filter(Boolean).join(" ").trim();
      setSuccess(`Lead "${leadNameStr}" created successfully!`);
      setForm({ first_name: "", last_name: "", phone: "", email: "", company: "", requirement: "" });
      setShowForm(false);
      loadLeads();
    } catch (err: any) {
      setError(err.message || "Failed to create lead");
    } finally {
      setCreatingLead(false);
    }
  };

  const parseCsvText = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];
    const firstLine = lines[0];
    const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";
    const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      rows.push(row);
    }
    return rows;
  };

  const getFieldValue = (row: Record<string, string>, aliases: string[]): string => {
    for (const [key, val] of Object.entries(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const alias of aliases) {
        const cleanAlias = alias.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleanKey === cleanAlias) {
          return (val || "").trim();
        }
      }
    }
    return "";
  };

  const handleFileSelectedForImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImportFile(file);
      setImportPreview(null);
    }
  };

  const handleParseAndPreview = async () => {
    if (!selectedImportFile) {
      setError("Please select a CSV or Excel file to upload");
      return;
    }
    setParsingFile(true);
    setError(null);
    try {
      let rawRows: Record<string, string>[] = [];
      const fileNameLower = selectedImportFile.name.toLowerCase();

      if (fileNameLower.endsWith(".csv")) {
        const text = await selectedImportFile.text();
        rawRows = parseCsvText(text);
      } else {
        const previewRes = await leadService.preview(selectedImportFile);
        rawRows = previewRes.rows || [];
      }

      const validLeads: Record<string, string>[] = [];
      const previewRows: Array<{ name: string; phone: string; email: string; isValid: boolean; reason?: string }> = [];
      let validCount = 0;
      let invalidCount = 0;

      const phoneAliases = ["mobile number", "mobilenumber", "phonenumber", "phone number", "phone", "mobile", "contact", "contact number", "cell", "telephone", "whatsapp", "number", "phone_number", "mobile_number", "mob", "phone no", "mobile no", "contact no", "cust phone", "customer phone", "num"];
      const firstNameAliases = ["first name", "firstname", "first_name", "given name", "name", "full name", "customer name", "lead name", "client name", "customer"];
      const lastNameAliases = ["last name", "lastname", "last_name", "surname"];
      const emailAliases = ["email", "email address", "e-mail", "mail", "emailid"];
      const placeAliases = ["place", "location", "city", "town", "district", "address", "state", "country"];
      const companyAliases = ["company", "company name", "organization", "business name", "company_name", "org"];
      const requirementAliases = ["requirement", "requirements", "notes", "message", "interest", "product interest", "description"];

      rawRows.forEach((row) => {
        const ext = extractLeadFieldsFromRow(row);
        const firstName = ext.first_name;
        const lastName = ext.last_name;
        const phone = ext.phone;
        const place = ext.location;
        const email = ext.email;
        const company = ext.company;
        const requirement = ext.requirement;

        const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || "Unnamed Lead";
        const hasContactOrName = Boolean(firstName || lastName || phone || email);
        const isValidPhone = !phone || (phone.replace(/\D/g, "").length >= 3);
        const isValid = Boolean(hasContactOrName && isValidPhone);

        if (isValid) {
          validCount++;
          validLeads.push({
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            location: place,
            email: email,
            company: company,
            requirement: requirement,
          });
          previewRows.push({
            name: fullName,
            phone: phone || "—",
            email: email || "—",
            isValid: true,
          });
        } else {
          invalidCount++;
          let reason = "Invalid Mobile Number";
          if (!hasContactOrName) reason = "Missing Contact Information";

          previewRows.push({
            name: fullName,
            phone: phone || "Empty",
            email: email || "—",
            isValid: false,
            reason: reason,
          });
        }
      });

      setImportPreview({
        totalRecords: rawRows.length,
        validCount,
        invalidCount,
        validLeads,
        previewRows,
      });
    } catch (err: any) {
      setError(err.message || "Failed to parse file");
    } finally {
      setParsingFile(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedImportFile) {
      setError("Please select a file to import");
      return;
    }
    setImporting(true);
    setError(null);
    setSuccess(null);
    try {
      const summary = await leadService.importFile(selectedImportFile);

      const imported = summary.successfully_imported ?? summary.leads_created ?? 0;
      const total = summary.total_rows ?? imported;
      const duplicates = summary.duplicate_rows ?? 0;
      const invalid = summary.invalid_rows ?? 0;

      let msg = `Successfully imported ${imported} out of ${total} leads from "${selectedImportFile.name}".`;
      if (duplicates > 0) msg += ` (${duplicates} duplicates skipped)`;
      if (invalid > 0) msg += ` (${invalid} invalid rows skipped)`;

      setSuccess(msg);

      if (summary.errors && summary.errors.length > 0) {
        const sampleErrors = summary.errors.slice(0, 3).join(" | ");
        setError(`Import details: ${sampleErrors}${summary.errors.length > 3 ? ` ... and ${summary.errors.length - 3} more` : ""}`);
      }

      setImportPreview(null);
      setSelectedImportFile(null);
      setShowForm(false);
      loadLeads();
      loadGroups();
    } catch (err: any) {
      setError(err.message || "Failed to import leads file");
    } finally {
      setImporting(false);
    }
  };

  const handleViewGroupLeads = async (group: LeadGroup) => {
    setSelectedGroup(group);
    setLoadingLeads(true);
    setError(null);
    try {
      const leads = await leadGroupService.getLeads(group.id);
      setGroupLeads(leads);
    } catch (err: any) {
      setError(err.message || "Failed to load leads for group");
      setSelectedGroup(null);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleStartRename = (group: LeadGroup) => {
    setEditingGroup(group);
    setEditFilename(group.filename);
  };

  const handleSaveRename = async () => {
    if (!editingGroup) return;
    setError(null);
    try {
      await leadGroupService.update(editingGroup.id, { filename: editFilename });
      setEditingGroup(null);
      loadGroups();
    } catch (err: any) {
      setError(err.message || "Failed to rename file");
    }
  };

  const handleDownload = async (group: LeadGroup) => {
    setError(null);
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch(leadGroupService.downloadUrl(group.id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = group.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Failed to download spreadsheet");
    }
  };

  const handleDeleteGroup = async (group: LeadGroup) => {
    if (!confirm(`Are you sure you want to delete "${group.filename}"? This will delete all ${group.lead_count} associated leads.`)) {
      return;
    }
    setError(null);
    try {
      await leadGroupService.remove(group.id);
      loadGroups();
    } catch (err: any) {
      setError(err.message || "Failed to delete group");
    }
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Leads <Sparkles className="h-6 w-6 text-indigo-500 animate-pulse" />
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage outbound prospects, import campaign lead lists, and view call status</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowForm((v) => !v)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold flex items-center gap-2 rounded-xl"
          >
            {showForm ? (
              <>
                <X className="h-4 w-4" /> Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> New Lead
              </>
            )}
          </Button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 mb-6 text-sm flex items-center justify-between font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 mb-6 text-sm flex items-center justify-between font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-6 shadow-sm space-y-5 max-w-4xl animate-in fade-in duration-200">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-md uppercase tracking-wider">Create New Outbound Lead</h3>
            <button 
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleCreateManualLead} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">FIRST NAME *</label>
                <Input 
                  value={form.first_name} 
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })} 
                  required={!selectedImportFile}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">LAST NAME</label>
                <Input 
                  value={form.last_name} 
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">PHONE NUMBER *</label>
                <Input 
                  value={form.phone} 
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                  required={!selectedImportFile}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">EMAIL</label>
                <Input 
                  type="email"
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">COMPANY</label>
                <Input 
                  value={form.company} 
                  onChange={(e) => setForm({ ...form, company: e.target.value })} 
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">REQUIREMENT / INTEREST DESCRIPTION</label>
                <Input
                  value={form.requirement}
                  onChange={(e) => setForm({ ...form, requirement: e.target.value })}
                />
              </div>
            </div>

            {/* Embedded CSV / Excel File Uploader inside the form */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">OR UPLOAD CSV / EXCEL FILE</span>
                <div className="h-[1px] bg-slate-100 flex-1" />
              </div>

              {!importPreview ? (
                <div className="space-y-3">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 transition-all rounded-2xl p-4 text-center cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <FileSpreadsheet className="h-7 w-7 text-indigo-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {selectedImportFile ? selectedImportFile.name : "Attach CSV or Excel File for Bulk Lead Import"}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Supported formats: .csv, .xlsx, .xls
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedImportFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImportFile(null);
                            setImportPreview(null);
                          }}
                          className="text-xs text-rose-500 hover:bg-rose-50 h-8 px-2 rounded-lg"
                        >
                          Remove
                        </Button>
                      )}
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="text-xs font-bold border-indigo-200 text-indigo-600 bg-white hover:bg-indigo-50 shrink-0 rounded-xl"
                      >
                        {selectedImportFile ? "Change File" : "Browse File"}
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={handleFileSelectedForImport}
                    />
                  </div>

                  {selectedImportFile && (
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleParseAndPreview}
                        disabled={parsingFile || importing}
                        className="border-indigo-200 text-indigo-700 font-bold text-xs h-9 px-4 rounded-xl"
                      >
                        {parsingFile ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                        Preview File Leads
                      </Button>
                      <Button
                        type="button"
                        onClick={handleConfirmImport}
                        disabled={importing || parsingFile}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-4 rounded-xl"
                      >
                        {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                        Import File Now
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-indigo-600" /> File Preview ({selectedImportFile?.name})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setImportPreview(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Clear File Preview
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Total Records</p>
                      <p className="text-lg font-black text-slate-900">{importPreview.totalRecords}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Valid Leads</p>
                      <p className="text-lg font-black text-emerald-700">{importPreview.validCount}</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] font-bold text-rose-600 uppercase">Invalid Leads</p>
                      <p className="text-lg font-black text-rose-700">{importPreview.invalidCount}</p>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs font-medium border-collapse">
                      <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Email</th>
                          <th className="p-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreview.previewRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-900">{row.name}</td>
                            <td className="p-2 font-mono text-slate-700">{row.phone}</td>
                            <td className="p-2 text-slate-500">{row.email || "—"}</td>
                            <td className="p-2 text-right">
                              {row.isValid ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                  Valid
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800">
                                  Invalid ({row.reason})
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button 
                      type="button"
                      onClick={handleConfirmImport} 
                      disabled={importPreview.validCount === 0 || importing}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-4 rounded-xl"
                    >
                      {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                      Import {importPreview.validCount} Valid File Leads
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={creatingLead}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {creatingLead ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Lead
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="flex border-b border-gray-200 mb-6 gap-6">
        <button
          onClick={() => setActiveTab("leads")}
          className={`pb-3 font-semibold text-sm border-b-2 transition-all relative ${
            activeTab === "leads"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All Leads
        </button>
        <button
          onClick={() => setActiveTab("files")}
          className={`pb-3 font-semibold text-sm border-b-2 transition-all relative ${
            activeTab === "files"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Import History
        </button>
      </div>

      {activeTab === "leads" && (
        <div className="space-y-4">
          {isAdmin && (
            <>
              <div className="flex items-center justify-between gap-4 flex-wrap bg-gray-50 p-3.5 rounded-2xl border border-gray-150 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Lead Source:</span>
                  {[
                    { id: "all", label: "All Leads" },
                    { id: "admin", label: "Added by Admin" },
                    { id: "user", label: "Added by User" },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setFilterSource(id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        filterSource === id
                          ? "bg-white text-indigo-600 shadow-sm border border-indigo-100 font-bold"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-xs font-semibold flex items-center gap-1.5 rounded-xl"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                  Lead Config
                </Button>
              </div>

              {showConfig && (
                <div className="bg-white border border-indigo-100 p-5 rounded-2xl shadow-sm space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    ⚙️ Display & Handling Configurations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex gap-3 items-start select-none cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={hideAdminLeads}
                        onChange={(e) => toggleConfig("callzenza_config_hide_admin_leads", e.target.checked, setHideAdminLeads)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-semibold text-gray-700">Hide Admin Leads from standard Users</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Completely hide admin-added leads in general directories</p>
                      </div>
                    </label>

                    <label className="flex gap-3 items-start select-none cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={restrictCampaignCalls}
                        onChange={(e) => toggleConfig("callzenza_config_restrict_campaign_calls", e.target.checked, setRestrictCampaignCalls)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-semibold text-gray-700">Restrict Outbound Calls by Campaign</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Allow calls only if lead is actively mapped to a running campaign</p>
                      </div>
                    </label>

                    <label className="flex gap-3 items-start select-none cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={autoAssignAdminLeads}
                        onChange={(e) => toggleConfig("callzenza_config_auto_assign_admin_leads", e.target.checked, setAutoAssignAdminLeads)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-semibold text-gray-700">Auto-Assign Admin Leads to Users</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Automatically route admin-imported leads to available agents</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by filename, client name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadLeads()}
                className="pl-10 h-10 rounded-xl border-gray-200 text-sm"
              />
            </div>
          </div>

          {/* Grouping Logic for EXCEL_IMPORT leads & MANUAL leads */}
          {(() => {
            const excelGroupsMap = new Map<string, {
              key: string;
              filename: string;
              groupId?: string;
              leads: Lead[];
            }>();

            const manualLeadsList: Lead[] = [];
            const searchLower = search.trim().toLowerCase();

            // Pre-populate with all persistent lead groups so every list is tracked
            groups.forEach((g) => {
              if (!excelGroupsMap.has(g.id)) {
                excelGroupsMap.set(g.id, {
                  key: g.id,
                  filename: g.filename,
                  groupId: g.id,
                  leads: [],
                });
              }
            });

            leads.forEach((lead) => {
              if (hideAdminLeads && lead.created_by_role === "ADMIN") return;
              if (filterSource === "admin" && lead.created_by_role !== "ADMIN") return;
              if (filterSource === "user" && lead.created_by_role !== "USER") return;

              if (lead.source === "EXCEL_IMPORT") {
                const filename = lead.original_filename || lead.uploaded_file_name || "leads.csv";
                const key = lead.group_id || filename;

                if (!excelGroupsMap.has(key)) {
                  excelGroupsMap.set(key, {
                    key,
                    filename,
                    groupId: lead.group_id || undefined,
                    leads: [],
                  });
                }
                excelGroupsMap.get(key)!.leads.push(lead);
              } else {
                manualLeadsList.push(lead);
              }
            });

            const filteredExcelGroups = Array.from(excelGroupsMap.values()).filter((group) => {
              if (!searchLower) return true;
              const filenameMatch = group.filename.toLowerCase().includes(searchLower);
              const leadMatch = group.leads.some((l) =>
                `${l.first_name} ${l.last_name}`.toLowerCase().includes(searchLower) ||
                (l.email && l.email.toLowerCase().includes(searchLower)) ||
                (l.phone && l.phone.includes(searchLower)) ||
                (l.company && l.company.toLowerCase().includes(searchLower))
              );
              return filenameMatch || leadMatch;
            });

            const filteredManualLeads = manualLeadsList.filter((l) => {
              if (!searchLower) return true;
              return (
                `${l.first_name} ${l.last_name}`.toLowerCase().includes(searchLower) ||
                (l.email && l.email.toLowerCase().includes(searchLower)) ||
                (l.phone && l.phone.includes(searchLower)) ||
                (l.company && l.company.toLowerCase().includes(searchLower))
              );
            });

            return (
              <div className="space-y-4">
                {/* 1. EXCEL IMPORT FILE GROUPS */}
                {filteredExcelGroups.map((group) => {
                  const searchMatchesLead = searchLower && group.leads.some((l) =>
                    `${l.first_name} ${l.last_name}`.toLowerCase().includes(searchLower) ||
                    (l.email && l.email.toLowerCase().includes(searchLower)) ||
                    (l.phone && l.phone.includes(searchLower)) ||
                    (l.company && l.company.toLowerCase().includes(searchLower))
                  );

                  // Show lead list expanded by default so leads inside are immediately visible
                  const isExpanded = expandedGroups[group.key] !== undefined ? !!expandedGroups[group.key] : true;

                  return (
                    <div key={group.key} className="bg-white border border-indigo-150 rounded-2xl p-5 shadow-sm space-y-4 transition-all hover:shadow-md">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3.5 flex-1 min-w-[280px]">
                          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shrink-0 mt-0.5">
                            <FileSpreadsheet className="h-6 w-6" />
                          </div>
                          <div className="space-y-1.5 flex-1 min-w-0">
                            {/* COMPLETE UNTRUNCATED FILENAME DISPLAY */}
                            <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug break-all">
                              {group.filename}
                            </h3>
                            <div className="flex items-center gap-2.5 flex-wrap text-xs">
                              <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                                {group.leads.length} Customers
                              </span>
                              <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
                                EXCEL IMPORT
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                Status: Imported
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExpandGroup(group.key)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 font-bold text-xs h-9 px-4 rounded-xl gap-1.5 cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {isExpanded ? "HIDE CUSTOMERS" : "VIEW CUSTOMERS"}
                          </Button>

                          {group.groupId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingGroup({ id: group.groupId!, filename: group.filename } as any);
                                setEditFilename(group.filename);
                              }}
                              className="text-slate-600 hover:text-indigo-600 font-semibold text-xs h-9 px-3 rounded-xl gap-1 cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" /> Edit
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete the Excel import file group "${group.filename}" and all ${group.leads.length} customers in it?`)) {
                                try {
                                  if (group.groupId) {
                                    await leadGroupService.remove(group.groupId);
                                  } else {
                                    await Promise.all(group.leads.map((l) => leadService.remove(l.id)));
                                  }
                                  setSuccess(`Deleted group "${group.filename}".`);
                                  loadLeads();
                                } catch (err: any) {
                                  setError(err.message || "Failed to delete group.");
                                }
                              }
                            }}
                            className="text-rose-600 hover:bg-rose-50 border-rose-100 font-semibold text-xs h-9 px-3 rounded-xl gap-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        </div>
                      </div>

                      {/* EXPANDED GROUP CUSTOMERS DETAILS TABLE */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3">Customer Name</th>
                                  <th className="px-4 py-3">Contact Details</th>
                                  <th className="px-4 py-3">Company</th>
                                  <th className="px-4 py-3">Disposition / Status</th>
                                  <th className="px-4 py-3">Assigned Agent</th>
                                  <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/60 font-semibold text-slate-800">
                                {group.leads.map((lead) => (
                                  <tr key={lead.id} className="hover:bg-white transition-colors">
                                    <td className="px-4 py-3 font-bold text-slate-900">
                                      {lead.first_name} {lead.last_name}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="font-mono text-slate-900 font-bold">{lead.phone || "—"}</div>
                                      <div className="text-[10px] text-slate-500">{lead.email || "—"}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{lead.company || "—"}</td>
                                    <td className="px-4 py-3">
                                      {lead.status === "CALL BACK" || (lead.call_status && lead.call_status === "CALL BACK") || (lead.call_result && (lead.call_result.toUpperCase().includes("CALLBACK") || lead.call_result.toUpperCase().includes("CALL BACK"))) ? (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5 w-fit">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                          CALL BACK
                                        </span>
                                      ) : lead.call_result && lead.call_result !== "—" ? (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                          {lead.call_result}
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                                          {lead.status || lead.qualification_status || "NEW"}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      {lead.agent_name || lead.assigned_agent_name ? (
                                        <span className="text-emerald-700 font-extrabold text-xs flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                          {lead.agent_name || lead.assigned_agent_name}
                                        </span>
                                      ) : lead.assigned_expert_id ? (
                                        <span className="text-emerald-700 font-bold text-xs">Assigned</span>
                                      ) : (
                                        <span className="text-slate-400 font-normal text-xs">Unassigned</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-indigo-600 hover:bg-indigo-50"
                                          onClick={() => setSelectedLeadForView(lead)}
                                          title="View Lead Details"
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50"
                                          onClick={() => handleEditLead(lead)}
                                          title="Edit Lead"
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50"
                                          onClick={async () => {
                                            if (confirm(`Delete customer "${lead.first_name}"?`)) {
                                              await leadService.remove(lead.id);
                                              loadLeads();
                                            }
                                          }}
                                          title="Delete Lead"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 2. MANUAL LEADS LISTING */}
                {filteredManualLeads.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-4">
                    <div className="p-4 bg-gray-50 border-b border-gray-150 font-extrabold text-xs uppercase tracking-wider text-gray-500 flex items-center justify-between">
                      <span>Individual / Manual Leads</span>
                      <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-[10px]">
                        {filteredManualLeads.length} Leads
                      </span>
                    </div>
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 border-b border-gray-150 uppercase tracking-wider text-xs font-semibold">
                        <tr>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Contact Details</th>
                          <th className="px-6 py-4">Company</th>
                          <th className="px-6 py-4">Disposition / Status</th>
                          <th className="px-6 py-4">Assigned Agent</th>
                          <th className="px-6 py-4">Source</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {filteredManualLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-gray-900">{lead.first_name} {lead.last_name}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs text-gray-700 font-mono font-semibold">{lead.phone || "—"}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{lead.email || "—"}</p>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{lead.company || "—"}</td>
                            <td className="px-6 py-4">
                              {lead.status === "CALL BACK" || (lead.call_status && lead.call_status === "CALL BACK") || (lead.call_result && (lead.call_result.toUpperCase().includes("CALLBACK") || lead.call_result.toUpperCase().includes("CALL BACK"))) ? (
                                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5 w-fit">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                  CALL BACK
                                </span>
                              ) : lead.call_result && lead.call_result !== "—" ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  ● {lead.call_result}
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                                  ● {lead.status || "NEW"}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {lead.agent_name || lead.assigned_agent_name ? (
                                <span className="text-xs font-black text-emerald-700 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  {lead.agent_name || lead.assigned_agent_name}
                                </span>
                              ) : lead.assigned_expert_id ? (
                                <span className="text-xs font-bold text-emerald-700">Assigned</span>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium">Unassigned</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <Badge className="bg-slate-100 text-slate-700 border-none text-[10px] font-semibold">
                                {lead.source || "MANUAL"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                  onClick={() => setSelectedLeadForView(lead)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                  onClick={() => handleEditLead(lead)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                  onClick={async () => {
                                    if (confirm(`Delete lead "${lead.first_name}"?`)) {
                                      await leadService.remove(lead.id);
                                      loadLeads();
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {filteredExcelGroups.length === 0 && filteredManualLeads.length === 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400 font-medium shadow-sm">
                    No leads or Excel import groups found. Create a new lead or import a CSV/Excel file above.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === "files" && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {loadingGroups ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="text-sm font-medium">Fetching import history...</span>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-150 uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">File Name</th>
                  <th className="px-6 py-4">Total Leads</th>
                  <th className="px-6 py-4">Successfully Created</th>
                  <th className="px-6 py-4">Failed</th>
                  <th className="px-6 py-4">Upload Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {groups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-100">
                          <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-gray-900">{group.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">{group.lead_count}</td>
                    <td className="px-6 py-4 text-emerald-700 font-bold">{group.lead_count}</td>
                    <td className="px-6 py-4 text-rose-500 font-semibold">0</td>
                    <td className="px-6 py-4 text-gray-500 text-xs font-semibold">
                      {new Date(group.created_at).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {group.status || "Completed"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                          title="View Leads"
                          onClick={() => handleViewGroupLeads(group)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                          title="Download File"
                          onClick={() => handleDownload(group)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete History Record"
                          onClick={() => handleDeleteGroup(group)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {groups.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-gray-400 font-medium">
                      No import history records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedGroup && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                  {selectedGroup.filename}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Showing {groupLeads.length} leads in this import batch</p>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingLeads ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  <span>Loading records...</span>
                </div>
              ) : (
                <div className="border border-gray-150 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-150 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3">Call Status</th>
                        <th className="px-4 py-3">Call Outcome</th>
                        <th className="px-4 py-3">Qualification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {groupLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50/30">
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {lead.first_name} {lead.last_name}
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-mono">{lead.phone || "—"}</td>
                          <td className="px-4 py-3 text-gray-600">{lead.email || "—"}</td>
                          <td className="px-4 py-3 text-gray-600">{lead.company || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              lead.call_status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              lead.call_status === "FAILED" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                              lead.call_status === "CALLING" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                              lead.call_status === "PENDING" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
                              "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>
                              {lead.call_status || "NEW"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {lead.call_result && lead.call_result !== "—" ? (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {lead.call_result}
                              </span>
                            ) : lead.call_status === "NEW" || !lead.call_status ? (
                              <span className="text-slate-400 text-xs italic">Not dialed yet</span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">No outcome</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {lead.qualification_status === "QUALIFIED" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> QUALIFIED
                              </span>
                            ) : lead.qualification_status === "NOT_QUALIFIED" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                NOT QUALIFIED
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">UNQUALIFIED</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {groupLeads.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-400 font-medium">
                            No lead records available for this import file.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
              <Button
                variant="outline"
                className="gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-100 font-bold"
                onClick={() => handleDownload(selectedGroup)}
              >
                <FileDown className="h-4 w-4" /> Download File
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingGroup && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-gray-900 text-lg">Rename File</h3>
              <button onClick={() => setEditingGroup(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">File Name</label>
              <Input
                value={editFilename}
                onChange={(e) => setEditFilename(e.target.value)}
                placeholder="e.g. leads_2026.xlsx"
                className="font-medium"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setEditingGroup(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRename} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
      {selectedLeadForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-md uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-600" /> LEAD DETAILS
              </h3>
              <button
                onClick={() => setSelectedLeadForView(null)}
                className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider">Name</p>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                    {selectedLeadForView.first_name} {selectedLeadForView.last_name}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedLeadForView.phone || "—"}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider">Email</p>
                  <p className="font-medium text-slate-700 mt-0.5">{selectedLeadForView.email || "—"}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider">Company</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLeadForView.company || "—"}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider">Disposition / Status</p>
                  <div className="mt-0.5">
                    {selectedLeadForView.status === "CALL BACK" || (selectedLeadForView.call_status && selectedLeadForView.call_status === "CALL BACK") || (selectedLeadForView.call_result && (selectedLeadForView.call_result.toUpperCase().includes("CALLBACK") || selectedLeadForView.call_result.toUpperCase().includes("CALL BACK"))) ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        CALL BACK
                      </span>
                    ) : (
                      <span className="font-bold text-slate-800 text-xs">
                        {selectedLeadForView.call_result || selectedLeadForView.status || "NEW"}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider">Assigned Agent</p>
                  <p className="font-bold text-emerald-700 text-xs mt-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {selectedLeadForView.agent_name || selectedLeadForView.assigned_agent_name || (selectedLeadForView.assigned_expert_id ? "Assigned" : "Unassigned")}
                  </p>
                </div>
              </div>

              {selectedLeadForView.requirement && (
                <div className="space-y-1 bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-2xl text-xs">
                  <p className="font-bold text-indigo-600 uppercase tracking-wider">Requirement / Description</p>
                  <p className="text-slate-700 font-medium">{selectedLeadForView.requirement}</p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Uploaded Lead File</p>
                {selectedLeadForView.uploaded_file_name ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-xl shrink-0 font-black">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-900 text-xs truncate">{selectedLeadForView.uploaded_file_name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          {selectedLeadForView.uploaded_file_type || "FILE"} • {selectedLeadForView.uploaded_at ? new Date(selectedLeadForView.uploaded_at).toLocaleDateString() : "Uploaded"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={selectedLeadForView.uploaded_file_path || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        View File
                      </a>
                      <a
                        href={selectedLeadForView.uploaded_file_path || "#"}
                        download={selectedLeadForView.uploaded_file_name}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        Download File
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-400 font-medium">
                    No lead data file attached.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setSelectedLeadForView(null)}>
                Close
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 cursor-pointer"
                onClick={() => {
                  const leadToEdit = selectedLeadForView;
                  setSelectedLeadForView(null);
                  handleEditLead(leadToEdit);
                }}
              >
                <Edit2 className="h-4 w-4" /> Edit Lead
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-md uppercase tracking-wider flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-indigo-600" /> EDIT LEAD DETAILS
              </h3>
              <button
                onClick={() => setEditingLead(null)}
                className="text-slate-400 hover:text-slate-600 p-1 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    placeholder="First Name"
                    className="h-9 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Last Name
                  </label>
                  <Input
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    placeholder="Last Name"
                    className="h-9 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="Mobile / Phone Number"
                    className="h-9 font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="email@domain.com"
                    className="h-9 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Company
                  </label>
                  <Input
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    placeholder="Company Name"
                    className="h-9 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Location / Place
                  </label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="e.g. Chennai, Mumbai"
                    className="h-9 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Call / Lead Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-200 px-3 bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="NEW">NEW</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="WAITING_FOR_AGENT">WAITING FOR AGENT</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="DISQUALIFIED">DISQUALIFIED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Qualification Status
                  </label>
                  <select
                    value={editForm.qualification_status}
                    onChange={(e) => setEditForm({ ...editForm, qualification_status: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-200 px-3 bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="UNQUALIFIED">UNQUALIFIED</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="NOT_QUALIFIED">NOT QUALIFIED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Requirement / Description
                </label>
                <textarea
                  value={editForm.requirement}
                  onChange={(e) => setEditForm({ ...editForm, requirement: e.target.value })}
                  placeholder="Enter prospect notes or details..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setEditingLead(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatingLead}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  {updatingLead ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Lead Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

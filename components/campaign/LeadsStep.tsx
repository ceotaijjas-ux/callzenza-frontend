"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lead } from "@/lib/services/lead.service";
import { LeadGroup } from "@/lib/services/lead-group.service";
import {
  FolderOpen,
  Users,
  CheckSquare,
  Square,
  Search,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  MinusSquare,
} from "lucide-react";

interface LeadsStepProps {
  allLeads: Lead[];
  leadLibraries: LeadGroup[];
  leadSelectionMode: "ALL" | "LIBRARY" | "MANUAL";
  setLeadSelectionMode: (mode: "ALL" | "LIBRARY" | "MANUAL") => void;
  libraryId: string;
  onLibraryChange: (id: string) => void;
  selectedLeadIds: string[];
  setSelectedLeadIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function LeadsStep({
  allLeads,
  leadLibraries,
  leadSelectionMode,
  setLeadSelectionMode,
  libraryId,
  onLibraryChange,
  selectedLeadIds,
  setSelectedLeadIds,
}: LeadsStepProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleExpandGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Group leads by Excel file / library
  const excelGroupsMap = new Map<string, { key: string; filename: string; groupId?: string; leads: Lead[] }>();
  const manualLeadsList: Lead[] = [];

  allLeads.forEach((lead) => {
    if (lead.source === "EXCEL_IMPORT" || lead.original_filename) {
      const filename = lead.original_filename || "Excel_Import_File";
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

  const searchLower = searchTerm.trim().toLowerCase();

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

  const handleToggleLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleGroup = (groupLeads: Lead[]) => {
    const groupLeadIds = groupLeads.map((l) => l.id);
    const allSelected = groupLeadIds.every((id) => selectedLeadIds.includes(id));

    if (allSelected) {
      // Unselect all in this group
      setSelectedLeadIds((prev) => prev.filter((id) => !groupLeadIds.includes(id)));
    } else {
      // Select all in this group
      setSelectedLeadIds((prev) => Array.from(new Set([...prev, ...groupLeadIds])));
    }
  };

  const handleSelectAllFiltered = () => {
    const allFilteredLeads = [
      ...filteredExcelGroups.flatMap((g) => g.leads),
      ...filteredManualLeads,
    ];
    const filteredIds = allFilteredLeads.map((l) => l.id);
    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedLeadIds.includes(id));

    if (allFilteredSelected) {
      setSelectedLeadIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedLeadIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Determine active total count for display badge
  let activeCount = 0;
  if (leadSelectionMode === "ALL") {
    activeCount = allLeads.length;
  } else if (leadSelectionMode === "LIBRARY") {
    const lib = leadLibraries.find((g) => g.id === libraryId);
    activeCount = lib ? lib.lead_count : 0;
  } else {
    activeCount = selectedLeadIds.length;
  }

  return (
    <Card className="p-6 space-y-5 shadow-sm border-gray-200/80 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-indigo-500" /> Step 4: Select Target Leads
        </h3>
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold">
          {activeCount} Leads Selected
        </span>
      </div>

      {/* Mode Selector Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setLeadSelectionMode("ALL")}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            leadSelectionMode === "ALL"
              ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" /> All Leads
            </span>
            {leadSelectionMode === "ALL" && <CheckCircle className="h-4 w-4 text-indigo-600" />}
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Include all ({allLeads.length}) created outbound leads
          </p>
        </button>

        <button
          type="button"
          onClick={() => setLeadSelectionMode("LIBRARY")}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            leadSelectionMode === "LIBRARY"
              ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-sm flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-indigo-600" /> Lead Library / CSV
            </span>
            {leadSelectionMode === "LIBRARY" && <CheckCircle className="h-4 w-4 text-indigo-600" />}
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Select from imported CSV / Excel libraries ({leadLibraries.length})
          </p>
        </button>

        <button
          type="button"
          onClick={() => setLeadSelectionMode("MANUAL")}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            leadSelectionMode === "MANUAL"
              ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-sm flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-indigo-600" /> Select Manually
            </span>
            {leadSelectionMode === "MANUAL" && <CheckCircle className="h-4 w-4 text-indigo-600" />}
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Handpick specific leads using checkboxes
          </p>
        </button>
      </div>

      {/* Mode 1: All Leads Summary */}
      {leadSelectionMode === "ALL" && (
        <div className="bg-emerald-50/70 text-emerald-900 p-4 rounded-xl border border-emerald-100 flex items-center justify-between text-sm font-medium">
          <div>
            <p className="font-bold text-gray-900">All Created Leads Selected</p>
            <p className="text-xs text-emerald-800 mt-0.5">
              This campaign will target all {allLeads.length} leads currently registered in your system.
            </p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 py-1.5 px-4 rounded-full font-extrabold text-xs shrink-0">
            {allLeads.length} Leads
          </span>
        </div>
      )}

      {/* Mode 2: Lead Library Dropdown */}
      {leadSelectionMode === "LIBRARY" && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider font-medium">
            Target Leads Library File
          </label>
          <select
            value={libraryId}
            onChange={(e) => onLibraryChange(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-semibold cursor-pointer"
          >
            <option value="">Choose Library File...</option>
            {leadLibraries.map((lib) => (
              <option key={lib.id} value={lib.id}>
                {lib.filename} ({lib.lead_count} Leads)
              </option>
            ))}
          </select>
          {leadLibraries.length === 0 && (
            <p className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded-xl">
              No CSV/Excel Lead Libraries found. Switch to "All Leads" above or import a CSV file on the Leads page.
            </p>
          )}
          {libraryId && (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 flex justify-between items-center text-sm font-medium">
              <span>Selected library file contains:</span>
              <span className="bg-emerald-100 text-emerald-800 py-1 px-3.5 rounded-full font-bold text-xs">
                {activeCount} Leads
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Grouped Excel Import Cards + Manual Checklist */}
      {leadSelectionMode === "MANUAL" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search leads by name, phone, email, company, filename..."
                className="pl-9 text-xs font-medium"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllFiltered}
              className="text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 shrink-0"
            >
              Deselect All Filtered
            </Button>
          </div>

          {/* EXCEL IMPORT FILE GROUPS */}
          {filteredExcelGroups.map((group) => {
            const groupLeadIds = group.leads.map((l) => l.id);
            const isAllSelected = groupLeadIds.every((id) => selectedLeadIds.includes(id));
            const isSomeSelected = groupLeadIds.some((id) => selectedLeadIds.includes(id)) && !isAllSelected;

            const searchMatchesLead =
              searchLower &&
              group.leads.some(
                (l) =>
                  `${l.first_name} ${l.last_name}`.toLowerCase().includes(searchLower) ||
                  (l.email && l.email.toLowerCase().includes(searchLower)) ||
                  (l.phone && l.phone.includes(searchLower)) ||
                  (l.company && l.company.toLowerCase().includes(searchLower))
              );

            const isExpanded = !!expandedGroups[group.key] || !!searchMatchesLead;
            const selectedCountInGroup = groupLeadIds.filter((id) => selectedLeadIds.includes(id)).length;

            return (
              <div
                key={group.key}
                className="bg-white border border-indigo-150 rounded-2xl p-4 shadow-sm space-y-3 transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                    <button
                      type="button"
                      onClick={() => handleToggleGroup(group.leads)}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer shrink-0"
                      title={isAllSelected ? "Deselect All in File" : "Select All in File"}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-5 w-5 text-indigo-600" />
                      ) : isSomeSelected ? (
                        <MinusSquare className="h-5 w-5 text-indigo-500" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-300" />
                      )}
                    </button>

                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="text-sm font-extrabold text-slate-900 tracking-tight leading-snug break-all">
                        {group.filename}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                          {selectedCountInGroup} / {group.leads.length} Customers Selected
                        </span>
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
                          EXCEL IMPORT
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpandGroup(group.key)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 font-bold text-xs h-8 px-3 rounded-xl gap-1.5 cursor-pointer shrink-0"
                  >
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {isExpanded ? "HIDE CUSTOMERS" : "VIEW CUSTOMERS"}
                  </Button>
                </div>

                {/* EXPANDED GROUP CUSTOMERS TABLE */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="border border-slate-200/80 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="p-2.5 w-10 text-center">Select</th>
                            <th className="p-2.5">Customer Name</th>
                            <th className="p-2.5">Phone</th>
                            <th className="p-2.5">Company</th>
                            <th className="p-2.5">Requirement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {group.leads.map((lead) => {
                            const isChecked = selectedLeadIds.includes(lead.id);
                            return (
                              <tr
                                key={lead.id}
                                onClick={() => handleToggleLead(lead.id)}
                                className={`cursor-pointer transition-colors ${
                                  isChecked ? "bg-indigo-50/60 font-semibold" : "hover:bg-slate-50"
                                }`}
                              >
                                <td className="p-2.5 text-center">
                                  {isChecked ? (
                                    <CheckSquare className="h-4 w-4 text-indigo-600 inline" />
                                  ) : (
                                    <Square className="h-4 w-4 text-slate-300 inline" />
                                  )}
                                </td>
                                <td className="p-2.5 font-bold text-slate-900">
                                  {lead.first_name} {lead.last_name}
                                </td>
                                <td className="p-2.5 font-mono">{lead.phone || "—"}</td>
                                <td className="p-2.5">{lead.company || "—"}</td>
                                <td className="p-2.5 text-slate-500 truncate max-w-xs">{lead.requirement || "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* MANUAL LEADS SECTION */}
          {filteredManualLeads.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                Manual Outbound Leads ({filteredManualLeads.length})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase sticky top-0">
                    <tr>
                      <th className="p-2.5 w-10 text-center">Select</th>
                      <th className="p-2.5">Customer Name</th>
                      <th className="p-2.5">Phone</th>
                      <th className="p-2.5">Company</th>
                      <th className="p-2.5">Requirement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredManualLeads.map((lead) => {
                      const isChecked = selectedLeadIds.includes(lead.id);
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => handleToggleLead(lead.id)}
                          className={`cursor-pointer transition-colors ${
                            isChecked ? "bg-indigo-50/60 font-semibold" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="p-2.5 text-center">
                            {isChecked ? (
                              <CheckSquare className="h-4 w-4 text-indigo-600 inline" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-300 inline" />
                            )}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900">
                            {lead.first_name} {lead.last_name}
                          </td>
                          <td className="p-2.5 font-mono">{lead.phone || "—"}</td>
                          <td className="p-2.5">{lead.company || "—"}</td>
                          <td className="p-2.5 text-slate-500 truncate max-w-xs">{lead.requirement || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredExcelGroups.length === 0 && filteredManualLeads.length === 0 && (
            <div className="p-6 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No leads match your search criteria.
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

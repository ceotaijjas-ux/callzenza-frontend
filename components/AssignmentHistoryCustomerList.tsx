"use client";

import React, { useState } from "react";
import { LeadAssignmentRecord } from "@/lib/services/lead-assignment.service";
import { Search, ChevronRight, Users } from "lucide-react";

interface AssignmentHistoryCustomerListProps {
  assignments: LeadAssignmentRecord[];
  selectedAssignment: LeadAssignmentRecord | null;
  selectedLeadId?: string;
  onSelectCustomer: (assignment: LeadAssignmentRecord) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export function AssignmentHistoryCustomerList({
  assignments,
  selectedAssignment,
  selectedLeadId,
  onSelectCustomer,
  searchTerm = "",
  onSearchChange,
}: AssignmentHistoryCustomerListProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const effectiveSearch = onSearchChange !== undefined ? searchTerm : localSearch;

  const handleSearch = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setLocalSearch(val);
    }
  };

  const filtered = assignments.filter((h) => {
    if (!effectiveSearch.trim()) return true;
    const q = effectiveSearch.toLowerCase();
    const name = (
      h.context?.lead_name ||
      h.context?.name ||
      `${h.context?.first_name || ""} ${h.context?.last_name || ""}`
    ).toLowerCase();
    const phone = (h.context?.phone || "").toLowerCase();
    const company = (h.context?.company || "").toLowerCase();
    return name.includes(q) || phone.includes(q) || company.includes(q);
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Assignment History
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
            {assignments.length}
          </span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="p-2.5 border-b border-slate-100 bg-white">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={effectiveSearch}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search history customers..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Vertical Scrollable Customer List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 max-h-[580px] scrollbar-thin">
        {assignments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium italic text-xs">
            No completed or historical assignments recorded.
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium italic text-xs">
            No history customers matching &quot;{effectiveSearch}&quot;.
          </div>
        ) : (
          filtered.map((h) => {
            const isSelected = Boolean(
              (selectedAssignment &&
                (selectedAssignment.id === h.id || selectedAssignment.lead_id === h.lead_id)) ||
                (selectedLeadId && selectedLeadId === h.lead_id)
            );

            const custName =
              h.context?.lead_name ||
              h.context?.name ||
              `${h.context?.first_name || ""} ${h.context?.last_name || ""}`.trim() ||
              "Customer";
            const custPhone = h.context?.phone || "—";
            const custCompany = h.context?.company;

            return (
              <button
                key={h.id}
                type="button"
                onClick={() => onSelectCustomer(h)}
                className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm ring-2 ring-indigo-300"
                    : "bg-white border-slate-200 text-slate-800 hover:bg-indigo-50/50 hover:border-indigo-200 hover:shadow-2xs"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-extrabold text-xs transition-colors ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700"
                    }`}
                  >
                    {custName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4
                      className={`text-xs font-bold truncate ${
                        isSelected ? "text-white" : "text-slate-900 group-hover:text-indigo-950"
                      }`}
                    >
                      {custName}
                    </h4>
                    <p
                      className={`text-[11px] font-mono mt-0.5 truncate ${
                        isSelected ? "text-indigo-100" : "text-slate-500"
                      }`}
                    >
                      {custPhone}
                    </p>
                    {custCompany && (
                      <p
                        className={`text-[10px] truncate mt-0.5 ${
                          isSelected ? "text-indigo-200" : "text-slate-400"
                        }`}
                      >
                        {custCompany}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {isSelected ? (
                    <span className="w-5 h-5 rounded-full bg-white text-indigo-600 flex items-center justify-center text-[10px] font-black shadow-2xs">
                      ✓
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3.5 py-2 border-t border-slate-100 bg-slate-50 text-[10px] font-medium text-slate-500 flex items-center justify-between">
        <span>Showing {filtered.length} of {assignments.length}</span>
        {selectedAssignment && (
          <span className="font-bold text-indigo-600">Selected</span>
        )}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { RecycleLead } from "@/lib/services/lead-recycle.service";
import { Phone, User, Clock, CheckSquare, Square } from "lucide-react";

interface LeadTableProps {
  leads: RecycleLead[];
  reason: string;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
}

export default function LeadTable({
  leads,
  reason,
  selectedIds,
  onToggle,
  onToggleAll,
}: LeadTableProps) {
  const checkboxRef = React.useRef<HTMLInputElement>(null);
  const allSelected = leads.length > 0 && selectedIds.size === leads.length;
  const isIndeterminate = leads.length > 0 && selectedIds.size > 0 && selectedIds.size < leads.length;

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-200 select-none">
            <tr>
              <th className="p-3.5 w-12 text-center">
                <input
                  ref={checkboxRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                  title={allSelected ? "Deselect All" : "Select All"}
                />
              </th>
              <th className="p-3.5">Customer / Lead</th>
              <th className="p-3.5">Contact</th>
              <th className="p-3.5">Previous Agent</th>
              <th className="p-3.5">Attempts</th>
              <th className="p-3.5">Last Call</th>
              <th className="p-3.5">Disposition</th>
              <th className="p-3.5">Eligibility</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {leads.map((lead) => {
              const isSelected = selectedIds.has(lead.id);
              const isEligible = lead.eligibility ? lead.eligibility === "Eligible" : lead.qualification_status !== "QUALIFIED";
              return (
                <tr
                  key={lead.id}
                  onClick={() => onToggle(lead.id)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    isSelected ? "bg-indigo-50/40" : ""
                  }`}
                >
                  <td
                    className="p-3.5 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(lead.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {lead.initials}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900">{lead.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{lead.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{lead.phone}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{lead.agent}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                      {lead.attempts}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{lead.lastCall}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px] uppercase">
                      {lead.disposition || reason || "Call Back"}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full border font-extrabold text-[10px] uppercase tracking-wider ${
                        isEligible
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {isEligible ? "Eligible" : "Not Eligible"}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-extrabold text-[10px] uppercase tracking-wider">
                      {lead.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

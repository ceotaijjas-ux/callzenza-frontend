"use client";

import React, { useEffect, useState } from "react";
import { 
  User, Phone, Mail, Building2, MapPin, FileText, 
  Clock, ShieldCheck, CheckCircle2, XCircle, ArrowRight, 
  RotateCcw, Play, Pause, AlertCircle, Sparkles, Send,
  ChevronRight, Calendar, UserCheck, PhoneCall, PhoneForwarded, X
} from "lucide-react";
import { 
  leadAssignmentService, 
  LeadAssignmentHistoryResponse, 
  LeadAssignmentRecord 
} from "@/lib/services/lead-assignment.service";

interface AssignmentHistoryDetailViewProps {
  selectedAssignment: LeadAssignmentRecord | null;
  selectedLeadId?: string;
  onPlayRecording?: (id: string | number, url?: string) => void;
  playingRecordingId?: string | number | null;
  onClose?: () => void;
}

export function AssignmentHistoryDetailView({
  selectedAssignment,
  selectedLeadId,
  onPlayRecording,
  playingRecordingId,
  onClose
}: AssignmentHistoryDetailViewProps) {
  const [historyData, setHistoryData] = useState<LeadAssignmentHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const effectiveLeadId = selectedAssignment?.lead_id || selectedLeadId;

  useEffect(() => {
    if (!effectiveLeadId) {
      setHistoryData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    leadAssignmentService
      .getLeadAssignmentHistory(effectiveLeadId)
      .then((data) => {
        if (isMounted) {
          setHistoryData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching assignment history details:", err);
        if (isMounted) {
          // Fallback construction from selectedAssignment if endpoint error
          if (selectedAssignment) {
            const ctx = selectedAssignment.context || {};
            const custName = ctx.lead_name || ctx.name || `${ctx.first_name || ""} ${ctx.last_name || ""}`.trim() || "Customer";
            setHistoryData({
              customer: {
                lead_id: selectedAssignment.lead_id,
                name: custName,
                first_name: ctx.first_name || custName.split(" ")[0],
                last_name: ctx.last_name || custName.split(" ").slice(1).join(" "),
                phone: ctx.phone || "—",
                email: ctx.email || "—",
                company: ctx.company || "—",
                city: ctx.location || ctx.city || "—",
                requirement: ctx.requirement || "Interested in campaign offering",
                status: ctx.lead_status || selectedAssignment.status || "COMPLETED",
                qualification_status: ctx.qualification_status || selectedAssignment.qualification_stage || "UNQUALIFIED",
                created_at: selectedAssignment.assigned_at
              },
              assignment: {
                current_agent: selectedAssignment.expert_name || "Voice Agent",
                assigned_by: selectedAssignment.previous_expert_name || (selectedAssignment.ai_agent_name ? "AI Agent" : "Admin"),
                assignment_source: selectedAssignment.trigger_source === "SPECIFIC_AGENT_REQUEST" ? "Agent Transfer" : selectedAssignment.ai_agent_name ? "AI Agent Assignment" : "Admin Assignment",
                previous_agent: selectedAssignment.previous_expert_name,
                assigned_on: selectedAssignment.assigned_at,
                transfer_reason: selectedAssignment.notes,
                status: selectedAssignment.status,
                qualification_status: selectedAssignment.qualification_stage || "UNQUALIFIED"
              },
              call_summary: {
                total_calls: 1,
                last_call_at: selectedAssignment.assigned_at,
                last_call_status: selectedAssignment.status,
                qualification: selectedAssignment.qualification_stage || "UNQUALIFIED",
                call_duration: 0,
                formatted_duration: "00:00"
              },
              timeline: [
                {
                  id: "fallback-1",
                  timestamp: selectedAssignment.assigned_at,
                  title: `Assigned to ${selectedAssignment.expert_name || "Agent"}`,
                  type: "ASSIGNMENT",
                  actor: selectedAssignment.previous_expert_name || "Admin",
                  assigned_to: selectedAssignment.expert_name || "Agent",
                  assigned_by: selectedAssignment.previous_expert_name || "Admin",
                  source: "Admin Assignment",
                  status: "READY",
                  description: "Lead assignment record created."
                }
              ]
            });
          }
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveLeadId, selectedAssignment]);

  if (!effectiveLeadId && !selectedAssignment) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-xs flex flex-col items-center justify-center min-h-[350px]">
        <Clock className="w-10 h-10 text-slate-300 mb-3 animate-pulse" />
        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">No Customer Selected</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Select any customer chip from the Assignment History list above to view their complete assignment details, assignment source, and historical timeline.
        </p>
      </div>
    );
  }

  if (loading && !historyData) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-xs flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Loading Assignment History...</p>
      </div>
    );
  }

  if (!historyData) return null;

  const { customer, assignment, call_summary, timeline } = historyData;

  const isQualified = (customer.qualification_status || assignment.qualification_status || "").toUpperCase() === "QUALIFIED";
  const isUnqualified = (customer.qualification_status || assignment.qualification_status || "").toUpperCase() === "UNQUALIFIED";

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      {/* HEADER BANNER */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase tracking-wider">
              Assignment Record
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {customer.name}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
            <span>Lead ID: <span className="font-mono font-semibold text-slate-700">{customer.lead_id.slice(0, 8)}...</span></span>
            {customer.created_at && (
              <span>Created: <span className="font-medium text-slate-700">{new Date(customer.created_at).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span></span>
            )}
          </p>
        </div>

        {/* STATUS & QUALIFICATION BADGES + CLOSE BUTTON */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Current Status</span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider ${
              customer.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
              customer.status === "CALLING" || customer.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800 border border-blue-200 animate-pulse" :
              customer.status === "TRANSFERRED" || customer.status === "REASSIGNED" ? "bg-purple-100 text-purple-800 border border-purple-200" :
              "bg-slate-100 text-slate-800 border border-slate-200"
            }`}>
              {customer.status}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Qualification</span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
              isQualified ? "bg-emerald-600 text-white shadow-xs" :
              isUnqualified ? "bg-rose-50 text-rose-700 border border-rose-200" :
              "bg-amber-50 text-amber-800 border border-amber-200"
            }`}>
              {isQualified ? <CheckCircle2 className="w-3.5 h-3.5" /> : isUnqualified ? <XCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {customer.qualification_status || "PENDING"}
            </span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              title="Close details"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2-COLUMN GRID: CUSTOMER DETAILS + ASSIGNMENT INFO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* CARD 1: CUSTOMER INFORMATION */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" /> Customer Information
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Verified Profile</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Full Name</label>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">{customer.name}</span>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Phone Number</label>
                <span className="font-mono font-bold text-indigo-700 text-sm block mt-0.5">{customer.phone}</span>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Email Address</label>
                <span className="font-semibold text-slate-800 text-xs block mt-0.5 truncate">{customer.email}</span>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Company</label>
                <span className="font-semibold text-slate-800 text-xs block mt-0.5 truncate">{customer.company}</span>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100 col-span-2">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">City / Location</label>
                <span className="font-semibold text-slate-800 text-xs block mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {customer.city}
                </span>
              </div>
            </div>

            <div className="mt-3.5 bg-indigo-50/40 p-3 rounded-lg border border-indigo-100/60">
              <label className="block text-[9px] font-extrabold text-indigo-900 uppercase tracking-wider">Requirement / Interest</label>
              <p className="text-xs font-semibold text-indigo-950 mt-1 leading-relaxed">
                {customer.requirement}
              </p>
            </div>
          </div>
        </div>

        {/* CARD 2: WHO ASSIGNED & ASSIGNMENT DETAILS */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" /> Assignment Details & Origin
              </h3>
              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded font-black text-[9px] uppercase">
                {assignment.assignment_source}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Assigned To</label>
                <span className="font-bold text-slate-900 text-sm block mt-0.5 flex items-center gap-1">
                  {assignment.current_agent}
                </span>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Assigned By</label>
                <span className="font-bold text-indigo-900 text-sm block mt-0.5 flex items-center gap-1">
                  {assignment.assigned_by}
                </span>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Assignment Source</label>
                <span className="font-semibold text-slate-800 text-xs block mt-0.5">
                  {assignment.assignment_source}
                </span>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Assignment Date</label>
                <span className="font-mono font-semibold text-slate-800 text-xs block mt-0.5">
                  {assignment.assigned_on ? new Date(assignment.assigned_on).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                </span>
              </div>

              {assignment.previous_agent && (
                <div className="bg-purple-50/60 p-3 rounded-lg border border-purple-100 col-span-2">
                  <label className="block text-[9px] font-extrabold text-purple-900 uppercase tracking-wider">Previous Agent (Transferred From)</label>
                  <span className="font-bold text-purple-950 text-xs block mt-0.5">
                    {assignment.previous_agent}
                  </span>
                </div>
              )}
            </div>

            {assignment.transfer_reason && (
              <div className="mt-3.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Transfer / Assignment Notes</label>
                <p className="text-xs text-slate-700 mt-1 font-medium italic">
                  "{assignment.transfer_reason}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CALL SUMMARY & RECORDING PLAYBACK */}
      {call_summary && (
        <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Calls Handled</span>
              <span className="text-lg font-black text-white">{call_summary.total_calls}</span>
            </div>

            <div className="h-8 w-px bg-slate-800"></div>

            <div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Last Call Time</span>
              <span className="text-xs font-mono font-bold text-indigo-300">
                {call_summary.last_call_at ? new Date(call_summary.last_call_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-800"></div>

            <div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Call Duration</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{call_summary.formatted_duration}</span>
            </div>

            <div className="h-8 w-px bg-slate-800"></div>

            <div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Final Call Status</span>
              <span className="text-xs font-bold uppercase text-slate-200">{call_summary.last_call_status}</span>
            </div>
          </div>

          {call_summary.recording_url && onPlayRecording && (
            <button
              onClick={() => onPlayRecording(customer.lead_id, call_summary.recording_url || undefined)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {playingRecordingId === customer.lead_id ? (
                <>
                  <Pause className="w-3.5 h-3.5 animate-pulse" /> Pause Recording
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Play Recording
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* SECTION 3: ASSIGNMENT TIMELINE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" /> Assignment History Timeline
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            {timeline.length} Recorded Milestone{timeline.length === 1 ? "" : "s"}
          </span>
        </div>

        {timeline.length === 0 ? (
          <div className="py-8 text-center text-slate-400 italic text-xs">
            No historical timeline events recorded for this customer.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100">
            {timeline.map((evt, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === timeline.length - 1;
              const formattedTime = evt.timestamp 
                ? new Date(evt.timestamp).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) 
                : "Timestamp N/A";

              let dotColor = "bg-indigo-600 ring-indigo-100";
              let badgeBg = "bg-slate-100 text-slate-700";

              if (evt.type === "CALL_COMPLETED") {
                dotColor = "bg-emerald-600 ring-emerald-100";
                badgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
              } else if (evt.type === "CALL_STARTED") {
                dotColor = "bg-blue-600 ring-blue-100";
                badgeBg = "bg-blue-50 text-blue-800 border-blue-200";
              } else if (evt.type === "TRANSFER") {
                dotColor = "bg-purple-600 ring-purple-100";
                badgeBg = "bg-purple-50 text-purple-800 border-purple-200";
              }

              return (
                <div key={evt.id || idx} className="relative group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full ${dotColor} ring-4 ring-offset-1 ring-offset-white shadow-xs`}></div>

                  {/* Event Card */}
                  <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-lg p-3.5 transition-all shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                          {evt.title}
                        </span>
                        {evt.status && (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${badgeBg}`}>
                            {evt.status}
                          </span>
                        )}
                        {evt.qualification && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {evt.qualification}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formattedTime}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      {evt.description}
                    </p>

                    {(evt.assigned_by || evt.source || evt.actor) && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-4 text-[10px] text-slate-500 font-semibold">
                        {evt.assigned_by && (
                          <span>Assigned By: <strong className="text-slate-800">{evt.assigned_by}</strong></span>
                        )}
                        {evt.assigned_to && (
                          <span>Assigned To: <strong className="text-slate-800">{evt.assigned_to}</strong></span>
                        )}
                        {evt.source && (
                          <span>Source: <strong className="text-indigo-700">{evt.source}</strong></span>
                        )}
                        {evt.duration && (
                          <span>Duration: <strong className="font-mono text-emerald-700">{evt.duration}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { leadService, Lead } from "@/lib/services/lead.service";
import { conversationService, Conversation, ConversationMessage } from "@/lib/services/conversation.service";
import { callService, Call } from "@/lib/services/call.service";

import { FileSpreadsheet, ArrowLeft } from "lucide-react";

export default function LeadDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [fromSource, setFromSource] = useState<string>("");
  const [lead, setLead] = useState<Lead | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [calls, setCalls] = useState<Call[]>([]);
  const [calling, setCalling] = useState(false);

  const loadLead = useCallback(() => leadService.get(id).then(setLead), [id]);

  const ensureConversation = useCallback(async () => {
    const existing = await conversationService.listForLead(id);
    if (existing.length > 0) {
      setConversation(existing[0]);
      setMessages(await conversationService.messages(existing[0].id));
    } else {
      const created = await conversationService.create({ lead_id: id, channel: "LIVE_CHAT" });
      setConversation(created);
      setMessages([]);
    }
  }, [id]);

  useEffect(() => {
    loadLead();
    ensureConversation();
    callService.listForLead(id).then(setCalls);
  }, [loadLead, ensureConversation, id]);

  const placeCall = async () => {
    setCalling(true);
    try {
      await callService.trigger(id);
      setCalls(await callService.listForLead(id));
      loadLead();
    } finally {
      setCalling(false);
    }
  };

  const send = async () => {
    if (!conversation || !draft.trim()) return;
    setSending(true);
    try {
      const result = await conversationService.sendMessage(conversation.id, draft);
      setDraft("");
      setMessages(await conversationService.messages(conversation.id));
      loadLead();
      if (result.handoff_triggered) {
        alert("Lead qualified — handed off to a human expert.");
      }
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const fromParam = urlParams.get("from");
      if (fromParam) {
        setFromSource(fromParam);
      } else if (document.referrer.includes("hopper")) {
        setFromSource("hopper");
      } else if (document.referrer.includes("recycle")) {
        setFromSource("recycle");
      }
    }
  }, []);

  const isFromHopper = fromSource === "hopper";
  const backLabel = isFromHopper
    ? "Back to Lead Hopper"
    : fromSource === "recycle"
    ? "Back to Recycle Lists"
    : "Back to Leads";

  const fallbackUrl = isFromHopper
    ? "/leads/hopper"
    : fromSource === "recycle"
    ? "/leads/recycle"
    : "/leads";

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  if (!lead) return <AppShell><p className="text-gray-400">Loading…</p></AppShell>;

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>{backLabel}</span>
          </button>

          {isFromHopper ? (
            <Link
              href="/leads"
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              All Leads →
            </Link>
          ) : (
            <Link
              href="/leads/hopper"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Lead Hopper →
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-white border border-gray-200 rounded-xl p-5 h-fit">
          <h2 className="font-semibold text-lg">{lead.first_name} {lead.last_name}</h2>
          <p className="text-sm text-gray-500">{lead.company}</p>
          <div className="flex gap-2 mt-3">
            <Badge>{lead.status}</Badge>
            <Badge>{lead.qualification_status}</Badge>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Score</dt><dd className="font-medium">{lead.score}/100</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd>{lead.email || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd>{lead.phone || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Budget</dt><dd>{lead.budget || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Timeline</dt><dd>{lead.timeline || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Source</dt><dd>{lead.source}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500 font-medium text-indigo-600">Assigned Agent</dt><dd className="font-bold text-indigo-700">{lead.assigned_expert_id ? "Assigned Voice Agent" : "Unassigned / Queue"}</dd></div>
          </dl>
          {lead.ai_summary && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-1">AI Summary & Transcript Context</p>
              <pre className="text-xs whitespace-pre-wrap bg-gray-50 rounded-md p-3 font-mono">{lead.ai_summary}</pre>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Uploaded Lead File</p>
            {lead.uploaded_file_name ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="font-bold text-gray-900 truncate">{lead.uploaded_file_name}</span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={lead.uploaded_file_path || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    View File
                  </a>
                  <a
                    href={lead.uploaded_file_path || "#"}
                    download={lead.uploaded_file_name}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    Download File
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No lead file uploaded.</p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">Calls</p>
              <Button variant="outline" onClick={placeCall} disabled={calling || !lead.phone}>
                {calling ? "Calling..." : "Call Now"}
              </Button>
            </div>
            {!lead.phone && <p className="text-xs text-gray-400">Add a phone number to enable calling.</p>}
            <div className="space-y-2">
              {calls.map((call, idx) => (
                <div key={`${call.id || 'call'}-${idx}`} className="border border-gray-100 rounded-md p-2 text-xs bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{call.direction} · {call.to_number || call.from_number}</span>
                    <Badge>{call.status}</Badge>
                  </div>
                  <p className="text-gray-500 mt-1 font-medium">{Math.floor((call.duration_seconds || 0) / 60)}m {(call.duration_seconds || 0) % 60}s · {call.turn_count} turns</p>
                  {call.transcript && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-primary">Transcript</summary>
                      <pre className="whitespace-pre-wrap mt-1">{call.transcript}</pre>
                    </details>
                  )}
                  {call.recording_url && (
                    <a href={call.recording_url} target="_blank" rel="noreferrer" className="text-primary block mt-1">
                      Recording
                    </a>
                  )}
                </div>
              ))}
              {calls.length === 0 && <p className="text-gray-400 text-xs">No calls yet.</p>}
            </div>
          </div>
        </div>

        <div className="col-span-2 bg-white border border-gray-200 rounded-xl flex flex-col h-[70vh]">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <p className="font-medium text-sm">Conversation</p>
            {conversation && <Badge>{conversation.status}</Badge>}
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender_type === "LEAD" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    m.sender_type === "LEAD"
                      ? "bg-primary text-white"
                      : m.sender_type === "SYSTEM"
                      ? "bg-amber-50 text-amber-800 italic"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">{m.sender_type}</p>
                  {m.content}
                </div>
              </div>
            ))}
            {messages.length === 0 && <p className="text-gray-400 text-sm">No messages yet — say hello as the lead.</p>}
          </div>
          <div className="p-4 border-t border-gray-200 flex gap-2">
            <Input
              placeholder="Type as the lead..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={conversation?.status !== "ACTIVE"}
            />
            <Button onClick={send} disabled={sending || conversation?.status !== "ACTIVE"}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

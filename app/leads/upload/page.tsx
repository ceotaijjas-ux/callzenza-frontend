"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { agentService, Agent } from "@/lib/services/agent.service";
import { leadService } from "@/lib/services/lead.service";
import { useAuthStore } from "@/lib/store";
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  X,
  Search,
  Bot,
  Phone,
  Sparkles,
  Loader2,
  AlertTriangle,
  Play,
  User,
} from "lucide-react";

interface ImportedLead {
  id: string;
  first_name: string;
  last_name: string;
  location: string;
  company?: string;
  email?: string;
  requirement?: string;
  status: string;
}

export default function LeadsUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  
  // Preview and Queue state
  const [importedLeads, setImportedLeads] = useState<ImportedLead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  // Local browser voice queue state
  const [callQueue, setCallQueue] = useState<string[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);
  const [activeVoiceLead, setActiveVoiceLead] = useState<ImportedLead | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [voiceTranscript, setVoiceTranscript] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [voiceSessionId, setVoiceSessionId] = useState<string | undefined>(undefined);

  const activeSessionRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const voiceSessionIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    agentService.list().then((res) => {
      setAgents(res);
      if (res.length > 0) {
        setSelectedAgentId(res[0].id);
      }
    });
  }, []);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    const token = useAuthStore.getState().token;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("auto_call", "false"); // Ignore PSTN auto-dialing

    try {
      const data = await leadService.importFile(file, { autoCall: false });
      setSummary(data);

      // Fetch newly created leads to display in preview table
      const allLeads = await leadService.list();
      const sessionLeads = (allLeads || []).map((l: any) => ({
        id: l.id,
        first_name: l.first_name || "Unnamed",
        last_name: l.last_name || "",
        location: l.location || "Unknown",
        company: l.company || "",
        email: l.email || "",
        requirement: l.requirement || "",
        status: l.status || "Ready",
      }));
      setImportedLeads(sessionLeads);
      setSelectedLeadIds(new Set(sessionLeads.map((l: any) => l.id)));
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // Checkbox handlers
  const handleSelectLead = (id: string) => {
    const next = new Set(selectedLeadIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedLeadIds(next);
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  // Filter preview list
  const filteredLeads = importedLeads.filter((l) => {
    const query = searchQuery.toLowerCase();
    return (
      l.first_name.toLowerCase().includes(query) ||
      l.last_name.toLowerCase().includes(query) ||
      l.location.toLowerCase().includes(query)
    );
  });

  // Browser Voice Synthesis + Recognition Engine
  const playVoiceResponse = (text: string, onEndCallback: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    setVoiceStatus("speaking");
    const utterance = new SpeechSynthesisUtterance(text);

    const isTamilUnicode = /[\u0B80-\u0BFF]/.test(text);
    const isTanglish = /\b(irukken|irukan|solla|panradhu|pandrathu|aagum|unga|ungaloda|dhaan|nalla|vanakkam|pathi|pesalaam|thavavai|saaptinagala|machan|keetturuka|therinjukanum|mudiyadhu|epdi|eppadi|yeppadi|paarkka|kudukkang|pesa|sariyaana|ennodu|namaskaram)\b/i.test(text);
    const isHindiUnicode = /[\u0900-\u097F]/.test(text);
    const isHinglish = /\b(kaise|kya|nahi|karna|kar|raha|hai|samjh|bataya|apka|aapse|hoga|batao|apne|namaste)\b/i.test(text);

    // Dynamic language routing
    if (isTamilUnicode || isTanglish) {
      utterance.lang = "ta-IN";
    } else if (isHindiUnicode || isHinglish) {
      utterance.lang = "hi-IN";
    } else if (/[\u0C00-\u0C7F]/.test(text)) {
      utterance.lang = "te-IN";
    } else if (/[\u0D00-\u0D7F]/.test(text)) {
      utterance.lang = "ml-IN";
    } else {
      utterance.lang = "en-IN";
    }

    utterance.onend = () => {
      if (activeSessionRef.current) {
        setTimeout(onEndCallback, 400);
      }
    };
    utterance.onerror = (e) => {
      if (e.error !== "interrupted" && activeSessionRef.current) {
        setTimeout(onEndCallback, 1000);
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  const initiateListening = () => {
    if (!activeSessionRef.current) return;

    if (typeof window !== "undefined" && window.speechSynthesis.speaking) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;

    // Detect language code from last AI transcript block
    const lastAiMsg = voiceTranscript.findLast(m => m.sender === "ai");
    let langCode = "ta-IN";
    if (lastAiMsg) {
      const text = lastAiMsg.text;
      const isTam = /[\u0B80-\u0BFF]/.test(text) || /\b(irukken|irukan|solla|panradhu|pandrathu|aagum|unga|ungaloda|dhaan|nalla|vanakkam|pathi|pesalaam|thavavai|saaptinagala|machan|keetturuka|therinjukanum|mudiyadhu|epdi|eppadi|yeppadi)\b/i.test(text);
      const isHin = /[\u0900-\u097F]/.test(text) || /\b(kaise|kya|nahi|karna|kar|raha|hai|samjh|bataya|apka|aapse|hoga|batao|apne|namaste)\b/i.test(text);
      if (isTam) langCode = "ta-IN";
      else if (isHin) langCode = "hi-IN";
    }
    recognition.lang = langCode;

    recognition.onstart = () => {
      if (activeSessionRef.current) {
        setVoiceStatus("listening");
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        console.warn("Speech recognition error:", event.error);
      }
      setTimeout(() => {
        if (activeSessionRef.current) {
          initiateListening();
        }
      }, 600);
    };

    recognition.onend = () => {
      if (!activeSessionRef.current) return;
      setTimeout(() => {
        if (activeSessionRef.current && typeof window !== "undefined" && !window.speechSynthesis.speaking) {
          initiateListening();
        }
      }, 500);
    };

    recognition.onresult = async (event: any) => {
      if (!activeSessionRef.current) return;

      const result = event.results[0];
      if (!result.isFinal) return;

      const text = result[0].transcript;
      if (!text.trim()) return;

      setVoiceTranscript((prev) => [...prev, { sender: "user", text }]);
      setVoiceStatus("thinking");

      try {
        const agentId = selectedAgentId || (agents[0]?.id);
        const IS_BROWSER = typeof window !== "undefined";
        const baseUrl = IS_BROWSER ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000");
        const res = await fetch(`${baseUrl}/api/knowledge-agents/${agentId}/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: text,
            session_id: voiceSessionIdRef.current,
            lead_id: activeVoiceLead?.id,
          }),
        });
        const data = await res.json();
        if (!activeSessionRef.current) return;

        if (data.session_id) {
          setVoiceSessionId(data.session_id);
          voiceSessionIdRef.current = data.session_id;
        }

        const reply = data.answer;
        if (!reply || reply.trim() === "" || reply === "[DEBOUNCED]") {
          setVoiceStatus("listening");
          return;
        }

        setVoiceTranscript((prev) => [...prev, { sender: "ai", text: reply }]);
        playVoiceResponse(reply, () => {
          if (activeSessionRef.current) {
            initiateListening();
          }
        });
      } catch (err) {
        console.warn("Error calling agent:", err);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.warn("Error starting recognition:", e);
    }
  };

  // Launch browser voice session
  const startQueueVoiceSession = async (leadId: string) => {
    const lead = importedLeads.find((l) => l.id === leadId);
    if (!lead) return;

    activeSessionRef.current = true;
    setActiveVoiceLead(lead);
    setVoiceStatus("thinking");
    setVoiceTranscript([{ sender: "ai", text: "Connecting browser voice session..." }]);
    setVoiceSessionId(undefined);
    voiceSessionIdRef.current = undefined;

    // Update status to Calling
    updateLeadStatus(leadId, "Calling");

    let introText = `Hello ${lead.first_name} ${lead.last_name}, I understand you are from ${lead.location}...`;

    try {
      const agentId = selectedAgentId || (agents[0]?.id);
      const IS_BROWSER = typeof window !== "undefined";
      const baseUrl = IS_BROWSER ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000");
      const res = await fetch(`${baseUrl}/api/knowledge-agents/${agentId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "hello / greeting / script start",
          lead_id: leadId,
        }),
      });
      const data = await res.json();
      if (data.answer && data.answer.trim() !== "") {
        introText = data.answer;
        if (data.session_id) {
          setVoiceSessionId(data.session_id);
          voiceSessionIdRef.current = data.session_id;
        }
      }
    } catch (err) {
      console.warn("Greeting fetch failed, using fallback:", err);
    }

    if (!activeSessionRef.current) return;

    // Update status to In Conversation
    updateLeadStatus(leadId, "In Conversation");
    setVoiceTranscript([{ sender: "ai", text: introText }]);

    playVoiceResponse(introText, () => {
      if (activeSessionRef.current) {
        initiateListening();
      }
    });
  };

  const stopVoiceSession = (finalStatus: "Completed" | "Session Ended" = "Completed") => {
    activeSessionRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (activeVoiceLead) {
      updateLeadStatus(activeVoiceLead.id, finalStatus);
    }

    setActiveVoiceLead(null);
    setVoiceStatus("idle");
  };

  // Queue workflow trigger
  const handleStartVoiceSessionQueue = () => {
    const selectedList = Array.from(selectedLeadIds);
    if (selectedList.length === 0) {
      alert("Please select at least one lead to start the voice queue.");
      return;
    }
    setCallQueue(selectedList);
    setCurrentQueueIndex(0);
    startQueueVoiceSession(selectedList[0]);
  };

  const handleNextInQueue = () => {
    const nextIndex = currentQueueIndex + 1;
    if (nextIndex < callQueue.length) {
      stopVoiceSession("Completed");
      setCurrentQueueIndex(nextIndex);
      startQueueVoiceSession(callQueue[nextIndex]);
    } else {
      stopVoiceSession("Completed");
      alert("Voice session campaign queue completed!");
      setCurrentQueueIndex(-1);
      setCallQueue([]);
    }
  };

  const handleSkipOrCancelSession = () => {
    stopVoiceSession("Session Ended");
    const nextIndex = currentQueueIndex + 1;
    if (nextIndex < callQueue.length) {
      setCurrentQueueIndex(nextIndex);
      startQueueVoiceSession(callQueue[nextIndex]);
    } else {
      setCurrentQueueIndex(-1);
      setCallQueue([]);
    }
  };

  const updateLeadStatus = (leadId: string, status: string) => {
    setImportedLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    );
  };

  return (
    <AppShell>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Import Leads</h1>
          <p className="text-sm text-gray-500">Upload customer Excel sheets and launch local WebRTC voice sessions</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 mb-6 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!summary ? (
        <Card className="max-w-2xl p-6">
          <form onSubmit={handleUpload} className="space-y-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer transition ${
                isDragOver ? "border-indigo-600 bg-indigo-50/50" : "border-gray-200 hover:border-indigo-500"
              }`}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="w-full text-center flex flex-col items-center gap-3 cursor-pointer">
                <Upload className="h-10 w-10 text-indigo-400" />
                <span className="text-sm font-semibold">
                  {file ? file.name : "Drag & drop your Excel file here or click to browse"}
                </span>
                <span className="text-xs text-gray-400">Supports .xlsx, .xls, and .csv formats</span>
              </label>
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 p-3 rounded-md">
                <FileText className="h-4 w-4" />
                <span>Column headers (First Name, Last Name, Place/Location) will auto-align. Phone columns are ignored.</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={!file || loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                {loading ? "Processing..." : "Process Upload"}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Validation Feedback Alert & Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
              <p className="text-xs text-gray-500 font-semibold uppercase">Total Rows</p>
              <p className="text-xl font-bold text-slate-800">{summary.total_rows ?? 0}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
              <p className="text-xs text-emerald-700 font-semibold uppercase">Successfully Imported</p>
              <p className="text-xl font-bold text-emerald-800">{summary.successfully_imported ?? summary.leads_created ?? 0}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
              <p className="text-xs text-amber-700 font-semibold uppercase">Duplicate Rows</p>
              <p className="text-xl font-bold text-amber-800">{summary.duplicate_rows ?? 0}</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl">
              <p className="text-xs text-rose-700 font-semibold uppercase">Invalid Rows</p>
              <p className="text-xl font-bold text-rose-800">{summary.invalid_rows ?? 0}</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl col-span-2 sm:col-span-1">
              <p className="text-xs text-indigo-700 font-semibold uppercase">Final Lead Count</p>
              <p className="text-xl font-bold text-indigo-800">{summary.final_lead_count ?? summary.leads_created ?? 0}</p>
            </div>
          </div>

          {/* Validation Skip logs */}
          {summary.errors && summary.errors.length > 0 && (
            <Card className="p-4 border-amber-200 bg-amber-50/10">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Skipped Rows Details:</h3>
              <div className="max-h-32 overflow-y-auto text-xs text-amber-800 space-y-1">
                {summary.errors.map((err: string, i: number) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            </Card>
          )}

          {/* Preview grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 max-w-sm flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search imported leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Agent Selection & Run Voice Campaign Button */}
              <div className="flex items-center gap-3">
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="p-2 border rounded-lg text-sm bg-white"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      Agent: {a.name}
                    </option>
                  ))}
                </select>

                <Button
                  onClick={handleStartVoiceSessionQueue}
                  disabled={selectedLeadIds.size === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2 shadow-sm"
                >
                  <Play className="h-4 w-4 fill-white" /> Start Voice Session ({selectedLeadIds.size})
                </Button>
              </div>
            </div>

            {/* Imported Leads Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/75 border-b border-gray-150 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={filteredLeads.length > 0 && selectedLeadIds.size === filteredLeads.length}
                        onChange={handleSelectAll}
                        className="rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4">First Name</th>
                    <th className="px-6 py-4">Last Name</th>
                    <th className="px-6 py-4">Place / Location</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/30">
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.has(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                          className="rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{lead.first_name}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{lead.last_name}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{lead.location}</td>
                      <td className="px-6 py-4">
                        <Badge className={`border-none font-medium ${
                          lead.status === "Ready" ? "bg-indigo-50 text-indigo-700" :
                          lead.status === "Calling" ? "bg-amber-50 text-amber-700 animate-pulse" :
                          lead.status === "In Conversation" ? "bg-emerald-50 text-emerald-700" :
                          lead.status === "Completed" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                        }`}>
                          {lead.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                        No imported leads matched your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Browser Voice Session Overlay modal */}
      {activeVoiceLead && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl border border-gray-100 overflow-hidden flex flex-col h-[600px] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-2xl">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Active Browser Voice Session</h3>
                  <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                    Lead: {activeVoiceLead.first_name} {activeVoiceLead.last_name} ({activeVoiceLead.location})
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    Queue: {currentQueueIndex + 1} of {callQueue.length} leads
                  </p>
                </div>
              </div>
            </div>

            {/* Status Wave */}
            <div className="p-8 flex flex-col items-center justify-center border-b border-gray-50 shrink-0">
              <div className="relative flex items-center justify-center w-24 h-24 mb-4">
                {voiceStatus === "listening" && (
                  <div className="absolute inset-0 bg-indigo-400/20 rounded-full animate-ping" />
                )}
                {voiceStatus === "speaking" && (
                  <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-pulse" />
                )}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 ${
                  voiceStatus === "listening" ? "bg-indigo-600 scale-110" :
                  voiceStatus === "speaking" ? "bg-emerald-600" :
                  voiceStatus === "thinking" ? "bg-amber-500 animate-bounce" : "bg-gray-400"
                }`}>
                  {voiceStatus === "listening" ? <Phone className="h-6 w-6" /> :
                   voiceStatus === "speaking" ? <Sparkles className="h-6 w-6" /> : <Loader2 className="h-6 w-6 animate-spin" />}
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-gray-800 capitalize">
                  {voiceStatus === "listening" ? "Listening to your voice..." :
                   voiceStatus === "speaking" ? "AI is speaking..." :
                   voiceStatus === "thinking" ? "Processing..." : "Initializing..."}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Speak into your microphone to simulate the customer call flow</p>
              </div>
            </div>

            {/* Dialogue Transcript */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {voiceTranscript.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 items-start ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`p-2 rounded-full border ${msg.sender === "user" ? "bg-indigo-600 border-indigo-700" : "bg-white border-gray-200"}`}>
                    {msg.sender === "user" ? <User className="h-3 w-3 text-white" /> : <Bot className="h-3 w-3 text-gray-600" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-xs max-w-[75%] ${
                    msg.sender === "user" ? "bg-indigo-600 text-white font-medium rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border shadow-sm"
                  }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Queue Control Buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
              <Button onClick={handleSkipOrCancelSession} variant="ghost" className="text-rose-600 hover:bg-rose-50 font-semibold">
                Skip Lead
              </Button>

              <div className="flex gap-2">
                <Button onClick={() => stopVoiceSession("Session Ended")} variant="outline" className="border-gray-300 font-semibold">
                  Stop Campaign
                </Button>
                <Button onClick={handleNextInQueue} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">
                  {currentQueueIndex + 1 < callQueue.length ? "Next Lead" : "Finish"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

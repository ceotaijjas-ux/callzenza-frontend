"use client";

import { useEffect, useState, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store";
import {
  chatbotService,
  ChatMessage,
  ChatConversation,
  RAGAgentItem,
  KnowledgeDocument,
} from "@/lib/services/chatbot.service";
import { MarkdownText } from "@/components/ui/MarkdownText";
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  AlertCircle,
  CornerDownLeft,
  Settings,
  Database,
  Upload,
  FileText,
} from "lucide-react";

export default function ChatbotPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedContextId, setExpandedContextId] = useState<string | null>(null);

  const [chatAgentKey, setChatAgentKey] = useState<number | null>(null);
  const [availableAgents, setAvailableAgents] = useState<RAGAgentItem[]>([]);

  // Admin RAG Training States
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [agents, setAgents] = useState<RAGAgentItem[]>([]);
  const [selectedAgentKey, setSelectedAgentKey] = useState<number | null>(null);
  const [agentDocs, setAgentDocs] = useState<KnowledgeDocument[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Suggested prompt chips for new chat
  const promptSuggestions = [
    "What is the company refund policy?",
    "How does the CallZenza predictive dialer work?",
    "What are the working hours and escalation rules?",
    "Summarize our latest sales objection handling scripts.",
  ];

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    loadAvailableAgents();
    if (isAdmin) {
      loadAgents();
    }
  }, [isAdmin]);

  const loadAvailableAgents = async () => {
    try {
      const list = await chatbotService.listAvailableAgents();
      setAvailableAgents(list);
    } catch (err) {
      console.error("Failed to load available agents:", err);
    }
  };

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const loadAgents = async () => {
    try {
      const list = await chatbotService.listAgents();
      setAgents(list);
    } catch (err) {
      console.error("Failed to load agents:", err);
    }
  };

  const loadAgentLibrary = async (agentKey: number) => {
    setAdminLoading(true);
    try {
      const data = await chatbotService.listAgentLibrary(agentKey);
      setAgentDocs(data.files || []);
    } catch (err) {
      console.error("Failed to load agent library:", err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSelectAgent = (agentKey: number) => {
    setSelectedAgentKey(agentKey);
    loadAgentLibrary(agentKey);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!selectedAgentKey) return;
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAgentKey || !e.target.files) return;
    const files = Array.from(e.target.files);
    await uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    if (!selectedAgentKey || files.length === 0) return;
    setUploading(true);
    try {
      await chatbotService.uploadMultipleForAgent(files, selectedAgentKey);
      await loadAgentLibrary(selectedAgentKey);
    } catch (err: any) {
      alert("Failed to upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await chatbotService.deleteDocument(id);
      if (selectedAgentKey) loadAgentLibrary(selectedAgentKey);
    } catch (err) {
      alert("Failed to delete document");
    }
  };

  const handleReprocessDoc = async (id: string) => {
    try {
      await chatbotService.reprocessDocument(id);
      if (selectedAgentKey) loadAgentLibrary(selectedAgentKey);
    } catch (err) {
      alert("Failed to reprocess document");
    }
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      const list = await chatbotService.listConversations();
      setConversations(list);
      if (list.length > 0 && !activeConvId) {
        selectConversation(list[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (id: string) => {
    setActiveConvId(id);
    setError(null);
    try {
      const data = await chatbotService.getConversation(id);
      setMessages(data.messages || []);
    } catch (err: any) {
      setError("Could not load conversation history");
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setError(null);
    setInputMessage("");
    setChatAgentKey(null);
    inputRef.current?.focus();
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await chatbotService.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConvId === id) {
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err: any) {
      setError("Failed to delete conversation");
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || sending) return;

    setError(null);
    setSending(true);
    setInputMessage("");

    // Optimistic UI for user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await chatbotService.sendMessage(text, activeConvId || undefined, chatAgentKey || undefined);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        content: response.message,
        retrieved_context: response.retrieved_context,
        latency_ms: response.latency_ms,
        created_at: response.created_at,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If this was a new conversation, update active ID and conversation list
      if (!activeConvId && response.conversation_id) {
        setActiveConvId(response.conversation_id);
        loadConversations();
      }
    } catch (err: any) {
      setError(err.message || "Failed to get response from CallZenza AI");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50/50">
        {/* Left Sidebar: Conversations */}
        <div className="w-72 md:w-80 bg-white border-r border-slate-200/80 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">CallZenza AI</span>
            </div>

            <Button
              size="sm"
              onClick={handleNewChat}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs h-8 px-3 font-semibold gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </Button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 px-3 py-1.5 block uppercase tracking-wider">
              Recent Chats
            </span>

            {conversations.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs font-medium px-4">
                No past conversations yet.
              </div>
            )}

            {conversations.map((c) => {
              const isActive = activeConvId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`group relative flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all text-xs font-semibold ${
                    isActive
                      ? "bg-indigo-50 text-indigo-900 shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 pr-2">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    <span className="truncate">{c.title || "Conversation"}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteConversation(e, c.id)}
                    title="Delete Conversation"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom user status */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="truncate">{user?.full_name || user?.email || "Agent"}</span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-md uppercase">
              {user?.role || "USER"}
            </span>
          </div>
        </div>

        {/* Right Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            
            {/* Admin RAG Training Section */}
            {isAdmin && (
              <div className="mb-8 border border-indigo-200 rounded-3xl bg-indigo-50/30 overflow-hidden shadow-sm">
                <div 
                  className="bg-indigo-600 px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-indigo-700 transition-colors"
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                >
                  <div className="flex items-center gap-2 text-white">
                    <Database className="w-4 h-4" />
                    <h3 className="text-sm font-bold tracking-tight">Admin RAG Training</h3>
                  </div>
                  {showAdminPanel ? <ChevronUp className="w-4 h-4 text-white/80" /> : <ChevronDown className="w-4 h-4 text-white/80" />}
                </div>

                {showAdminPanel && (
                  <div className="p-5 md:p-6 space-y-6">
                    {/* Agent Selection */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Agent / Workspace:</label>
                      <div className="flex flex-wrap gap-2">
                        {agents.map((ag) => (
                          <button
                            key={ag.agent_key}
                            onClick={() => handleSelectAgent(ag.agent_key)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                              selectedAgentKey === ag.agent_key
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                            }`}
                          >
                            {ag.name}
                          </button>
                        ))}
                        {agents.length === 0 && <span className="text-xs text-slate-400 font-medium">No agents found.</span>}
                      </div>
                    </div>

                    {/* Knowledge Management */}
                    {selectedAgentKey && (
                      <div className="space-y-4 pt-4 border-t border-indigo-100/50">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          Knowledge Management <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px]">Selected: {agents.find(a => a.agent_key === selectedAgentKey)?.name}</span>
                        </label>
                        
                        {/* Upload Zone */}
                        <div
                          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={handleDrop}
                          className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all ${
                            dragOver ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-300"
                          } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          <input 
                            type="file" 
                            multiple 
                            onChange={handleFileSelect} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept=".pdf,.docx,.txt"
                          />
                          <Upload className={`w-6 h-6 mb-2 ${dragOver ? "text-indigo-600" : "text-slate-400"}`} />
                          <span className="text-sm font-bold text-slate-700">Drag & Drop Documents</span>
                          <span className="text-xs text-slate-400 mt-1">or click to browse (PDF, DOCX, TXT)</span>
                          {uploading && <span className="mt-3 text-xs font-bold text-indigo-600 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin"/> Uploading...</span>}
                        </div>

                        {/* Document List */}
                        <div className="space-y-2">
                          {adminLoading ? (
                            <div className="py-4 text-center text-xs text-slate-400 font-medium flex justify-center items-center gap-2"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading documents...</div>
                          ) : agentDocs.length === 0 ? (
                            <div className="py-4 text-center text-xs text-slate-400 font-medium border border-slate-100 bg-white rounded-xl">No documents uploaded for this agent yet.</div>
                          ) : (
                            agentDocs.map(doc => (
                              <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-100 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className={`p-2 rounded-lg ${doc.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : doc.status === 'FAILED' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-slate-700 truncate">{doc.filename}</span>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                      <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                                      <span>•</span>
                                      <span className={doc.status === 'COMPLETED' ? 'text-emerald-600 font-semibold' : doc.status === 'FAILED' ? 'text-red-600 font-semibold' : 'text-amber-600 font-semibold'}>{doc.status}</span>
                                      {doc.chunk_count > 0 && <span>• {doc.chunk_count} chunks</span>}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-4">
                                  <button onClick={() => handleReprocessDoc(doc.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Reprocess">
                                    <RefreshCw className={`w-3.5 h-3.5 ${doc.status === 'PROCESSING' ? 'animate-spin text-amber-500' : ''}`} />
                                  </button>
                                  <button onClick={() => handleDeleteDoc(doc.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {messages.length === 0 && !chatAgentKey && !activeConvId && (
              <div className="max-w-4xl mx-auto py-12 px-4 animate-fadeIn">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Bot className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Select an AI Agent
                  </h2>
                  <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
                    Choose the specialized agent you want to talk to. Each agent is trained on specific departmental knowledge.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {availableAgents.map((agent) => (
                    <button
                      key={agent.agent_key}
                      onClick={() => setChatAgentKey(agent.agent_key)}
                      className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition-all text-left flex flex-col items-start group"
                    >
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl mb-3 group-hover:bg-indigo-50">
                        {agent.archetype_icon || "🤖"}
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">{agent.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{agent.archetype_desc}</p>
                    </button>
                  ))}
                  {availableAgents.length === 0 && (
                    <div className="col-span-full text-center text-slate-400 text-sm py-8">
                      No agents available. Please contact administrator.
                    </div>
                  )}
                </div>
              </div>
            )}

            {messages.length === 0 && (chatAgentKey || activeConvId) && (
              <div className="max-w-2xl mx-auto text-center py-16 space-y-6 animate-fadeIn">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20">
                  <Bot className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    How can CallZenza AI assist you today?
                  </h2>
                  <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                    Ask questions grounded in our verified company knowledge base, sales playbooks, call handling procedures, and policies.
                  </p>
                </div>

                {/* Prompt Suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg mx-auto pt-2">
                  {promptSuggestions.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="p-3 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 rounded-2xl text-left text-xs font-semibold text-slate-700 hover:text-indigo-900 transition-all text-balance"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, idx) => {
              const isUser = m.sender === "user";
              const hasContext = m.retrieved_context && m.retrieved_context.length > 0;
              const isContextExpanded = expandedContextId === m.id;

              return (
                <div
                  key={m.id || idx}
                  className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto justify-end" : "mr-auto justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`space-y-2 max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-xs font-medium leading-relaxed ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-br-xs shadow-sm shadow-indigo-600/20"
                        : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-bl-xs"
                    }`}
                  >
                    <div>
                      <MarkdownText content={m.content} isUser={isUser} />
                    </div>

                    {/* AI Message Footer: Grounding sources & Actions */}
                    {!isUser && (
                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          {hasContext && (
                            <button
                              onClick={() =>
                                setExpandedContextId(isContextExpanded ? null : m.id)
                              }
                              className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>{m.retrieved_context?.length} Grounded Sources</span>
                              {isContextExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          )}
                          {m.latency_ms ? <span>{m.latency_ms} ms</span> : null}
                        </div>

                        <button
                          onClick={() => copyToClipboard(m.content, m.id)}
                          className="hover:text-slate-600 p-1 rounded-md transition-colors"
                          title="Copy Answer"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Expandable Grounded Source Citations */}
                    {!isUser && hasContext && isContextExpanded && (
                      <div className="mt-2 p-3 bg-white border border-indigo-100 rounded-xl space-y-2 text-[11px] text-slate-700 animate-fadeIn">
                        <span className="font-bold text-indigo-700 block">Verified Knowledge Sources:</span>
                        {m.retrieved_context?.map((ctx: any, cIdx: number) => (
                          <div key={cIdx} className="p-2 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                            <div className="flex justify-between font-bold text-slate-600 text-[10px]">
                              <span>{ctx.document_title}</span>
                              <span className="text-indigo-600">{(ctx.score * 100).toFixed(0)}% Match</span>
                            </div>
                            <p className="text-slate-600 text-[10px] italic line-clamp-3">{ctx.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking / Streaming Indicator */}
            {sending && (
              <div className="flex gap-3 mr-auto max-w-3xl items-center animate-fadeIn">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-bl-xs px-4 py-3 text-xs text-slate-500 font-medium flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Searching CallZenza knowledge base and reasoning with Gemini...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-medium flex items-center gap-2 max-w-lg mx-auto">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-slate-200/80 bg-white">
            <div className="max-w-3xl mx-auto relative flex items-end bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <textarea
                ref={inputRef}
                rows={1}
                disabled={!chatAgentKey && !activeConvId}
                placeholder={(!chatAgentKey && !activeConvId) ? "Select an agent to chat..." : "Ask CallZenza AI a question..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-0 resize-none px-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none max-h-32 min-h-[2.5rem] disabled:opacity-50"
              />

              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || sending || (!chatAgentKey && !activeConvId)}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-8 w-8 p-0 shrink-0 shadow-xs disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-[10px] text-slate-400 text-center mt-2 font-medium">
              CallZenza AI is grounded in company-verified knowledge. Shift + Enter for new line.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

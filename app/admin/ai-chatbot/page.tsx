"use client";

import { useEffect, useState, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store";
import {
  chatbotService,
  KnowledgeDocument,
  KnowledgeChunk,
  ChatbotConfig,
  ChatbotAnalytics,
  AdminChatHistoryItem,
  RAGAgentItem,
  RAGMissItem,
  RAGCacheItem,
} from "@/lib/services/chatbot.service";
import { MarkdownText } from "@/components/ui/MarkdownText";
import {
  Bot,
  BrainCircuit,
  FileText,
  Upload,
  Trash2,
  RefreshCw,
  Sliders,
  History,
  BarChart3,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Send,
  Eye,
  Zap,
  Building2,
  UserPlus,
  HelpCircle,
  Download,
  Check,
  X,
  FileCheck,
  Lock,
  Edit2,
  Save,
  Loader2,
} from "lucide-react";

export default function AdminAIChatbotPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Top Section Mode (Department Workspace vs Custom Agent Creator)
  const [topMode, setTopMode] = useState<"departments" | "custom_creator">("departments");

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    "workspace" | "documents" | "chunks" | "config" | "history" | "analytics" | "sandbox"
  >("workspace");

  // Department & Custom Agent State
  const [agents, setAgents] = useState<RAGAgentItem[]>([]);
  const [selectedAgentKey, setSelectedAgentKey] = useState<number>(900001);
  const [deptFiles, setDeptFiles] = useState<any[]>([]);
  const [deptMisses, setDeptMisses] = useState<RAGMissItem[]>([]);
  const [deptCaches, setDeptCaches] = useState<RAGCacheItem[]>([]);
  const [deptUploading, setDeptUploading] = useState(false);
  const [deptDragOver, setDeptDragOver] = useState(false);

  // Custom Agent Creation State
  const [selectedArchetype, setSelectedArchetype] = useState<string>("sales");
  const [customAgentName, setCustomAgentName] = useState<string>("");
  const [customArchetypeTitle, setCustomArchetypeTitle] = useState<string>("");
  const [customArchetypeDesc, setCustomArchetypeDesc] = useState<string>("");
  const [customArchetypeIcon, setCustomArchetypeIcon] = useState<string>("🤖");
  const [customAgentFiles, setCustomAgentFiles] = useState<File[]>([]);
  const [customAgentPrompt, setCustomAgentPrompt] = useState<string>("");
  const [creatingAgent, setCreatingAgent] = useState(false);

  // Global RAG State
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
  const [chunkSearch, setChunkSearch] = useState("");
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editingChunkText, setEditingChunkText] = useState("");
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [analytics, setAnalytics] = useState<ChatbotAnalytics | null>(null);
  const [chatHistory, setChatHistory] = useState<AdminChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [showAddQAModal, setShowAddQAModal] = useState(false);
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaAnswer, setQaAnswer] = useState("");
  const [selectedDocDetails, setSelectedDocDetails] = useState<any | null>(null);
  const [selectedChat, setSelectedChat] = useState<AdminChatHistoryItem | null>(null);

  // Scoped Library Doc Edit State
  const [editingDocItem, setEditingDocItem] = useState<any | null>(null);
  const [editDocTitle, setEditDocTitle] = useState("");
  const [editingDocContentItem, setEditingDocContentItem] = useState<any | null>(null);
  const [editDocFullTitle, setEditDocFullTitle] = useState("");
  const [editDocFullText, setEditDocFullText] = useState("");
  const [loadingDocContent, setLoadingDocContent] = useState(false);

  // Learned Cache CRUD States
  const [viewingCacheItem, setViewingCacheItem] = useState<RAGCacheItem | null>(null);
  const [editingCacheItem, setEditingCacheItem] = useState<RAGCacheItem | null>(null);
  const [editCacheQuestion, setEditCacheQuestion] = useState("");
  const [editCacheAnswer, setEditCacheAnswer] = useState("");

  const [showAddCacheModal, setShowAddCacheModal] = useState(false);
  const [addCacheQuestion, setAddCacheQuestion] = useState("");
  const [addCacheAnswer, setAddCacheAnswer] = useState("");

  // Sandbox State
  const [sandboxQuery, setSandboxQuery] = useState("");
  const [sandboxAgentKey, setSandboxAgentKey] = useState<number | undefined>(undefined);
  const [sandboxConversationId, setSandboxConversationId] = useState<string | undefined>(undefined);
  const [sandboxPdfUrl, setSandboxPdfUrl] = useState<string | null>(null);
  const [sandboxQAHistory, setSandboxQAHistory] = useState<
    Array<{ question: string; answer: string; q_time?: string; a_time?: string }>
  >([]);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const deptFileInputRef = useRef<HTMLInputElement>(null);
  const customFileInputRef = useRef<HTMLInputElement>(null);

  const archetypes = [
    { id: "sales", icon: "💰", title: "SALES CLOSING BOT", desc: "Conversion engine" },
    { id: "support", icon: "🛡️", title: "CUSTOMER SUPPORT AGENT", desc: "Resolution layer" },
    { id: "copilot", icon: "🚀", title: "PRODUCT COPILOT", desc: "Feature navigator" },
    { id: "custom", icon: "✨", title: "CUSTOM ARCHETYPE", desc: "Build from scratch" },
  ];

  // Initial Data Load
  useEffect(() => {
    loadInitialData();
  }, []);

  // When selectedAgentKey changes, load scoped data
  useEffect(() => {
    if (selectedAgentKey) {
      loadScopedAgentData(selectedAgentKey);
    }
  }, [selectedAgentKey]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [agentsList, docsData, configData, analyticsData] = await Promise.all([
        chatbotService.listAgents().catch(() => []),
        chatbotService.listDocuments().catch(() => []),
        chatbotService.getConfig().catch(() => null),
        chatbotService.getAnalytics().catch(() => null),
      ]);
      setAgents(agentsList);
      setDocuments(docsData);
      setConfig(configData);
      setAnalytics(analyticsData);

      if (agentsList.length > 0 && !selectedAgentKey) {
        setSelectedAgentKey(agentsList[0].agent_key);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load knowledge data");
    } finally {
      setLoading(false);
    }
  };

  const loadScopedAgentData = async (agentKey: number) => {
    try {
      const [libraryRes, missesRes, cacheRes] = await Promise.all([
        chatbotService.listAgentLibrary(agentKey).catch(() => ({ files: [] })),
        chatbotService.listRagMisses(agentKey).catch(() => ({ misses: [] })),
        chatbotService.listRagCache(agentKey).catch(() => ({ cache: [] })),
      ]);
      setDeptFiles(libraryRes.files || []);
      setDeptMisses(missesRes.misses || []);
      setDeptCaches(cacheRes.cache || []);
    } catch (err: any) {
      console.error("Failed to load agent scoped data:", err);
    }
  };

  const loadChunks = async (searchQuery?: string) => {
    try {
      const data = await chatbotService.listChunks(searchQuery);
      setChunks(data);
    } catch (err: any) {
      console.error("Failed to load chunks:", err);
    }
  };

  const loadChatHistory = async () => {
    try {
      const data = await chatbotService.getChatHistory();
      setChatHistory(data);
    } catch (err: any) {
      console.error("Failed to load history:", err);
    }
  };

  const handleDeleteChatHistory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    setActionLoading(true);
    setError(null);
    try {
      await chatbotService.deleteConversation(id);
      setSuccess("Conversation deleted successfully.");
      loadChatHistory();
    } catch (err: any) {
      setError(err.message || "Failed to delete conversation");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Delete Handlers
  const handleDeleteAllDeptFiles = async (agentKey: number) => {
    if (!confirm("Are you sure you want to delete ALL documents for this workspace? This cannot be undone.")) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await chatbotService.deleteAllDocuments(agentKey);
      setSuccess(res.message || "All agent workspace documents deleted.");
      loadScopedAgentData(agentKey);
      loadInitialData();
    } catch (err: any) {
      setError(err.message || "Failed to delete agent workspace documents");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAllRagMisses = async (agentKey: number) => {
    if (!confirm("Are you sure you want to clear ALL gap questions for this agent?")) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await chatbotService.deleteAllRagMisses(agentKey);
      setSuccess(res.message || "All gap questions cleared.");
      setDeptMisses([]);
    } catch (err: any) {
      setError(err.message || "Failed to clear gap questions");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAllRagCache = async (agentKey: number) => {
    if (!confirm("Are you sure you want to clear ALL learned QA cache entries for this agent?")) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await chatbotService.deleteAllRagCache(agentKey);
      setSuccess(res.message || "All QA cache entries cleared.");
      setDeptCaches([]);
    } catch (err: any) {
      setError(err.message || "Failed to clear QA cache");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAllDocuments = async () => {
    if (!confirm("Are you sure you want to delete ALL master knowledge documents and all their vector chunks? This cannot be undone.")) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await chatbotService.deleteAllDocuments();
      setSuccess(res.message || "All master documents deleted.");
      setDocuments([]);
      if (activeTab === "chunks") loadChunks();
    } catch (err: any) {
      setError(err.message || "Failed to delete master documents");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAllChunks = async () => {
    if (!confirm("Are you sure you want to delete ALL vector chunks? This cannot be undone.")) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await chatbotService.deleteAllChunks();
      setSuccess(res.message || "All vector chunks deleted.");
      setChunks([]);
    } catch (err: any) {
      setError(err.message || "Failed to delete vector chunks");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAllChatHistory = async () => {
    if (!confirm("Are you sure you want to clear ALL user chat history across all agents? This cannot be undone.")) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await chatbotService.deleteAllChatHistory();
      setSuccess(res.message || "All chat history cleared.");
      setChatHistory([]);
    } catch (err: any) {
      setError(err.message || "Failed to clear chat history");
    } finally {
      setActionLoading(false);
    }
  };


  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setError(null);
    setSuccess(null);
    if (tab === "chunks") loadChunks(chunkSearch);
    if (tab === "history") loadChatHistory();
    if (tab === "analytics") chatbotService.getAnalytics().then(setAnalytics);
  };

  // Toggle Agent Active State
  const handleToggleAgent = async (agentKey: number) => {
    try {
      const res = await chatbotService.toggleAgentActive(agentKey);
      setAgents((prev) =>
        prev.map((a) => (a.agent_key === agentKey ? { ...a, is_active: res.is_active } : a))
      );
    } catch (err: any) {
      setError(err.message || "Failed to toggle agent status");
    }
  };

  // Delete Custom Agent
  const handleDeleteCustomAgent = async (agentKey: number, name: string) => {
    if (!confirm(`Delete custom agent '${name}' and its scoped knowledge?`)) return;
    try {
      await chatbotService.deleteCustomAgent(agentKey);
      setSuccess(`Agent '${name}' removed.`);
      loadInitialData();
    } catch (err: any) {
      setError(err.message || "Failed to delete agent");
    }
  };

  // Drop / Select multiple files for scoped agent
  const handleDeptFileDrop = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setDeptUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const fileArray = Array.from(files);
      const res = await chatbotService.uploadMultipleForAgent(fileArray, selectedAgentKey);
      setSuccess(res.message || `Uploaded ${fileArray.length} file(s).`);
      loadScopedAgentData(selectedAgentKey);
      loadInitialData();
    } catch (err: any) {
      setError(err.message || "Scoped document upload failed");
    } finally {
      setDeptUploading(false);
      setDeptDragOver(false);
    }
  };

  // Resolve RAG Miss
  const handleResolveMiss = async (missId: string) => {
    try {
      await chatbotService.resolveRagMiss(missId);
      setDeptMisses((prev) => prev.filter((m) => m.id !== missId));
      setSuccess("Gap question resolved and added to learned knowledge.");
      if (selectedAgentKey) {
        loadScopedAgentData(selectedAgentKey);
      }
    } catch (err: any) {
      setError(err.message || "Failed to resolve question");
    }
  };

  // Delete Learned Cache Entry
  const handleDeleteCache = async (cacheId: string) => {
    try {
      await chatbotService.deleteRagCache(cacheId);
      setDeptCaches((prev) => prev.filter((c) => c.id !== cacheId));
      setSuccess("Cached Q&A entry removed.");
    } catch (err: any) {
      setError(err.message || "Failed to delete cache entry");
    }
  };

  // Start Edit Scoped Document Content & Title
  const handleStartEditDocContent = async (f: any) => {
    setEditingDocContentItem(f);
    setEditDocFullTitle(f.title || f.filename || "");
    setEditDocFullText("");
    setLoadingDocContent(true);
    try {
      const data = await chatbotService.getDocumentContent(f.id);
      setEditDocFullText(data.content || "");
    } catch (err: any) {
      setError(err.message || "Failed to load document content");
    } finally {
      setLoadingDocContent(false);
    }
  };

  // Save Edit Scoped Document Content & Title
  const handleSaveEditDocContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocContentItem || !editDocFullText.trim()) return;
    setActionLoading(true);
    setError(null);
    try {
      await chatbotService.updateDocumentContent(editingDocContentItem.id, {
        title: editDocFullTitle.trim(),
        content: editDocFullText.trim(),
      });
      setSuccess(`Document '${editDocFullTitle}' content updated and re-indexed into RAG memory!`);
      setEditingDocContentItem(null);
      loadScopedAgentData(selectedAgentKey);
      loadInitialData();
    } catch (err: any) {
      setError(err.message || "Failed to update document content");
    } finally {
      setActionLoading(false);
    }
  };

  // Download Document File
  const handleDownloadDoc = (docId: string) => {
    const url = chatbotService.getDocumentDownloadUrl(docId);
    window.open(url, "_blank");
  };

  // Start Edit Learned Cache Item
  const handleStartEditCache = (c: RAGCacheItem) => {
    setEditingCacheItem(c);
    setEditCacheQuestion(c.question);
    setEditCacheAnswer(c.answer);
  };

  // Save Edit Learned Cache Item
  const handleSaveEditCache = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCacheItem || !editCacheQuestion.trim() || !editCacheAnswer.trim()) return;
    setActionLoading(true);
    setError(null);
    try {
      await chatbotService.updateRagCache(editingCacheItem.id, {
        question: editCacheQuestion.trim(),
        answer: editCacheAnswer.trim(),
      });
      setSuccess("Learned Q&A entry updated.");
      setEditingCacheItem(null);
      loadScopedAgentData(selectedAgentKey);
    } catch (err: any) {
      setError(err.message || "Failed to update cache entry");
    } finally {
      setActionLoading(false);
    }
  };

  // Save Add Manual Learned Cache Item
  const handleSaveAddCache = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCacheQuestion.trim() || !addCacheAnswer.trim()) return;
    setActionLoading(true);
    setError(null);
    try {
      await chatbotService.addRagCache({
        agent_key: selectedAgentKey,
        question: addCacheQuestion.trim(),
        answer: addCacheAnswer.trim(),
        source: "manual",
      });
      setSuccess("New Learned Q&A entry added!");
      setShowAddCacheModal(false);
      setAddCacheQuestion("");
      setAddCacheAnswer("");
      loadScopedAgentData(selectedAgentKey);
    } catch (err: any) {
      setError(err.message || "Failed to add cache entry");
    } finally {
      setActionLoading(false);
    }
  };

  // Create Custom Agent
  const handleCreateCustomAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAgentName.trim()) return;
    setCreatingAgent(true);
    setError(null);
    setSuccess(null);
    try {
      const arch = archetypes.find((a) => a.id === selectedArchetype) || archetypes[3];
      const res = await chatbotService.createCustomAgent({
        name: customAgentName.trim(),
        archetype_id: selectedArchetype,
        archetype_title: selectedArchetype === "custom" ? customArchetypeTitle : arch.title,
        archetype_desc: selectedArchetype === "custom" ? customArchetypeDesc : arch.desc,
        archetype_icon: selectedArchetype === "custom" ? customArchetypeIcon : arch.icon,
        system_prompt: customAgentPrompt.trim(),
      });

      // If initial PDFs attached
      if (customAgentFiles.length > 0 && res.agent?.agent_key) {
        await chatbotService.uploadMultipleForAgent(customAgentFiles, res.agent.agent_key);
      }

      setSuccess(`Agent '${customAgentName}' deployed successfully!`);
      setCustomAgentName("");
      setCustomArchetypeTitle("");
      setCustomArchetypeDesc("");
      setCustomAgentFiles([]);
      setCustomAgentPrompt("");
      setTopMode("departments");
      loadInitialData();
    } catch (err: any) {
      setError(err.message || "Failed to deploy custom agent");
    } finally {
      setCreatingAgent(false);
    }
  };

  // Global upload submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await chatbotService.uploadDocument(uploadFile, uploadTitle);
      setSuccess(res.message || "Document uploaded and indexed!");
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle("");
      loadInitialData();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Global manual submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim()) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await chatbotService.createManualDocument(manualTitle, manualContent);
      setSuccess(res.message || "Knowledge entry created and indexed!");
      setShowManualModal(false);
      setManualTitle("");
      setManualContent("");
      loadInitialData();
    } catch (err: any) {
      setError(err.message || "Creation failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Reprocess Document
  const handleReprocess = async (id: string) => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await chatbotService.reprocessDocument(id);
      setSuccess(res.message || "Document reprocessed successfully!");
      loadInitialData();
    } catch (err: any) {
      setError(err.message || "Reprocessing failed");
    } finally {
      setActionLoading(false);
    }
  };

  // View Document Details
  const handleViewDocument = async (id: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const docDetails = await chatbotService.getDocumentDetails(id);
      setSelectedDocDetails(docDetails);
    } catch (err: any) {
      setError(err.message || "Failed to load document details");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (id: string, title: string) => {
    if (!confirm(`Delete '${title}' and its chunks?`)) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await chatbotService.deleteDocument(id);
      setSuccess(`Document '${title}' removed.`);
      loadInitialData();
    } catch (err: any) {
      setError(err.message || "Deletion failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveQA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuestion.trim() || !qaAnswer.trim()) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await chatbotService.createManualDocument(
        `Q&A: ${qaQuestion.substring(0, 50)}`,
        `Q: ${qaQuestion}\n\nA: ${qaAnswer}`,
        activeTab === "workspace" && selectedAgentKey ? selectedAgentKey : undefined
      );
      setSuccess("Q&A chunk added successfully");
      setShowAddQAModal(false);
      setQaQuestion("");
      setQaAnswer("");
      loadChunks(chunkSearch);
      loadInitialData();
    } catch (err: any) {
      setError(err.message || "Failed to add Q&A chunk");
    } finally {
      setActionLoading(false);
    }
  };

  // Save Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await chatbotService.updateConfig(config);
      setSuccess("Configuration updated successfully!");
      setConfig(res.config);
    } catch (err: any) {
      setError(err.message || "Failed to save configuration");
    } finally {
      setActionLoading(false);
    }
  };

  // Run Sandbox Query & Real-time Q&A / PDF Update
  const handleRunSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryText = sandboxQuery.trim();
    if (!queryText) return;
    setSandboxLoading(true);
    setError(null);
    try {
      const activeAgentKey = sandboxAgentKey || selectedAgentKey;
      const res = await chatbotService.sendMessage(
        queryText,
        sandboxConversationId,
        activeAgentKey,
        false
      );
      setSandboxConversationId(res.conversation_id);
      if (res.pdf_url) {
        setSandboxPdfUrl(res.pdf_url);
      }
      setSandboxQAHistory((prev) => [
        ...prev,
        {
          question: queryText,
          answer: res.message,
          q_time: res.created_at,
          a_time: res.created_at
        }
      ]);
      setSandboxQuery("");

      // Real-time update of #2 Scoped Library, Gap Questions, and Learned Cache
      if (activeAgentKey) {
        loadScopedAgentData(activeAgentKey);
      }
    } catch (err: any) {
      setError(err.message || "Sandbox test query failed");
    } finally {
      setSandboxLoading(false);
    }
  };

  const handleNewSandboxSession = () => {
    setSandboxConversationId(undefined);
    setSandboxPdfUrl(null);
    setSandboxQAHistory([]);
    setSuccess("Started new conversation session with clean PDF.");
  };

  const handleEditChunk = (chunk: KnowledgeChunk) => {
    setEditingChunkId(chunk.id);
    setEditingChunkText(chunk.text);
  };

  const handleSaveChunk = async (id: string) => {
    setActionLoading(true);
    setError(null);
    try {
      await chatbotService.updateChunk(id, editingChunkText);
      setSuccess("Chunk updated successfully");
      setEditingChunkId(null);
      loadChunks(chunkSearch);
    } catch (err: any) {
      setError(err.message || "Failed to update chunk");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteChunk = async (id: string) => {
    if (!confirm("Are you sure you want to delete this chunk?")) return;
    setActionLoading(true);
    setError(null);
    try {
      await chatbotService.deleteChunk(id);
      setSuccess("Chunk deleted successfully");
      loadChunks(chunkSearch);
    } catch (err: any) {
      setError(err.message || "Failed to delete chunk");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAgentStatus = async (agentKey: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(true);
    setError(null);
    try {
      await chatbotService.toggleAgentActive(agentKey);
      setSuccess("Agent status updated");
      const updatedAgents = await chatbotService.listAgents();
      setAgents(updatedAgents);
    } catch (err: any) {
      setError(err.message || "Failed to toggle agent status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAgent = async (agentKey: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this custom agent? This cannot be undone.")) return;
    setActionLoading(true);
    setError(null);
    try {
      await chatbotService.deleteCustomAgent(agentKey);
      setSuccess("Custom agent deleted");
      if (selectedAgentKey === agentKey) {
        setSelectedAgentKey(900001);
      }
      const updatedAgents = await chatbotService.listAgents();
      setAgents(updatedAgents);
    } catch (err: any) {
      setError(err.message || "Failed to delete agent");
    } finally {
      setActionLoading(false);
    }
  };

  const selectedAgent = agents.find((a) => a.agent_key === selectedAgentKey) || agents[0];
  const customAgentsFleet = agents.filter((a) => a.agent_key > 900010);

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                CallZenza AI Chatbot & RAG
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Admin
                </span>
              </h1>
              <p className="text-slate-500 text-xs font-medium">
                Manage department workspaces, custom agent creators, scoped documents, text chunking, vector embeddings, Gemini grounding, and chat logs.
              </p>
            </div>
          </div>

          {/* Department Workspace vs Custom Agent Creator Toggle */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                setTopMode("departments");
                setActiveTab("workspace");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                topMode === "departments"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              Department Workspace
            </button>
            <button
              onClick={() => {
                setTopMode("custom_creator");
                setActiveTab("workspace");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                topMode === "custom_creator"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              Custom Agent Creator
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-medium animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-medium animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-1 pb-px scrollbar-none">
          {[
            { id: "workspace", label: "Agent Workspaces & Scoped RAG", icon: Building2 },
            { id: "documents", label: "Master Knowledge Base", icon: FileText },
            { id: "chunks", label: "Chunks & Embeddings", icon: Layers },
            { id: "config", label: "Configuration", icon: Sliders },
            { id: "history", label: "Chat History", icon: History },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "sandbox", label: "Test Sandbox", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB: WORKSPACE (DEPARTMENT WORKSPACES OR CUSTOM AGENT CREATOR) */}
        {activeTab === "workspace" && topMode === "departments" && (
          <div className="space-y-6 animate-fadeIn">
            {/* 1. Department Workspace Tiles */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Select Agent Workspace
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {agents.map((ag) => {
                  const isSelected = selectedAgentKey === ag.agent_key;
                  const isCustom = ag.agent_key > 900010;
                  return (
                    <div
                      key={ag.agent_key}
                      onClick={() => setSelectedAgentKey(ag.agent_key)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border text-center relative flex flex-col items-center justify-center gap-1.5 group ${
                        isSelected
                          ? "bg-indigo-50/80 border-indigo-600 shadow-sm shadow-indigo-500/10 ring-2 ring-indigo-500/20"
                          : "bg-white border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/60"
                      }`}
                    >
                      {isCustom && (
                        <button
                          onClick={(e) => handleDeleteAgent(ag.agent_key, e)}
                          className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Custom Agent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      <div className="text-2xl mb-0.5">{ag.archetype_icon || "🤖"}</div>
                      <span className="font-extrabold text-xs text-slate-800 tracking-tight truncate w-full px-4">
                        {ag.name}
                      </span>
                      <button
                        onClick={(e) => handleToggleAgentStatus(ag.agent_key, e)}
                        disabled={actionLoading}
                        className={`flex items-center gap-1.5 mt-0.5 px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity ${
                          ag.is_active ? "bg-emerald-50" : "bg-slate-100"
                        }`}
                        title="Click to toggle status"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            ag.is_active ? "bg-emerald-500 shadow-xs" : "bg-slate-400"
                          }`}
                        />
                        <span className={`text-[10px] font-bold ${ag.is_active ? "text-emerald-700" : "text-slate-600"}`}>
                          {ag.is_active ? "Active" : "Inactive"}
                        </span>
                      </button>
                    </div>
                  );
                })}

                {/* Create New Agent Tile */}
                <div
                  onClick={() => setTopMode("custom_creator")}
                  className="p-4 rounded-2xl cursor-pointer transition-all border border-dashed border-indigo-300 bg-indigo-50/30 hover:bg-indigo-50 text-center flex flex-col items-center justify-center gap-1.5 text-indigo-700"
                >
                  <Plus className="w-6 h-6 text-indigo-600" />
                  <span className="font-extrabold text-xs tracking-tight">Create New Agent</span>
                </div>
              </div>
            </div>

            {/* 2. Selected Department Scoped Management */}
            {selectedAgent && (
              <div className="space-y-6">
                {/* Agent Header & Toggle */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedAgent.archetype_icon || "💼"}</span>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                        {selectedAgent.name} WORKSPACE
                      </h2>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Agent Key: {selectedAgent.agent_key} • {selectedAgent.archetype_title || "Scoped Library Context"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        selectedAgent.is_active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {selectedAgent.is_active ? "Active" : "Inactive"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleAgent(selectedAgent.agent_key)}
                      className="rounded-xl text-xs h-8 font-semibold"
                    >
                      {selectedAgent.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>

                {/* 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: #1 Upload & #2 Scoped Library */}
                  <div className="space-y-6">
                    {/* #1 RAG Upload */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          #1 RAG PDF / Document Upload
                        </span>
                        {deptUploading && (
                          <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Indexing...
                          </span>
                        )}
                      </div>

                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDeptDragOver(true);
                        }}
                        onDragLeave={() => setDeptDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDeptFileDrop(e.dataTransfer.files);
                        }}
                        onClick={() => deptFileInputRef.current?.click()}
                        className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                          deptDragOver
                            ? "border-indigo-600 bg-indigo-50/50"
                            : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/60 bg-slate-50/30"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-800 block">
                            Drop PDF to add to this agent's library
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium block">
                            Click or drag & drop — multiple PDFs / DOCX / TXT supported
                          </span>
                        </div>
                        <input
                          ref={deptFileInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.docx,.doc,.txt,.csv,.md"
                          onChange={(e) => handleDeptFileDrop(e.target.files)}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* #2 Scoped Agent Library */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          #2 Scoped Agent Library ({deptFiles.length} files)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadScopedAgentData(selectedAgentKey)}
                            className="text-xs h-7 gap-1 text-slate-500"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Refresh
                          </Button>
                          {deptFiles.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAllDeptFiles(selectedAgentKey)}
                              className="text-xs h-7 gap-1 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold rounded-xl cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete All Files
                            </Button>
                          )}
                        </div>
                      </div>

                      {deptFiles.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 text-xs font-medium space-y-1">
                          <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                          <span>Library is currently empty.</span>
                          <p className="text-[11px]">Upload documents to seed knowledge for {selectedAgent.name}.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {deptFiles.map((f) => (
                            <div
                              key={f.id}
                              className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                <div className="truncate">
                                  <span className="font-bold text-slate-900 truncate block">{f.title || f.filename}</span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {f.file_type} • {f.chunk_count} chunks • {f.status}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleViewDocument(f.id)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                  title="View Document Chunks & Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDownloadDoc(f.id)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                  title="Download Original File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleStartEditDocContent(f)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                  title="Edit Document Content & Vector Memory"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDoc(f.id, f.title || f.filename)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: #3 Unanswered Questions & #4 Learned Cache */}
                  <div className="space-y-6">
                    {/* #3 Unanswered / Gap Questions */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          Unanswered / Gap Questions ({deptMisses.length})
                        </span>
                        {deptMisses.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAllRagMisses(selectedAgentKey)}
                            className="text-[11px] h-7 gap-1 font-bold border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Clear All
                          </Button>
                        )}
                      </div>

                      {deptMisses.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 text-xs font-medium space-y-1">
                          <span className="text-2xl block mb-1">🎉</span>
                          <span className="font-bold text-slate-700">No unresolved gaps!</span>
                          <p className="text-[11px]">All questions have been matched or successfully answered.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {deptMisses.map((m) => (
                            <div
                              key={m.id}
                              className="p-3 bg-red-50/50 border border-red-100 rounded-2xl flex items-center justify-between gap-3 text-xs"
                            >
                              <p className="text-slate-800 font-semibold text-[11px] truncate flex-1">{m.question}</p>
                              <Button
                                size="sm"
                                onClick={() => handleResolveMiss(m.id)}
                                className="bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-bold h-7 px-2.5"
                              >
                                Resolve
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* #4 Gemini Q&A Review (Learned Cache) */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          Gemini Q&A Review (Learned Cache) ({deptCaches.length})
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAddCacheModal(true)}
                            className="text-[11px] h-7 gap-1 font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl cursor-pointer"
                          >
                            <Plus className="w-3 h-3 text-indigo-600" />
                            Add Q&A
                          </Button>
                          {deptCaches.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteAllRagCache(selectedAgentKey)}
                              className="text-[11px] h-7 gap-1 font-bold border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Clear All
                            </Button>
                          )}
                        </div>
                      </div>


                      {deptCaches.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 text-xs font-medium space-y-1">
                          <BrainCircuit className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                          <span>No learned cache entries for this agent yet.</span>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                          {deptCaches.map((c) => (
                            <div
                              key={c.id}
                              className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs"
                            >
                              <div className="flex justify-between items-center text-[11px] font-bold text-indigo-700 gap-2">
                                <span className="truncate flex-1">Q: {c.question}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => setViewingCacheItem(c)}
                                    className="text-slate-400 hover:text-indigo-600 p-1 transition-colors cursor-pointer"
                                    title="View Full Q&A"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleStartEditCache(c)}
                                    className="text-slate-400 hover:text-blue-600 p-1 transition-colors cursor-pointer"
                                    title="Edit Q&A"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCache(c.id)}
                                    className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                                    title="Delete Entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-slate-700 text-[11px] font-medium whitespace-pre-wrap line-clamp-3">{c.answer}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: CUSTOM AGENT CREATOR WORKSPACE */}
        {activeTab === "workspace" && topMode === "custom_creator" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Form */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Custom Agent Creation Workspace
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Design specialized AI agents with tailored archetypes, scoped knowledge libraries, and system prompts.
                </p>
              </div>

              <form onSubmit={handleCreateCustomAgent} className="space-y-6">
                {/* 01 - Agent Archetype */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    01 — Agent Archetype
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {archetypes.map((arch) => {
                      const isSel = selectedArchetype === arch.id;
                      return (
                        <div
                          key={arch.id}
                          onClick={() => setSelectedArchetype(arch.id)}
                          className={`p-4 rounded-2xl cursor-pointer transition-all border text-center flex flex-col items-center justify-center gap-1.5 ${
                            isSel
                              ? "bg-indigo-50 border-indigo-600 shadow-xs ring-2 ring-indigo-500/20"
                              : "bg-slate-50/50 border-slate-200 hover:border-indigo-300"
                          }`}
                        >
                          <span className="text-2xl">{arch.icon}</span>
                          <span className="font-extrabold text-[11px] text-slate-800 tracking-tight">
                            {arch.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{arch.desc}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Agent Name Input */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Agent Name</label>
                    <Input
                      placeholder="e.g. 'Sales Objection Pro' or 'HR Copilot'"
                      value={customAgentName}
                      onChange={(e) => setCustomAgentName(e.target.value)}
                      className="rounded-2xl border-slate-200 text-xs h-11 font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* 02 - RAG Data Portal */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    02 — RAG Data Portal
                  </span>
                  <div
                    onClick={() => customFileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl text-center cursor-pointer bg-slate-50/30 flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">Drop PDF for this agent</span>
                    <span className="text-[10px] text-slate-400">Click or drag & drop — multiple PDFs supported</span>
                    <input
                      ref={customFileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.docx,.doc,.txt,.csv,.md"
                      onChange={(e) => setCustomAgentFiles(Array.from(e.target.files || []))}
                      className="hidden"
                    />
                  </div>
                  {customAgentFiles.length > 0 && (
                    <div className="text-[11px] text-emerald-600 font-bold">
                      {customAgentFiles.length} file(s) selected for initial indexing
                    </div>
                  )}
                </div>

                {/* 03 - System Prompt */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Agent System Instructions</label>
                  <textarea
                    rows={3}
                    placeholder="Provide custom behavioral instructions for this agent..."
                    value={customAgentPrompt}
                    onChange={(e) => setCustomAgentPrompt(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={creatingAgent || !customAgentName.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-11 font-bold text-xs gap-2 shadow-sm"
                >
                  <Zap className="w-4 h-4" />
                  {creatingAgent ? "Deploying & Indexing..." : "Deploy / Save Agent"}
                </Button>
              </form>
            </div>

            {/* Right: Custom Agents Fleet */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Custom Agents Fleet ({customAgentsFleet.length} agents)
              </span>

              {customAgentsFleet.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 text-xs font-medium space-y-1">
                  <Bot className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                  <span>No custom agents deployed yet.</span>
                </div>
              ) : (
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {customAgentsFleet.map((ag) => (
                    <div
                      key={ag.agent_key}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{ag.archetype_icon || "🤖"}</span>
                          <div>
                            <span className="font-extrabold text-slate-900 block">{ag.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Key: {ag.agent_key} • {ag.pdfs_count} PDFs
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteCustomAgent(ag.agent_key, ag.name)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            ag.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {ag.is_active ? "Active" : "Inactive"}
                        </span>
                        <button
                          onClick={() => handleToggleAgent(ag.agent_key)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          {ag.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: MASTER KNOWLEDGE BASE */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Master Documents & Knowledge Base</h2>
              <div className="flex items-center gap-2">
                {documents.length > 0 && (
                  <Button
                    onClick={handleDeleteAllDocuments}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs gap-1.5 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete All Documents
                  </Button>
                )}
                <Button
                  onClick={() => setShowManualModal(true)}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  Add Manual
                </Button>
                <Button
                  onClick={() => setShowUploadModal(true)}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </Button>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl p-8 space-y-4">
                <FileText className="w-10 h-10 text-indigo-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No knowledge documents yet</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  Upload PDF, DOCX, TXT, or CSV files to index knowledge.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Document</th>
                      <th className="px-4 py-3.5">Type</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Scope</th>
                      <th className="px-4 py-3.5">Chunks</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{doc.title}</td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg font-bold text-[10px]">
                            {doc.file_type}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-500 font-medium">
                          {doc.agent_key ? `Agent #${doc.agent_key}` : "Global"}
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-900">{doc.chunk_count}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewDocument(doc.id)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                              title="View Document Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReprocess(doc.id)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Reprocess Document"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(doc.id, doc.title)}
                              className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: CHUNKS & EMBEDDINGS */}
        {activeTab === "chunks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search chunk text..."
                  value={chunkSearch}
                  onChange={(e) => {
                    setChunkSearch(e.target.value);
                    loadChunks(e.target.value);
                  }}
                  className="pl-9 rounded-xl border-slate-200 text-xs h-10"
                />
              </div>
              <div className="flex items-center gap-3">
                {chunks.length > 0 && (
                  <Button
                    onClick={handleDeleteAllChunks}
                    size="sm"
                    variant="outline"
                    className="h-10 rounded-xl text-xs gap-1.5 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete All Chunks
                  </Button>
                )}
                <Button
                  onClick={() => setShowAddQAModal(true)}
                  size="sm"
                  variant="outline"
                  className="h-10 rounded-xl text-xs gap-1.5 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Q&A Pair
                </Button>
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Showing {chunks.length} chunks</span>
              </div>
            </div>

            {chunks.length === 0 ? (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl text-slate-400 text-sm font-medium">
                No chunks found matching query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chunks.map((c) => (
                  <Card key={c.id} className="p-4 border-slate-200/80 rounded-2xl space-y-2.5 bg-white shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-xs text-indigo-600">Chunk #{c.chunk_index + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                          3072-dim Gemini Vector
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">{c.token_count} words</span>
                      </div>
                    </div>
                    {editingChunkId === c.id ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          className="w-full text-xs text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y min-h-[120px]"
                          value={editingChunkText}
                          onChange={(e) => setEditingChunkText(e.target.value)}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingChunkId(null)}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-700 px-2 py-1"
                            disabled={actionLoading}
                          >
                            CANCEL
                          </button>
                          <button
                            onClick={() => handleSaveChunk(c.id)}
                            className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1"
                            disabled={actionLoading}
                          >
                            {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            SAVE
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100 line-clamp-5">
                          {c.text}
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 mt-2">
                          <button
                            onClick={() => handleEditChunk(c)}
                            className="text-slate-400 hover:text-indigo-600 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                            title="Edit Chunk"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteChunk(c.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                            title="Delete Chunk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: CONFIGURATION */}
        {activeTab === "config" && config && (
          <form onSubmit={handleSaveConfig} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 max-w-3xl shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Chatbot & RAG Retrieval Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Gemini LLM Model</label>
                <select
                  value={config.model_name}
                  onChange={(e) => setConfig({ ...config, model_name: e.target.value })}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800"
                >
                  <option value="gemini-3.6-flash">gemini-3.6-flash (Fast, Recommended)</option>
                  <option value="gemini-pro-latest">gemini-pro-latest (High Reasoning)</option>
                  <option value="gemini-flash-lite-latest">gemini-flash-lite-latest (Ultra-lightweight)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Temperature</label>
                    <span className="text-xs font-bold text-indigo-600">{config.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={config.temperature}
                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Top-K Chunks</label>
                    <span className="text-xs font-bold text-indigo-600">{config.top_k}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={config.top_k}
                    onChange={(e) => setConfig({ ...config, top_k: parseInt(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Min Similarity</label>
                    <span className="text-xs font-bold text-indigo-600">{config.similarity_threshold}</span>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={config.similarity_threshold}
                      onChange={(e) => setConfig({ ...config, similarity_threshold: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">System Prompt & Grounding Rules</label>
                <textarea
                  rows={5}
                  value={config.system_prompt}
                  onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Fallback Answer (Anti-Hallucination)</label>
                <Input
                  value={config.fallback_message}
                  onChange={(e) => setConfig({ ...config, fallback_message: e.target.value })}
                  className="rounded-xl border-slate-200 text-xs h-10"
                />
              </div>
            </div>

            <Button type="submit" disabled={actionLoading} className="bg-indigo-600 text-white rounded-xl text-xs px-5 h-10 font-semibold gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {actionLoading ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        )}

        {/* TAB: CHAT HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">User &amp; Agent Chat Conversations</h2>
              {chatHistory.length > 0 && (
                <Button
                  onClick={handleDeleteAllChatHistory}
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-xl text-xs gap-1.5 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All History
                </Button>
              )}
            </div>
            {chatHistory.length === 0 ? (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl text-slate-400 text-sm font-medium">
                No chat conversations logged yet.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">User</th>
                      <th className="px-4 py-3.5">Conversation</th>
                      <th className="px-4 py-3.5">Messages</th>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {chatHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{item.user_name}</div>
                          <div className="text-slate-400 text-[11px]">{item.user_email}</div>
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-800">{item.title}</td>
                        <td className="px-4 py-4 font-bold text-slate-800">{item.message_count}</td>
                        <td className="px-4 py-4 text-slate-400 text-[11px]">
                          {new Date(item.updated_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedChat(item)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs"
                            >
                              Inspect Log
                            </button>
                            <button
                              onClick={() => handleDeleteChatHistory(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Conversation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: ANALYTICS */}
        {activeTab === "analytics" && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 rounded-3xl bg-white border-slate-200/80 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Documents Indexed</span>
              <div className="text-3xl font-black text-slate-900">{analytics.completed_documents} / {analytics.total_documents}</div>
            </Card>
            <Card className="p-6 rounded-3xl bg-white border-slate-200/80 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Vector Chunks</span>
              <div className="text-3xl font-black text-purple-600">{analytics.total_chunks}</div>
            </Card>
            <Card className="p-6 rounded-3xl bg-white border-slate-200/80 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase">User Queries Answered</span>
              <div className="text-3xl font-black text-emerald-600">{analytics.total_user_queries}</div>
            </Card>
          </div>
        )}

        {/* TAB: TEST SANDBOX */}
        {activeTab === "sandbox" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Chat / Question Query Form */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  RAG Test Sandbox & Conversation Session
                </h2>
                {sandboxConversationId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNewSandboxSession}
                    className="text-xs h-8 rounded-xl font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    + New Session
                  </Button>
                )}
              </div>

              <form onSubmit={handleRunSandbox} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Agent (Optional)</label>
                  <select
                    value={sandboxAgentKey || ""}
                    onChange={(e) => setSandboxAgentKey(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="">All Knowledge (Global)</option>
                    {agents.map((a) => (
                      <option key={a.agent_key} value={a.agent_key}>
                        {a.name} (Key: {a.agent_key})
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  rows={4}
                  placeholder="Ask a question about the knowledge base..."
                  value={sandboxQuery}
                  onChange={(e) => setSandboxQuery(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  type="submit"
                  disabled={sandboxLoading || !sandboxQuery.trim()}
                  className="w-full bg-indigo-600 text-white rounded-xl text-xs h-10 font-bold gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {sandboxLoading ? "Retrieving & Generating PDF..." : "Send Question & Update PDF"}
                </Button>
              </form>
            </div>

            {/* Right: Real-time Q&A History Side Panel */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  CONVERSATION Q&A HISTORY
                </h3>
                {sandboxPdfUrl && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
                      window.open(`${apiBase}${sandboxPdfUrl}`, "_blank");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs gap-1.5 font-bold cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Open Conversation PDF
                  </Button>
                )}
              </div>

              {sandboxQAHistory.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 text-xs font-medium space-y-1 my-auto">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                  <span className="font-bold text-slate-700">No questions asked in this session yet</span>
                  <p className="text-[11px]">Ask a question to see real-time Q&A history and generated PDF.</p>
                </div>
              ) : (
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[480px] pr-1">
                  {sandboxQAHistory.map((qa, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
                      <div className="font-bold text-indigo-700 flex justify-between items-start">
                        <span>Q{idx + 1}: {qa.question}</span>
                        {qa.q_time && (
                          <span className="text-[10px] text-slate-400 font-normal shrink-0 ml-2">
                            {qa.q_time.substring(11, 16)}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-800 font-medium whitespace-pre-wrap pl-3 border-l-2 border-emerald-500 bg-white/70 p-2.5 rounded-xl">
                        <span className="font-bold text-emerald-700 block mb-1">A{idx + 1}:</span>
                        {qa.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: Upload File */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Upload Knowledge Document</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Document Title (Optional)</label>
                  <Input
                    placeholder="e.g. Sales Playbook Q3"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="rounded-xl border-slate-200 text-xs h-10"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select File (PDF, DOCX, TXT, CSV, MD)</label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.csv,.md"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 border border-slate-200 rounded-xl p-2 cursor-pointer"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowUploadModal(false)} className="rounded-xl text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!uploadFile || actionLoading} className="bg-indigo-600 text-white rounded-xl text-xs font-semibold gap-2">
                    <Upload className="w-4 h-4" />
                    {actionLoading ? "Processing..." : "Upload & Index"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Manual Knowledge Entry */}
        {showManualModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Add Manual Knowledge</h3>
                <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Title</label>
                  <Input
                    placeholder="e.g. Return Policy & Warranty Terms"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="rounded-xl border-slate-200 text-xs h-10"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Knowledge Content</label>
                  <textarea
                    rows={6}
                    placeholder="Enter factual documentation, FAQs, or procedures..."
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowManualModal(false)} className="rounded-xl text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!manualTitle.trim() || !manualContent.trim() || actionLoading} className="bg-indigo-600 text-white rounded-xl text-xs font-semibold gap-2">
                    <Plus className="w-4 h-4" />
                    {actionLoading ? "Indexing..." : "Save Knowledge"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Add Q&A Pair */}
        {showAddQAModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Add Q&A Chunk</h3>
                <button type="button" onClick={() => setShowAddQAModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveQA} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Question / Query</label>
                  <Input
                    value={qaQuestion}
                    onChange={(e) => setQaQuestion(e.target.value)}
                    placeholder="e.g. What is the refund policy?"
                    required
                    className="w-full text-xs font-medium border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ideal AI Answer</label>
                  <textarea
                    value={qaAnswer}
                    onChange={(e) => setQaAnswer(e.target.value)}
                    placeholder="e.g. We offer a 30-day money-back guarantee..."
                    required
                    rows={5}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setShowAddQAModal(false)} className="rounded-xl text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!qaQuestion.trim() || !qaAnswer.trim() || actionLoading} className="bg-indigo-600 text-white rounded-xl text-xs font-semibold gap-2">
                    <Plus className="w-4 h-4" />
                    {actionLoading ? "Saving..." : "Save Q&A"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Inspect Document Details */}
        {selectedDocDetails && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-3xl max-h-[85vh] flex flex-col space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedDocDetails.title}</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {selectedDocDetails.chunks?.length || 0} chunks • Status: {selectedDocDetails.status}
                  </p>
                </div>
                <button onClick={() => setSelectedDocDetails(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {selectedDocDetails.chunks?.map((c: any) => (
                  <div key={c.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">
                        Chunk #{c.chunk_index + 1}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{c.token_count} words</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {c.text}
                    </p>
                  </div>
                ))}
                {(!selectedDocDetails.chunks || selectedDocDetails.chunks.length === 0) && (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    No chunks found for this document.
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadDoc(selectedDocDetails.id)}
                  className="rounded-xl text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  Download File
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const doc = selectedDocDetails;
                      setSelectedDocDetails(null);
                      handleStartEditDocContent(doc);
                    }}
                    className="bg-indigo-600 text-white rounded-xl text-xs font-semibold gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Content
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedDocDetails(null)} className="rounded-xl text-xs">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Inspect Chat History */}
        {selectedChat && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedChat.title}</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    User: {selectedChat.user_name} ({selectedChat.user_role}) • {selectedChat.message_count} messages
                  </p>
                </div>
                <button onClick={() => setSelectedChat(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {selectedChat.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                      m.sender === "user"
                        ? "bg-indigo-50/70 border border-indigo-100 text-indigo-950 ml-6"
                        : "bg-slate-50 border border-slate-200 text-slate-800 mr-6"
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold text-[10px] text-slate-400 mb-1">
                      <span>{m.sender === "user" ? "User" : "CallZenza AI"}</span>
                      {m.latency_ms ? <span>{m.latency_ms} ms</span> : null}
                    </div>
                    <div className="font-medium text-xs">
                      <MarkdownText content={m.content} isUser={m.sender === "user"} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button onClick={() => setSelectedChat(null)} className="rounded-xl text-xs">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: View Learned Q&A Cache Entry */}
        {viewingCacheItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-600" />
                  Learned Q&A Details
                </h3>
                <button onClick={() => setViewingCacheItem(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                    Question
                  </span>
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs font-semibold text-slate-900">
                    {viewingCacheItem.question}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                    Learned Gemini Answer
                  </span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {viewingCacheItem.answer}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Source: <strong className="text-slate-600">{viewingCacheItem.source || "auto"}</strong></span>
                  <span>Created: {new Date(viewingCacheItem.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  onClick={() => {
                    const c = viewingCacheItem;
                    setViewingCacheItem(null);
                    handleStartEditCache(c);
                  }}
                  className="bg-indigo-600 text-white rounded-xl text-xs font-semibold gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit This Entry
                </Button>
                <Button variant="outline" onClick={() => setViewingCacheItem(null)} className="rounded-xl text-xs">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Edit Learned Q&A Cache Entry */}
        {editingCacheItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Edit Learned Q&A</h3>
                <button onClick={() => setEditingCacheItem(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditCache} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Question</label>
                  <Input
                    value={editCacheQuestion}
                    onChange={(e) => setEditCacheQuestion(e.target.value)}
                    required
                    className="w-full text-xs font-medium border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Answer</label>
                  <textarea
                    value={editCacheAnswer}
                    onChange={(e) => setEditCacheAnswer(e.target.value)}
                    required
                    rows={6}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setEditingCacheItem(null)} className="rounded-xl text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={actionLoading} className="bg-indigo-600 text-white rounded-xl text-xs font-semibold">
                    {actionLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Add Manual Learned Q&A Entry */}
        {showAddCacheModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Add Learned Q&A Entry</h3>
                <button onClick={() => setShowAddCacheModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAddCache} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">User Question</label>
                  <Input
                    placeholder="e.g. Who is the CEO of CallZenza?"
                    value={addCacheQuestion}
                    onChange={(e) => setAddCacheQuestion(e.target.value)}
                    required
                    className="w-full text-xs font-medium border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target AI Answer</label>
                  <textarea
                    placeholder="e.g. The CEO of CallZenza is Mr. Murugan."
                    value={addCacheAnswer}
                    onChange={(e) => setAddCacheAnswer(e.target.value)}
                    required
                    rows={5}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setShowAddCacheModal(false)} className="rounded-xl text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!addCacheQuestion.trim() || !addCacheAnswer.trim() || actionLoading} className="bg-indigo-600 text-white rounded-xl text-xs font-semibold gap-1.5">
                    <Plus className="w-4 h-4" />
                    {actionLoading ? "Saving..." : "Add to Learned Cache"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}



        {/* MODAL: Edit Document Content & Vector Memory */}
        {editingDocContentItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Edit Document Content & Vector Memory</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Modifying this text updates the document and re-embeds all vector chunks for Gemini RAG.
                    </p>
                  </div>
                </div>
                <button onClick={() => setEditingDocContentItem(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDocContent ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                  <span>Loading document content...</span>
                </div>
              ) : (
                <form onSubmit={handleSaveEditDocContent} className="flex-1 flex flex-col space-y-4 overflow-hidden">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Document Title</label>
                    <Input
                      value={editDocFullTitle}
                      onChange={(e) => setEditDocFullTitle(e.target.value)}
                      required
                      className="w-full text-xs font-medium border-slate-200 rounded-xl bg-slate-50"
                    />
                  </div>

                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700 block">Full Document Text Content</label>
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(editingDocContentItem.id)}
                        className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        Download File
                      </button>
                    </div>
                    <textarea
                      value={editDocFullText}
                      onChange={(e) => setEditDocFullText(e.target.value)}
                      required
                      rows={12}
                      placeholder="Enter or edit full text content..."
                      className="w-full flex-1 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingDocContentItem(null)}
                      className="rounded-xl text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!editDocFullText.trim() || actionLoading}
                      className="bg-indigo-600 text-white rounded-xl text-xs font-semibold gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {actionLoading ? "Re-Indexing Vectors..." : "Save Content & Re-Embed"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

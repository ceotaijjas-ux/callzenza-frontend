import { useAuthStore } from "@/lib/store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAuthHeader(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  retrieved_context?: Array<{
    chunk_id: string;
    document_id: string;
    text: string;
    score: number;
    page: number;
    document_title: string;
    filename: string;
  }>;
  latency_ms?: number;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  message_count: number;
  last_message?: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED";
  agent_key?: number;
  department?: string;
  chunk_count: number;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  agent_key?: number;
  chunk_index: number;
  text: string;
  token_count: number;
  meta_info?: any;
  created_at: string;
}

export interface RAGAgentItem {
  id: string;
  agent_key: number;
  name: string;
  archetype_id: string;
  archetype_title: string;
  archetype_desc: string;
  archetype_icon: string;
  is_active: boolean;
  system_prompt?: string;
  pdfs_count: number;
  created_at: string;
}

export interface RAGMissItem {
  id: string;
  agent_key: number;
  question: string;
  created_at: string;
}

export interface RAGCacheItem {
  id: string;
  agent_key: number;
  question: string;
  answer: string;
  source: string;
  created_at: string;
}

export interface ChatbotConfig {
  id: string;
  model_name: string;
  temperature: number;
  top_k: number;
  similarity_threshold: number;
  system_prompt: string;
  fallback_message: string;
}

export interface ChatbotAnalytics {
  total_documents: number;
  completed_documents: number;
  total_chunks: number;
  total_conversations: number;
  total_messages: number;
  total_user_queries: number;
  active_users: number;
  total_agents?: number;
}

export interface AdminChatHistoryItem {
  id: string;
  title: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export const chatbotService = {
  // User / Agent Chat Endpoints
  async sendMessage(message: string, conversation_id?: string, agent_key?: number | null, is_global?: boolean): Promise<{
    conversation_id: string;
    message: string;
    sender: string;
    retrieved_context: any[];
    latency_ms: number;
    pdf_url?: string;
    created_at: string;
  }> {
    const res = await fetch(`${API_BASE}/api/chatbot/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ message, conversation_id, agent_key, is_global }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to send message" }));
      throw new Error(err.detail || "Failed to send message");
    }
    return res.json();
  },

  async listAvailableAgents(): Promise<RAGAgentItem[]> {
    try {
      const res = await fetch(`${API_BASE}/api/chatbot/agents`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async listConversations(): Promise<ChatConversation[]> {
    try {
      const res = await fetch(`${API_BASE}/api/chatbot/conversations`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async getConversation(id: string): Promise<{
    id: string;
    title: string;
    pdf_url?: string;
    created_at: string;
    updated_at: string;
    qa_history?: Array<{ question: string; answer: string; q_time?: string; a_time?: string }>;
    messages: ChatMessage[];
  }> {
    const res = await fetch(`${API_BASE}/api/chatbot/conversations/${id}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to load conversation messages");
    return res.json();
  },

  async deleteConversation(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/chatbot/conversations/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to delete conversation");
  },

  // Department & Custom Agent Endpoints
  async listAgents(): Promise<RAGAgentItem[]> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/agents`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to load agents");
    return res.json();
  },

  async createCustomAgent(payload: {
    name: string;
    archetype_id: string;
    archetype_title: string;
    archetype_desc: string;
    archetype_icon: string;
    system_prompt?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/agents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create agent");
    return res.json();
  },

  async toggleAgentActive(agent_key: number): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/agents/${agent_key}/toggle`, {
      method: "PATCH",
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to toggle agent status");
    return res.json();
  },

  async deleteCustomAgent(agent_key: number): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/agents/${agent_key}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to delete custom agent");
    return res.json();
  },

  async listAgentLibrary(agent_key: number): Promise<{ files: any[] }> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/library/${agent_key}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to load agent library");
    return res.json();
  },

  async uploadMultipleForAgent(files: File[], agentKey: number): Promise<any> {
    const formData = new FormData();
    files.forEach((f) => formData.append("pdfs", f));
    formData.append("agentKey", String(agentKey));

    const res = await fetch(`${API_BASE}/api/admin/chatbot/library/upload-multiple`, {
      method: "POST",
      headers: getAuthHeader(),
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },

  async listRagMisses(agent_key: number): Promise<{ misses: RAGMissItem[] }> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/rag-misses/${agent_key}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to load gap questions");
    return res.json();
  },

  async resolveRagMiss(miss_id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/rag-misses/${miss_id}/resolve`, {
      method: "POST",
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to resolve gap question");
    return res.json();
  },

  async listRagCache(agent_key: number): Promise<{ cache: RAGCacheItem[] }> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/rag-cache/${agent_key}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to load learned cache");
    return res.json();
  },

  async addRagCache(payload: { agent_key: number; question: string; answer: string; source?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/rag-cache`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to add cache entry");
    return res.json();
  },

  async updateRagCache(id: string, payload: { question?: string; answer?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/rag-cache/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update cache entry");
    return res.json();
  },

  async deleteRagCache(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/rag-cache/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to delete cache entry");
    return res.json();
  },

  async updateDocumentTitle(id: string, title: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/documents/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to update document title");
    return res.json();
  },

  async getDocumentContent(id: string): Promise<{ id: string; title: string; content: string }> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/documents/${id}/content`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to fetch document content");
    return res.json();
  },

  async updateDocumentContent(id: string, payload: { title?: string; content: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/documents/${id}/content`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update document content");
    return res.json();
  },

  getDocumentDownloadUrl(id: string): string {
    return `${API_BASE}/api/admin/chatbot/documents/${id}/download`;
  },

  // Global Documents & Settings Endpoints
  async listDocuments(): Promise<KnowledgeDocument[]> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/documents`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to load knowledge documents");
    return res.json();
  },

  async uploadDocument(file: File, title?: string, agent_key?: number): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);
    if (agent_key) formData.append("agent_key", String(agent_key));

    const res = await fetch(`${API_BASE}/api/admin/chatbot/documents/upload`, {
      method: "POST",
      headers: getAuthHeader(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  },

  async createManualDocument(title: string, content: string, agent_key?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/documents/manual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ title, content, agent_key }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Creation failed" }));
      throw new Error(err.detail || "Creation failed");
    }
    return res.json();
  },

  async getDocumentDetails(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/documents/${id}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to load document details");
    return res.json();
  },

  async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/documents/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to delete document");
  },

  async reprocessDocument(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/documents/${id}/reprocess`, {
      method: "POST",
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to reprocess document");
    return res.json();
  },

  async listChunks(q?: string, document_id?: string, agent_key?: number): Promise<KnowledgeChunk[]> {
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    if (document_id) params.append("document_id", document_id);
    if (agent_key) params.append("agent_key", String(agent_key));

    const res = await fetch(`${API_BASE}/api/admin/chatbot/chunks?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to search chunks");
    return res.json();
  },

  async updateChunk(id: string, text: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/chunks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("Failed to update chunk");
    return res.json();
  },

  async deleteChunk(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/chunks/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to delete chunk");
  },

  async getConfig(): Promise<ChatbotConfig> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/config`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to load chatbot configuration");
    return res.json();
  },

  async updateConfig(config: Partial<ChatbotConfig>): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error("Failed to update chatbot configuration");
    return res.json();
  },

  async getChatHistory(): Promise<AdminChatHistoryItem[]> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/history`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to load chat history");
    return res.json();
  },

  async getAnalytics(): Promise<ChatbotAnalytics> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/analytics`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to load analytics");
    return res.json();
  },

  async testRAG(query: string, agent_key?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/test-rag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ query, agent_key }),
    });
    if (!res.ok) throw new Error("RAG test query failed");
    return res.json();
  },

  // Bulk Delete Methods
  async deleteAllDocuments(agent_key?: number): Promise<any> {
    const url = agent_key
      ? `${API_BASE}/api/admin/chatbot/documents/delete-all?agent_key=${agent_key}`
      : `${API_BASE}/api/admin/chatbot/documents/delete-all`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to delete all documents");
    return res.json();
  },

  async deleteAllChunks(agent_key?: number): Promise<any> {
    const url = agent_key
      ? `${API_BASE}/api/admin/chatbot/chunks/delete-all?agent_key=${agent_key}`
      : `${API_BASE}/api/admin/chatbot/chunks/delete-all`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to delete all chunks");
    return res.json();
  },

  async deleteAllChatHistory(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/history/delete-all`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to delete all chat history");
    return res.json();
  },

  async deleteAllRagMisses(agent_key: number): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/rag-misses/${agent_key}/delete-all`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to delete gap questions");
    return res.json();
  },

  async deleteAllRagCache(agent_key: number): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/chatbot/rag-cache/${agent_key}/delete-all`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Failed to delete QA cache");
    return res.json();
  },
};


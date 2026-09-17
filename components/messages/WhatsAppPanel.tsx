import React, { useState, useEffect } from 'react';
import ChatList, { ChatItem } from './ChatList';
import ChatThread from './ChatThread';
import NewChatModal from './NewChatModal';
import { messagesService, WhatsAppMessage, WhatsAppConversationItem } from '@/lib/services/messages.service';

interface CRMLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  initials: string;
  color: string;
}

interface WhatsAppPanelProps {
  leads: CRMLead[];
  activeLeadId: string | null;
  currentLead?: CRMLead | null;
  onSelectLead?: (leadId: string) => void;
}

export default function WhatsAppPanel({ leads, activeLeadId, currentLead, onSelectLead }: WhatsAppPanelProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [threads, setThreads] = useState<Record<string, WhatsAppMessage[]>>({});
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configuredPhone, setConfiguredPhone] = useState<string>('');
  const [dbConversations, setDbConversations] = useState<WhatsAppConversationItem[]>([]);

  useEffect(() => {
    messagesService
      .getWhatsAppConfig()
      .then((res) => {
        if (res?.config?.phone_number) {
          setConfiguredPhone(res.config.phone_number);
        }
      })
      .catch(() => {});
  }, []);

  const loadConversations = async () => {
    try {
      const convs = await messagesService.getWhatsAppConversations();
      if (Array.isArray(convs)) {
        setDbConversations(convs);
      }
    } catch (err) {
      console.warn("Failed to load WhatsApp conversations:", err);
    }
  };

  // Initial load and periodic polling for conversations list
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages helper
  const fetchMessages = async (id: string) => {
    if (!id) return;
    try {
      const msgs = await messagesService.getWhatsAppMessages(id);
      setThreads((prev) => ({ ...prev, [id]: msgs || [] }));
    } catch (err: any) {
      if (err?.status === 404 || err?.message?.includes("Lead not found")) {
        setThreads((prev) => ({ ...prev, [id]: prev[id] || [] }));
      } else {
        console.warn("Failed to load WhatsApp messages:", err?.message || err);
      }
    }
  };

  // Poll active chat messages
  useEffect(() => {
    if (!activeId) return;
    
    fetchMessages(activeId);
    const interval = setInterval(() => {
      fetchMessages(activeId);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeId]);

  const resolveLead = (id: string): CRMLead => {
    if (currentLead && currentLead.id === id) return currentLead;
    const found = leads.find((l) => l.id === id);
    if (found) return found;

    const dbConv = dbConversations.find(
      (c) => c.id === id || c.lead_id === id || c.contact_id === id || c.phone === id || c.recipient_phone === id
    );
    if (dbConv) {
      const phone = dbConv.recipient_phone || dbConv.phone || '';
      const rawName = dbConv.name;
      const displayName = (!rawName || rawName === 'Lead' || rawName === 'Customer' || rawName === 'Unknown')
        ? phone
        : rawName;
      return {
        id: dbConv.lead_id || dbConv.id,
        name: displayName || phone || 'WhatsApp Contact',
        phone: phone,
        email: '',
        initials: (displayName && displayName !== phone ? displayName.slice(0, 2).toUpperCase() : 'WA'),
        color: '#10B981',
      };
    }

    return fallbackLead(id);
  };

  // Build chats list merging dbConversations, leads prop, and active threads
  const seenIds = new Set<string>();
  const chatItems: ChatItem[] = [];

  // 1. Database conversations
  for (const conv of dbConversations) {
    const convId = conv.lead_id || conv.id;
    if (!convId || seenIds.has(convId)) continue;
    seenIds.add(convId);

    const msgs = threads[convId] || [];
    const lastMsg = msgs[msgs.length - 1];
    const phone = conv.recipient_phone || conv.phone || '';
    const rawName = conv.name;
    const displayName = (!rawName || rawName === 'Lead' || rawName === 'Customer' || rawName === 'Unknown')
      ? (phone || 'WhatsApp Contact')
      : rawName;

    chatItems.push({
      id: convId,
      name: displayName,
      phone: phone,
      email: '',
      initials: (displayName && displayName !== phone ? displayName.slice(0, 2).toUpperCase() : 'WA'),
      color: '#10B981',
      lastMessage: lastMsg?.text || conv.latest_message || conv.last_message || 'No messages yet',
      lastTime: lastMsg?.time || conv.timestamp || conv.last_message_at || conv.time || '',
      unread: unread[convId] || conv.unread_count || conv.unread || 0,
    });
  }

  // 2. Props leads
  for (const lead of leads) {
    if (!lead.id || seenIds.has(lead.id)) continue;
    seenIds.add(lead.id);

    const msgs = threads[lead.id] || [];
    const lastMsg = msgs[msgs.length - 1];
    chatItems.push({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      initials: lead.initials,
      color: lead.color,
      lastMessage: lastMsg?.text || 'No messages yet',
      lastTime: lastMsg?.time || '',
      unread: unread[lead.id] || 0,
    });
  }

  // 3. In-memory or active threads
  const otherIds = [activeId, ...(currentLead ? [currentLead.id] : []), ...Object.keys(threads)].filter(Boolean);
  for (const oId of otherIds) {
    if (seenIds.has(oId)) continue;
    seenIds.add(oId);

    const l = resolveLead(oId);
    const msgs = threads[oId] || [];
    const lastMsg = msgs[msgs.length - 1];
    chatItems.push({
      id: oId,
      name: l.name,
      phone: l.phone,
      email: l.email,
      initials: l.initials,
      color: l.color,
      lastMessage: lastMsg?.text || 'No messages yet',
      lastTime: lastMsg?.time || '',
      unread: unread[oId] || 0,
    });
  }

  const chats = chatItems;
  const chatLeadIds = chatItems.map((c) => c.id);

  // Sync activeId with activeLeadId or fallback to first chat item
  useEffect(() => {
    if (activeLeadId) {
      setActiveId(activeLeadId);
    } else if (!activeId && chats.length > 0) {
      setActiveId(chats[0].id);
    }
  }, [activeLeadId, chats.length]);

  function selectChat(id: string) {
    setActiveId(id);
    setUnread((u) => ({ ...u, [id]: 0 }));
    if (onSelectLead) {
      onSelectLead(id);
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || !activeId) return;

    const currentActiveId = activeId;
    // Optimistic update
    const optimisticMsg: WhatsAppMessage = {
      id: `opt-${Date.now()}`,
      from_type: 'agent',
      text,
      time: 'Just now',
    };
    setThreads((t) => ({
      ...t,
      [currentActiveId]: [...(t[currentActiveId] || []), optimisticMsg],
    }));

    try {
      const sentMsg = await messagesService.sendWhatsAppMessage(currentActiveId, text);
      const realId = sentMsg.lead_id || sentMsg.contact_id || currentActiveId;

      // Replace optimistic message with response in the thread
      setThreads((t) => {
        const next = { ...t };
        const activeList = (next[currentActiveId] || []).map((m) =>
          m.id === optimisticMsg.id ? sentMsg : m
        );
        if (realId !== currentActiveId) {
          delete next[currentActiveId];
          next[realId] = activeList;
        } else {
          next[realId] = activeList;
        }
        return next;
      });

      if (realId !== currentActiveId) {
        setActiveId(realId);
        if (onSelectLead) {
          onSelectLead(realId);
        }
      }

      // Immediately refetch conversation list so left-side list reflects latest message & recipient without page refresh
      await loadConversations();
    } catch (err) {
      console.error("Failed to send WhatsApp message:", err);
    }
  };

  function openChat(leadId: string) {
    setActiveId(leadId);
    fetchMessages(leadId);
    setNewChatOpen(false);
  }

  function startChatWithNumber(phone: string) {
    const clean = phone.trim();
    // Check if phone matches any existing conversation in DB
    const existing = dbConversations.find(
      (c) => c.phone === clean || c.recipient_phone === clean || c.id === clean || c.lead_id === clean
    );
    if (existing) {
      const targetId = existing.lead_id || existing.id;
      setActiveId(targetId);
      fetchMessages(targetId);
      setNewChatOpen(false);
      return;
    }

    const tempId = `new-${clean}`;
    setThreads((t) => ({ ...t, [tempId]: [] }));
    setActiveId(tempId);
    setNewChatOpen(false);
  }

  const activeLead = resolveLead(activeId);

  return (
    <div className="relative flex-1 min-w-0 bg-white border border-[#E1E4EA] rounded-[10px] flex flex-col overflow-hidden">
      <div className="h-11 shrink-0 flex items-center justify-between px-3.5 border-b border-[#E1E4EA]">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6.2a2 2 0 0 1-2 2H8.4L5 16v-2.8H5a2 2 0 0 1-2-2V5z"
              stroke="#16A34A"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[13px] font-bold text-[#1D2433]">WhatsApp</span>
          <div className="flex items-center gap-1 ml-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
            <span className="text-[10.5px] font-semibold text-brand-green">Connected</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 ml-1">
            {configuredPhone || '+1 (555) 159-5909'}
          </span>
        </div>
        <button
          type="button"
          title="New chat"
          onClick={() => setNewChatOpen(true)}
          className="w-[22px] h-[22px] rounded-full bg-[#DCF3E3] flex items-center justify-center hover:brightness-95 cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10h12" stroke="#16A34A" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        <ChatList chats={chats} activeId={activeId} onSelect={selectChat} />
        <ChatThread lead={activeLead} messages={threads[activeId] || []} onSend={sendMessage} />
      </div>

      {newChatOpen && (
        <NewChatModal
          leads={leads}
          existingThreadIds={chatLeadIds}
          onClose={() => setNewChatOpen(false)}
          onOpenExisting={openChat}
          onStartNew={startChatWithNumber}
        />
      )}
    </div>
  );
}

function fallbackLead(id: string): CRMLead {
  const phone = typeof id === 'string' && id.startsWith('new-') ? id.replace('new-', '') : '';
  const cleanId = id || 'unknown';
  return {
    id: cleanId,
    name: phone || 'Unknown',
    phone,
    email: '',
    initials: '?',
    color: '#8A93A8',
  };
}

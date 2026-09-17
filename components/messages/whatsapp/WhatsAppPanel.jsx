import React, { useState } from 'react'
import { leads, initialWhatsAppThreads } from '@/lib/data/mockMessagesData'
import ChatList from './ChatList'
import ChatThread from './ChatThread'
import NewChatModal from './NewChatModal'

/**
 * Left half of the Messages page. Owns all WhatsApp state for this demo:
 * threads (messages per lead), which chat is open, and the New Conversation
 * modal. In a real build this state — and the send/receive calls — would
 * likely live in a shared store (Redux/Zustand/React Query) so the same
 * thread is visible from anywhere else in the app too.
 */
export default function WhatsAppPanel() {
  const [threads, setThreads] = useState(initialWhatsAppThreads)
  const [activeId, setActiveId] = useState('john-smith')
  const [unread, setUnread] = useState({ 'sara-lee': 1 })
  const [newChatOpen, setNewChatOpen] = useState(false)

  const chatLeadIds = Object.keys(threads)
  const chats = chatLeadIds.map((id) => {
    const lead = leads.find((l) => l.id === id) || fallbackLead(id)
    const msgs = threads[id]
    const last = msgs[msgs.length - 1]
    return { ...lead, lastMessage: last?.text ?? 'No messages yet', lastTime: last?.time ?? '', unread: unread[id] || 0 }
  })

  function selectChat(id) {
    setActiveId(id)
    setUnread((u) => ({ ...u, [id]: 0 }))
  }

  function sendMessage(text) {
    if (!text.trim()) return
    setThreads((t) => ({
      ...t,
      [activeId]: [...(t[activeId] || []), { id: Date.now(), from: 'agent', text, time: 'Just now', read: false }],
    }))
    // INTEGRATION POINT: call your WhatsApp Business API's send-message
    // endpoint here (Meta Cloud API directly, or a BSP like Twilio /
    // Gupshup / 360dialog), addressed to the active lead's phone number.
    // On success, reconcile this optimistic message with the returned
    // message id; on failure, mark it as failed and offer retry.
  }

  function openChat(leadId) {
    setThreads((t) => (t[leadId] ? t : { ...t, [leadId]: [] }))
    setActiveId(leadId)
    setNewChatOpen(false)
  }

  function startChatWithNumber(phone) {
    const tempId = `new-${phone}`
    setThreads((t) => ({ ...t, [tempId]: [] }))
    setActiveId(tempId)
    setNewChatOpen(false)
    // INTEGRATION POINT: this number isn't a lead yet. Either create the
    // lead record in the CRM right here, or let your webhook create it the
    // first time this number replies — then swap this temp id for the real
    // lead id everywhere it's used.
  }

  const activeLead = leads.find((l) => l.id === activeId) || fallbackLead(activeId)

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
        </div>
        <button
          type="button"
          title="New chat"
          onClick={() => setNewChatOpen(true)}
          className="w-[22px] h-[22px] rounded-full bg-brand-greenSoft flex items-center justify-center hover:brightness-95"
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
  )
}

function fallbackLead(id) {
  const phone = typeof id === 'string' && id.startsWith('new-') ? id.replace('new-', '') : ''
  return { id, name: phone || 'Unknown', phone, initials: '?', color: '#8A93A8' }
}

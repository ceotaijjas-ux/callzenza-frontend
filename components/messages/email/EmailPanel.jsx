import React, { useState } from 'react'
import { leads, initialEmails } from '@/lib/data/mockMessagesData'
import InboxList from './InboxList'
import ReadingPane from './ReadingPane'
import ComposeModal from './ComposeModal'

/**
 * Right half of the Messages page. Owns the inbox list, the open thread,
 * and the Compose modal. Same note as WhatsAppPanel: this state would
 * normally live wherever the rest of the app keeps CRM/lead state, so the
 * same thread is visible from anywhere else that shows this lead.
 */
export default function EmailPanel() {
  const [emails, setEmails] = useState(initialEmails)
  const [activeId, setActiveId] = useState(initialEmails[0]?.id)
  const [composeOpen, setComposeOpen] = useState(false)

  const activeEmail = emails.find((e) => e.id === activeId)

  function selectEmail(id) {
    setActiveId(id)
    setEmails((es) => es.map((e) => (e.id === id ? { ...e, unread: false } : e)))
  }

  function reply(text) {
    if (!text.trim()) return
    setEmails((es) =>
      es.map((e) =>
        e.id === activeId
          ? { ...e, replies: [...e.replies, { id: Date.now(), from: 'agent1', time: 'Just now', body: text }] }
          : e,
      ),
    )
    // INTEGRATION POINT: send through your SMTP relay (Amazon SES /
    // SendGrid / Postmark), threaded on the original Message-ID / In-Reply-To
    // header so it lands as one conversation in the customer's inbox.
  }

  function sendNew({ to, subject, body }) {
    const lead = leads.find((l) => l.email === to)
    const newEmail = {
      id: `e${Date.now()}`,
      leadId: lead?.id,
      subject,
      from: 'agent1 (you)',
      fromEmail: 'agent1@callzenza.com',
      time: 'Just now',
      unread: false,
      body,
      replies: [],
    }
    setEmails((es) => [newEmail, ...es])
    setActiveId(newEmail.id)
    setComposeOpen(false)
    // INTEGRATION POINT: same SMTP send path as `reply`, above. Also where
    // you'd validate the sending domain's SPF/DKIM/DMARC are set up before
    // going live — see the integration notes in the README.
  }

  return (
    <div className="relative flex-1 min-w-0 bg-white border border-[#E1E4EA] rounded-[10px] flex flex-col overflow-hidden">
      <div className="h-11 shrink-0 flex items-center justify-between px-3.5 border-b border-[#E1E4EA]">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <rect x="2.5" y="4.5" width="15" height="11" rx="1.6" stroke="#6C63F5" strokeWidth="1.5" />
            <path d="M3 5.5l7 5.5 7-5.5" stroke="#6C63F5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[13px] font-bold text-[#1D2433]">Email</span>
          <div className="flex items-center gap-1 ml-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />
            <span className="text-[10.5px] font-semibold text-brand-indigo">Connected</span>
          </div>
        </div>
        <button
          type="button"
          title="Compose"
          onClick={() => setComposeOpen(true)}
          className="flex items-center gap-1.5 bg-brand-indigoSoft rounded-full pl-2 pr-2.5 py-1 hover:brightness-95"
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
            <path
              d="M13.5 4.5L6 12a2.1 2.1 0 1 0 3 3l7.5-7.5a3.5 3.5 0 1 0-5-5L4 10"
              stroke="#6C63F5"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-[10.5px] font-bold text-brand-indigo">Compose</span>
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        <InboxList emails={emails} activeId={activeId} onSelect={selectEmail} />
        {activeEmail ? (
          <ReadingPane email={activeEmail} onReply={reply} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[11.5px] text-[#9AA2B5]">Select a message</div>
        )}
      </div>

      {composeOpen && (
        <ComposeModal leads={leads} defaultTo={activeEmail} onClose={() => setComposeOpen(false)} onSend={sendNew} />
      )}
    </div>
  )
}

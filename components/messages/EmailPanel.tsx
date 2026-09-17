import React, { useState, useEffect } from 'react';
import InboxList from './InboxList';
import ReadingPane from './ReadingPane';
import ComposeModal from './ComposeModal';
import { messagesService, EmailThread } from '@/lib/services/messages.service';
import { useAuthStore } from '@/lib/store';

interface CRMLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  initials: string;
  color: string;
}

interface EmailPanelProps {
  leads: CRMLead[];
  activeLeadId: string | null;
  currentLead?: CRMLead | null;
}

export default function EmailPanel({ leads, activeLeadId, currentLead }: EmailPanelProps) {
  const { token, user } = useAuthStore();
  const [connected, setConnected] = useState(true);
  const [emails, setEmails] = useState<EmailThread[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  // Check Gmail connection status
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await messagesService.getGmailStatus();
        if (typeof res?.connected === 'boolean') {
          setConnected(res.connected);
        }
      } catch (err) {
        console.error("Failed to check Gmail OAuth status:", err);
      } finally {
        setChecking(false);
      }
    }
    checkStatus();
  }, []);

  // Fetch emails for the active lead
  const fetchEmails = async (leadId: string) => {
    if (!leadId) {
      setEmails([]);
      setActiveId('');
      return;
    }
    try {
      const res = await messagesService.getEmails(leadId);
      if (res && res.length > 0) {
        setEmails(res);
        setActiveId((prev) => (prev && res.some((e) => e.id === prev) ? prev : res[0].id));
      } else {
        setEmails([]);
        setActiveId('');
      }
    } catch (err) {
      console.error("Failed to fetch lead emails:", err);
      setEmails([]);
      setActiveId('');
    }
  };

  useEffect(() => {
    const effectiveLeadId = activeLeadId || (leads.length > 0 ? leads[0].id : null);
    if (connected && effectiveLeadId) {
      fetchEmails(effectiveLeadId);
    }
  }, [connected, activeLeadId]);

  const activeEmail = emails.find((e) => e.id === activeId) || (emails.length > 0 ? emails[0] : undefined);

  function selectEmail(id: string) {
    setActiveId(id);
    // Optimistic read status update
    setEmails((es) => es.map((e) => (e.id === id ? { ...e, unread: false } : e)));
  }

  const handleReply = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const targetLeadId = activeLeadId || activeEmail?.leadId || (leads.length > 0 ? leads[0].id : null);
    const targetEmailId = activeId || activeEmail?.id || (emails.length > 0 ? emails[0].id : null);

    if (!targetLeadId || !targetEmailId) {
      console.warn("Missing lead or thread ID for reply:", { targetLeadId, targetEmailId });
      return;
    }

    // Optimistic reply update
    const newReply = {
      id: `rep-${Date.now()}`,
      from_name: user?.full_name || 'You',
      time: 'Just now',
      body: trimmed,
    };

    setEmails((es) =>
      es.map((e) =>
        e.id === targetEmailId
          ? { ...e, replies: [...(e.replies || []), newReply] }
          : e
      )
    );

    try {
      await messagesService.replyEmail(targetLeadId, targetEmailId, trimmed);
    } catch (err) {
      console.error("Failed to send email reply:", err);
      throw err;
    }
  };

  const handleSendNew = async ({
    to,
    subject,
    body,
    attachments,
  }: {
    to: string;
    subject: string;
    body: string;
    attachments?: Array<{ filename: string; file_id?: string; content_base64?: string; content_type?: string }>;
  }) => {
    const targetLeadId = activeLeadId || (leads.find((l) => l.email === to)?.id) || (leads.length > 0 ? leads[0].id : "direct");
    try {
      const newEmail = await messagesService.sendEmail(targetLeadId, to, subject, body, attachments);
      setEmails((es) => [newEmail, ...es]);
      setActiveId(newEmail.id);
      setComposeOpen(false);
    } catch (err) {
      console.error("Failed to send compose email:", err);
      throw err;
    }
  };

  const handleConnect = () => {
    // Redirect to backend OAuth start URL with token in query params
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    const startUrl = `${apiBase}/api/messages/gmail/oauth/start?token=${token}`;
    window.location.href = startUrl;
  };

  const handleDisconnect = async () => {
    try {
      await messagesService.disconnectGmail();
      setConnected(false);
      setEmails([]);
      setActiveId('');
    } catch (err) {
      console.error("Failed to disconnect Gmail:", err);
    }
  };

  if (checking) {
    return (
      <div className="flex-1 min-w-0 bg-white border border-[#E1E4EA] rounded-[10px] flex items-center justify-center">
        <span className="text-[12px] text-slate-400 font-semibold animate-pulse">Checking Email Connection...</span>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-w-0 bg-white border border-[#E1E4EA] rounded-[10px] flex flex-col overflow-hidden">
      <div className="h-11 shrink-0 flex items-center justify-between px-3.5 border-b border-[#E1E4EA]">
        <div className="flex items-center gap-2">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <span className="text-[13.5px] font-bold text-[#1D2433]">Email</span>
          <div className="flex items-center gap-1.5 ml-1">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-[#4F46E5]' : 'bg-slate-300'}`} />
            <span className={`text-[11px] font-semibold ${connected ? 'text-[#4F46E5]' : 'text-slate-400'}`}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {connected ? (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDisconnect}
              className="text-[11px] font-semibold text-[#EA384C] bg-[#FEECEC] hover:bg-[#FCD8D8] rounded-full px-3.5 py-1 cursor-pointer transition-colors"
            >
              Disconnect
            </button>
            <button
              type="button"
              title="Compose"
              onClick={() => setComposeOpen(true)}
              className="flex items-center gap-1.5 bg-[#EEF0FF] hover:bg-[#E0E4FF] text-[#6366F1] rounded-full px-3.5 py-1 cursor-pointer transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              <span className="text-[11px] font-semibold">Compose</span>
            </button>
          </div>
        ) : null}
      </div>

      {connected ? (
        <div className="flex-1 flex min-h-0">
          <InboxList emails={emails} activeId={activeId} onSelect={selectEmail} />
          {activeEmail ? (
            <ReadingPane email={activeEmail} onReply={handleReply} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
              <div className="w-12 h-12 rounded-full bg-[#EEF0FF] flex items-center justify-center mb-3">
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                  <rect x="2.5" y="4.5" width="15" height="11" rx="1.6" stroke="#6C63F5" strokeWidth="1.8" />
                  <path d="M3 5.5l7 5.5 7-5.5" stroke="#6C63F5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="text-[14px] font-bold text-[#1D2433] mb-1">
                No Emails Yet
              </h4>
              <p className="text-[11.5px] text-[#8A93A8] max-w-[280px] mb-4 leading-relaxed">
                {currentLead?.email
                  ? `No email conversation history with ${currentLead.name} (${currentLead.email}).`
                  : `No email address on file for ${currentLead?.name || 'this lead'}.`}
              </p>
              {currentLead?.email && (
                <button
                  type="button"
                  onClick={() => setComposeOpen(true)}
                  className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-lg px-4 py-2 text-[12px] font-bold cursor-pointer shadow-xs hover:shadow-sm transition-all"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                  Compose Email to {currentLead.name}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50">
          <div className="w-12 h-12 rounded-full bg-[#EEF0FF] flex items-center justify-center mb-3">
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
              <rect x="2.5" y="4.5" width="15" height="11" rx="1.6" stroke="#6C63F5" strokeWidth="1.8" />
              <path d="M3 5.5l7 5.5 7-5.5" stroke="#6C63F5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h4 className="text-[13px] font-bold text-[#1D2433] mb-1">Email Account Not Connected</h4>
          <p className="text-[11px] text-[#8A93A8] max-w-[280px] mb-4">
            Connect your Email account via Google OAuth to send and receive customer emails.
          </p>
          <button
            type="button"
            onClick={handleConnect}
            className="bg-brand-indigo hover:bg-brand-indigo/95 text-white text-[11.5px] font-bold px-4 py-2 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
          >
            Connect Email
          </button>
        </div>
      )}

      {composeOpen && (
        <ComposeModal leads={leads} currentLead={currentLead} defaultTo={activeEmail} onClose={() => setComposeOpen(false)} onSend={handleSendNew} />
      )}
    </div>
  );
}

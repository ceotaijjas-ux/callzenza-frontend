import React, { useState, useRef } from 'react';
import { EmailThread } from '@/lib/services/messages.service';
import { useAuthStore } from '@/lib/store';

function formatFileSize(bytes: number) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

interface CRMLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  initials: string;
  color: string;
}

interface ComposeModalProps {
  leads: CRMLead[];
  currentLead?: CRMLead | null;
  defaultTo?: EmailThread;
  onClose: () => void;
  onSend: (data: {
    to: string;
    subject: string;
    body: string;
    attachments?: Array<{ filename: string; file_id?: string; content_base64?: string; content_type?: string }>;
  }) => Promise<void> | void;
}

export default function ComposeModal({ leads, currentLead, defaultTo, onClose, onSend }: ComposeModalProps) {
  const defaultLead = leads.find((l) => l.id === defaultTo?.leadId);
  const [to, setTo] = useState(
    defaultLead?.email ||
    defaultTo?.fromEmail ||
    currentLead?.email ||
    ''
  );
  const [subject, setSubject] = useState(() => {
    if (defaultTo) {
      return defaultTo.subject.toLowerCase().startsWith('re:') ? defaultTo.subject : `Re: ${defaultTo.subject}`;
    }
    if (currentLead?.name) {
      return `Information Regarding Call - ${currentLead.name}`;
    }
    return '';
  });
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const canSend = Boolean(to.trim() && subject.trim());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<
    { name: string; sizeStr: string; url?: string; file_id?: string; base64?: string; type?: string }[]
  >([]);

  const handleSend = async () => {
    if (!canSend || sending || uploading) return;
    setSendError(null);
    setSending(true);
    try {
      await onSend({
        to: to.trim(),
        subject: subject.trim(),
        body,
        attachments: attachedFiles.map((f) => ({
          filename: f.name,
          file_id: f.file_id,
          content_base64: f.base64,
          content_type: f.type,
        })),
      });
    } catch (err: any) {
      const msg = err?.message || err?.detail || 'Failed to send email. Please check your Gmail connection.';
      setSendError(msg);
      if (msg.includes("authorization") || msg.includes("OAuth") || msg.includes("401") || msg.includes("connect")) {
        window.open('/auth/google', '_blank', 'width=520,height=620');
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canSend && !sending) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      let fileUrl = '';
      let fileId = '';
      const token = useAuthStore.getState().token;

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/files', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        fileUrl = `/api/files/${data.id}/download`;
        fileId = data.id;
      }

      // Read as base64 to guarantee attachment content is available
      const reader = new FileReader();
      reader.onload = () => {
        const base64Content = (reader.result as string).split(',')[1] || '';
        const sizeStr = formatFileSize(file.size);
        setAttachedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            sizeStr,
            url: fileUrl,
            file_id: fileId,
            base64: base64Content,
            type: file.type || 'application/octet-stream',
          },
        ]);
      };
      reader.readAsDataURL(file);

      const attachText = `Attached: ${file.name}`;
      setBody((prev) => (prev ? `${prev}\n\n${attachText}` : attachText));
    } catch (err) {
      console.error('File attach error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[540px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span className="text-sm font-bold tracking-tight">New Email Message</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* To Input */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 w-12">To</span>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Search contacts or type an email..."
            list="lead-emails"
            className="flex-1 text-xs text-slate-800 font-medium outline-none placeholder:text-slate-400 bg-transparent"
          />
          <datalist id="lead-emails">
            {leads.map((l) => (
              <option key={l.id} value={l.email}>
                {l.name} ({l.email})
              </option>
            ))}
          </datalist>
        </div>

        {/* Subject Input */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 w-12">Subject</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject line..."
            className="flex-1 text-xs font-semibold text-slate-900 outline-none bg-transparent placeholder:text-slate-400"
          />
        </div>

        {/* Body Textarea */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write your email message... (Press Ctrl+Enter to send)"
          rows={8}
          className="flex-1 px-5 py-4 text-xs leading-relaxed text-slate-700 outline-none resize-none placeholder:text-slate-400 bg-slate-50/40 focus:bg-white transition-colors"
        />

        {/* Attached Files List */}
        {attachedFiles.length > 0 && (
          <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">
            {attachedFiles.map((f, i) => (
              <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 shrink-0">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                <span className="truncate max-w-[200px]">{f.name}</span>
                <span className="text-[10px] text-slate-400">({f.sizeStr})</span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== i));
                    setBody((prev) => prev.replace(new RegExp(`\\n?\\n?Attached:\\s*${f.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '').trim());
                  }}
                  className="text-slate-400 hover:text-rose-500 transition-colors ml-1 cursor-pointer"
                  title="Remove attachment"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileAttach}
          className="hidden"
        />

        {/* Send Error Notice */}
        {sendError && (
          <div className="px-5 py-2.5 bg-rose-50 border-t border-rose-200/80 flex items-center justify-between text-xs text-rose-700 font-medium">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0 text-rose-500">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                <line x1="10" y1="6" x2="10" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="10" cy="14" r="1" fill="currentColor" />
              </svg>
              <span>{sendError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSendError(null)}
              className="text-rose-400 hover:text-rose-600 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            {uploading ? (
              <svg className="w-3.5 h-3.5 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            )}
            <span>{uploading ? 'Attaching...' : 'Attach File'}</span>
          </button>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSend || uploading || sending}
              onClick={handleSend}
              className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                canSend && !uploading && !sending
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98 shadow-indigo-200'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {sending ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>Send Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

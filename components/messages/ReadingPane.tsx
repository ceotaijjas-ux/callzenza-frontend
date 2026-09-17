import React, { useState, useRef, useEffect } from 'react';
import { EmailThread } from '@/lib/services/messages.service';
import { useAuthStore } from '@/lib/store';

interface ReadingPaneProps {
  email: EmailThread;
  onReply: (text: string) => Promise<void> | void;
}

export default function ReadingPane({ email, onReply }: ReadingPaneProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation thread when new reply is added or on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [email.replies]);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onReply(trimmed);
      setText('');
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 2500);
    } catch (err: any) {
      console.error("Failed to send reply:", err);
      const errMsg = err?.message || err?.detail || "";
      if (errMsg.includes("authorization") || errMsg.includes("OAuth") || errMsg.includes("401") || errMsg.includes("connect")) {
        window.open('/auth/google', '_blank', 'width=520,height=620');
      }
    } finally {
      setSending(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = useAuthStore.getState().token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);

      const res = await fetch('/api/files', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      if (!res.ok) {
        console.warn('Backend file upload returned non-ok status:', res.status);
        const attachmentNote = `📎 Attached: ${file.name} (${sizeStr})`;
        setText((prev) => (prev.trim() ? `${prev}\n\n${attachmentNote}` : attachmentNote));
        return;
      }

      const data = await res.json();
      const fileUrl = data?.download_url || (data?.id ? `/api/files/${data.id}/download` : '');
      const attachmentNote = fileUrl
        ? `📎 Attached: [${file.name}](${fileUrl}) (${sizeStr})`
        : `📎 Attached: ${file.name} (${sizeStr})`;
      setText((prev) => (prev.trim() ? `${prev}\n\n${attachmentNote}` : attachmentNote));
    } catch (err) {
      console.warn('Failed to upload file attachment:', err);
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      const attachmentNote = `📎 Attached: ${file.name} (${sizeStr})`;
      setText((prev) => (prev.trim() ? `${prev}\n\n${attachmentNote}` : attachmentNote));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white">
      {/* Hidden file input for attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Message Header */}
      <div className="px-5 py-3.5 border-b border-[#E1E4EA] shrink-0">
        <h2 className="text-[15.5px] font-bold text-[#1D2433] leading-snug mb-1">
          {email.subject}
        </h2>
        <div className="text-[11px] text-[#8A93A8]">
          From: {email.from_name} &lt;{email.fromEmail}&gt; &middot; {email.time}
        </div>
      </div>

      {/* Message Body Content */}
      <div ref={scrollRef} className="cz-scroll flex-1 px-5 py-4 overflow-y-auto">
        <p className="whitespace-pre-line text-[12px] leading-relaxed text-[#2D3748]">
          {email.body}
        </p>

        {/* Render attached file card if body references an attachment */}
        {(() => {
          const match = email.body.match(/Attached:\s*([^\r\n]+)/);
          if (!match) return null;
          const fullMatch = match[1].replace(/[📎\[\]\(\)]/g, ' ').trim();
          const fileName = fullMatch.split(/\s+/)[0] || 'attachment';
          const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';
          return (
            <div className="mt-3.5 p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-center justify-between gap-3 max-w-md animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="px-2 py-1 rounded bg-[#5B4DF6] text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                  {ext}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{fileName}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Attached file &middot; Original {ext} format</p>
                </div>
              </div>
              <a
                href={`/api/files/download-by-name?filename=${encodeURIComponent(fileName)}`}
                download={fileName}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-50 text-[#5B4DF6] text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download</span>
              </a>
            </div>
          );
        })()}

        {email.replies && email.replies.map((r) => (
          <div key={r.id} className="mt-4 pt-3.5 border-t border-dashed border-[#E1E4EA] animate-in fade-in duration-200">
            <div className="text-[10.5px] text-[#8A93A8] mb-1.5 font-semibold">
              {r.from_name} &middot; {r.time}
            </div>
            <p className="whitespace-pre-line text-[12px] leading-relaxed text-[#2D3748] bg-[#F7F8FA] p-3 rounded-lg border border-[#E1E4EA]/70">
              {r.body}
            </p>
          </div>
        ))}
      </div>

      {/* Reply Box Section */}
      <div className="shrink-0 border-t border-[#E1E4EA] p-4 bg-white">
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-3.5 text-[#7A8294] mb-2 px-0.5">
          <button
            type="button"
            title="Bold"
            onClick={() => setText((prev) => prev ? `**${prev}**` : '**bold**')}
            className="text-[13px] font-bold hover:text-[#1D2433] cursor-pointer transition-colors leading-none"
          >
            B
          </button>
          <button
            type="button"
            title="Underline"
            onClick={() => setText((prev) => prev ? `<u>${prev}</u>` : '<u>underline</u>')}
            className="text-[13px] underline font-semibold hover:text-[#1D2433] cursor-pointer transition-colors leading-none"
          >
            U
          </button>
          <button
            type="button"
            title="List"
            onClick={() => setText((prev) => prev ? `${prev}\n- ` : '- ')}
            className="hover:text-[#1D2433] cursor-pointer transition-colors flex items-center"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <button
            type="button"
            title="Attach file"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="hover:text-[#6366F1] cursor-pointer transition-colors flex items-center gap-1"
          >
            {uploading ? (
              <svg className="animate-spin h-3.5 w-3.5 text-[#6366F1]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            )}
            {uploading && <span className="text-[10px] text-[#6366F1] font-semibold">Uploading...</span>}
          </button>
        </div>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a reply..."
          rows={3}
          className="w-full bg-[#F8FAFC] focus:bg-white border border-[#E1E4EA] focus:border-[#6366F1] rounded-lg p-3 text-[12px] text-[#1D2433] outline-none placeholder:text-[#9AA2B5] transition-all resize-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
        />

        {/* Action Button */}
        <div className="flex justify-end mt-2.5">
          <button
            type="button"
            onClick={send}
            disabled={!text.trim() || sending}
            className={`text-[12px] font-bold px-7 py-2 rounded-lg transition-all duration-150 shadow-sm ${
              sentSuccess
                ? 'bg-emerald-600 text-white cursor-default'
                : !text.trim() || sending
                ? 'bg-[#5B50EC]/60 text-white/80 cursor-not-allowed'
                : 'bg-[#5B50EC] hover:bg-[#4F46E5] text-white active:scale-95 cursor-pointer shadow-md'
            }`}
          >
            {sending ? 'Sending...' : sentSuccess ? 'Sent' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

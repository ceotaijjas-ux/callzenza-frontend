import React, { useState, useRef } from 'react';
import { WhatsAppMessage } from '@/lib/services/messages.service';
import { useAuthStore } from '@/lib/store';
import { Paperclip, FileText, Download, Loader2, Image as ImageIcon, Send } from 'lucide-react';

interface ChatThreadProps {
  lead: {
    id: string;
    name: string;
    phone: string;
    initials: string;
    color: string;
  };
  messages: WhatsAppMessage[];
  onSend: (text: string) => void;
}

function formatFileSize(bytes: number) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function renderMessageContent(text: string) {
  const fileRegex = /(?:📎|📷)\s*\[(?:File|Image):\s*([^\]]+)\]\(([^)]+)\)\s*(?:\(([^)]+)\))?/i;
  const match = text.match(fileRegex);

  if (match) {
    const fileName = match[1];
    const fileUrl = match[2];
    const fileSize = match[3] || '';
    const remainingText = text.replace(match[0], '').trim();
    const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName) || text.includes('📷');

    return (
      <div className="flex flex-col gap-1.5 min-w-[200px] max-w-[280px]">
        {isImage && fileUrl && fileUrl !== '#' ? (
          <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900/5 shadow-xs">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block group relative">
              <img
                src={fileUrl}
                alt={fileName}
                className="w-full max-h-[180px] object-cover hover:opacity-95 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[2px]">
                <Download className="w-3.5 h-3.5" /> View / Download
              </div>
            </a>
            <div className="px-2 py-1.5 text-[10px] text-slate-700 flex items-center justify-between bg-white/90 border-t border-slate-100">
              <span className="truncate max-w-[170px] font-medium" title={fileName}>{fileName}</span>
              <span className="text-slate-400 font-mono text-[9px]">{fileSize}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/80 border border-slate-200/90 shadow-xs hover:bg-white transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-slate-800 truncate" title={fileName}>
                {fileName}
              </div>
              <div className="text-[9.5px] text-slate-400 font-mono flex items-center justify-between mt-0.5">
                <span>{fileSize}</span>
                {fileUrl && fileUrl !== '#' && (
                  <a
                    href={fileUrl}
                    download={fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline inline-flex items-center gap-0.5"
                  >
                    <Download className="w-3 h-3" /> Download
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
        {remainingText && (
          <div className="text-[11.5px] text-[#1D2433] whitespace-pre-wrap leading-relaxed mt-1">
            {remainingText}
          </div>
        )}
      </div>
    );
  }

  return <div className="text-[11.5px] text-[#1D2433] whitespace-pre-wrap leading-relaxed">{text}</div>;
}

export default function ChatThread({ lead, messages, onSend }: ChatThreadProps) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      let fileUrl = '';
      const token = useAuthStore.getState().token;

      // Try backend upload
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/files', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          fileUrl = `/api/files/${data.id}/download`;
        }
      } catch (uploadErr) {
        console.warn('Backend file upload fallback:', uploadErr);
      }

      // If backend file endpoint was unavailable or returned error, use object URL preview
      if (!fileUrl) {
        fileUrl = URL.createObjectURL(file);
      }

      const sizeStr = formatFileSize(file.size);
      const isImg = file.type.startsWith('image/');

      const fileMsg = isImg
        ? `📷 [Image: ${file.name}](${fileUrl}) (${sizeStr})`
        : `📎 [File: ${file.name}](${fileUrl}) (${sizeStr})`;

      const finalContent = text.trim() ? `${fileMsg}\n${text.trim()}` : fileMsg;
      onSend(finalContent);
      setText('');
    } catch (err) {
      console.error('Failed to attach file:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="h-[46px] shrink-0 flex items-center gap-2.5 px-3 border-b border-[#E1E4EA] bg-white">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10.5px] font-bold shadow-xs"
          style={{ backgroundColor: lead.color || '#6C63F5' }}
        >
          {lead.initials || 'WA'}
        </div>
        <div>
          <div className="text-[12px] font-bold text-[#1D2433]">
            {(!lead.name || lead.name === 'Lead' || lead.name === 'Customer' || lead.name === 'Unknown')
              ? (lead.phone || lead.name || 'WhatsApp Contact')
              : lead.name}
          </div>
          <div className="text-[9.5px] text-brand-green font-medium">{lead.phone || 'No phone number'} &middot; online</div>
        </div>
      </div>

      {/* Messages list */}
      <div className="cz-scroll flex-1 p-3 flex flex-col gap-2 overflow-auto bg-[#F7F8FA]">
        {messages.length === 0 && (
          <div className="m-auto text-[11.5px] text-[#9AA2B5]">No messages yet &mdash; say hello or share a document.</div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              'max-w-[75%] rounded-xl px-3 py-2 shadow-xs ' +
              (m.from_type === 'agent'
                ? 'self-end bg-brand-greenSoft border border-emerald-100 text-emerald-950 rounded-tr-xs'
                : 'self-start bg-white border border-[#E1E4EA] rounded-tl-xs')
            }
          >
            {renderMessageContent(m.text)}
            <div className="text-[8.5px] text-[#8E97A6] mt-1 text-right font-medium">
              {m.time}
              {m.from_type === 'agent' && <span className="text-[#10B981] font-bold"> &#10003;&#10003;</span>}
            </div>
          </div>
        ))}

        {uploading && (
          <div className="self-end bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-3 py-2 text-xs flex items-center gap-2 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>Uploading and sending file...</span>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Input bar */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-t border-[#E1E4EA] bg-white">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Upload file (PDF, image, document)"
          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={uploading ? 'Uploading file...' : 'Type a message (or click 📎 to send a file)'}
          disabled={uploading}
          className="flex-1 bg-[#F1F2F5] focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded-full px-3.5 py-1.5 text-[11.5px] outline-none placeholder:text-[#9AA2B5] transition-all"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || uploading}
          title="Send message"
          className="w-7 h-7 rounded-full bg-brand-green disabled:bg-slate-200 disabled:cursor-not-allowed shrink-0 flex items-center justify-center text-white hover:brightness-95 cursor-pointer shadow-xs transition-all"
        >
          <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

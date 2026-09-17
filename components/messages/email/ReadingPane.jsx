import React, { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'

export default function ReadingPane({ email, onReply }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [email?.replies])

  async function send() {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      await onReply(trimmed)
      setText('')
      setSentSuccess(true)
      setTimeout(() => setSentSuccess(false), 2500)
    } catch (err) {
      console.error('Failed to send reply:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      send()
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const token = useAuthStore.getState().token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name)

      const res = await fetch('/api/files', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`

      if (!res.ok) {
        console.warn('Backend file upload returned non-ok status:', res.status)
        const attachmentNote = `📎 Attached: ${file.name} (${sizeStr})`
        setText((prev) => (prev.trim() ? `${prev}\n\n${attachmentNote}` : attachmentNote))
        return
      }

      const data = await res.json()
      const fileUrl = data?.download_url || (data?.id ? `/api/files/${data.id}/download` : '')
      const attachmentNote = fileUrl
        ? `📎 Attached: [${file.name}](${fileUrl}) (${sizeStr})`
        : `📎 Attached: ${file.name} (${sizeStr})`
      setText((prev) => (prev.trim() ? `${prev}\n\n${attachmentNote}` : attachmentNote))
    } catch (err) {
      console.warn('Failed to upload file attachment:', err)
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`
      const attachmentNote = `📎 Attached: ${file.name} (${sizeStr})`
      setText((prev) => (prev.trim() ? `${prev}\n\n${attachmentNote}` : attachmentNote))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="px-3.5 pt-3 pb-2.5 border-b border-[#E1E4EA] shrink-0">
        <div className="text-[13.5px] font-bold text-[#1D2433] mb-1">{email.subject}</div>
        <div className="text-[10.5px] text-[#8A93A8]">
          From: {email.from_name || email.from} &lt;{email.fromEmail}&gt; &middot; {email.time}
        </div>
      </div>

      <div ref={scrollRef} className="cz-scroll flex-1 p-3.5 overflow-auto">
        <p className="whitespace-pre-line text-[11.5px] leading-7 text-[#3A4254]">{email.body}</p>
        {email.replies && email.replies.map((r) => (
          <div key={r.id} className="mt-3 pt-3 border-t border-dashed border-[#E1E4EA] animate-in fade-in duration-200">
            <div className="text-[10px] text-[#8A93A8] mb-1 font-semibold">
              {r.from_name || r.from} &middot; {r.time}
            </div>
            <p className="whitespace-pre-line text-[11.5px] leading-7 text-[#3A4254] bg-[#F7F8FA] p-2.5 rounded-lg border border-[#E1E4EA]/60">
              {r.body}
            </p>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-[#E1E4EA] px-3.5 py-2.5 bg-[#FCFDFF]">
        <div className="flex items-center gap-2.5 text-[#8A93A8] mb-2">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="cursor-pointer hover:text-[#1D2433] transition-colors" title="Bold">
            <path d="M5 3h6a3 3 0 0 1 0 6H5zM5 9h7a3 3 0 0 1 0 6H5z" stroke="currentColor" strokeWidth="1.6" fill="none" />
          </svg>
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="cursor-pointer hover:text-[#1D2433] transition-colors" title="Underline">
            <path d="M5 3v6a5 5 0 0 0 10 0V3M4 17h12" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="cursor-pointer hover:text-[#1D2433] transition-colors" title="List">
            <path d="M3 4h14M3 9h10M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <button
            type="button"
            title="Attach file"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-[#8A93A8] hover:text-brand-indigo transition-colors cursor-pointer flex items-center gap-1"
          >
            {uploading ? (
              <svg className="animate-spin h-3 w-3 text-brand-indigo" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                <path
                  d="M13.5 4.5L6 12a2.1 2.1 0 1 0 3 3l7.5-7.5a3.5 3.5 0 1 0-5-5L4 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {uploading && <span className="text-[10px] text-brand-indigo font-medium">Uploading...</span>}
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a reply... (Ctrl + Enter to send)"
          rows={2}
          className="w-full bg-[#F7F8FA] focus:bg-white border border-[#E1E4EA] focus:border-brand-indigo rounded-md px-2.5 py-2 text-[11.5px] outline-none placeholder:text-[#9AA2B5] transition-all resize-none mb-2.5"
        />

        <div className="flex items-center justify-between">
          <div className="text-[10px] text-[#8A93A8]">
            Press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-mono">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-mono">Enter</kbd> to send
          </div>

          <button
            type="button"
            onClick={send}
            disabled={!text.trim() || sending}
            className={`flex items-center gap-1.5 text-[11.5px] font-bold px-4 py-1.5 rounded-md transition-all duration-150 ${
              sentSuccess
                ? 'bg-emerald-600 text-white cursor-default shadow-sm'
                : !text.trim() || sending
                ? 'bg-brand-indigo/50 text-white/80 cursor-not-allowed'
                : 'bg-brand-indigo text-white hover:brightness-105 active:scale-95 cursor-pointer shadow-sm hover:shadow'
            }`}
          >
            {sending ? (
              <>
                <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Sending...</span>
              </>
            ) : sentSuccess ? (
              <>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Sent ✓</span>
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 10l16-8-6 16-3-6-7-2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

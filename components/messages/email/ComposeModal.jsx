import React, { useState } from 'react'

export default function ComposeModal({ leads, defaultTo, onClose, onSend }) {
  const defaultLead = leads.find((l) => l.id === defaultTo?.leadId)
  const [to, setTo] = useState(defaultLead ? defaultLead.email : '')
  const [subject, setSubject] = useState(() => {
    if (!defaultTo) return ''
    return defaultTo.subject.toLowerCase().startsWith('re:') ? defaultTo.subject : `Re: ${defaultTo.subject}`
  })
  const [body, setBody] = useState('')

  const canSend = Boolean(to.trim() && subject.trim())

  const handleSend = () => {
    if (!canSend) return
    onSend({ to: to.trim(), subject: subject.trim(), body })
  }

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canSend) {
      e.preventDefault()
      handleSend()
    }
  }

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

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Ctrl + Enter to send
          </span>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSend}
              onClick={handleSend}
              className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                canSend
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98 shadow-indigo-200'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              <span>Send Email</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

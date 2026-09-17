import React, { useState } from 'react'

export default function ChatList({ chats, activeId, onSelect }) {
  const [query, setQuery] = useState('')
  const filtered = chats.filter((c) => {
    const isGeneric = !c.name || c.name.trim() === '' || c.name === 'Lead' || c.name === 'Customer' || c.name === 'Unknown'
    const name = (isGeneric ? (c.phone || c.name || '') : c.name).toLowerCase()
    const phone = (c.phone || '').toLowerCase()
    const q = query.toLowerCase()
    return name.includes(q) || phone.includes(q)
  })

  return (
    <div className="w-[200px] shrink-0 border-r border-[#E1E4EA] flex flex-col">
      <div className="p-2.5 shrink-0">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search or start new chat"
          className="w-full bg-[#F1F2F5] rounded-md px-2.5 py-1.5 text-[11px] text-[#4A5568] placeholder:text-[#9AA2B5] outline-none"
        />
      </div>
      <div className="cz-scroll overflow-auto">
        {filtered.map((chat) => {
          const isGenericName = !chat.name || chat.name.trim() === '' || chat.name === 'Lead' || chat.name === 'Customer' || chat.name === 'Unknown'
          const displayName = isGenericName ? (chat.phone || chat.name || 'WhatsApp Contact') : chat.name
          const displayInitials = (!chat.initials || chat.initials === '?' || isGenericName)
            ? (displayName.startsWith('+') ? 'WA' : displayName.slice(0, 2).toUpperCase())
            : chat.initials

          return (
            <button
              key={chat.id}
              type="button"
              onClick={() => onSelect(chat.id)}
              className={
                'w-full flex items-center gap-2 p-2.5 text-left border-l-2 transition-colors ' +
                (chat.id === activeId ? 'bg-brand-indigoSoft border-brand-indigo' : 'border-transparent hover:bg-[#F7F8FA]')
              }
            >
              <div
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                style={{ backgroundColor: chat.color || '#10B981' }}
              >
                {displayInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="text-[11.5px] font-bold text-[#1D2433] truncate" title={displayName}>{displayName}</span>
                  <span className="text-[9px] text-[#9AA2B5] shrink-0">{chat.lastTime}</span>
                </div>
                {chat.phone && displayName !== chat.phone && (
                  <div className="text-[9.5px] text-[#8A93A8] font-mono truncate">{chat.phone}</div>
                )}
                <div className="text-[10.5px] text-[#7A8294] truncate">{chat.lastMessage}</div>
              </div>
              {chat.unread > 0 && (
                <span className="w-[15px] h-[15px] rounded-full bg-brand-green text-white text-[8.5px] flex items-center justify-center shrink-0">
                  {chat.unread}
                </span>
              )}
            </button>
          )
        })}
        {filtered.length === 0 && <div className="p-3 text-[11px] text-[#9AA2B5]">No chats match "{query}".</div>}
      </div>
    </div>
  )
}

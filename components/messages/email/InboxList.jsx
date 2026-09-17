import React, { useState } from 'react'

export default function InboxList({ emails, activeId, onSelect }) {
  const [tab, setTab] = useState('inbox')
  const shown = tab === 'inbox' ? emails : []

  return (
    <div className="w-[200px] shrink-0 border-r border-[#E1E4EA] flex flex-col">
      <div className="flex gap-3.5 px-2.5 pt-2.5 shrink-0">
        <TabBtn active={tab === 'inbox'} onClick={() => setTab('inbox')}>
          Inbox
        </TabBtn>
        <TabBtn active={tab === 'sent'} onClick={() => setTab('sent')}>
          Sent
        </TabBtn>
      </div>
      <div className="cz-scroll overflow-auto border-t border-[#EEF0F3] mt-2">
        {shown.map((email) => (
          <button
            key={email.id}
            type="button"
            onClick={() => onSelect(email.id)}
            className={
              'w-full text-left p-2.5 border-l-2 ' +
              (email.id === activeId ? 'bg-brand-indigoSoft border-brand-indigo' : 'border-transparent hover:bg-[#F7F8FA]')
            }
          >
            <div className="flex justify-between gap-2">
              <span
                className={
                  email.unread
                    ? 'text-[11.5px] truncate font-bold text-[#1D2433]'
                    : 'text-[11.5px] truncate font-semibold text-[#1D2433]'
                }
              >
                {email.from}
              </span>
              <span className="text-[9px] text-[#9AA2B5] shrink-0">{email.time}</span>
            </div>
            <div className="text-[10.5px] text-[#1D2433] truncate mt-0.5">{email.subject}</div>
            <div className="text-[10px] text-[#7A8294] truncate">{email.body}</div>
          </button>
        ))}
        {shown.length === 0 && <div className="p-3 text-[11px] text-[#9AA2B5]">Nothing here yet.</div>}
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'text-[10.5px] pb-1.5 ' +
        (active ? 'font-bold text-[#1D2433] border-b-2 border-brand-indigo' : 'font-semibold text-[#9AA2B5]')
      }
    >
      {children}
    </button>
  )
}

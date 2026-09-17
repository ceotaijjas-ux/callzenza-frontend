import React, { useState } from 'react';
import { EmailThread } from '@/lib/services/messages.service';

interface InboxListProps {
  emails: EmailThread[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function InboxList({ emails, activeId, onSelect }: InboxListProps) {
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  
  const shown = tab === 'inbox' 
    ? emails 
    : emails.filter(e => e.from_name.toLowerCase().includes('you') || e.from_name.toLowerCase().includes('agent'));

  return (
    <div className="w-[210px] shrink-0 border-r border-[#E1E4EA] flex flex-col bg-white">
      <div className="flex gap-4 px-3.5 pt-3 pb-0 shrink-0 border-b border-[#E1E4EA]">
        <TabBtn active={tab === 'inbox'} onClick={() => setTab('inbox')}>
          Inbox
        </TabBtn>
        <TabBtn active={tab === 'sent'} onClick={() => setTab('sent')}>
          Sent
        </TabBtn>
      </div>
      <div className="cz-scroll overflow-auto flex-1">
        {shown.map((email) => {
          const isSelected = email.id === activeId;
          return (
            <button
              key={email.id}
              type="button"
              onClick={() => onSelect(email.id)}
              className={`w-full text-left px-3.5 py-2.5 border-l-[3px] transition-colors cursor-pointer border-b border-[#F0F2F5] ${
                isSelected
                  ? 'bg-[#F4F6FF] border-[#6366F1]'
                  : 'border-transparent hover:bg-[#F9FAFB]'
              }`}
            >
              <div className="flex justify-between items-baseline gap-1.5">
                <span className="text-[12px] truncate font-bold text-[#1D2433]">
                  {email.from_name}
                </span>
                <span className="text-[9.5px] text-[#8A93A8] shrink-0 font-normal">
                  {email.time}
                </span>
              </div>
              <div className="text-[11px] text-[#1D2433] font-medium truncate mt-0.5">
                {email.subject}
              </div>
              <div className="text-[10.5px] text-[#7A8294] truncate mt-0.5 font-normal">
                {email.body}
              </div>
            </button>
          );
        })}
        {shown.length === 0 && <div className="p-3.5 text-[11px] text-[#9AA2B5]">Nothing here yet.</div>}
      </div>
    </div>
  );
}

interface TabBtnProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabBtn({ active, onClick, children }: TabBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[12px] pb-2 cursor-pointer transition-colors ${
        active
          ? 'font-bold text-[#1D2433] border-b-2 border-[#6366F1]'
          : 'font-semibold text-[#8A93A8] hover:text-[#1D2433] border-b-2 border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

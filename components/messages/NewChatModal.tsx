import React, { useState } from 'react';

interface CRMLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  initials: string;
  color: string;
}

interface NewChatModalProps {
  leads: CRMLead[];
  existingThreadIds: string[];
  onClose: () => void;
  onOpenExisting: (id: string) => void;
  onStartNew: (phone: string) => void;
}

export interface CountryOption {
  code: string;
  iso: string;
  name: string;
  flag: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: '+91', iso: 'IN', name: 'India', flag: '🇮🇳' },
  { code: '+1', iso: 'US', name: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', iso: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', iso: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+966', iso: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+65', iso: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: '+61', iso: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: '+60', iso: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+49', iso: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', iso: 'FR', name: 'France', flag: '🇫🇷' },
  { code: '+34', iso: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: '+39', iso: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: '+81', iso: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: '+86', iso: 'CN', name: 'China', flag: '🇨🇳' },
  { code: '+852', iso: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: '+92', iso: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', iso: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', iso: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+977', iso: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: '+62', iso: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', iso: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: '+66', iso: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: '+84', iso: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+974', iso: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: '+968', iso: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: '+965', iso: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+973', iso: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: '+20', iso: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: '+27', iso: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: '+234', iso: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', iso: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: '+55', iso: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: '+52', iso: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: '+54', iso: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: '+353', iso: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: '+31', iso: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+41', iso: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+46', iso: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: '+47', iso: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: '+45', iso: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: '+90', iso: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: '+7', iso: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: '+64', iso: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: '+82', iso: 'KR', name: 'South Korea', flag: '🇰🇷' },
];

export default function NewChatModal({
  leads,
  existingThreadIds,
  onClose,
  onOpenExisting,
  onStartNew,
}: NewChatModalProps) {
  const [query, setQuery] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');

  const filtered = leads.filter((l) =>
    l.name.toLowerCase().includes(query.toLowerCase()) ||
    l.phone.includes(query)
  );

  const handleStartNew = () => {
    const trimmed = phone.trim();
    if (!trimmed) return;

    let finalPhone = trimmed;
    if (!finalPhone.startsWith('+')) {
      const cleanNum = trimmed.replace(/^0+/, '');
      finalPhone = `${countryCode}${cleanNum}`;
    }
    onStartNew(finalPhone);
  };

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="w-[440px] bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[#E1E4EA]">
          <span className="text-[14px] font-bold text-[#1D2433]">New Conversation</span>
          <button type="button" onClick={onClose} className="cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="#8A93A8" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-[18px] pt-4 pb-1.5">
          <div className="text-[11px] text-[#8A93A8] mb-2.5">
            Message anyone already in your CRM, or start a chat with a new number.
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads by name or phone"
            className="w-full bg-[#F1F2F5] rounded-md px-2.5 py-2 text-[11.5px] outline-none placeholder:text-[#9AA2B5]"
          />
        </div>

        <div className="px-2.5 max-h-[200px] overflow-auto cz-scroll">
          {filtered.map((lead) => {
            const hasThread = existingThreadIds.includes(lead.id);
            return (
              <div key={lead.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50">
                <div
                  className="w-[30px] h-[30px] rounded-full shrink-0 flex items-center justify-center text-white text-[10.5px] font-bold"
                  style={{ backgroundColor: lead.color }}
                >
                  {lead.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-[#1D2433]">{lead.name}</div>
                  <div className="text-[10px] text-[#8A93A8]">{hasThread ? lead.phone : 'Lead \u2022 no chat yet'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenExisting(lead.id)}
                  className={
                    'cursor-pointer text-[10.5px] font-bold rounded-md ' +
                    (hasThread
                      ? 'text-brand-indigo hover:underline'
                      : 'text-white bg-brand-green px-2.5 py-1 hover:brightness-95')
                  }
                >
                  {hasThread ? 'Open chat' : 'Start Chat'}
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="p-3 text-[11px] text-[#9AA2B5]">No leads match "{query}".</div>}
        </div>

        <div className="flex items-center gap-2.5 px-[18px] pt-3.5 pb-1">
          <div className="flex-1 h-px bg-[#E1E4EA]" />
          <span className="text-[10px] text-[#B3B9C6]">or enter a number worldwide</span>
          <div className="flex-1 h-px bg-[#E1E4EA]" />
        </div>

        <div className="px-[18px] pt-2.5 pb-[18px]">
          <div className="flex gap-2 mb-3">
            <div className="relative shrink-0">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="appearance-none w-[130px] bg-[#F7F8FA] border border-[#E1E4EA] rounded-md pl-2 pr-6 py-2 text-[11.5px] font-medium text-[#1D2433] outline-none cursor-pointer hover:border-[#CAD0DB] focus:border-[#7A73E0] transition-colors"
                aria-label="Country Code"
              >
                {COUNTRIES.map((c) => (
                  <option key={`${c.iso}-${c.code}`} value={c.code}>
                    {c.flag} {c.code} ({c.name})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[#8A93A8]">
                <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleStartNew();
                }
              }}
              placeholder="Phone number (e.g. 9876543210)"
              className="flex-1 min-w-0 bg-[#F7F8FA] border border-[#E1E4EA] rounded-md px-2.5 text-[11.5px] outline-none placeholder:text-[#9AA2B5] focus:border-[#7A73E0] focus:bg-white transition-colors"
            />
          </div>
          <button
            type="button"
            disabled={!phone.trim()}
            onClick={handleStartNew}
            className="w-full bg-brand-indigo disabled:bg-[#D8D5FB] disabled:text-[#7A73E0] text-white text-[12.5px] font-bold py-2.5 rounded-md cursor-pointer hover:brightness-95 transition-all shadow-sm"
          >
            Start Chat
          </button>
          <div className="text-[9.5px] text-[#B3B9C6] mt-2.5 leading-relaxed">
            New conversations you start must use an approved WhatsApp template until the customer replies &mdash;
            a Meta policy, not a setting in this dashboard.
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import WhatsAppPanel from './WhatsAppPanel';
import EmailPanel from './EmailPanel';

interface CRMLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  initials: string;
  color: string;
}

interface MessagesPageProps {
  onBack: () => void;
  leads: CRMLead[];
  activeLead: CRMLead | null;
}

export default function MessagesPage({ onBack, leads, activeLead }: MessagesPageProps) {
  const [selectedLeadId, setSelectedLeadId] = React.useState<string | null>(
    activeLead?.id || (leads.length > 0 ? leads[0].id : null)
  );

  React.useEffect(() => {
    if (activeLead?.id) {
      setSelectedLeadId(activeLead.id);
    }
  }, [activeLead?.id]);

  const allLeads = React.useMemo(() => {
    const list = [...leads];
    if (activeLead && !list.some((l) => l.id === activeLead.id)) {
      list.unshift(activeLead);
    }
    return list;
  }, [leads, activeLead]);

  const currentLead =
    (selectedLeadId ? allLeads.find((l) => l.id === selectedLeadId) : null) ||
    activeLead ||
    (allLeads.length > 0 ? allLeads[0] : null);

  return (
    <div className="flex-1 h-full flex flex-col min-w-0 p-[18px] gap-3 bg-[#EEF0F3]">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-[#8A93A8] text-[12px] font-semibold hover:text-[#1D2433] cursor-pointer transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Dashboard
          </button>
          <div className="w-px h-4 bg-[#D6DAE2]" />
          <span className="text-[15px] font-bold text-[#1D2433]">Messages</span>
        </div>
        {currentLead ? (
          <div className="text-[12px] text-[#8A93A8]">
            Lead: <b className="text-[#1D2433]">{currentLead.name}</b> &middot; {currentLead.phone || 'No phone'} &middot; {currentLead.email || 'No email'}
          </div>
        ) : (
          <div className="text-[12px] text-amber-600 font-semibold animate-pulse">
            No active lead. Dial next customer or select an active lead.
          </div>
        )}
      </div>

      <div className="flex-1 flex gap-3.5 min-h-0">
        <WhatsAppPanel
          leads={allLeads}
          activeLeadId={currentLead ? currentLead.id : null}
          currentLead={currentLead}
          onSelectLead={(id) => setSelectedLeadId(id)}
        />
        <EmailPanel
          leads={allLeads}
          activeLeadId={currentLead ? currentLead.id : null}
          currentLead={currentLead}
        />
      </div>
    </div>
  );
}

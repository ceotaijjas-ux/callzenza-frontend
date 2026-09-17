"use client";
import { useState } from "react";
import Sidebar from "./components/layout/Sidebar.jsx";
import MobileTopbar from "./components/layout/MobileTopbar.jsx";
import Topbar from "./components/layout/Topbar.jsx";
import Toast from "./components/ui/Toast.jsx";
import useToast from "./hooks/useToast.js";
import { NAV_ITEMS, DEFAULT_TAB } from "./data/navigation.js";

import ConnectionsPanel from "./panels/ConnectionsPanel.jsx";
import BusinessIdentityPanel from "./panels/BusinessIdentityPanel.jsx";
import TemplatesPanel from "./panels/TemplatesPanel.jsx";
import NotificationsPanel from "./panels/NotificationsPanel.jsx";
import CrmSyncPanel from "./panels/CrmSyncPanel.jsx";
import TeamPanel from "./panels/TeamPanel.jsx";
import CompliancePanel from "./panels/CompliancePanel.jsx";

const PANELS = {
  connections: ConnectionsPanel,
  identity: BusinessIdentityPanel,
  templates: TemplatesPanel,
  notifications: NotificationsPanel,
  crm: CrmSyncPanel,
  team: TeamPanel,
  compliance: CompliancePanel,
};

export default function App({ onClose }) {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { message, visible, showToast } = useToast();

  const activeItem = NAV_ITEMS.find((item) => item.key === activeTab);
  const ActivePanel = PANELS[activeTab];

  const selectTab = (key) => {
    setActiveTab(key);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <div className="flex min-h-screen">
      {/* Mobile backdrop for the sliding sidebar drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[rgba(10,10,20,.5)] z-[35] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}


      <Sidebar
        activeTab={activeTab}
        onSelectTab={selectTab}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigateBack={onClose}
      />

      <div className="flex-1 min-w-0 flex flex-col bg-slate-50 h-screen overflow-y-auto">
        <MobileTopbar onOpenSidebar={() => setSidebarOpen(true)} onClose={onClose} />
        <div className="relative">
          <Topbar title={activeItem.title} subtitle={activeItem.subtitle} />
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-1/2 -translate-y-1/2 right-6 p-2 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-full transition-colors z-10 hidden sm:flex items-center justify-center"
              title="Close Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}
        </div>

        <div className="px-6 sm:px-10 lg:px-16 pt-8 pb-24 w-full max-w-full animate-fade" key={activeTab}>
          <ActivePanel onSave={() => showToast("Changes saved")} showToast={showToast} />
        </div>
      </div>

      <Toast message={message} visible={visible} />
    </div>
  );
}

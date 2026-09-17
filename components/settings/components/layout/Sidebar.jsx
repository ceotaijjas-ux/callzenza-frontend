"use client";
import { NAV_ITEMS } from "../../data/navigation.js";
import { ICONS_BY_KEY, SignOutIcon } from "../ui/Icons.jsx";

export default function Sidebar({ activeTab, onSelectTab, open, onClose, onNavigateBack }) {
  return (
    <aside
      className={`fixed md:sticky top-0 left-0 w-[264px] shrink-0 bg-sidebar-bg border-r border-sidebar-border flex flex-col h-screen overflow-y-auto z-40 transition-transform duration-[250ms] ease-in-out
        ${open ? "translate-x-0 shadow-drawer" : "-translate-x-full md:translate-x-0"}`}
    >
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-accent to-[#a78bff] flex items-center justify-center font-disp font-bold text-white text-[15px] shrink-0">
          C
        </div>
        <div className="font-disp font-bold text-base text-white tracking-tight">CallZenza</div>
      </div>

      <div className="px-5 pb-3.5 text-[11.5px] text-sidebar-text flex items-center gap-1.5 flex-wrap">
        <a href="#" className="text-sidebar-text no-underline hover:text-sidebar-text-active">
          Back to Messages
        </a>
        <span className="opacity-40">/</span>
        <span className="text-sidebar-text-active font-semibold">Messages Settings</span>
      </div>

      <div className="text-[10.5px] uppercase tracking-[.08em] text-[#54546b] px-5 pt-3.5 pb-1.5 font-semibold">
        Setup
      </div>
      <ul className="list-none px-2.5 flex-1 flex flex-col">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS_BY_KEY[item.icon];
          const isActive = item.key === activeTab;
          return (
            <li key={item.key} className="mb-3">
              <button
                onClick={() => onSelectTab(item.key)}
                className={`relative w-full text-left flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13.2px] font-medium border-none
                  ${isActive ? "bg-accent-dim text-white" : "bg-transparent text-sidebar-text hover:bg-[#1e1e2c] hover:text-sidebar-text-active"}`}
              >
                {isActive && (
                  <span className="absolute -left-2.5 top-1.5 bottom-1.5 w-[3px] bg-accent rounded-r-[3px]" />
                )}
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-accent opacity-100" : "opacity-85"}`} />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto px-4 py-3.5 border-t border-sidebar-border">
        <button onClick={onNavigateBack} className="w-full flex items-center justify-center gap-2 text-[12px] font-bold text-slate-400 hover:text-white bg-transparent border border-sidebar-border cursor-pointer py-2 rounded-lg hover:bg-[#1e1e2c] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Dashboard
        </button>
      </div>

      {/* Mobile-only close affordance: tapping backdrop (handled by parent) also closes */}
      <button onClick={onClose} className="sr-only" aria-hidden="true" tabIndex={-1}>
        close
      </button>
    </aside>
  );
}

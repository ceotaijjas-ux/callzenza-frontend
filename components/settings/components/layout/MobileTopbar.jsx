"use client";
import { MenuIcon } from "../ui/Icons.jsx";

export default function MobileTopbar({ onOpenSidebar, onClose }) {
  return (
    <div className="flex md:hidden items-center justify-between gap-3 px-4 py-3.5 bg-sidebar-bg sticky top-0 z-30">
      <button onClick={onOpenSidebar} className="flex text-white bg-transparent border-none p-1">
        <MenuIcon className="w-[22px] h-[22px]" stroke="#fff" />
      </button>
      <div className="flex items-center gap-2 text-white font-disp font-bold text-sm">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent to-[#a78bff] flex items-center justify-center text-xs">
          C
        </div>
        CallZenza
      </div>
      {onClose ? (
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      ) : (
        <div className="w-[22px]" />
      )}
    </div>
  );
}

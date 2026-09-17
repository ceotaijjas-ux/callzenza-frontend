"use client";
import {
  MenuIcon,
  CallsIcon,
  MessagesIcon,
  HistoryIcon,
  FiltersIcon,
  StarredIcon,
  SettingsIcon,
} from "../ui/Icons.jsx";

const RAIL_ITEMS = [
  { title: "Menu", Icon: MenuIcon },
  { title: "Calls", Icon: CallsIcon },
  { title: "Messages", Icon: MessagesIcon, active: true, dot: true },
  { title: "History", Icon: HistoryIcon },
  { title: "Filters", Icon: FiltersIcon },
  { title: "Starred", Icon: StarredIcon },
];

export default function IconRail() {
  return (
    <nav className="hidden md:flex w-14 shrink-0 bg-rail border-r border-sidebar-border flex-col items-center py-4 sticky top-0 h-screen z-[41]">
      <div className="w-[30px] h-[30px] rounded-lg mb-[22px] bg-gradient-to-br from-accent to-[#a78bff] flex items-center justify-center font-disp font-bold text-white text-sm">
        C
      </div>

      <div className="flex flex-col gap-1 flex-1">
        {RAIL_ITEMS.map(({ title, Icon, active, dot }) => (
          <button
            key={title}
            title={title}
            className={`relative w-9 h-9 rounded-[9px] flex items-center justify-center border-none ${
              active ? "bg-accent-dim text-accent" : "text-[#6f6f89] hover:bg-[#1c1c29] hover:text-[#cfcfe0]"
            }`}
          >
            <Icon className="w-[18px] h-[18px]" />
            {dot && (
              <span className="absolute top-[5px] right-1.5 w-1.5 h-1.5 rounded-full bg-danger border-[1.5px] border-rail" />
            )}
          </button>
        ))}
        <button
          title="Settings"
          className="relative w-9 h-9 rounded-[9px] flex items-center justify-center border-none text-accent"
        >
          <SettingsIcon className="w-[18px] h-[18px]" />
        </button>
      </div>

      <div className="w-8 h-8 rounded-[9px] bg-accent text-white flex items-center justify-center font-disp font-bold text-xs mt-2">
        N
      </div>
    </nav>
  );
}

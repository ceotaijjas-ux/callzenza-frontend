"use client";

import { useRouter, usePathname } from "next/navigation";
import { Phone, Clock, PlayCircle, History, Mic, MicOff, Settings, MessageSquare, FileText } from "lucide-react";

export function VoiceAgentSidebar({ basePath = "/voice-agent", isMuted, onMuteToggle }: { basePath?: string, isMuted?: boolean, onMuteToggle?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const isSupervisor = pathname.includes("/supervisor");

  const menu = [
    { icon: PlayCircle, label: "Status" },
    { icon: Clock, label: "Timer" },
    { icon: Settings, label: "Settings" },
    { icon: MessageSquare, label: "Messages" },
    { icon: FileText, label: "Report" }
  ];

  return (
    <>
      <aside className="w-16 bg-slate-900 border-r border-indigo-900/50 flex flex-col items-center py-4 gap-4 shrink-0 z-40">

        {menu.map((item, i) => (
          <button
            key={i}
            onClick={() => {
              if (item.label === "Settings") {
                router.push(isSupervisor ? "/settings" : `${basePath}/settings`);
              } else if (item.label === "Messages") {
                router.push(isSupervisor ? `${basePath}?tab=messages` : `${basePath}/dashboard?tab=messages`);
              } else if (item.label === "Status") {
                router.push(isSupervisor ? `${basePath}?tab=status` : `${basePath}/dashboard?tab=status`);
              } else {
                router.push(`${basePath}/${item.label.toLowerCase()}`);
              }
            }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors w-full cursor-pointer ${(item as any).activeColor || "text-slate-400 hover:text-white hover:bg-slate-800"}`}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-[9px] uppercase font-bold tracking-wider">
              {item.label}
            </span>
          </button>
        ))}
      </aside>
    </>
  );
}

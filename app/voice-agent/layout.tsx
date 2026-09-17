"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { VoiceAgentHeader } from "@/components/VoiceAgentHeader";
import { VoiceAgentSidebar } from "@/components/VoiceAgentSidebar";

export default function VoiceAgentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let activeToken = token;
    let activeUser = user;

    if (!activeToken || !activeUser) {
      if (typeof window !== "undefined") {
        try {
          const tabData = sessionStorage.getItem("callzenza-auth") || localStorage.getItem("callzenza-auth-VOICE_AGENT") || localStorage.getItem("callzenza-auth");
          if (tabData) {
            const parsed = JSON.parse(tabData);
            activeToken = parsed?.state?.token || null;
            activeUser = parsed?.state?.user || null;
            if (activeToken && activeUser) {
              useAuthStore.getState().setToken(activeToken);
              useAuthStore.getState().setUser(activeUser);
            }
          }
        } catch (_) {}
      }
    }

    if (!activeToken || !activeUser) {
      router.replace("/login");
    } else if (activeUser.role !== "VOICE_AGENT" && activeUser.role !== "SUPER_ADMIN" && activeUser.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [mounted, token, user, router, pathname]);

  if (!mounted) {
    return <div className="h-screen flex items-center justify-center font-extrabold text-slate-600 bg-slate-50">Loading Voice Agent Workspace...</div>;
  }

  const activeUser = user || (typeof window !== "undefined" ? (() => {
    try {
      const tabData = sessionStorage.getItem("callzenza-auth") || localStorage.getItem("callzenza-auth-VOICE_AGENT") || localStorage.getItem("callzenza-auth");
      return tabData ? JSON.parse(tabData)?.state?.user : null;
    } catch (_) { return null; }
  })() : null);

  if (!activeUser) {
    return <div className="h-screen flex items-center justify-center font-extrabold text-slate-600 bg-slate-50">Loading Voice Agent Workspace...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <VoiceAgentHeader />
      <div className="flex flex-1 overflow-hidden">
        <VoiceAgentSidebar />
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}

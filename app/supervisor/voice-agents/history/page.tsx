"use client";

import { History, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { VoiceAgentSidebar } from "@/components/VoiceAgentSidebar";
import { useAuthStore } from "@/lib/store";
import { useEffect, useState } from "react";

export default function SupervisorHistoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated || !user) return null;

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Supervisor's sidebar */}
        <VoiceAgentSidebar basePath="/supervisor/voice-agents" />

        <div className="flex flex-1 animate-in fade-in duration-300 bg-slate-200/50 relative">
          <div className="flex-1 flex flex-col items-center justify-center min-w-0 p-4 gap-4 overflow-y-auto">
            <div className="bg-white border border-slate-300 rounded shadow-sm p-12 text-center max-w-md w-full relative">
              <button 
                onClick={() => router.push("/supervisor/voice-agents")}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <History className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2">History</h2>
              <p className="text-slate-500 font-medium">This page is currently under construction.</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

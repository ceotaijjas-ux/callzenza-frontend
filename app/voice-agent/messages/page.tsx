"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VoiceAgentMessagesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/voice-agent/dashboard?tab=messages");
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900 text-slate-400 text-xs font-semibold animate-pulse">
      Redirecting to Messages Hub...
    </div>
  );
}

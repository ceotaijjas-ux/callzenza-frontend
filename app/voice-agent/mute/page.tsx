"use client";

import { MicOff, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MutePage() {
  const router = useRouter();
  return (
    <div className="flex h-full animate-in fade-in duration-300 bg-slate-200/50">
      <div className="flex-1 flex flex-col items-center justify-center min-w-0 p-4 gap-4 overflow-y-auto">
        <div className="bg-white border border-slate-300 rounded shadow-sm p-12 text-center max-w-md w-full relative">
          <button 
            onClick={() => router.push("/voice-agent/dashboard")}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <MicOff className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2">Mute Settings</h2>
          <p className="text-slate-500 font-medium">This page is currently under construction.</p>
        </div>
      </div>
    </div>
  );
}

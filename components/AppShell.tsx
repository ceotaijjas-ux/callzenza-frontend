"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { authService } from "@/lib/services/auth.service";
import { Sidebar } from "@/components/Sidebar";
import { Menu, X, Sparkles, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { GlobalChatbot } from "@/components/chatbot/GlobalChatbot";
import { useLiveClock } from "@/lib/useLiveClock";

// Ambient Animated Background for the entire platform
const GlobalAnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50">
      {/* Dynamic ambient gradients */}
      <motion.div 
        className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
          x: [0, -50, 0],
          y: [0, 50, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[60%] rounded-full bg-purple-500/10 blur-[120px]"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
          x: [0, 50, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      
      {/* Floating data particles (simulating live calls) */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400/30"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            opacity: Math.random() * 0.5 + 0.2
          }}
          animate={{
            y: [null, Math.random() * -500],
            opacity: [null, 0]
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

/** Client-side auth guard + shared shell for every authenticated page. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [hydrated, setHydrated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { mounted: clockMounted, timeStr } = useLiveClock();

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return () => unsub();
  }, []);

  useEffect(() => {
    if (hydrated) {
      if (!token) {
        router.replace("/");
      } else if (user && typeof window !== "undefined") {
        const path = window.location.pathname;
        if (user.role === "VOICE_AGENT" && !path.startsWith("/voice-agent")) {
          router.replace("/voice-agent/dashboard");
        } else if (user.role === "SUPERVISOR" && !path.startsWith("/supervisor") && !path.startsWith("/live-calls") && !path.startsWith("/inbound") && !path.startsWith("/user-groups") && !path.startsWith("/reports") && !path.startsWith("/campaigns") && !path.startsWith("/leads") && !path.startsWith("/chatbot") && !path.startsWith("/settings")) {
          router.replace("/supervisor/dashboard");
        } else if (!["ADMIN", "SUPER_ADMIN", "SUPERVISOR"].includes(user.role) && (path.startsWith("/supervisor") || path.startsWith("/admin"))) {
          router.replace("/dashboard");
        } else if (user.role === "SUPERVISOR" && path.startsWith("/admin")) {
          router.replace("/supervisor/dashboard");
        }
      }
    }
  }, [hydrated, token, user, router]);

  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (hydrated && token) {
      authService.me(token).then((userData) => {
        setUser(userData);
      }).catch((e) => {
        console.warn("User profile not found or session invalid. Logging out...", e);
        logout();
        router.replace("/");
      });
    }
  }, [hydrated, token, setUser, logout, router]);

  if (!hydrated || !token) return null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row text-slate-900 font-sans relative">
      <GlobalAnimatedBackground />
      
      {/* Desktop Sidebar (Permanent) */}
      <div className="hidden lg:block z-10 relative bg-slate-950/90 backdrop-blur-2xl border-r border-indigo-500/20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <Sidebar />
      </div>

      {/* Mobile/Tablet Header Bar */}
      <header className="flex lg:hidden items-center justify-between px-6 py-4 bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500 rounded-lg">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-extrabold text-slate-950 tracking-tight text-sm">CallZenza</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-mono text-[10px] font-bold">
            {clockMounted ? timeStr : ""}
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 hover:bg-slate-50 text-slate-600 rounded-xl transition-premium cursor-pointer"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer (Responsive Overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity" 
          />
          {/* Drawer Content */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white shadow-xl animate-in slide-in-from-left duration-250">
            <Sidebar onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 min-h-0 overflow-y-auto z-10 relative">
        {children}
      </main>
      
      {/* Global AI Chatbot */}
      <GlobalChatbot />
    </div>
  );
}


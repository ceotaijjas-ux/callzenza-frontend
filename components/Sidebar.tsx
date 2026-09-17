"use client";
import { useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, Bot, Handshake, LogOut, PhoneCall, 
  PhoneForwarded, Activity, Settings, Puzzle, Play, CreditCard, 
  BookOpen, Sparkles, User, ShieldCheck, UserCheck, Zap, RefreshCw
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { motion } from "framer-motion";
import { useLiveClock } from "@/lib/useLiveClock";

let savedSidebarScrollTop = 0;

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

export function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { mounted, timeWithSecondsStr } = useLiveClock();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    savedSidebarScrollTop = top;
    try {
      sessionStorage.setItem("sidebar_scroll_position", top.toString());
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const restoreScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      let targetScroll = savedSidebarScrollTop;
      try {
        const stored = sessionStorage.getItem("sidebar_scroll_position");
        if (stored !== null) {
          const val = parseFloat(stored);
          if (!isNaN(val)) targetScroll = val;
        }
      } catch {
        // ignore
      }

      if (targetScroll > 0) {
        container.scrollTop = targetScroll;
      }

      if (activeItemRef.current && container) {
        const itemRect = activeItemRef.current.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
          activeItemRef.current.scrollIntoView({ block: "nearest", behavior: "auto" });
          savedSidebarScrollTop = container.scrollTop;
          try {
            sessionStorage.setItem("sidebar_scroll_position", container.scrollTop.toString());
          } catch {
            // ignore
          }
        }
      }
    };

    restoreScroll();
    const raf = requestAnimationFrame(restoreScroll);
    const timer = setTimeout(restoreScroll, 60);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [pathname]);

  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.email === "admin@callzenza.com";
  const isBusinessOwner = user?.role === "BUSINESS_OWNER";
  const isAdmin = user?.role === "ADMIN" || isSuperAdmin || isBusinessOwner;
  const isVoiceAgent = user?.role === "VOICE_AGENT";
  const isSupervisor = user?.role === "SUPERVISOR";
  const isNormalUser = user?.role === "USER";

  const hasPerm = (key: string): boolean => {
    if (isSuperAdmin) return true;
    if (!user?.permissions || Object.keys(user.permissions).length === 0) return true;
    return !!user.permissions[key];
  };

  let workspaceGroup: NavItem[] = [];
  let managementGroup: NavItem[] = [];
  let systemGroup: NavItem[] = [];

  if (isSupervisor) {
    const perms = user?.permissions || {};
    // Default to true for core modules if permissions are null (backward compatibility)
    
    if (perms.dashboard !== false) {
      workspaceGroup.push({ href: "/supervisor/dashboard", label: "Dashboard", icon: LayoutDashboard });
    }
    if (perms.user_management !== false) {
      workspaceGroup.push({ href: "/supervisor/users", label: "User Management", icon: Users });
    }
    if (perms.voice_agent !== false) {
      workspaceGroup.push({ href: "/supervisor/voice-agents", label: "Voice Agent", icon: UserCheck });
    }
    if (perms.reports) {
      workspaceGroup.push({ href: "/reports", label: "Reports", icon: Activity });
    }
    if (perms.live_calls !== false) {
      workspaceGroup.push({ href: "/live-calls", label: "Live Calls", icon: PhoneCall });
    }
    if (perms.campaigns) {
      workspaceGroup.push({ href: "/campaigns", label: "Campaigns", icon: Play });
    }
    if (perms.lists) {
      workspaceGroup.push({ href: "/leads", label: "Lists", icon: Users });
    }
    workspaceGroup.push({ href: "/inbound", label: "Inbound", icon: PhoneCall });
    workspaceGroup.push({ href: "/user-groups", label: "User Groups", icon: Users });
    workspaceGroup.push({ href: "/chatbot", label: "AI Chatbot", icon: Bot });
  } else if (isNormalUser) {
    const perms = user?.permissions || {};
    
    workspaceGroup.push({ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
    workspaceGroup.push({ href: "/chatbot", label: "AI Chatbot", icon: Bot });
    
    if (perms.viewAnalytics) {
      workspaceGroup.push({ href: "/reports", label: "Reports", icon: Activity });
      workspaceGroup.push({ href: "/analytics", label: "Analytics", icon: Activity });
    }
    
    if (perms.runCampaigns) {
      workspaceGroup.push({ href: "/campaigns", label: "Campaigns", icon: Play });
      workspaceGroup.push({ href: "/leads", label: "Lists", icon: Users });
    }
    
    if (perms.viewRecordings) {
      workspaceGroup.push({ href: "/live-calls", label: "Live Calls", icon: PhoneCall });
    }
    
    if (perms.manageBilling) {
      workspaceGroup.push({ href: "/admin/billing", label: "Billing", icon: CreditCard });
    }
    
    systemGroup = [
      { href: "/settings", label: "Settings", icon: Settings },
    ];
  } else if (isBusinessOwner || (isAdmin && !isSuperAdmin)) {
    // Dedicated streamlined navigation for Tenant Admin accounts
    workspaceGroup = [
      hasPerm("dashboard") ? { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard } : null,
      hasPerm("users") ? { href: "/admin/users", label: "Users", icon: Users } : null,
      hasPerm("clients") ? { href: "/admin/clients", label: "Clients", icon: Handshake } : null,
      hasPerm("campaigns") ? { href: "/admin/campaigns", label: "Campaigns", icon: Play } : null,
      hasPerm("supervisors") ? { href: "/admin/supervisors", label: "Quality Control", icon: ShieldCheck } : null,
      hasPerm("chatbot") ? { href: "/admin/ai-chatbot", label: "AI Chatbot (RAG)", icon: Sparkles } : null,
      hasPerm("scripts") ? { href: "/admin/knowledge", label: "Scripts", icon: BookOpen } : null,
      hasPerm("reports") ? { href: "/analytics", label: "Filters", icon: Activity } : null,
      hasPerm("inbound") ? { href: "/inbound", label: "Inbound", icon: PhoneCall } : null,
      hasPerm("agents") ? { href: "/agents", label: "Remote Agents (AI)", icon: Bot } : null,
      hasPerm("voice_agents") ? { href: "/experts/portal", label: "Remote Agents (Voice)", icon: UserCheck } : null,
    ].filter(Boolean) as NavItem[];

    managementGroup = [];
    systemGroup = [
      hasPerm("settings") ? { href: "/settings", label: "Settings", icon: Settings } : null,
    ].filter(Boolean) as NavItem[];
  } else {
    // Full system flow preserved for Super Admin (and direct voice agents)
    workspaceGroup = [
      hasPerm("dashboard") ? { href: isVoiceAgent ? "/voice-agent/dashboard" : "/dashboard", label: "Dashboard", icon: LayoutDashboard } : null,
      hasPerm("chatbot") ? { href: "/chatbot", label: "AI Chatbot", icon: Bot } : null,
      hasPerm("reports") ? { href: "/reports", label: "Reports", icon: Activity } : null,
      (isAdmin && hasPerm("users")) ? { href: "/admin/users", label: "Users", icon: Users } : null,
      (isAdmin && hasPerm("clients")) ? { href: "/admin/clients", label: "Clients", icon: Handshake } : null,
      (isAdmin && hasPerm("live_calls")) ? { href: "/live-calls", label: "Live Calls", icon: PhoneCall } : null,
      (isAdmin && hasPerm("campaigns")) ? { href: "/admin/campaigns", label: "Campaigns", icon: Play } : (hasPerm("campaigns") ? { href: "/campaigns", label: "Campaigns", icon: Play } : null),
      hasPerm("leads") ? { href: "/leads", label: "Lists", icon: Users } : null,
      hasPerm("leads") ? { href: "/leads/recycle", label: "Lead Recycle", icon: RefreshCw } : null,
      hasPerm("leads") ? { href: "/leads/hopper", label: "Lead Hopper", icon: PhoneForwarded } : null,
      (isAdmin && hasPerm("supervisors")) ? { href: "/admin/supervisors", label: "Quality Control", icon: ShieldCheck } : null,
      (isAdmin && hasPerm("chatbot")) ? { href: "/admin/ai-chatbot", label: "AI Chatbot (RAG)", icon: Sparkles } : null,
      (isAdmin && hasPerm("scripts")) ? { href: "/admin/knowledge", label: "Scripts", icon: BookOpen } : null,
      hasPerm("reports") ? { href: "/analytics", label: "Filters", icon: Activity } : null,
      hasPerm("inbound") ? { href: "/inbound", label: "Inbound", icon: PhoneCall } : null,
      hasPerm("user_groups") ? { href: "/user-groups", label: "User Groups", icon: Users } : null,
      hasPerm("agents") ? { href: "/agents", label: "Remote Agents (AI)", icon: Bot } : null,
      ((isVoiceAgent || isAdmin) && hasPerm("voice_agents")) ? { href: "/experts/portal", label: "Remote Agents (Voice)", icon: UserCheck } : null,
      hasPerm("admin") ? { href: "/admin", label: "Admin", icon: Settings } : null,
    ].filter(Boolean) as NavItem[];

    managementGroup = [];

    systemGroup = [
      hasPerm("settings") ? { href: "/settings", label: "Settings", icon: Settings } : null,
    ].filter(Boolean) as NavItem[];
  }

  const renderNavList = (items: NavItem[]) => (
    <div className="space-y-1.5">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== "/dashboard" && href !== "/admin" && pathname.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href}
            ref={isActive ? activeItemRef : undefined}
            onClick={() => {
              if (scrollContainerRef.current) {
                const top = scrollContainerRef.current.scrollTop;
                savedSidebarScrollTop = top;
                try {
                  sessionStorage.setItem("sidebar_scroll_position", top.toString());
                } catch {
                  // ignore
                }
              }
              onCloseMobile?.();
            }}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-all duration-300 overflow-hidden ${
              isActive 
                ? "text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] border border-indigo-500/50" 
                : "text-slate-400 hover:text-slate-100 border border-transparent hover:bg-white/5"
            }`}
          >
            {isActive && (
              <motion.div 
                layoutId="activeTab" 
                className="absolute inset-0 bg-gradient-to-r from-indigo-600/40 to-purple-600/40 opacity-50"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            
            <div className={`relative z-10 p-1.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-500 shadow-md shadow-indigo-500/50' : 'bg-transparent group-hover:bg-white/10'}`}>
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
            </div>
            
            <span className="truncate relative z-10 tracking-wide">{label}</span>
            
            {isActive && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,1)] animate-pulse" />
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col bg-transparent text-white overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -z-10 pointer-events-none" />

      {/* Sidebar Header */}
      <div className="p-6 border-b border-white/5 flex items-center gap-4 relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] relative shadow-[0_0_20px_rgba(99,102,241,0.4)]">
          <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
        <div>
          <h1 className="font-black text-white tracking-tight text-xl leading-none">CallZenza</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
            <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 leading-none">
              Live {mounted ? timeWithSecondsStr : "Online"}
            </span>
          </div>
        </div>
      </div>

      {/* Nav Content */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide"
      >
        <div>
          <p className="text-[10px] font-black text-indigo-400/70 uppercase tracking-widest px-3 mb-3 flex items-center gap-2">
            <span className="w-2 h-[1px] bg-indigo-500/50"></span> Workspace
          </p>
          {renderNavList(workspaceGroup)}
        </div>

        {managementGroup.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-indigo-400/70 uppercase tracking-widest px-3 mb-3 flex items-center gap-2">
              <span className="w-2 h-[1px] bg-indigo-500/50"></span> Management
            </p>
            {renderNavList(managementGroup)}
          </div>
        )}

        {systemGroup.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-indigo-400/70 uppercase tracking-widest px-3 mb-3 flex items-center gap-2">
              <span className="w-2 h-[1px] bg-indigo-500/50"></span> System
            </p>
            {renderNavList(systemGroup)}
          </div>
        )}
      </div>

      {/* Bottom Profile Details */}
      <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
          {(() => {
            const rawName = user?.full_name || user?.email?.split("@")[0] || "User Account";
            const displayName = rawName.toLowerCase() === "super admin" ? "System Admin" : rawName;
            const initial = displayName ? displayName[0].toUpperCase() : "S";

            return (
              <>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-black text-white shadow-inner">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate group-hover:text-indigo-200 transition-colors">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-indigo-300 truncate flex items-center gap-1.5 font-bold uppercase tracking-wider mt-0.5">
                    {isSuperAdmin ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Admin
                      </>
                    ) : isAdmin ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Admin
                      </>
                    ) : (
                      "Member"
                    )}
                  </p>
                </div>
              </>
            );
          })()}
        </div>

        <button
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="mt-3 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-transparent hover:border-rose-500/20 transition-all w-full cursor-pointer group"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0 group-hover:-translate-x-1 transition-transform" />
          <span>Log out secure</span>
        </button>
      </div>
    </aside>
  );
}

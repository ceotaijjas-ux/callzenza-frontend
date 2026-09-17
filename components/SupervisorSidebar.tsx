"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, Bot, LogOut, Sparkles, User, ShieldCheck
} from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

export function SupervisorSidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const isSupervisor = user?.role === "SUPERVISOR";

  const navItems: NavItem[] = [
    { href: "/supervisor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/supervisor/users", label: "Users", icon: Users },
    { href: "/supervisor/agents", label: "Agents", icon: Bot },
  ];

  const renderNavList = (items: NavItem[]) => (
    <div className="space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onCloseMobile}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-premium cursor-pointer ${
              isActive 
                ? "bg-indigo-50 text-indigo-600 border border-indigo-100/50" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
            }`}
          >
            <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside className="w-64 shrink-0 border-r border-slate-100 h-screen sticky top-0 flex flex-col bg-white">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-50 flex items-center gap-2.5">
        <div className="p-2 bg-indigo-500 rounded-xl">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-extrabold text-slate-900 tracking-tight leading-tight">CallZenza</p>
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 mt-0.5 block">
            Supervisor Portal
          </span>
        </div>
      </div>

      {/* Nav Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Management</p>
          {renderNavList(navItems)}
        </div>
      </div>

      {/* Bottom Profile Details */}
      <div className="p-4 border-t border-slate-50 space-y-3">
        <div className="flex items-center gap-3 px-2 py-1.5 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
            {user?.full_name ? user.full_name[0].toUpperCase() : user?.email?.[0].toUpperCase() || "S"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate">
              {user?.full_name || user?.email?.split("@")[0] || "Supervisor Account"}
            </p>
            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-500" /> Supervisor
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            router.push("/supervisor/login");
          }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-premium w-full cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

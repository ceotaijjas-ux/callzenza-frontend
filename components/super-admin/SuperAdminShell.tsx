"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Building2,
  BarChart3,
  Server,
  HardDrive,
  CreditCard,
  LogOut,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Bell,
  Lock,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { apiFetch } from "@/lib/api-client";

interface SuperAdminShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/super-admin/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "Tenants & Orgs",
    href: "/super-admin/tenants",
    icon: Building2,
    badge: null,
  },
  {
    label: "Platform Analytics",
    href: "/super-admin/analytics",
    icon: BarChart3,
    badge: null,
  },
  {
    label: "Server Health",
    href: "/super-admin/server-status",
    icon: Server,
    badge: null,
  },
  {
    label: "Storage Usage",
    href: "/super-admin/storage",
    icon: HardDrive,
    badge: null,
  },
  {
    label: "Subscription Plans",
    href: "/super-admin/subscriptions",
    icon: CreditCard,
    badge: null,
  },
];

export function SuperAdminShell({ children }: SuperAdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, setToken, setUser, logout } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated and has SUPER_ADMIN role
    const checkAuth = async () => {
      let currentToken = token;
      let currentUser = user;

      if (!currentToken || !currentUser) {
        if (typeof window !== "undefined") {
          try {
            const raw =
              sessionStorage.getItem("callzenza-auth") ||
              localStorage.getItem("callzenza-auth-SUPER_ADMIN") ||
              localStorage.getItem("callzenza-auth");
            if (raw) {
              const parsed = JSON.parse(raw);
              currentToken = parsed?.state?.token;
              currentUser = parsed?.state?.user;
              if (currentToken && currentUser) {
                setToken(currentToken);
                setUser(currentUser);
              }
            }
          } catch (_) {}
        }
      }

      const isSuper =
        currentUser?.role === "SUPER_ADMIN" ||
        currentUser?.email === "admin@callzenza.com" ||
        (currentUser as any)?.is_super_admin === true;

      if (!currentToken || !currentUser || !isSuper) {
        router.replace("/super-admin/login");
        return;
      }

      setAuthorized(true);
      setLoading(false);

      // Lightweight health indicator
      try {
        await apiFetch("/api/super-admin/server-status");
        setServerOk(true);
      } catch (_) {
        setServerOk(false);
      }
    };

    checkAuth();
  }, [token, user, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("callzenza-auth");
      localStorage.removeItem("callzenza-auth");
      localStorage.removeItem("callzenza-auth-SUPER_ADMIN");
    }
    router.replace("/super-admin/login");
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-[#0A0E2E] flex flex-col items-center justify-center text-slate-300 font-sans">
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 flex items-center justify-center text-[#C9BEFF] shadow-lg shadow-[#7C5CFF]/20">
              <ShieldAlert className="w-8 h-8 animate-pulse text-[#7C5CFF]" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#7C5CFF] rounded-full animate-ping" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-white">Super Admin Console</h3>
            <p className="text-xs text-[#9096AC] font-mono">Verifying cryptographic credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E2E] text-slate-100 flex font-sans antialiased selection:bg-[#7C5CFF] selection:text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col justify-between border-r border-[#1E2555]/80 bg-[#080B22]/90 backdrop-blur-xl shrink-0 z-30">
        <div>
          {/* Logo & Brand */}
          <div className="p-6 border-b border-[#1E2555]/60 flex items-center justify-between">
            <Link href="/super-admin/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C5CFF] via-[#5B3FE0] to-[#3B6EF6] flex items-center justify-center text-white shadow-lg shadow-[#7C5CFF]/35 group-hover:scale-105 transition-transform font-bold">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white tracking-tight text-lg">CallZenza</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#7C5CFF]/20 text-[#C9BEFF] border border-[#7C5CFF]/40">
                    SUPER
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-[#9096AC] tracking-wide">Platform Admin Portal</p>
              </div>
            </Link>
          </div>

          {/* Quick System Badge */}
          <div className="px-6 py-3 border-b border-[#1E2555]/60 bg-[#10132A]/60 flex items-center justify-between text-xs">
            <span className="text-[#9096AC] font-medium text-[11px] flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  serverOk === true
                    ? "bg-[#4ADE80] animate-pulse"
                    : serverOk === false
                    ? "bg-[#EF5B5B]"
                    : "bg-[#F5A623] animate-pulse"
                }`}
              />
              System Status
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                serverOk === true
                  ? "bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30"
                  : serverOk === false
                  ? "bg-[#EF5B5B]/15 text-[#EF5B5B] border border-[#EF5B5B]/30"
                  : "bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30"
              }`}
            >
              {serverOk === true ? "HEALTHY" : serverOk === false ? "ATTENTION" : "CHECKING..."}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#7C5CFF]/80">
              Platform Management
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/super-admin/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? "bg-gradient-to-r from-[#7C5CFF] to-[#3B6EF6] text-white shadow-lg shadow-[#7C5CFF]/30 border border-[#C9BEFF]/30"
                      : "text-[#9096AC] hover:text-[#C9BEFF] hover:bg-[#161E5E]/40 border border-transparent hover:border-[#7C5CFF]/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#9096AC] group-hover:text-[#7C5CFF] transition-colors"}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#C9BEFF]" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Profile & Actions */}
        <div className="p-4 border-t border-[#1E2555]/60 bg-[#080B22]/70 space-y-3">
          {/* User pill */}
          <div className="p-3 rounded-xl bg-[#10132A]/80 border border-[#1E2555] flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#7C5CFF]/20 text-[#C9BEFF] border border-[#7C5CFF]/30 flex items-center justify-center font-bold text-xs shrink-0">
                SA
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-100 truncate">{user?.full_name || "Super Admin"}</div>
                <div className="text-[10px] text-[#9096AC] font-mono truncate">{user?.email}</div>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#4ADE80] shrink-0 shadow-sm shadow-[#4ADE80]" title="Active Session" />
          </div>

          {/* Quick links & Logout */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex-1 text-center py-2 px-2.5 rounded-lg text-[11px] font-semibold text-[#9096AC] hover:text-[#C9BEFF] bg-[#10132A] hover:bg-[#161E5E] border border-[#1E2555] hover:border-[#7C5CFF]/40 transition-colors flex items-center justify-center gap-1"
              title="Switch to Tenant Workspace"
            >
              <span>Workspace</span>
              <ExternalLink className="w-3 h-3 text-[#9096AC] group-hover:text-[#7C5CFF]" />
            </Link>
            <button
              onClick={handleLogout}
              className="py-2 px-3 rounded-lg text-[11px] font-semibold text-[#EF5B5B] hover:text-white hover:bg-[#EF5B5B]/20 border border-[#EF5B5B]/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#1E2555]/80 bg-[#080B22]/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#10132A] border border-[#1E2555] text-[#9096AC] hover:text-[#C9BEFF] hover:border-[#7C5CFF]/40 shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 text-xs min-w-0">
              <span className="text-[#9096AC] hidden sm:inline">Console</span>
              <span className="text-[#5B6178] hidden sm:inline">/</span>
              <span className="text-[#C9BEFF] font-semibold uppercase tracking-wider text-[11px] truncate">
                {pathname.split("/").filter(Boolean).slice(1).join(" / ") || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-xs text-[#C9BEFF] font-medium">
              <Lock className="w-3.5 h-3.5 text-[#7C5CFF]" />
              <span>Super Admin Security Gated</span>
            </div>
            <div className="sm:hidden flex items-center p-2 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF]" title="Super Admin Security Gated">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
        </header>

        {/* Mobile Navigation Dropdown & Backdrop */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="lg:hidden absolute top-16 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto bg-[#080B22] border-b border-[#1E2555] p-4 space-y-3 z-40 shadow-2xl">
              {/* Quick System Badge on Mobile */}
              <div className="px-3 py-2 rounded-xl bg-[#10132A] border border-[#1E2555] flex items-center justify-between text-xs">
                <span className="text-[#9096AC] font-medium text-[11px] flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      serverOk === true
                        ? "bg-[#4ADE80] animate-pulse"
                        : serverOk === false
                        ? "bg-[#EF5B5B]"
                        : "bg-[#F5A623] animate-pulse"
                    }`}
                  />
                  System Status
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    serverOk === true
                      ? "bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30"
                      : serverOk === false
                      ? "bg-[#EF5B5B]/15 text-[#EF5B5B] border border-[#EF5B5B]/30"
                      : "bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30"
                  }`}
                >
                  {serverOk === true ? "HEALTHY" : serverOk === false ? "ATTENTION" : "CHECKING..."}
                </span>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/super-admin/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? "bg-gradient-to-r from-[#7C5CFF] to-[#3B6EF6] text-white shadow-lg shadow-[#7C5CFF]/30 border border-[#C9BEFF]/30"
                          : "text-[#9096AC] hover:bg-[#161E5E]/40 hover:text-[#C9BEFF]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#9096AC]"}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#C9BEFF]" />}
                    </Link>
                  );
                })}
              </div>

              {/* User Profile & Actions on Mobile */}
              <div className="pt-3 border-t border-[#1E2555] space-y-2">
                <div className="p-2.5 rounded-xl bg-[#10132A] border border-[#1E2555] flex items-center justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-[#7C5CFF]/20 text-[#C9BEFF] border border-[#7C5CFF]/30 flex items-center justify-center font-bold text-xs shrink-0">
                      SA
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-100 truncate">{user?.full_name || "Super Admin"}</div>
                      <div className="text-[10px] text-[#9096AC] font-mono truncate">{user?.email}</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#4ADE80] shrink-0" />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 px-2.5 rounded-lg text-[11px] font-semibold text-[#9096AC] hover:text-[#C9BEFF] bg-[#10132A] hover:bg-[#161E5E] border border-[#1E2555] transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Workspace</span>
                    <ExternalLink className="w-3 h-3 text-[#9096AC]" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="py-2 px-3 rounded-lg text-[11px] font-semibold text-[#EF5B5B] hover:text-white hover:bg-[#EF5B5B]/20 border border-[#EF5B5B]/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Exit</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-gradient-to-b from-[#0A0E2E] via-[#0D1236] to-[#0A0E2E]">
          {children}
        </main>
      </div>
    </div>
  );
}

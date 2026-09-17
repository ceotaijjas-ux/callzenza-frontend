"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { authService } from "@/lib/services/auth.service";
import { Loader2 } from "lucide-react";

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, logout, setToken, setUser } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const isLoginPage = pathname === "/supervisor/login";

  useEffect(() => {
    if (isLoginPage) return;

    const checkAuth = async () => {
      if (!token) {
        router.replace("/supervisor/login");
        return;
      }

      try {
        const me = await authService.me(token);
        if (me.role !== "SUPERVISOR") {
          // If not supervisor, clear token and redirect to their respective login
          logout();
          router.replace("/supervisor/login");
        } else {
          setToken(token);
          setUser(me);
          setIsAuthorized(true);
        }
      } catch (err) {
        logout();
        router.replace("/supervisor/login");
      }
    };

    checkAuth();
  }, [token, router, logout, setToken, setUser, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <main className="flex-1 overflow-x-hidden relative">
        {children}
      </main>
    </div>
  );
}

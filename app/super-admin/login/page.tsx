"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  LogIn,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Server,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store";
import { apiFetch } from "@/lib/api-client";
import Link from "next/link";

interface SuperAdminLoginForm {
  email: string;
  password: string;
  remember_me?: boolean;
}

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<SuperAdminLoginForm>();
  const { token, user, setToken, setUser, logout } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated as SUPER_ADMIN, redirect directly to /super-admin/dashboard
  useEffect(() => {
    if (token && user) {
      const isSuper =
        user.role === "SUPER_ADMIN" ||
        user.email === "admin@callzenza.com" ||
        (user as any).is_super_admin === true;
      if (isSuper) {
        router.replace("/super-admin/dashboard");
      }
    }
  }, [token, user, router]);

  const onSubmit = async (values: SuperAdminLoginForm) => {
    setError(null);
    try {
      const cleanEmail = values.email.trim().toLowerCase();

      // Directly authenticate against the dedicated Super Admin endpoint
      const res = await apiFetch<{
        access_token: string;
        token_type: string;
        user: {
          id: string;
          email: string;
          full_name: string;
          role: string;
          is_active: boolean;
        };
      }>("/api/super-admin/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: cleanEmail,
          password: values.password,
          remember_me: values.remember_me || false,
        }),
      });

      const superUser = {
        ...res.user,
        is_super_admin: true,
        business_id: "c3dce06c-8330-4724-ba33-b5282b3c3596",
      };

      setToken(res.access_token);
      setUser(superUser as any);

      if (typeof window !== "undefined") {
        const statePayload = JSON.stringify({
          state: { token: res.access_token, user: superUser },
          version: 0,
        });
        sessionStorage.setItem("callzenza-auth", statePayload);
        localStorage.setItem("callzenza-auth-SUPER_ADMIN", statePayload);
        localStorage.setItem("callzenza-auth", statePayload);
      }

      // Explicitly redirect to /super-admin/dashboard
      router.push("/super-admin/dashboard");
    } catch (e: any) {
      logout();
      setError(
        e?.message || "Invalid credentials or unauthorized access. Super Admin credentials required."
      );
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100 relative overflow-hidden font-sans cursor-default select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-md flex flex-col gap-6 z-10">
        {/* Navigation back options */}
        <div className="flex items-center justify-between w-full mb-1">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-semibold group bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to User Login</span>
          </Link>
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium"
          >
            Home
          </Link>
        </div>

        {/* Portal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2 shadow-lg shadow-indigo-950/50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-slate-100 to-purple-200 bg-clip-text text-transparent">
            Super Admin Console
          </h1>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            Dedicated platform management terminal. Strictly restricted to verified Super Administrators.
          </p>
        </div>

        {/* Form Box */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl shadow-slate-950/80 space-y-6"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Super Admin Email
              </label>
              <Input
                {...register("email", { required: "Email is required" })}
                type="email"
                placeholder="admin@callzenza.com"
                className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
              />
              {errors.email && (
                <p className="text-[11px] text-rose-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  {...register("password", { required: "Password is required" })}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400">{errors.password.message}</p>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register("remember_me")}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Remember this session</span>
            </label>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 text-xs bg-rose-950/40 border border-rose-900/50 text-rose-400 rounded-xl flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting ? "Authenticating Cryptographically..." : "Authenticate Super Admin"}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500">
              Audit logging is strictly enforced. Every authentication event and privileged action is recorded with IP and timestamp.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ShieldAlert, LogIn, ArrowLeft, Eye, EyeOff, Lock, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/services/auth.service";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";

interface FormValues {
  email: string;
  password: string;
}

export default function AdminLogin() {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<FormValues>();
  const { token, user, setToken, setUser, logout } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (token && user) {
      if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
        router.replace("/dashboard");
      } else if (user.role === "SUPERVISOR") {
        router.replace("/supervisor/dashboard");
      } else if (user.role === "VOICE_AGENT") {
        router.replace("/voice-agent/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [token, user, router]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const cleanEmail = values.email.trim();
      const { access_token } = await authService.login({
        email: cleanEmail,
        password: values.password,
      });

      const me = await authService.me(access_token);

      setToken(access_token);
      setUser(me);

      if (typeof window !== "undefined") {
        const statePayload = JSON.stringify({
          state: { token: access_token, user: me },
          version: 0
        });
        sessionStorage.setItem("callzenza-auth", statePayload);
        localStorage.setItem(`callzenza-auth-${me.role}`, statePayload);
        localStorage.setItem("callzenza-auth", statePayload);
      }

      if (me.role === "SUPER_ADMIN" || me.role === "ADMIN") {
        router.push("/dashboard");
      } else if (me.role === "SUPERVISOR") {
        router.push("/supervisor/dashboard");
      } else if (me.role === "VOICE_AGENT") {
        router.push("/voice-agent/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      logout();
      setError(e instanceof Error ? e.message : "Invalid email or password");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100 relative overflow-hidden font-sans cursor-default select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-md flex flex-col gap-6 z-10">
        <div className="flex items-center justify-between w-full mb-1">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-semibold group bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl"
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

        <div className="text-center">
          <div className="inline-flex p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-slate-100 to-purple-200 bg-clip-text text-transparent">
            Admin Portal
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Access platform operations & configurations.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl shadow-slate-950/50"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Admin Email
              </label>
              <Input
                {...register("email", { required: true })}
                type="email"
                className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative">
                <Input
                  {...register("password", { required: true })}
                  type={showPassword ? "text" : "password"}
                  className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  suppressHydrationWarning
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 text-xs bg-red-950/40 border border-red-900/50 text-red-400 rounded-xl"
              >
                {error}
              </motion.div>
            )}

            <Button 
              type="submit" 
              disabled={formState.isSubmitting}
              className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              {formState.isSubmitting ? (
                "Authenticating..."
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> Authenticate Admin
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Security Indicator */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 mt-4 bg-slate-900/40 border border-slate-900 py-2.5 px-4 rounded-xl">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>SSL Secure &middot; Encrypted Session Gateway</span>
        </div>
      </div>
    </main>
  );
}


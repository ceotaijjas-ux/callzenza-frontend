"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ShieldCheck, LogIn, ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/services/auth.service";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";

interface FormValues {
  email: string;
  password: string;
}

export default function SupervisorLogin() {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<FormValues>();
  const { token, user, setToken, setUser, logout } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (token && user) {
      if (user.role === "SUPERVISOR") {
        router.replace("/supervisor/dashboard");
      } else if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
        router.replace("/dashboard");
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

      if (me.role === "SUPERVISOR") {
        router.push("/supervisor/dashboard");
      } else if (me.role === "SUPER_ADMIN" || me.role === "ADMIN") {
        router.push("/dashboard");
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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-900 relative overflow-hidden font-sans cursor-default select-none">
      <div className="w-full max-w-md flex flex-col gap-6 z-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors self-start mb-2 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to main site
        </Link>

        <div className="text-center">
          <div className="inline-flex p-3.5 rounded-2xl bg-indigo-100 text-indigo-600 border border-indigo-200 mb-4 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Supervisor Portal
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Access team performance and agent assignments.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/50"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Supervisor Email
              </label>
              <Input
                {...register("email", { required: true })}
                type="email"
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <Input
                  {...register("password", { required: true })}
                  type={showPassword ? "text" : "password"}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium"
              >
                {error}
              </motion.div>
            )}

            <Button 
              type="submit" 
              disabled={formState.isSubmitting}
              className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-200 active:scale-[0.98] transition-all cursor-pointer"
            >
              {formState.isSubmitting ? (
                "Authenticating..."
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> Authenticate
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Security Indicator */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 mt-4">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secure Supervisor Access</span>
        </div>
      </div>
    </main>
  );
}

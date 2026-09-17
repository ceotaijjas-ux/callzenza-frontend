"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { LogIn, Eye, EyeOff, Sparkles, MessageSquare, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/services/auth.service";
import { businessService } from "@/lib/services/business.service";
import { useAuthStore } from "@/lib/store";

interface FormValues {
  email: string;
  password: string;
  full_name?: string;
  business_name?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<FormValues>();
  const { token, user, setToken, setUser } = useAuthStore();
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
      const { access_token } = await authService.login({ email: cleanEmail, password: values.password });
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
        router.replace("/dashboard");
      } else if (me.role === "SUPERVISOR") {
        router.replace("/supervisor/dashboard");
      } else if (me.role === "VOICE_AGENT") {
        router.replace("/voice-agent/dashboard");
      } else {
        router.replace("/dashboard");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid email or password");
    }
  };

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 font-sans cursor-default select-none">
      {/* Left Pane - Feature Showcase (Hidden on Mobile/Tablet) */}
      <div className="hidden lg:flex lg:col-span-7 bg-indigo-950 text-slate-100 flex-col justify-between p-16 relative overflow-hidden">
        {/* Glow overlays */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl -z-10" />

        {/* Branding header & Back button */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer group shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">CallZenza</span>
          </div>
        </div>

        {/* Main Content Info */}
        <div className="max-w-xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h1 className="text-5xl font-extrabold tracking-tight leading-tight text-white">
              Smarter Conversations. <br />
              <span className="text-indigo-400">Better Results.</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Manage your AI-powered calling, leads, campaigns, and conversations from one intelligent, unified workspace.
            </p>
          </motion.div>

          {/* Features Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            {[
              { icon: MessageSquare, label: "AI Qualifies Leads 24/7", desc: "Automate early-stage outreach." },
              { icon: Shield, label: "Enterprise Security", desc: "Secure Twilio logs and business parameters." },
            ].map((f, i) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                key={f.label}
                className="flex gap-3 bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-premium"
              >
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl h-fit">
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{f.label}</h4>
                  <p className="text-xs text-slate-400 mt-1">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-sm text-slate-400">
          Powered by CallZenza Engine &copy; 2026. All rights reserved.
        </div>
      </div>

      {/* Right Pane - Form Card Container */}
      <div className="lg:col-span-5 flex flex-col justify-center items-center p-8 bg-slate-50 relative">
        <div className="w-full max-w-md flex flex-col gap-6">
          {/* Mobile Back Navigation (Hidden on desktop where left pane has Back to Home) */}
          <Link
            href="/"
            className="inline-flex lg:hidden items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-xl transition-all w-fit cursor-pointer shadow-2xs group self-start"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Home</span>
          </Link>

          <div className="flex flex-col gap-2 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="text-sm text-slate-500">
              Sign in to access your workspace. Account creation is managed by Platform Admins.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 lg:p-8"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <Input {...register("email", { required: true })} type="email" />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    {...register("password", { required: true })}
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    suppressHydrationWarning
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                Remember me
              </label>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium"
                >
                  {error}
                </motion.div>
              )}

              <Button type="submit" disabled={formState.isSubmitting} className="w-full mt-2 cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                <LogIn className="mr-2 h-4 w-4" />
                {formState.isSubmitting ? "Authenticating..." : "Sign In to Workspace"}
              </Button>
            </form>
          </motion.div>

          <div className="flex flex-col items-center gap-3 text-xs font-semibold text-slate-500">
            <div>
              <span>New to CallZenza? </span>
              <Link href="/signup" className="text-indigo-600 hover:underline font-bold">
                Create an Organization
              </Link>
            </div>
            <div className="flex flex-col items-center gap-1.5 pt-1 text-center">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>Super Admin:</span>
                <Link href="/super-admin/login" className="text-indigo-600 hover:underline flex items-center gap-0.5 font-bold">
                  Super Admin Console <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>Admin:</span>
                <Link href="/admin/login" className="text-indigo-600 hover:underline font-bold flex items-center gap-0.5">
                  Admin Portal <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}



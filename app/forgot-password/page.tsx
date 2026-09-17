"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between items-center bg-slate-50 p-6 font-sans">
      <div className="pt-8 flex items-center gap-2">
        <div className="p-2 bg-indigo-600 rounded-xl">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">CallZenza</span>
      </div>

      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 lg:p-8 space-y-6">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Check Your Inbox</h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              If an account is associated with <strong className="text-slate-900">{email}</strong>,
              you will receive a password reset link shortly. The link expires in 2 hours.
            </p>
            <div className="pt-4 border-t border-slate-100">
              <Link href="/login">
                <Button variant="outline" className="w-full text-xs font-semibold cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Login
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Reset Password
              </h2>
              <p className="text-xs text-slate-500">
                Enter your work email address and we&apos;ll send you instructions to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Work Email</label>
                <div className="relative">
                  <Input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 cursor-pointer shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending Link...
                  </>
                ) : (
                  <>
                    Send Reset Link <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-2 text-center">
              <Link href="/login" className="text-xs text-indigo-600 hover:underline font-semibold flex items-center justify-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="pb-8 text-xs text-slate-400">
        &copy; 2026 CallZenza Inc. All rights reserved.
      </div>
    </main>
  );
}

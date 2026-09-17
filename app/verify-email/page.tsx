"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Sparkles, ArrowRight, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/services/auth.service";
import { useAuthStore } from "@/lib/store";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const { setToken, setUser } = useAuthStore();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessage("No verification token found in the link. Please check your verification email.");
      return;
    }

    let isMounted = true;
    const runVerify = async () => {
      try {
        const res = await authService.verifyEmail(token);
        if (!isMounted) return;

        setSuccess(true);
        setMessage(res.message || "Your email address has been verified successfully!");

        // If access token returned, automatically initialize session
        if (res.access_token) {
          setToken(res.access_token);
          try {
            const me = await authService.me(res.access_token);
            setUser(me);
            if (typeof window !== "undefined") {
              const statePayload = JSON.stringify({
                state: { token: res.access_token, user: me },
                version: 0,
              });
              sessionStorage.setItem("callzenza-auth", statePayload);
              localStorage.setItem("callzenza-auth", statePayload);
            }
          } catch (meErr) {
            // Ignored, user can log in normally
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setSuccess(false);
        setMessage(err?.message || "Invalid or expired verification link.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    runVerify();

    return () => {
      isMounted = false;
    };
  }, [token, setToken, setUser]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResending(true);
    setResendStatus(null);
    try {
      const res = await authService.resendVerification(resendEmail.trim().toLowerCase());
      setResendStatus(res.message || "A new verification link has been sent to your email.");
    } catch (err: any) {
      setResendStatus(err?.message || "Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-sm p-8 text-center space-y-6">
      {loading ? (
        <div className="py-8 space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Verifying Email Address...</h2>
          <p className="text-xs text-slate-500">
            Please wait while we activate your organization workspace.
          </p>
        </div>
      ) : success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Email Verified!</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 cursor-pointer shadow-sm"
            >
              Enter Workspace <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <XCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Verification Failed</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
          </div>

          {/* Resend Form */}
          <form onSubmit={handleResend} className="space-y-3 pt-2 text-left">
            <label className="text-xs font-semibold text-slate-700">
              Need a new link? Enter your work email:
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                required
                placeholder="work@company.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="text-xs"
              />
              <Button
                type="submit"
                disabled={resending}
                variant="outline"
                className="text-xs font-semibold shrink-0 cursor-pointer"
              >
                {resending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Resend"}
              </Button>
            </div>
            {resendStatus && (
              <p className="text-[11px] text-indigo-600 font-medium">{resendStatus}</p>
            )}
          </form>

          <div className="pt-2 border-t border-slate-100">
            <Link href="/login">
              <Button variant="ghost" className="w-full text-xs text-slate-500 hover:text-slate-900 cursor-pointer">
                Back to Login
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen flex flex-col justify-between items-center bg-slate-50 p-6 font-sans">
      {/* Header */}
      <div className="pt-8 flex items-center gap-2">
        <div className="p-2 bg-indigo-600 rounded-xl">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">CallZenza</span>
      </div>

      {/* Main card */}
      <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading verification...</div>}>
        <VerifyEmailContent />
      </Suspense>

      {/* Footer */}
      <div className="pb-8 text-xs text-slate-400">
        &copy; 2026 CallZenza Inc. All rights reserved.
      </div>
    </main>
  );
}

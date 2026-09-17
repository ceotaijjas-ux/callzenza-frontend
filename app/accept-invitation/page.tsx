"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  Sparkles,
  Building2,
  Lock,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/services/auth.service";
import { useAuthStore } from "@/lib/store";

interface AcceptFormValues {
  full_name: string;
  password: string;
  confirm_password: string;
}

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<{
    email: string;
    role: string;
    business_name: string;
    business_slug: string;
    is_expired: boolean;
  } | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setToken, setUser } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<AcceptFormValues>();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("No invitation token found in this link. Please check the email you received.");
      return;
    }

    let isMounted = true;
    const fetchDetails = async () => {
      try {
        const details = await authService.getInvitationDetails(token);
        if (!isMounted) return;

        if (details.is_expired) {
          setError("This invitation has expired. Please ask your organization administrator to resend your invite.");
        } else {
          setInvitation(details);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || "Invalid or expired invitation link.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const onSubmit = async (values: AcceptFormValues) => {
    if (!token) return;
    setFormError(null);

    if (values.password !== values.confirm_password) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.acceptInvitation({
        token,
        password: values.password,
        full_name: values.full_name.trim() || undefined,
      });

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

          if (me.role === "VOICE_AGENT") {
            router.replace("/voice-agent/dashboard");
          } else if (me.role === "SUPERVISOR") {
            router.replace("/supervisor/dashboard");
          } else {
            router.replace("/dashboard");
          }
          return;
        } catch (meErr) {
          // fallback to login redirect
        }
      }

      router.push("/login?accepted=true");
    } catch (err: any) {
      setFormError(err?.message || "Failed to accept invitation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-sm p-8 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Verifying Invitation...</h2>
        <p className="text-xs text-slate-500">Checking invitation security credentials...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-sm p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
          <XCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Invitation Invalid</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
        </div>
        <div className="pt-2">
          <Link href="/login">
            <Button variant="outline" className="w-full text-xs font-semibold cursor-pointer">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-3">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs group"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        <span>Back to Login</span>
      </Link>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 lg:p-8 space-y-6">
      {/* Invitation Header Card */}
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
          <Building2 className="w-3.5 h-3.5" /> {invitation.business_name}
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Accept Team Invitation
        </h2>
        <p className="text-xs text-slate-500">
          You&apos;ve been invited as a{" "}
          <strong className="text-slate-800 font-semibold">{invitation.role}</strong>. Set your password to activate your account.
        </p>
      </div>

      {/* Account Details Box */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-600 space-y-1.5">
        <div className="flex justify-between">
          <span className="text-slate-400">Work Email:</span>
          <span className="font-semibold text-slate-800">{invitation.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Role Assigned:</span>
          <span className="font-mono text-indigo-600 font-bold">{invitation.role}</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Full Name (Optional)</label>
          <Input
            {...register("full_name")}
            placeholder="Jane Doe"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Create Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Input
              {...register("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Minimum 8 characters" },
              })}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Confirm Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Input
              {...register("confirm_password", {
                required: "Please confirm your password",
              })}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.confirm_password.message}</p>
          )}
        </div>

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium">
            {formError}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 cursor-pointer shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Activating Account...
            </>
          ) : (
            <>
              Accept Invitation &amp; Enter <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <main className="min-h-screen flex flex-col justify-between items-center bg-slate-50 p-6 font-sans">
      <div className="pt-8 flex items-center gap-2">
        <div className="p-2 bg-indigo-600 rounded-xl">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">CallZenza</span>
      </div>

      <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading invitation...</div>}>
        <AcceptInvitationContent />
      </Suspense>

      <div className="pb-8 text-xs text-slate-400">
        &copy; 2026 CallZenza Inc. All rights reserved.
      </div>
    </main>
  );
}

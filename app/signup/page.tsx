"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Sparkles,
  Mail,
  Lock,
  User,
  Phone,
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/services/auth.service";

interface SignupFormValues {
  company_name: string;
  slug: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  password: string;
  confirm_password: string;
}

export default function SignupPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: {
      company_name: "",
      slug: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      country: "",
      password: "",
      confirm_password: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    email: string;
    company_name: string;
    slug: string;
    verification_url?: string;
  } | null>(null);

  // Slug availability check
  const companyNameValue = watch("company_name");
  const slugValue = watch("slug");
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugMessage, setSlugMessage] = useState<string>("");
  const [isSlugManual, setIsSlugManual] = useState(false);

  // Auto-slugify company name
  useEffect(() => {
    if (!isSlugManual && companyNameValue) {
      const autoSlug = companyNameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setValue("slug", autoSlug);
    }
  }, [companyNameValue, isSlugManual, setValue]);

  // Debounced check slug availability
  useEffect(() => {
    if (!slugValue || slugValue.length < 2) {
      setSlugAvailable(null);
      setSlugMessage("");
      return;
    }

    const timer = setTimeout(async () => {
      setSlugChecking(true);
      try {
        const res = await authService.checkSlug(slugValue);
        setSlugAvailable(res.available);
        setSlugMessage(res.message);
      } catch (err: any) {
        setSlugAvailable(null);
        setSlugMessage("");
      } finally {
        setSlugChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slugValue]);

  const onSubmit = async (values: SignupFormValues) => {
    setGeneralError(null);

    if (values.password !== values.confirm_password) {
      setGeneralError("Passwords do not match.");
      return;
    }

    try {
      const res = await authService.registerOrganization({
        company_name: values.company_name.trim(),
        slug: values.slug.trim(),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        phone: values.phone.trim() || undefined,
        country: values.country.trim() || undefined,
      });

      setSuccessData({
        email: values.email.trim().toLowerCase(),
        company_name: values.company_name.trim(),
        slug: res.slug,
        verification_url: res.verification_url,
      });
    } catch (e: any) {
      setGeneralError(e?.message || "Failed to register organization. Please try again.");
    }
  };

  const handleResend = async () => {
    if (!successData?.email) return;
    try {
      await authService.resendVerification(successData.email);
      alert("Verification email resent! Please check your inbox and spam folder.");
    } catch (err: any) {
      alert(err?.message || "Could not resend email. Please try again later.");
    }
  };

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 font-sans cursor-default select-none">
      {/* Left Pane - Feature & Benefits Showcase */}
      <div className="hidden lg:flex lg:col-span-5 bg-indigo-950 text-slate-100 flex-col justify-between p-12 relative overflow-hidden">
        {/* Glow overlays */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl -z-10" />

        {/* Left top corner: Back option & Branding */}
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-1.5 rounded-xl transition-all w-fit cursor-pointer group shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Home</span>
          </Link>

          <Link href="/" className="flex items-center gap-2.5 w-fit group">
            <div className="p-2 bg-indigo-500 rounded-xl group-hover:bg-indigo-400 transition-colors">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">CallZenza</span>
          </Link>
        </div>

        {/* Main Content Info */}
        <div className="max-w-md space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" /> Self-Service Enterprise Multi-Tenancy
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
              Launch your AI voice &amp; communication workspace.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Empower your enterprise with autonomous voice agents, real-time call analytics,
              smart workflows, and omni-channel messaging in dedicated isolated multi-tenant environments.
            </p>
          </motion.div>

          {/* Value props */}
          <div className="space-y-3 pt-2">
            {[
              {
                title: "Isolated Enterprise Tenant",
                desc: "Your organization’s leads, campaigns, calls, and agent models are strictly sequestered.",
              },
              {
                title: "Immediate Self-Serve Setup",
                desc: "Register in 60 seconds with instant verification and seamless team onboarding.",
              },
              {
                title: "Custom Workspace Subdomain",
                desc: "Access your dedicated team portal at your unique company slug URL.",
              },
            ].map((prop, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 bg-white/5 border border-white/10 rounded-xl"
              >
                <div className="p-1 bg-indigo-500/30 text-indigo-300 rounded-lg mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{prop.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{prop.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-300 hover:text-white font-semibold underline">
            Sign In
          </Link>
        </div>
      </div>

      {/* Right Pane - Registration Form Container */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 lg:p-12 bg-slate-50 relative overflow-y-auto">
        <div className="w-full max-w-xl flex flex-col gap-6 py-8">
          {/* Top navigation */}
          <div className="flex items-center justify-between w-full">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Login</span>
            </Link>
            <Link
              href="/"
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Home
            </Link>
          </div>

          <AnimatePresence mode="wait">
            {successData ? (
              /* Success Card: Email Verification Notice */
              <motion.div
                key="success-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-8 text-center space-y-6"
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                  <Mail className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">Check Your Email</h2>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    We&apos;ve sent an activation link to{" "}
                    <strong className="text-slate-900 font-semibold">{successData.email}</strong>.
                    Please click the link in that email to verify your email address and activate{" "}
                    <strong className="text-slate-900 font-semibold">{successData.company_name}</strong>.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-500 max-w-sm mx-auto space-y-1 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Company:</span>
                    <span className="font-medium text-slate-800">{successData.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Workspace Slug:</span>
                    <span className="font-mono text-indigo-600 font-semibold">{successData.slug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-amber-600 font-medium">Pending Verification</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  {successData.verification_url ? (
                    <Link
                      href={successData.verification_url.replace(/https?:\/\/[^/]+/, "") || successData.verification_url}
                      className="w-full sm:w-auto"
                    >
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer shadow-sm flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Verify &amp; Activate Workspace
                      </Button>
                    </Link>
                  ) : null}
                  <Button
                    variant="outline"
                    onClick={handleResend}
                    className="w-full sm:w-auto text-xs font-semibold cursor-pointer"
                  >
                    Resend Verification Email
                  </Button>
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer">
                      Proceed to Login <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              /* Signup Form */
              <motion.div
                key="signup-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Mobile Back Button */}
                <div className="lg:hidden flex items-center justify-between pb-1">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Home</span>
                  </Link>
                  <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <div className="p-1 bg-indigo-500 rounded-lg text-white">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    CallZenza
                  </Link>
                </div>

                <div className="space-y-1">
                  <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    Create Your Organization
                  </h2>
                  <p className="text-sm text-slate-500">
                    Get started with enterprise AI voice automation in minutes. No credit card required.
                  </p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 lg:p-8">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Organization Section */}
                    <div className="space-y-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        <Building2 className="w-4 h-4" /> Organization Details
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Company Name <span className="text-rose-500">*</span>
                          </label>
                          <Input
                            {...register("company_name", {
                              required: "Company name is required",
                              minLength: { value: 2, message: "At least 2 characters" },
                            })}
                          />
                          {errors.company_name && (
                            <p className="text-[11px] text-rose-500 font-medium">
                              {errors.company_name.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-700">
                              Workspace URL <span className="text-rose-500">*</span>
                            </label>
                            {slugChecking && (
                              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                              </span>
                            )}
                            {!slugChecking && slugAvailable === true && (
                              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Available
                              </span>
                            )}
                            {!slugChecking && slugAvailable === false && (
                              <span className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                                <XCircle className="w-3 h-3" /> Taken
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <Input
                              {...register("slug", {
                                required: "Workspace URL slug is required",
                                minLength: { value: 2, message: "At least 2 characters" },
                                onChange: () => setIsSlugManual(true),
                              })}
                              className="font-mono text-xs pr-8"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Unique URL: callzenza.com/{slugValue || "your-org"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Administrator Section */}
                    <div className="space-y-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        <User className="w-4 h-4" /> Admin Account
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            First Name <span className="text-rose-500">*</span>
                          </label>
                          <Input
                            {...register("first_name", { required: "First name is required" })}
                          />
                          {errors.first_name && (
                            <p className="text-[11px] text-rose-500 font-medium">
                              {errors.first_name.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">Last Name</label>
                          <Input {...register("last_name")} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Work Email <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          {...register("email", {
                            required: "Work email is required",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Invalid email address",
                            },
                          })}
                          type="email"
                        />
                        {errors.email && (
                          <p className="text-[11px] text-rose-500 font-medium">
                            {errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Phone (Optional)</label>
                        <Input {...register("phone")} />
                      </div>
                    </div>

                    {/* Security Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        <Lock className="w-4 h-4" /> Security
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Password <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Input
                              {...register("password", {
                                required: "Password is required",
                                minLength: { value: 8, message: "Minimum 8 characters" },
                              })}
                              type={showPassword ? "text" : "password"}
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
                            <p className="text-[11px] text-rose-500 font-medium">
                              {errors.password.message}
                            </p>
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
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {errors.confirm_password && (
                            <p className="text-[11px] text-rose-500 font-medium">
                              {errors.confirm_password.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {generalError && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium">
                        {generalError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting || slugAvailable === false}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 cursor-pointer shadow-sm transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Organization...
                        </>
                      ) : (
                        <>
                          Create Organization <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                      By registering, you agree to CallZenza&apos;s{" "}
                      <Link href="/terms" className="underline hover:text-slate-600">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="underline hover:text-slate-600">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </form>
                </div>

                <div className="text-center text-xs text-slate-500">
                  Already have an account?{" "}
                  <Link href="/login" className="text-indigo-600 hover:underline font-bold">
                    Log in here
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

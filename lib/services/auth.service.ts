import { apiFetch } from "@/lib/api-client";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  business_id?: string | null;
  tenant_id?: string | null;
}

export const authService = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    apiFetch<AuthUser>("/api/auth/register", { method: "POST", body: JSON.stringify(data), skipAuth: true }),
  login: (data: { email: string; password: string }) =>
    apiFetch<{ access_token: string; token_type: string; business_id?: string; tenant_id?: string; role?: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),
  me: (token?: string) => apiFetch<AuthUser>("/api/users/me", { token }),

  checkSlug: (slug: string) =>
    apiFetch<{ available: boolean; slug: string; message: string }>(
      `/api/auth/check-slug?slug=${encodeURIComponent(slug)}`,
      { skipAuth: true }
    ),

  registerOrganization: (data: {
    company_name: string;
    slug?: string;
    first_name: string;
    last_name?: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
  }) =>
    apiFetch<{
      message: string;
      business_id: string;
      slug: string;
      email: string;
      verification_required: boolean;
      verification_url?: string;
    }>("/api/auth/register-organization", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  verifyEmail: (token: string) =>
    apiFetch<{
      success: boolean;
      message: string;
      access_token?: string;
      business_id?: string;
      tenant_id?: string;
      role?: string;
    }>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
      skipAuth: true,
    }),

  resendVerification: (email: string) =>
    apiFetch<{ message: string; success: boolean }>("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
      skipAuth: true,
    }),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string; success: boolean }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      skipAuth: true,
    }),

  resetPassword: (data: { token: string; new_password: string }) =>
    apiFetch<{ message: string; success: boolean }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  getInvitationDetails: (token: string) =>
    apiFetch<{
      email: string;
      role: string;
      business_name: string;
      business_slug: string;
      is_expired: boolean;
    }>(`/api/auth/invitation-details?token=${encodeURIComponent(token)}`, {
      skipAuth: true,
    }),

  acceptInvitation: (data: { token: string; password: string; full_name?: string }) =>
    apiFetch<{
      success: boolean;
      message: string;
      access_token: string;
      business_id?: string;
      tenant_id?: string;
      role?: string;
    }>("/api/auth/accept-invitation", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),
};

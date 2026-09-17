import { useAuthStore } from "@/lib/store";

const IS_BROWSER = typeof window !== "undefined";
const API_URL = IS_BROWSER ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000");

interface RequestOptions extends RequestInit {
  token?: string;
  skipAuth?: boolean;
}

/** Standardized error envelope returned by the FastAPI backend. */
export class ApiError extends Error {
  errorCode?: string;
  status: number;
  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }
}

// Module-level stable tenant cache
let cachedTenantSubdomain: string | null = null;
let isTenantResolved = false;

/** Resolves tenant subdomain once and caches the result stably */
export function getTenantSubdomain(): string | undefined {
  if (!IS_BROWSER) return undefined;
  if (isTenantResolved) {
    return cachedTenantSubdomain || undefined;
  }

  let resolved: string | undefined = undefined;
  try {
    const hostname = window.location.hostname;
    if (hostname.endsWith(".localhost")) {
      const sub = hostname.replace(".localhost", "");
      if (sub && !["www", "api", "app", "admin"].includes(sub)) {
        resolved = sub;
      }
    } else {
      const parts = hostname.split(".");
      if (parts.length >= 3) {
        const candidate = parts[0];
        if (!["www", "api", "app", "admin", "localhost", "127"].includes(candidate)) {
          resolved = candidate;
        }
      }
    }
    if (!resolved) {
      const urlParams = new URLSearchParams(window.location.search);
      const qSub = urlParams.get("tenant_subdomain") || urlParams.get("tenant");
      if (qSub) resolved = qSub;
    }
  } catch (_) {}

  cachedTenantSubdomain = resolved || "";
  isTenantResolved = true;
  return resolved;
}

/** Explicitly update or reset the cached tenant subdomain (e.g., tenant switch or logout) */
export function setTenantSubdomain(subdomain: string | null | undefined): void {
  cachedTenantSubdomain = subdomain || "";
  isTenantResolved = true;
}

// In-flight GET request deduplication map
const inFlightGetRequests = new Map<string, Promise<any>>();

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, skipAuth, headers, method = "GET", ...rest } = options;
  const isGet = !method || method.toUpperCase() === "GET";

  let authToken = token ?? (skipAuth ? undefined : useAuthStore.getState().token ?? undefined);
  if (!authToken && IS_BROWSER && !skipAuth) {
    try {
      const tabData =
        sessionStorage.getItem("callzenza-auth") ||
        localStorage.getItem("callzenza-auth-SUPER_ADMIN") ||
        localStorage.getItem("callzenza-auth-ADMIN") ||
        localStorage.getItem("callzenza-auth-VOICE_AGENT") ||
        localStorage.getItem("callzenza-auth");
      if (tabData) {
        const parsed = JSON.parse(tabData);
        authToken = parsed?.state?.token || undefined;
      }
    } catch (_) {}
  }

  const tenantSubdomain = getTenantSubdomain();
  const url = `${API_URL}${path}`;

  // Deduplicate identical concurrent in-flight GET requests
  const dedupKey = isGet ? `${url}::${tenantSubdomain || ""}::${authToken || ""}` : null;
  if (dedupKey && inFlightGetRequests.has(dedupKey)) {
    return inFlightGetRequests.get(dedupKey) as Promise<T>;
  }

  const executeFetch = async (): Promise<T> => {
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        ...rest,
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(tenantSubdomain ? { "X-Tenant-Subdomain": tenantSubdomain } : {}),
          ...headers,
        },
      });
    } catch (err: any) {
      console.warn(`[API] Network request to ${path} failed:`, err.message || err);
      throw new ApiError(`Backend server unavailable. Please ensure the backend server is running on ${API_URL}.`, 503, "SERVER_UNAVAILABLE");
    }

    if (res.status === 204) {
      return undefined as T;
    }

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401) {
        const isIntegrationPath =
          path.includes("/email") ||
          path.includes("/gmail") ||
          path.includes("/messages/") ||
          path.includes("/integrations/");
        if (!skipAuth && !path.startsWith("/api/auth/") && !isIntegrationPath) {
          useAuthStore.getState().logout();
          if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
          return new Promise(() => {});
        }
      }
      const errDetail = typeof body.detail === "object" ? JSON.stringify(body.detail) : body.detail;
      let fallbackMsg = `Request failed (${res.status})`;
      if (res.status === 500 && !body.message && !errDetail) {
        fallbackMsg = "Backend server connection error (port 8000). Please check if backend is running.";
      }
      const msgStr = typeof body.message === "string" ? body.message : (errDetail ?? fallbackMsg);
      throw new ApiError(msgStr, res.status, body.error_code);
    }

    return body as T;
  };

  if (dedupKey) {
    const fetchPromise = executeFetch().finally(() => {
      inFlightGetRequests.delete(dedupKey);
    });
    inFlightGetRequests.set(dedupKey, fetchPromise);
    return fetchPromise;
  }

  return executeFetch();
}

/** For multipart/form-data uploads (file imports) — no Content-Type header
 * so the browser can set the multipart boundary itself. */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = useAuthStore.getState().token ?? undefined;
  const tenantSubdomain = getTenantSubdomain();

  const url = `${API_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantSubdomain ? { "X-Tenant-Subdomain": tenantSubdomain } : {}),
      },
      body: formData,
    });
  } catch (err: any) {
    console.warn(`[API] Upload request to ${path} failed:`, err.message || err);
    throw new ApiError(`Backend server unavailable. Please ensure the backend server is running on ${API_URL}.`, 503, "SERVER_UNAVAILABLE");
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      if (!path.startsWith("/api/auth/")) {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
        return new Promise(() => {});
      }
    }
    const errDetail = typeof body.detail === "object" ? JSON.stringify(body.detail) : body.detail;
    const msgStr = typeof body.message === "string" ? body.message : (errDetail ?? `Request failed (${res.status})`);
    throw new ApiError(msgStr, res.status, body.error_code);
  }

  return body as T;
}

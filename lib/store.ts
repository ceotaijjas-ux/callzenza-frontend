import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  business_id?: string | null;
  tenant_id?: string | null;
  permissions?: Record<string, boolean>;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

/**
 * Tab-Isolated Session Storage with Role-Scoped Fallback
 * 
 * 1. Uses sessionStorage as the primary storage engine to isolate tab sessions.
 *    Tab 1 (Admin) and Tab 2 (Voice Agent) on http://localhost:3000 run independently.
 * 2. Also saves a role-scoped fallback in localStorage (e.g. callzenza-auth-ADMIN)
 *    so opening a role portal in a new tab can automatically restore that role's session.
 */
const customTabStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;

    // 1. Check tab's isolated sessionStorage
    const tabData = sessionStorage.getItem(name);
    if (tabData) return tabData;

    // 2. If tab sessionStorage is empty, detect portal path to restore role session
    const pathname = window.location.pathname;
    let targetRole = "";
    if (pathname.startsWith("/admin")) targetRole = "ADMIN";
    else if (pathname.startsWith("/supervisor")) targetRole = "SUPERVISOR";
    else if (pathname.startsWith("/voice-agent")) targetRole = "VOICE_AGENT";
    else if (pathname.startsWith("/dashboard") || pathname.startsWith("/leads")) targetRole = "USER";

    if (targetRole) {
      const roleData = localStorage.getItem(`callzenza-auth-${targetRole}`);
      if (roleData) {
        // Hydrate this tab's sessionStorage with the role's saved credentials
        sessionStorage.setItem(name, roleData);
        return roleData;
      }
    }

    // 3. Fallback to default callzenza-auth in localStorage if available
    const defaultData = localStorage.getItem(name);
    if (defaultData) {
      sessionStorage.setItem(name, defaultData);
      return defaultData;
    }

    return null;
  },

  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return;

    // Store in tab's isolated sessionStorage
    sessionStorage.setItem(name, value);

    // Extract role from payload and save to role-scoped key in localStorage
    try {
      const parsed = JSON.parse(value);
      const userRole = parsed?.state?.user?.role;
      if (userRole) {
        localStorage.setItem(`callzenza-auth-${userRole}`, value);
        // Normalize SUPER_ADMIN to ADMIN key as well
        if (userRole === "SUPER_ADMIN") {
          localStorage.setItem("callzenza-auth-ADMIN", value);
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  },

  removeItem: (name: string): void => {
    if (typeof window === "undefined") return;

    // Retrieve active role before clearing
    try {
      const tabData = sessionStorage.getItem(name);
      if (tabData) {
        const parsed = JSON.parse(tabData);
        const userRole = parsed?.state?.user?.role;
        if (userRole) {
          localStorage.removeItem(`callzenza-auth-${userRole}`);
          if (userRole === "SUPER_ADMIN") {
            localStorage.removeItem("callzenza-auth-ADMIN");
          }
        }
      }
    } catch {
      // Ignore
    }

    sessionStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setToken: (token) => {
        set({ token });
        // Sync role key if user is set
        const currentUser = get().user;
        if (currentUser?.role && typeof window !== "undefined") {
          const payload = JSON.stringify({ state: { token, user: currentUser }, version: 0 });
          localStorage.setItem(`callzenza-auth-${currentUser.role}`, payload);
        }
      },
      setUser: (user) => {
        set({ user });
        const currentToken = get().token;
        if (user?.role && currentToken && typeof window !== "undefined") {
          const payload = JSON.stringify({ state: { token: currentToken, user }, version: 0 });
          localStorage.setItem(`callzenza-auth-${user.role}`, payload);
          if (user.role === "SUPER_ADMIN") {
            localStorage.setItem("callzenza-auth-ADMIN", payload);
          }
        }
      },
      logout: () => {
        const currentUser = get().user;
        const currentToken = get().token;
        if (currentUser) {
          const apiUrl = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000");
          fetch(`${apiUrl}/api/auth/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
            },
            body: JSON.stringify({ user_id: currentUser.id }),
          }).catch(() => null);
        }
        if (currentUser?.role && typeof window !== "undefined") {
          localStorage.removeItem(`callzenza-auth-${currentUser.role}`);
          if (currentUser.role === "SUPER_ADMIN") {
            localStorage.removeItem("callzenza-auth-ADMIN");
          }
        }
        set({ token: null, user: null });
      },
    }),
    {
      name: "callzenza-auth",
      storage: createJSONStorage(() => customTabStorage),
      skipHydration: false,
    }
  )
);

export interface ActiveCallState {
  callActive: boolean;
  callDuration: number;
  customerConnectedAt: string | null;
  clientConnectedAt: string | null;
  clientDisconnectedAt: string | null;
  clientDuration: number;
  activeCallId: string | null;
  telephonyStatus: string;
  leadName: string;
  leadPhone: string;
  selectedClientName: string;
  selectedClientPhone: string;
  selectedClientId: string | null;
  isCallParked: boolean;
  showSelectClientModal: boolean;
  setCallState: (data: Partial<Omit<ActiveCallState, "setCallState" | "resetCall" | "tickDuration" | "openClientSelectionModal" | "closeClientSelectionModal" | "setSelectedClient">>) => void;
  openClientSelectionModal: () => void;
  closeClientSelectionModal: () => void;
  setSelectedClient: (client: { name: string; phone: string; id?: string | null }) => void;
  tickDuration: () => void;
  resetCall: () => void;
}

export function parseIsoTimestampMs(isoString: string | null | undefined): number {
  if (!isoString) return Date.now();
  let s = isoString.trim();
  // If no timezone offset or Z, explicitly force UTC
  if (!s.endsWith("Z") && !/[+-]\d{2}(:\d{2})?$/.test(s)) {
    s = s + "Z";
  }
  const parsed = new Date(s).getTime();
  if (isNaN(parsed) || parsed > Date.now()) {
    return Date.now();
  }
  return parsed;
}

export const useActiveCallStore = create<ActiveCallState>((set) => ({
  callActive: false,
  callDuration: 0,
  customerConnectedAt: null,
  clientConnectedAt: null,
  clientDisconnectedAt: null,
  clientDuration: 0,
  activeCallId: null,
  telephonyStatus: "IDLE",
  leadName: "",
  leadPhone: "",
  selectedClientName: "",
  selectedClientPhone: "",
  selectedClientId: null,
  isCallParked: false,
  showSelectClientModal: false,
  setCallState: (data) => set((state) => ({ ...state, ...data })),
  openClientSelectionModal: () => set({ showSelectClientModal: true }),
  closeClientSelectionModal: () => set({ showSelectClientModal: false }),
  setSelectedClient: ({ name, phone, id }) => set({ selectedClientName: name, selectedClientPhone: phone, selectedClientId: id || null }),
  tickDuration: () =>
    set((state) => {
      if (!state.callActive || !state.customerConnectedAt || state.telephonyStatus === "RINGING" || state.telephonyStatus === "INITIATING") {
        if (state.callDuration !== 0 && (state.telephonyStatus === "RINGING" || state.telephonyStatus === "INITIATING")) {
          return { ...state, callDuration: 0 };
        }
        return state;
      }
      const now = Date.now();
      const customerStartMs = parseIsoTimestampMs(state.customerConnectedAt);
      const customerElapsed = Math.max(0, Math.floor((now - customerStartMs) / 1000));
      let clientElapsed = state.clientDuration;
      if (state.clientConnectedAt && !state.clientDisconnectedAt) {
        const clientStartMs = parseIsoTimestampMs(state.clientConnectedAt);
        clientElapsed = Math.max(0, Math.floor((now - clientStartMs) / 1000));
      }
      return {
        ...state,
        callDuration: customerElapsed,
        clientDuration: clientElapsed,
      };
    }),
  resetCall: () =>
    set({
      callActive: false,
      callDuration: 0,
      customerConnectedAt: null,
      clientConnectedAt: null,
      clientDisconnectedAt: null,
      clientDuration: 0,
      activeCallId: null,
      telephonyStatus: "IDLE",
      leadName: "",
      leadPhone: "",
      selectedClientName: "",
      selectedClientPhone: "",
      selectedClientId: null,
      isCallParked: false,
      showSelectClientModal: false,
    }),
}));

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { PortalAuthorizedRole } from "@/types";
import { API_CONFIG, getCsrfToken, refreshSession } from "./api";

export interface AdminSessionUser {
  id: string;
  name: string;
  email: string;
  role: PortalAuthorizedRole;
  department: string;
  lastLogin: string;
}

interface SignInParams {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

interface AuthContextValue {
  user: AdminSessionUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  signIn: (
    params: SignInParams
  ) => Promise<{ ok: boolean; role?: PortalAuthorizedRole; error?: string }>;
  signOut: () => void;
}

const STORAGE_KEY = "udis_admin_session";

/**
 * Mock credentials are only used when NEXT_PUBLIC_USE_LIVE_API is false.
 * With the live API enabled, authentication is handled by Express + JWT cookies.
 */
const DEV_MOCK_EMAIL = "admin@university.edu";
const DEV_MOCK_ADMIN_ID = "admin-001";
const DEV_MOCK_PASSWORD =
  process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD || "Admin123!";

const DEV_REGISTRAR_EMAIL = "registrar@university.edu";
const DEV_REGISTRAR_ID = "reg-001";
const DEV_REGISTRAR_PASSWORD =
  process.env.NEXT_PUBLIC_DEV_REGISTRAR_PASSWORD || "Registrar123!";

const DEFAULT_ADMIN_USER: AdminSessionUser = {
  id: "ADM-2026-001",
  name: "Administrator",
  email: "admin@university.edu",
  role: "Administrator",
  department: "Office of Institutional Data & Systems",
  lastLogin: "Today, 9:45 AM",
};

const DEFAULT_REGISTRAR_USER: AdminSessionUser = {
  id: "REG-2026-001",
  name: "University Registrar",
  email: "registrar@university.edu",
  role: "Registrar",
  department: "Office of the University Registrar",
  lastLogin: "Today, 9:50 AM",
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminSessionUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const readStoredSession = (): AdminSessionUser | null => {
      try {
        const raw =
          window.localStorage.getItem(STORAGE_KEY) ||
          window.sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as AdminSessionUser;
        return parsed && parsed.email ? parsed : null;
      } catch {
        return null;
      }
    };

    const bootstrap = async () => {
      if (!API_CONFIG.useLiveApi) {
        if (!cancelled) setUser(readStoredSession());
        if (!cancelled) setIsInitializing(false);
        return;
      }

      try {
        let res = await fetch(`${API_CONFIG.baseUrl}/auth/me`, {
          credentials: "include",
        });

        if (res.status === 401 && (await refreshSession())) {
          res = await fetch(`${API_CONFIG.baseUrl}/auth/me`, {
            credentials: "include",
          });
        }

        if (res.ok) {
          const data = (await res.json()) as { user?: AdminSessionUser };
          if (!cancelled) setUser(data.user ?? null);
        } else if (!cancelled) {
          setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async ({
      identifier,
      password,
      rememberMe,
    }: SignInParams): Promise<{
      ok: boolean;
      role?: PortalAuthorizedRole;
      error?: string;
    }> => {
      const normalized = identifier.trim().toLowerCase();

      if (API_CONFIG.useLiveApi) {
        try {
          const res = await fetch(`${API_CONFIG.baseUrl}/auth/login`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              identifier: normalized,
              password,
              rememberMe,
            }),
          });

          const data = (await res.json().catch(() => ({}))) as {
            user?: AdminSessionUser;
            message?: string;
          };

          if (!res.ok || !data.user) {
            return {
              ok: false,
              error:
                data.message ||
                "Unable to sign in. Please check your credentials and try again.",
            };
          }

          setUser(data.user);
          return { ok: true, role: data.user.role };
        } catch {
          return {
            ok: false,
            error:
              "Cannot reach the University DataHub API. Make sure the backend is running.",
          };
        }
      }

      // Mock mode (NEXT_PUBLIC_USE_LIVE_API=false)
      await new Promise((resolve) => setTimeout(resolve, 750));

      const isAdminMatch =
        (normalized === DEV_MOCK_EMAIL || normalized === DEV_MOCK_ADMIN_ID) &&
        password === DEV_MOCK_PASSWORD;

      const isRegistrarMatch =
        (normalized === DEV_REGISTRAR_EMAIL ||
          normalized === DEV_REGISTRAR_ID) &&
        password === DEV_REGISTRAR_PASSWORD;

      if (!isAdminMatch && !isRegistrarMatch) {
        return {
          ok: false,
          error:
            "Invalid email or password. Please check your credentials and try again.",
        };
      }

      const baseProfile = isRegistrarMatch
        ? DEFAULT_REGISTRAR_USER
        : DEFAULT_ADMIN_USER;

      const sessionUser: AdminSessionUser = {
        ...baseProfile,
        lastLogin: "Just now",
      };

      try {
        window.localStorage.removeItem(STORAGE_KEY);
        window.sessionStorage.removeItem(STORAGE_KEY);
        const targetStorage = rememberMe
          ? window.localStorage
          : window.sessionStorage;
        targetStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      } catch {
        // Ignore storage write errors in restricted browsing modes
      }

      setUser(sessionUser);
      return { ok: true, role: sessionUser.role };
    },
    []
  );

  const signOut = useCallback(() => {
    if (API_CONFIG.useLiveApi) {
      const csrfToken = getCsrfToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

      void fetch(`${API_CONFIG.baseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers,
      }).catch(() => undefined);
    }

    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isInitializing,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

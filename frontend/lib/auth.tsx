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
import { API_CONFIG } from "./api";

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
 * Development mock credentials for frontend authentication demonstration.
 * In production, authentication delegates to POST /api/auth/login (Express + JWT + PostgreSQL).
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
    try {
      const savedLocal = window.localStorage.getItem(STORAGE_KEY);
      const savedSession = window.sessionStorage.getItem(STORAGE_KEY);
      const raw = savedLocal || savedSession;
      if (raw) {
        const parsed = JSON.parse(raw) as AdminSessionUser;
        if (parsed && parsed.email) {
          setUser(parsed);
        }
      }
    } catch {
      // Ignore storage parse issues
    } finally {
      setIsInitializing(false);
    }
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

      // Prepared for future Express + JWT + PostgreSQL endpoint
      if (API_CONFIG.useLiveApi) {
        try {
          const res = await fetch(`${API_CONFIG.baseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: normalized, password }),
          });
          if (res.ok) {
            const data = await res.json();
            const sessionUser: AdminSessionUser =
              data.user || DEFAULT_ADMIN_USER;
            const storage = rememberMe
              ? window.localStorage
              : window.sessionStorage;
            storage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
            setUser(sessionUser);
            return { ok: true, role: sessionUser.role };
          }
        } catch {
          // Fall back to mock authentication when backend auth route is not yet online
        }
      }

      // Realistic network latency for Sign In transition
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

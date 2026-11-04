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
import { API_CONFIG, fetchJson, setSessionExpiredHandler } from "./api";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: PortalAuthorizedRole;
  accessRole?: string;
  department: string;
  studentId?: string;
  programCode?: string;
  programName?: string;
  yearLevel?: string;
  borrowerCardNo?: string;
  lastLogin: string;
}

// Backwards-compatible alias for existing imports
export type AdminSessionUser = SessionUser;

export interface SignInParams {
  identifier: string;
  password: string;
  rememberMe: boolean;
  expectedRole?: "Administrator" | "Student";
}

export interface RegisterStudentParams {
  name: string;
  email: string;
  studentId: string;
  programCode: string;
  programName: string;
  yearLevel: string;
  password: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  signIn: (
    params: SignInParams
  ) => Promise<{ ok: boolean; role?: PortalAuthorizedRole; error?: string }>;
  registerStudent: (
    params: RegisterStudentParams
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: (targetUrl?: string | React.MouseEvent) => void;
}

const STORAGE_KEY = "udis_user_session";
const LEGACY_STORAGE_KEY = "udis_admin_session";
/** Legacy mock-registration records; cleaned up opportunisticly on sign-out. */
const REGISTERED_STUDENTS_KEY = "udis_registered_students";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const savedLocal =
        window.localStorage.getItem(STORAGE_KEY) ||
        window.localStorage.getItem(LEGACY_STORAGE_KEY);
      const savedSession =
        window.sessionStorage.getItem(STORAGE_KEY) ||
        window.sessionStorage.getItem(LEGACY_STORAGE_KEY);
      const raw = savedLocal || savedSession;
      if (raw) {
        const parsed = JSON.parse(raw) as SessionUser;
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

  useEffect(() => {
    setSessionExpiredHandler(() => {
      if (typeof window === "undefined") return;

      // Clear every auth session key this provider owns, including legacy
      // mock-registration leftovers.
      try {
        window.localStorage.removeItem(STORAGE_KEY);
        window.sessionStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
        window.localStorage.removeItem(REGISTERED_STUDENTS_KEY);
      } catch {
        // Ignore storage access errors in restricted browsing modes
      }

      setUser(null);
      if (typeof window !== "undefined" && router) {
        router.replace("/login?session=expired");
      }
    });

    return () => setSessionExpiredHandler(null);
  }, [router]);

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
      if (!API_CONFIG.useLiveApi) {
        return {
          ok: false,
          error:
            "The backend API is not configured, so real accounts cannot sign in. Set NEXT_PUBLIC_API_URL in frontend/.env.",
        };
      }

      // Live authentication: the shared client sends cookies (credentials:
      // "include") and injects the CSRF header for cross-origin Express calls.
      try {
        const data = await fetchJson<{
          user?: SessionUser;
          csrfToken?: string;
        }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            identifier: identifier.trim().toLowerCase(),
            password,
          }),
        });
        if (!data.user) {
          return {
            ok: false,
            error: "The server did not return a user session. Please try again.",
          };
        }
        const sessionUser = data.user;
        const storage = rememberMe ? window.localStorage : window.sessionStorage;
        storage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
        setUser(sessionUser);
        return { ok: true, role: sessionUser.role };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : "Unable to sign in. Please try again.",
        };
      }
    },
    []
  );

  const registerStudent = useCallback(
    async (
      _params: RegisterStudentParams
    ): Promise<{ ok: boolean; error?: string }> => {
      // Only real accounts exist now: the backend does not expose a
      // self-registration endpoint, so mock/local registrations are disabled.
      return {
        ok: false,
        error:
          "Online student registration is currently unavailable. Please ask the registrar or an administrator to create your account in the system.",
      };
    },
    []
  );

  const signOut = useCallback((targetUrl?: string | React.MouseEvent) => {
    const wasAdmin = user?.role === "Administrator" || user?.role === "Registrar";

    // Best-effort backend logout (clears the httpOnly cookie server-side).
    // Fire-and-forget: never block local sign-out on the network response.
    if (API_CONFIG.useLiveApi) {
      void fetchJson<unknown>("/auth/logout", { method: "POST" }).catch(() => {
        // Ignore network/auth failures; local session cleanup still proceeds.
      });
    }

    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setUser(null);
    if (typeof targetUrl === "string") {
      router.push(targetUrl);
    } else {
      router.push(wasAdmin ? "/admin/login" : "/login");
    }
  }, [user, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isInitializing,
        signIn,
        registerStudent,
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

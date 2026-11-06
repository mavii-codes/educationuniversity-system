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
import {
  API_CONFIG,
  fetchJson,
  getApiErrorStatus,
  refreshSession,
  setSessionExpiredHandler,
  setSessionUserUpdateHandler,
} from "./api";

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
  expectedRole?: "Administrator" | "Librarian" | "Student";
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
  updateSessionUser: (updates: Partial<SessionUser>) => void;
  signOut: (targetUrl?: string | React.MouseEvent) => void;
}

const STORAGE_KEY = "udis_user_session";
const LEGACY_STORAGE_KEY = "udis_admin_session";
/** Legacy mock-registration records; cleaned up opportunisticly on sign-out. */
const REGISTERED_STUDENTS_KEY = "udis_registered_students";

function normalizePortalUser(user: SessionUser): SessionUser {
  return (user as { role?: string }).role === "Registrar"
    ? { ...user, role: "Librarian" as const, accessRole: "Library Staff" }
    : user;
}

function clearPersistedSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    window.localStorage.removeItem(REGISTERED_STUDENTS_KEY);
  } catch {
    // Ignore storage access errors in restricted browsing modes
  }
}

/**
 * Fetch the authoritative session user. `/auth/*` endpoints are excluded from
 * the shared client's auto-refresh retry, so an expired access cookie is
 * refreshed explicitly and the request retried once.
 */
async function fetchCurrentUser(): Promise<SessionUser> {
  try {
    const data = await fetchJson<{ user?: SessionUser }>("/auth/me");
    if (!data?.user) {
      throw new Error("The server did not return a user session.");
    }
    return data.user;
  } catch (error) {
    if (getApiErrorStatus(error) !== 401) throw error;
    if (!(await refreshSession())) throw error;

    const data = await fetchJson<{ user?: SessionUser }>("/auth/me");
    if (!data?.user) {
      throw new Error("The server did not return a user session.");
    }
    return data.user;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();

  const applyServerUser = useCallback((nextUser: SessionUser) => {
    setUser(nextUser);
    try {
      const storedLocally = window.localStorage.getItem(STORAGE_KEY) !== null;
      const storage = storedLocally ? window.localStorage : window.sessionStorage;
      storage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch (error) {
      console.error("[Auth] Failed to persist refreshed session profile:", error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      let restoredUser: SessionUser | null = null;
      let restoredStorage: Storage | null = null;
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
            restoredUser = normalizePortalUser(parsed);
            // Optimistic first paint while the server revalidates the session.
            setUser(restoredUser);
            restoredStorage = savedLocal
              ? window.localStorage
              : window.sessionStorage;
          }
        }
      } catch {
        // Ignore storage parse issues
      }

      // Demo mode keeps its instant restore with no backend round-trip.
      if (!API_CONFIG.useLiveApi || !restoredUser || !restoredStorage) {
        setIsInitializing(false);
        return;
      }

      try {
        const serverUser = normalizePortalUser(await fetchCurrentUser());
        if (cancelled) return;
        setUser(serverUser);
        try {
          restoredStorage.setItem(STORAGE_KEY, JSON.stringify(serverUser));
        } catch (error) {
          console.error("[Auth] Failed to persist revalidated session:", error);
        }
      } catch (error) {
        if (cancelled) return;
        if (getApiErrorStatus(error) === 401) {
          // Definitive auth failure after a refresh retry: drop the session.
          clearPersistedSession();
          setUser(null);
        } else {
          // Network blip / 5xx: keep the optimistic cached session.
          console.warn(
            "[Auth] Unable to revalidate the stored session; keeping cached session:",
            error
          );
        }
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSessionUserUpdateHandler((updatedUser) => {
      if (!updatedUser || typeof updatedUser !== "object") return;
      applyServerUser(normalizePortalUser(updatedUser as SessionUser));
    });

    return () => setSessionUserUpdateHandler(null);
  }, [applyServerUser]);

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
            identifier: identifier.trim(),
            password,
            ...(rememberMe ? { rememberMe } : {}),
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
      params: RegisterStudentParams
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!API_CONFIG.useLiveApi) {
        return {
          ok: false,
          error:
            "Student registration requires the live backend. Set NEXT_PUBLIC_API_URL in frontend/.env and enable PostgreSQL in backend/.env.",
        };
      }

      try {
        await fetchJson("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            studentId: params.studentId,
            name: params.name,
            email: params.email.trim().toLowerCase(),
            password: params.password,
            programCode: params.programCode,
            yearLevel: params.yearLevel,
          }),
        });
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to register your account. Please try again.",
        };
      }
    },
    []
  );

  const updateSessionUser = useCallback((updates: Partial<SessionUser>) => {
    setUser((previous) => {
      if (!previous) return previous;
      const updated = { ...previous, ...updates };
      try {
        const storedLocally = window.localStorage.getItem(STORAGE_KEY) !== null;
        const storage = storedLocally ? window.localStorage : window.sessionStorage;
        storage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("[Auth] Failed to persist updated session profile:", error);
      }
      return updated;
    });
  }, []);

  const signOut = useCallback((targetUrl?: string | React.MouseEvent) => {
    const wasAdmin =
      user?.role === "Administrator" ||
      user?.role === "Librarian" ||
      (user?.role as string) === "Registrar";

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
    const destination =
      typeof targetUrl === "string"
        ? targetUrl
        : user?.role === "Librarian" || (user?.role as string) === "Registrar"
          ? "/admin/login"
          : wasAdmin
            ? "/admin/login"
            : "/login";
    window.location.replace(destination);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isInitializing,
        signIn,
        registerStudent,
        updateSessionUser,
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

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

type StoredRegisteredStudent = Omit<RegisterStudentParams, "password"> & {
  id: string;
  /** Legacy mock records may still contain a plaintext password. */
  password?: string;
};

function stripStoredPassword(
  student: StoredRegisteredStudent
): StoredRegisteredStudent {
  const sanitized = { ...student };
  delete sanitized.password;
  return sanitized;
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
const REGISTERED_STUDENTS_KEY = "udis_registered_students";

/**
 * Development mock credentials for frontend authentication demonstration.
 * In production, authentication delegates to POST /api/auth/login (Express + JWT + PostgreSQL).
 */
const DEV_MOCK_EMAIL = "admin@university.edu";
const DEV_MOCK_ADMIN_ID = "admin-001";
const DEV_MOCK_PASSWORD = "Admin123!";

const DEV_REGISTRAR_EMAIL = "registrar@university.edu";
const DEV_REGISTRAR_ID = "reg-001";
const DEV_REGISTRAR_PASSWORD =
  process.env.NEXT_PUBLIC_DEV_REGISTRAR_PASSWORD || "Registrar123!";

const DEV_STUDENT_EMAIL = "student@university.edu";
const DEV_STUDENT_ID = "2024-042";
const DEV_STUDENT_PASSWORD = "Student123!";

const DEFAULT_ADMIN_USER: SessionUser = {
  id: "ADM-2026-001",
  name: "Head Administrator",
  accessRole: "Head Administrator",
  email: "admin@university.edu",
  role: "Administrator",
  department: "Office of Institutional Data & Systems",
  lastLogin: "Today, 9:45 AM",
};

export const DEFAULT_LIBRARIAN_USER: SessionUser = {
  id: "LIB-STAFF-001",
  name: "Elena Rostova",
  email: "librarian@university.edu",
  role: "Librarian",
  accessRole: "Library Staff",
  department: "University Library & Circulation Services",
  lastLogin: "Today, 9:50 AM",
};

export const DEFAULT_STUDENT_USER: SessionUser = {
  id: "STU-2024-042",
  studentId: "2024-042",
  name: "Marco Villanueva",
  email: "student@university.edu",
  role: "Student",
  department: "College of Computing & Information Sciences",
  programCode: "BSIT",
  programName: "BS Information Technology",
  yearLevel: "2nd Year",
  borrowerCardNo: "LIB-2024-042",
  lastLogin: "Today, 10:15 AM",
};

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

      // Clear every auth session key this provider owns. Demo registrations
      // (REGISTERED_STUDENTS_KEY) are intentionally preserved.
      try {
        window.localStorage.removeItem(STORAGE_KEY);
        window.sessionStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
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
      expectedRole,
    }: SignInParams): Promise<{
      ok: boolean;
      role?: PortalAuthorizedRole;
      error?: string;
    }> => {
      const normalized = identifier.trim().toLowerCase();

      // Live authentication: the shared client sends cookies (credentials:
      // "include") and injects the CSRF header for cross-origin Express calls.
      if (API_CONFIG.useLiveApi) {
        try {
          const data = await fetchJson<{
            user?: SessionUser;
            csrfToken?: string;
          }>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ identifier: normalized, password }),
          });
          const sessionUser: SessionUser = data.user || DEFAULT_ADMIN_USER;
          const storage = rememberMe
            ? window.localStorage
            : window.sessionStorage;
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
      }

      // Realistic network latency for Sign In transition
      await new Promise((resolve) => setTimeout(resolve, 600));

      // 1. Check Registered Students in LocalStorage
      let registeredStudentMatch: SessionUser | null = null;
      try {
        const registeredRaw = window.localStorage.getItem(
          REGISTERED_STUDENTS_KEY
        );
        if (registeredRaw) {
          const registeredList = JSON.parse(
            registeredRaw
          ) as StoredRegisteredStudent[];
          const found = registeredList.find((s) => {
            const identifierMatches =
              s.email.toLowerCase() === normalized ||
              s.studentId.toLowerCase() === normalized;
            if (!identifierMatches) return false;

            // Demo-only tradeoff: mock registrations never persist passwords.
            // In mock mode only, any non-empty password is accepted for a
            // stored account without one; live-API auth never reaches here.
            if (s.password === undefined) {
              return !API_CONFIG.useLiveApi && password.length > 0;
            }
            return s.password === password;
          });
          if (found) {
            registeredStudentMatch = {
              id: found.id,
              studentId: found.studentId,
              name: found.name,
              email: found.email,
              role: "Student",
              department: "College of Computing & Information Sciences",
              programCode: found.programCode,
              programName: found.programName,
              yearLevel: found.yearLevel,
              borrowerCardNo: `LIB-${found.studentId}`,
              lastLogin: "Just now",
            };
          }
        }
      } catch {
        // Ignore JSON error
      }

      if (registeredStudentMatch) {
        if (expectedRole === "Administrator") {
          return {
            ok: false,
            error:
              "This is a Student account. Please access the Student Library Portal at /login.",
          };
        }
        const storage = rememberMe
          ? window.localStorage
          : window.sessionStorage;
        storage.setItem(STORAGE_KEY, JSON.stringify(registeredStudentMatch));
        setUser(registeredStudentMatch);
        return { ok: true, role: "Student" };
      }

      // 2. Check Mock Student Credentials
      const isStudentMatch =
        (normalized === DEV_STUDENT_EMAIL ||
          normalized === DEV_STUDENT_ID.toLowerCase() ||
          normalized === "marco.villanueva@university.edu.ph") &&
        password === DEV_STUDENT_PASSWORD;

      if (isStudentMatch) {
        if (expectedRole === "Administrator") {
          return {
            ok: false,
            error:
              "This is a Student account. Please access the Student Library Portal at /login.",
          };
        }
        const sessionUser: SessionUser = {
          ...DEFAULT_STUDENT_USER,
          lastLogin: "Just now",
        };
        const storage = rememberMe
          ? window.localStorage
          : window.sessionStorage;
        storage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
        setUser(sessionUser);
        return { ok: true, role: "Student" };
      }

      // 3. Check Mock Admin & Library Staff Credentials
      const isAdminMatch =
        (normalized === DEV_MOCK_EMAIL ||
          normalized === DEV_MOCK_ADMIN_ID ||
          normalized === "admin") &&
        password === DEV_MOCK_PASSWORD;

      const isLibrarianMatch =
        (normalized === DEV_LIBRARIAN_EMAIL ||
          normalized === "staff@university.edu" ||
          normalized === "registrar@university.edu" ||
          normalized === DEV_LIBRARIAN_ID ||
          normalized === "librarian" ||
          normalized === "staff" ||
          normalized === "registrar") &&

        (password === DEV_LIBRARIAN_PASSWORD ||
          password === "Staff123!" ||
          password === "Registrar123!");

      if (!isAdminMatch && !isLibrarianMatch) {
        return {
          ok: false,
          error:
            "Invalid credentials. Please verify your institutional email or username and password.",
        };
      }

      if (expectedRole === "Student") {
        return {
          ok: false,
          error:
            "This is an Administrative account. Please access the Administrator / Library Staff Portal at /admin/login.",
        };
      }

      const baseProfile = isLibrarianMatch
        ? DEFAULT_LIBRARIAN_USER
        : DEFAULT_ADMIN_USER;

      const sessionUser: SessionUser = {
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

  const registerStudent = useCallback(
    async (
      params: RegisterStudentParams
    ): Promise<{ ok: boolean; error?: string }> => {
      await new Promise((resolve) => setTimeout(resolve, 600));

      try {
        const raw =
          window.localStorage.getItem(REGISTERED_STUDENTS_KEY) || "[]";
        const current = (
          JSON.parse(raw) as StoredRegisteredStudent[]
        ).map(stripStoredPassword);

        const exists = current.some(
          (s) =>
            s.email.toLowerCase() === params.email.trim().toLowerCase() ||
            s.studentId.trim() === params.studentId.trim()
        );

        if (
          exists ||
          params.email.trim().toLowerCase() === DEV_STUDENT_EMAIL ||
          params.studentId.trim() === DEV_STUDENT_ID
        ) {
          return {
            ok: false,
            error:
              "An account with this Student ID or email is already registered.",
          };
        }

        // Persist the demo profile without the plaintext password.
        const newStudent: StoredRegisteredStudent = {
          id: `STU-${params.studentId.trim()}`,
          name: params.name,
          email: params.email,
          studentId: params.studentId,
          programCode: params.programCode,
          programName: params.programName,
          yearLevel: params.yearLevel,
        };

        current.push(newStudent);
        window.localStorage.setItem(
          REGISTERED_STUDENTS_KEY,
          JSON.stringify(current)
        );

        return { ok: true };
      } catch (err: any) {
        return {
          ok: false,
          error: err?.message || "Failed to complete student registration.",
        };
      }
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

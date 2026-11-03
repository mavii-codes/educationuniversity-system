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

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: PortalAuthorizedRole;
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
  signOut: () => void;
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
const DEV_MOCK_PASSWORD =
  process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD || "Admin123!";

const DEV_REGISTRAR_EMAIL = "registrar@university.edu";
const DEV_REGISTRAR_ID = "reg-001";
const DEV_REGISTRAR_PASSWORD =
  process.env.NEXT_PUBLIC_DEV_REGISTRAR_PASSWORD || "Registrar123!";

const DEV_STUDENT_EMAIL = "student@university.edu";
const DEV_STUDENT_ID = "2024-042";
const DEV_STUDENT_PASSWORD =
  process.env.NEXT_PUBLIC_DEV_STUDENT_PASSWORD || "Student123!";

const DEFAULT_ADMIN_USER: SessionUser = {
  id: "ADM-2026-001",
  name: "Administrator",
  email: "admin@university.edu",
  role: "Administrator",
  department: "Office of Institutional Data & Systems",
  lastLogin: "Today, 9:45 AM",
};

const DEFAULT_REGISTRAR_USER: SessionUser = {
  id: "REG-2026-001",
  name: "University Registrar",
  email: "registrar@university.edu",
  role: "Registrar",
  department: "Office of the University Registrar",
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
            const sessionUser: SessionUser = data.user || DEFAULT_ADMIN_USER;
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
      await new Promise((resolve) => setTimeout(resolve, 600));

      // 1. Check Registered Students in LocalStorage
      let registeredStudentMatch: SessionUser | null = null;
      try {
        const registeredRaw = window.localStorage.getItem(
          REGISTERED_STUDENTS_KEY
        );
        if (registeredRaw) {
          const registeredList = JSON.parse(registeredRaw) as Array<
            RegisterStudentParams & { id: string }
          >;
          const found = registeredList.find(
            (s) =>
              (s.email.toLowerCase() === normalized ||
                s.studentId.toLowerCase() === normalized) &&
              s.password === password
          );
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

      // 3. Check Mock Admin & Registrar Credentials
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
            "Invalid credentials. Please verify your email / student ID and password.",
        };
      }

      if (expectedRole === "Student") {
        return {
          ok: false,
          error:
            "This is an Administrative account. Please access the Administrator / Librarian Portal at /admin/login.",
        };
      }

      const baseProfile = isRegistrarMatch
        ? DEFAULT_REGISTRAR_USER
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
        const current = JSON.parse(raw) as Array<
          RegisterStudentParams & { id: string }
        >;

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

        const newStudent = {
          ...params,
          id: `STU-${params.studentId.trim()}`,
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

  const signOut = useCallback(() => {
    const wasAdmin = user?.role === "Administrator" || user?.role === "Registrar";
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setUser(null);
    router.push(wasAdmin ? "/admin/login" : "/login");
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

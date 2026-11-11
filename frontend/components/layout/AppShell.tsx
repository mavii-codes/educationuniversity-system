"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";
import { Header } from "./Header";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileDrawer } from "@/components/admin/AdminMobileDrawer";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { StudentMobileDrawer } from "@/components/student/StudentMobileDrawer";
import { StudentHeader } from "@/components/student/StudentHeader";
import { StaffSidebar } from "@/components/staff/StaffSidebar";
import { StaffMobileDrawer } from "@/components/staff/StaffMobileDrawer";
import { StaffHeader } from "@/components/staff/StaffHeader";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";

function LibraryDataAlert() {
  const { loadState, refreshData } = useLibraryStore();
  const [isRetrying, setIsRetrying] = useState(false);

  // Keep the alert mounted during an explicit retry so the button can show
  // progress; a successful retry flips loadState to "ready" and unmounts it.
  if (loadState !== "error" && !isRetrying) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await refreshData();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 sm:px-6 lg:px-8">
      <div
        role="alert"
        className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-amber-900 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <p className="text-xs font-medium leading-5">
            Library data couldn&apos;t be loaded from the server — some lists
            may be empty or out of date.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRetry()}
          disabled={isRetrying}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 self-end rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60 sm:self-auto"
        >
          {isRetrying ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {isRetrying ? "Retrying..." : "Retry"}
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isInitializing, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/admin/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  const isAdminPortal = Boolean(pathname?.startsWith("/admin"));
  const isStudentPortal = Boolean(pathname?.startsWith("/student"));
  const isStaffPortal = Boolean(pathname?.startsWith("/staff"));

  useEffect(() => {
    if (isInitializing) return;

    if (isAdminPortal) {
      if (pathname === "/admin/login") {
        if (
          isAuthenticated &&
          (user?.role === "Administrator" || user?.role === "Librarian")
        ) {
          router.replace(user.role === "Librarian" ? "/staff/dashboard" : "/admin/dashboard");
        } else if (isAuthenticated && user?.role === "Student") {
          // User explicitly visited Admin Login while logged in as Student.
          // Sign out of student session so the Admin Login form is shown immediately.
          signOut("/admin/login");
        }
        return;
      }
      if (!isAuthenticated) {
        router.replace("/admin/login");
      } else if (user?.role === "Student") {
        router.replace("/student/dashboard");
      } else if (
        user?.role === "Librarian" &&
        pathname !== "/admin/ferpa" &&
        !pathname?.startsWith("/admin/ferpa/")
      ) {
        // Librarians have read-only FERPA visibility; all other admin modules
        // remain Administrator-only.
        router.replace("/staff/dashboard");
      }
    } else if (isStaffPortal) {
      if (!isAuthenticated) {
        router.replace("/admin/login");
      } else if (user?.role === "Student") {
        router.replace("/student/dashboard");
      }
    } else if (isStudentPortal) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (
        user?.role === "Administrator" ||
        user?.role === "Librarian"
      ) {
        router.replace(user.role === "Librarian" ? "/staff/dashboard" : "/admin/dashboard");
      }
    } else if (pathname === "/login") {
      if (isAuthenticated && user?.role === "Student") {
        router.replace("/student/dashboard");
      } else if (
        isAuthenticated &&
        (user?.role === "Administrator" ||
          user?.role === "Librarian")
      ) {
        router.replace(user.role === "Librarian" ? "/staff/dashboard" : "/admin/dashboard");
      }
    }
  }, [
    isAdminPortal,
    isStaffPortal,
    isStudentPortal,
    isInitializing,
    isAuthenticated,
    user,
    pathname,
    router,
    signOut,
  ]);

  // Public authentication screens render full-bleed without sidebar or top header
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Protected Admin Portal Shell
  if (isAdminPortal) {
    if (isInitializing || !isAuthenticated || user?.role === "Student") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-6 py-5 text-center text-xs font-medium text-slate-600 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span>Verifying administrator session...</span>
            </div>
            {!isAuthenticated && !isInitializing && (
              <Link
                href="/admin/login"
                className="mt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
              >
                Redirecting to Administrator Login (click if delayed)
              </Link>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        <AdminSidebar />
        <AdminMobileDrawer
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        <div className="flex min-h-screen flex-col lg:pl-64">
          <AdminHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
          <LibraryDataAlert />
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-[1440px] border-t border-slate-200/70 px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p>University Library Management System · Administrator Portal</p>
              <p>
                Catalog, circulation, member accounts, and library operations
              </p>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  // Protected Library Staff Portal Shell
  if (isStaffPortal) {
    if (isInitializing || !isAuthenticated || user?.role === "Student") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-6 py-5 text-center text-xs font-medium text-slate-600 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span>Verifying library staff session...</span>
            </div>
            {!isAuthenticated && !isInitializing && (
              <Link
                href="/admin/login"
                className="mt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
              >
                Redirecting to Administrator / Staff Login (click if delayed)
              </Link>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        <StaffSidebar />
        <StaffMobileDrawer
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        <div className="flex min-h-screen flex-col lg:pl-64">
          <StaffHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
          <LibraryDataAlert />
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-[1440px] border-t border-slate-200/70 px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p>University Library Management System · Library Staff Portal</p>
              <p>
                Catalog, circulation, member accounts, and library operations
              </p>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  // Protected Student Portal Shell
  if (isStudentPortal) {
    if (
      isInitializing ||
      !isAuthenticated ||
      (user?.role !== "Student" && user?.role)
    ) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-6 py-5 text-center text-xs font-medium text-slate-600 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span>Verifying student session...</span>
            </div>
            {!isAuthenticated && !isInitializing && (
              <Link
                href="/login"
                className="mt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
              >
                Redirecting to Student Login (click if delayed)
              </Link>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        <StudentSidebar />
        <StudentMobileDrawer
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        <div className="flex min-h-screen flex-col lg:pl-64">
          <StudentHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
          <LibraryDataAlert />
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-[1440px] border-t border-slate-200/70 px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p>University Library Management System · Student Portal</p>
              <p>
                Browse books, manage loans, and follow library activity
              </p>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  // Preserved legacy routes fallback
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <Sidebar />
      <MobileNavigation
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <LibraryDataAlert />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-[1440px] border-t border-slate-200/70 px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p>
              University Library Management System
            </p>
            <p>
              Catalog, circulation, member accounts, and library operations
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

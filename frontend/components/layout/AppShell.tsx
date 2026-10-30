"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Award, GraduationCap, Loader2, LogOut, User } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";
import { Header } from "./Header";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileDrawer } from "@/components/admin/AdminMobileDrawer";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useAuth } from "@/lib/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isInitializing, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/forgot-password";

  const isAdminPortal = Boolean(pathname?.startsWith("/admin"));
  const isRegistrarPortal = Boolean(pathname?.startsWith("/registrar"));

  useEffect(() => {
    if ((isAdminPortal || isRegistrarPortal) && !isInitializing && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    // Keep Admin and Registrar portal routes separated by role
    if (isAdminPortal && !isInitializing && isAuthenticated && user?.role === "Registrar") {
      router.replace("/registrar/alumni");
    }
  }, [isAdminPortal, isRegistrarPortal, isInitializing, isAuthenticated, user, router]);

  // Public authentication screens render full-bleed without sidebar or top header
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Protected Admin Portal Shell
  if (isAdminPortal) {
    if (isInitializing || !isAuthenticated || user?.role === "Registrar") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-xs font-medium text-slate-600 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Verifying administrator session...</span>
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
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-[1440px] border-t border-slate-200/70 px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p>University Data Integration System · Admin Portal</p>
              <p>
                Connected Systems: SIS · LMS · HR / Payroll · Library · Alumni CRM
              </p>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  // Protected Registrar Portal Shell (Scoped to authorized Registrar Alumni access)
  if (isRegistrarPortal) {
    if (isInitializing || !isAuthenticated) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-xs font-medium text-slate-600 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Verifying registrar session...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-bold tracking-tight text-slate-900">
                  University Data Integration System
                </span>
                <span className="block text-[11px] font-medium text-slate-500">
                  Registrar Portal · Integrated Alumni Records
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/registrar/alumni"
                className="hidden items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 sm:inline-flex"
              >
                <Award className="h-3.5 w-3.5" />
                <span>Alumni</span>
              </Link>
              <div className="hidden items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs sm:flex">
                <User className="h-3.5 w-3.5 text-indigo-600" />
                <span className="font-semibold text-slate-800">
                  {user?.name || "University Registrar"}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{user?.role || "Registrar"}</span>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
          {children}
        </main>
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
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-[1440px] border-t border-slate-200/70 px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p>
              University Data Integration System · Unified Student Lifecycle &amp; Academic Analytics
            </p>
            <p>
              Integrated Sources: SIS · LMS · HR / Payroll · Library · Alumni CRM
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

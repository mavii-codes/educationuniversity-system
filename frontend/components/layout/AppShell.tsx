"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  const { isAuthenticated, isInitializing } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/forgot-password";

  const isAdminPortal = Boolean(pathname?.startsWith("/admin"));

  useEffect(() => {
    if (isAdminPortal && !isInitializing && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAdminPortal, isInitializing, isAuthenticated, router]);

  // Public authentication screens render full-bleed without sidebar or top header
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Protected Admin Portal Shell
  if (isAdminPortal) {
    if (isInitializing || !isAuthenticated) {
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
              <p>
                University Data Integration System · Admin Portal
              </p>
              <p>
                Connected Systems: SIS · LMS · HR / Payroll · Library · Alumni CRM
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

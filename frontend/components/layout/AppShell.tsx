"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";
import { Header } from "./Header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <Sidebar />
      <MobileNavigation
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="lg:pl-64 flex min-h-screen flex-col">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-[1440px] border-t border-slate-200/70 px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p>
              University DataHub · Unified Student Lifecycle &amp; Academic Analytics
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


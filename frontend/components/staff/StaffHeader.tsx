"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface StaffHeaderProps {
  onOpenMobileMenu: () => void;
}

export function StaffHeader({ onOpenMobileMenu }: StaffHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const getPageTitle = () => {
    if (pathname === "/staff/dashboard") return { title: "Staff Dashboard", subtitle: "Circulation desk, request queues, and active library operations" };
    if (pathname === "/staff/books") return { title: "Books Catalog", subtitle: "Manage library collection inventory, shelf locations, and copies" };
    if (pathname === "/staff/requests") return { title: "Borrowing Requests", subtitle: "Approve or decline student borrowing requests" };
    if (pathname === "/staff/returns") return { title: "Returns & Check-in", subtitle: "Process book returns and verify item condition" };
    if (pathname === "/staff/reservations") return { title: "Reservations", subtitle: "Manage book hold requests and reservation priorities" };
    if (pathname === "/staff/fines") return { title: "Fines & Overdues", subtitle: "Monitor overdue items and manage fine payments" };
    if (pathname === "/staff/students") return { title: "Student Lookup", subtitle: "Look up student borrower cards and borrowing history" };
    if (pathname === "/staff/notifications") return { title: "Notifications", subtitle: "Circulation alerts and system messages" };
    return { title: "Library Staff Portal", subtitle: "University Library Operations" };
  };

  const { title, subtitle } = getPageTitle();
  const staffRole = user?.accessRole || "Librarian";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile Menu Button + Page Titles */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              {title}
            </h1>
            <p className="hidden truncate text-xs text-slate-500 md:block">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right Controls: Staff Role */}
        <div className="flex items-center gap-3">
          <div className="hidden shrink-0 sm:inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
            <ShieldCheck className="h-3 w-3 text-indigo-600" />
            <span>{staffRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  LogOut,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

interface StaffHeaderProps {
  onOpenMobileMenu: () => void;
}

export function StaffHeader({ onOpenMobileMenu }: StaffHeaderProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

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
  const staffName = user?.name || "Library Staff";
  const staffRole = user?.accessRole || "Librarian";

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xs sm:px-6 lg:px-8">
      {/* Mobile Menu Button + Page Titles */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {title}
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls: Staff Badge + Profile Dropdown */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
          <ShieldCheck className="h-3 w-3 text-indigo-600" />
          <span>{staffRole}</span>
        </div>

        {/* Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-1.5 pr-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-[11px] font-bold text-white shadow-xs">
              {staffName.charAt(0)}
            </div>
            <span className="hidden md:inline max-w-[120px] truncate">{staffName}</span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-lg z-50">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="text-xs font-bold text-slate-900 truncate">{staffName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {staffRole}
                </span>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => signOut("/admin/login")}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

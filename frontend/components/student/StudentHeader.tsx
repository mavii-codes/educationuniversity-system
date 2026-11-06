"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Menu,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { cn } from "@/lib/utils";

interface StudentHeaderProps {
  onOpenMobileMenu: () => void;
}

export function StudentHeader({ onOpenMobileMenu }: StudentHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } =
    useLibraryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);

  const studentId = user?.studentId || user?.id || "2024-042";
  const studentNotifications = notifications.filter(
    (n) => n.studentId === studentId
  );
  const unreadNotifs = studentNotifications.filter((n) => !n.read);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/student/books?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const getPageTitle = () => {
    if (pathname === "/student/dashboard") return { title: "Student Dashboard", subtitle: "Overview of your borrowings, catalog availability, and library standing" };
    if (pathname === "/student/books") return { title: "Browse Library Catalog", subtitle: "Explore books, check real-time availability, and request or reserve titles" };
    if (pathname === "/student/borrowing") return { title: "Borrowing & Requests", subtitle: "Manage active loans, track borrowing request statuses, and monitor reservations" };
    if (pathname === "/student/history") return { title: "Borrowing History", subtitle: "Review past returned loans and library circulation records" };
    if (pathname === "/student/fines") return { title: "Fines & Clearances", subtitle: "View overdue loan fees, fine status, and library clearance standing" };
    if (pathname === "/student/notifications") return { title: "Library Notifications", subtitle: "Alerts for request approvals, due dates, reservations, and fines" };
    if (pathname === "/student/profile") return { title: "Student Library Profile", subtitle: "Account details, borrower card credentials, and privacy access controls" };
    return { title: "Student Portal", subtitle: "University Library Management System" };
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Toggle & Page Title */}
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

        {/* Right: Search, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Catalog */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search catalog books, ISBN"
              placeholder="Search catalog books, ISBN..."
              className="h-9 w-52 rounded-lg border border-slate-200/90 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 transition focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 lg:w-64"
            />
          </form>

          {/* Notifications Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              aria-label={`Notifications${unreadNotifs.length > 0 ? `, ${unreadNotifs.length} unread` : ""}`}
              aria-expanded={notifOpen}
              className="relative inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-semibold">Notifications</span>
              {unreadNotifs.length > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-slate-200/90 bg-white p-3 shadow-dropdown z-50 animate-in fade-in-0 zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-900">
                    Notifications ({unreadNotifs.length} unread)
                  </span>
                  {unreadNotifs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsRead(studentId)}
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 mt-1">
                  {studentNotifications.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">
                      No notifications at this time.
                    </p>
                  ) : (
                    studentNotifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={cn(
                          "p-2.5 text-xs transition-colors rounded-lg cursor-pointer",
                          n.read
                            ? "hover:bg-slate-50 text-slate-600"
                            : "bg-indigo-50/50 hover:bg-indigo-50 text-slate-900"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-600 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-100 pt-2 text-center">
                  <Link
                    href="/student/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    View all notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

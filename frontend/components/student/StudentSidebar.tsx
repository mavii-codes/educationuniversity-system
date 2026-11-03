"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpen, LogOut, User } from "lucide-react";
import { STUDENT_NAVIGATION_GROUPS } from "./student-navigation";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { cn } from "@/lib/utils";

export function StudentSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const { getStudentSummary } = useLibraryStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  const studentId = user?.studentId || user?.id || "2024-042";
  const summary = getStudentSummary(studentId);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (footerRef.current && !footerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const studentName = user?.name || "Student Member";
  const currentTab = searchParams.get("tab");

  const isItemActive = (href: string) => {
    const [basePath, query] = href.split("?");
    if (query) {
      const params = new URLSearchParams(query);
      const tab = params.get("tab");
      return pathname === basePath && (currentTab === tab || (!currentTab && tab === "current"));
    }
    if (href === "/student/dashboard") {
      return pathname === "/student/dashboard";
    }
    if (href === "/student/borrowing") {
      return pathname === "/student/borrowing" && !currentTab;
    }
    return pathname === href;
  };

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white">
      {/* Top Brand Section */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <span className="block text-[13px] font-bold leading-snug tracking-tight text-slate-900 truncate">
            University Data Integration
          </span>
          <span className="block text-[11px] font-medium text-indigo-600">
            Student Library Portal
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3.5 py-4">
        {STUDENT_NAVIGATION_GROUPS.map((group) => (
          <div key={group.groupLabel}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.groupLabel}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href);

                let badgeCount: number | null = null;
                if (item.badgeKey === "currentBorrowedCount" && summary.currentBorrowedCount > 0) {
                  badgeCount = summary.currentBorrowedCount;
                } else if (item.badgeKey === "pendingRequestsCount" && summary.pendingRequestsCount > 0) {
                  badgeCount = summary.pendingRequestsCount;
                } else if (item.badgeKey === "activeReservationsCount" && summary.activeReservationsCount > 0) {
                  badgeCount = summary.activeReservationsCount;
                } else if (item.badgeKey === "overdueBooksCount" && summary.overdueBooksCount > 0) {
                  badgeCount = summary.overdueBooksCount;
                } else if (item.badgeKey === "unreadNotificationsCount" && summary.unreadNotificationsCount > 0) {
                  badgeCount = summary.unreadNotificationsCount;
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150",
                        active
                          ? "bg-indigo-50/90 text-indigo-700 shadow-xs"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[17px] w-[17px] shrink-0 transition-colors",
                          active
                            ? "text-indigo-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        )}
                      />
                      <span className="truncate">{item.label}</span>

                      {badgeCount !== null && (
                        <span
                          className={cn(
                            "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            item.badgeKey === "overdueBooksCount"
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : item.badgeKey === "pendingRequestsCount"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-indigo-100 text-indigo-700"
                          )}
                        >
                          {badgeCount}
                        </span>
                      )}

                      {active && badgeCount === null && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Explicit Logout Nav Item */}
        <div className="pt-2">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/80 transition-colors"
          >
            <LogOut className="h-[17px] w-[17px] shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Bottom Student Profile Card */}
      <div
        ref={footerRef}
        className="relative border-t border-slate-100 p-3.5"
      >
        {menuOpen && (
          <div className="absolute bottom-[calc(100%+0.5rem)] left-3.5 right-3.5 z-40 rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-dropdown animate-in fade-in-0 zoom-in-95">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-900">{studentName}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {studentId}</p>
            </div>
            <Link
              href="/student/profile"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <User className="h-3.5 w-3.5 text-slate-500" />
              <span>View Library Profile</span>
            </Link>
            <button
              onClick={() => {
                setMenuOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900">
                {studentName}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                ID: {studentId}
              </p>
            </div>
          </button>
          <button
            onClick={signOut}
            title="Logout"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

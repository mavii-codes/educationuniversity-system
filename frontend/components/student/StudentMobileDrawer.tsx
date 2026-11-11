"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpen, LogOut, User, X } from "lucide-react";
import { STUDENT_NAVIGATION_GROUPS } from "./student-navigation";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { cn } from "@/lib/utils";

interface StudentMobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function StudentMobileDrawer({
  open,
  onClose,
}: StudentMobileDrawerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const { getStudentSummary } = useLibraryStore();

  const studentId = user?.studentId || user?.id || "2024-042";
  const summary = getStudentSummary(studentId);
  const currentTab = searchParams.get("tab");

  useEffect(() => {
    onClose();
  }, [pathname, searchParams, onClose]);

  if (!open) return null;

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
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[13px] font-bold leading-snug text-slate-900">
                University Library System
              </span>
              <span className="block text-[11px] font-medium text-indigo-600">
                Student Library Portal
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3.5 py-5">
          {STUDENT_NAVIGATION_GROUPS.map((group) => (
            <div key={group.groupLabel}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.groupLabel}
              </p>
              <ul className="space-y-1">
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
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active ? "text-indigo-600" : "text-slate-400"
                          )}
                        />
                        <span>{item.label}</span>
                        {badgeCount !== null && (
                          <span
                            className={cn(
                              "ml-auto inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                              item.badgeKey === "overdueBooksCount"
                                ? "bg-rose-100 text-rose-700"
                                : item.badgeKey === "pendingRequestsCount"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-indigo-100 text-indigo-700"
                            )}
                          >
                            {badgeCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4 space-y-2.5">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 text-xs">
              <p className="truncate font-semibold text-slate-900">
                {user?.name || "Student"}
              </p>
              <p className="truncate text-slate-500">ID: {studentId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              signOut();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

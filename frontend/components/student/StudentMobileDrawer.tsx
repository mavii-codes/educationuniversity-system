"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpen, User, X } from "lucide-react";
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
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-900">
                University Library System
              </span>
              <span className="block text-[10px] font-medium text-indigo-600">
                Student Library Portal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {STUDENT_NAVIGATION_GROUPS.map((group) => (
            <div key={group.groupLabel}>
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                          active
                            ? "bg-indigo-50 text-indigo-700 font-semibold"
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {badgeCount !== null && (
                          <span
                            className={cn(
                              "ml-auto rounded-full px-2 py-0.5 text-[9px] font-semibold",
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

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900">
                {user?.name || "Student"}
              </p>
              <p className="truncate text-[10px] text-slate-500">
                ID: {studentId}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              signOut();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
          >
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

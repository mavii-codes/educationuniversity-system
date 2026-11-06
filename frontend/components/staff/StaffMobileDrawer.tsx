"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LogOut, X } from "lucide-react";
import { STAFF_NAVIGATION_GROUPS } from "./staff-navigation";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { cn } from "@/lib/utils";

interface StaffMobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function StaffMobileDrawer({ open, onClose }: StaffMobileDrawerProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { borrowingRequests, fines } = useLibraryStore();

  const pendingRequestsCount = borrowingRequests.filter(
    (r) => r.status === "Pending"
  ).length;
  const overdueCount = fines.filter((f) => f.paymentStatus === "Unpaid").length;

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  const staffName = user?.name || "Library Staff";

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-[13px] font-bold leading-snug text-slate-900">Library Staff Portal</span>
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

        <div className="flex-1 overflow-y-auto px-3.5 py-5">
          <nav className="space-y-5">
            {STAFF_NAVIGATION_GROUPS.map((group) => (
              <div key={group.groupLabel}>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.groupLabel}
                </p>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;

                    let badgeValue: number | undefined;
                    if (item.badgeKey === "pendingRequestsCount" && pendingRequestsCount > 0) {
                      badgeValue = pendingRequestsCount;
                    } else if (item.badgeKey === "overdueCount" && overdueCount > 0) {
                      badgeValue = overdueCount;
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
                          {typeof badgeValue === "number" && (
                            <span
                              className={cn(
                                "ml-auto inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                                item.badgeKey === "overdueCount"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700"
                              )}
                            >
                              {badgeValue}
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
        </div>

        <div className="border-t border-slate-100 p-4 space-y-2.5">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10 text-xs font-bold text-indigo-700">
              {staffName.charAt(0)}
            </div>
            <div className="min-w-0 text-xs">
              <p className="truncate font-semibold text-slate-900">
                {staffName}
              </p>
              <p className="truncate text-slate-500">{user?.accessRole || "Librarian"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              signOut("/admin/login");
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


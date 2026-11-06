"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LogOut, ShieldCheck } from "lucide-react";
import { STAFF_NAVIGATION_GROUPS } from "./staff-navigation";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { cn } from "@/lib/utils";

export function StaffSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { borrowingRequests, fines } = useLibraryStore();

  const pendingRequestsCount = borrowingRequests.filter((r) => r.status === "Pending").length;
  const overdueCount = fines.filter((f) => f.paymentStatus === "Unpaid").length;

  const staffName = user?.name || "Library Staff";
  const staffRole = user?.accessRole || "Librarian";

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white">
      {/* Top Brand Section */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <span className="block text-[13px] font-bold leading-snug tracking-tight text-slate-900 truncate">
            Library Staff Portal
          </span>
          <span className="block text-[11px] font-medium text-slate-500 truncate">
            Circulation &amp; Operations
          </span>
        </div>
      </div>

      {/* Navigation Group Items */}
      <div className="flex flex-1 flex-col overflow-y-auto px-3.5 py-5">
        <nav className="space-y-5">
          {STAFF_NAVIGATION_GROUPS.map((group) => (
            <div key={group.groupLabel}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.groupLabel}
              </p>
              <ul className="space-y-0.5">
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
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                          active
                            ? "bg-indigo-50/90 text-indigo-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0 transition-colors",
                            active
                              ? "text-indigo-600"
                              : "text-slate-400 group-hover:text-slate-600"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
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
                        {active && badgeValue === undefined && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
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

      {/* Footer Profile & Logout */}
      <div className="shrink-0 border-t border-slate-100 p-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
              {staffName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">
                {staffName}
              </p>
              <p className="truncate text-[10px] font-medium text-slate-600">
                {staffRole}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut("/admin/login")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

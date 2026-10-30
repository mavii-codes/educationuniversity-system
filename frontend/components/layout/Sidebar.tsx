"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, GraduationCap } from "lucide-react";
import { isNavItemActive, NAVIGATION_GROUPS } from "./navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <span className="block text-sm font-bold tracking-tight text-slate-900">
            University DataHub
          </span>
          <span className="block text-[11px] font-medium text-slate-500">
            Academic Integration
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3.5 py-5">
        {NAVIGATION_GROUPS.map((group) => (
          <div key={group.groupLabel}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-slate-400">
              {group.groupLabel}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(pathname, item);
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
                      {active && (
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

      {/* Subtle System Status Footer */}
      <div className="border-t border-slate-100 p-4">
        <Link
          href="/data-sources"
          className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50/70 px-3.5 py-2.5 transition hover:border-indigo-200 hover:bg-indigo-50/40"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-800">
              5 Systems Connected
            </p>
            <p className="truncate text-[11px] text-slate-500">
              Last sync 5 mins ago
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}


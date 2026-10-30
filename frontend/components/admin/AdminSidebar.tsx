"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LogOut, User } from "lucide-react";
import {
  ADMIN_NAVIGATION_GROUPS,
  isAdminNavActive,
} from "./admin-navigation";
import { AdminProfileMenu } from "./AdminProfileMenu";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (footerRef.current && !footerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const adminName = user?.name || "Administrator";

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white">
      {/* Top Brand Section */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <span className="block text-[13px] font-bold leading-snug tracking-tight text-slate-900">
            University Data Integration System
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3.5 py-5">
        {ADMIN_NAVIGATION_GROUPS.map((group) => (
          <div key={group.groupLabel}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.groupLabel}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isAdminNavActive(pathname, item);
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

      {/* Bottom Admin Profile Section */}
      <div
        ref={footerRef}
        className="relative border-t border-slate-100 p-3.5"
      >
        {menuOpen && (
          <AdminProfileMenu
            placement="sidebar"
            onClose={() => setMenuOpen(false)}
          />
        )}

        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left transition hover:opacity-90"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-semibold text-slate-900">
                {adminName}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                Role: Administrator
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={signOut}
            title="Logout"
            aria-label="Logout"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

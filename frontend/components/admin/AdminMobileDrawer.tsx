"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LogOut, User, X } from "lucide-react";
import {
  ADMIN_NAVIGATION_GROUPS,
  isAdminNavActive,
} from "./admin-navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface AdminMobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AdminMobileDrawer({ open, onClose }: AdminMobileDrawerProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
        {/* Mobile Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[13px] font-bold leading-snug text-slate-900">
                University Data Integration System
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

        {/* Navigation Links */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3.5 py-5">
          {ADMIN_NAVIGATION_GROUPS.map((group) => (
            <div key={group.groupLabel}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.groupLabel}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isAdminNavActive(pathname, item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
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
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom Admin Profile + Logout */}
        <div className="border-t border-slate-100 p-4 space-y-2.5">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-700">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 text-xs">
              <p className="truncate font-semibold text-slate-900">
                {user?.name || "Administrator"}
              </p>
              <p className="truncate text-slate-500">Role: Administrator</p>
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
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

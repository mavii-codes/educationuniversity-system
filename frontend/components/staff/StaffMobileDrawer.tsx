"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LogOut, X } from "lucide-react";
import { STAFF_NAVIGATION_GROUPS } from "./staff-navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface StaffMobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function StaffMobileDrawer({ open, onClose }: StaffMobileDrawerProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (!open) return null;

  const staffName = user?.name || "Library Staff";

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-900">Library Staff Portal</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-6">
            {STAFF_NAVIGATION_GROUPS.map((group) => (
              <div key={group.groupLabel} className="space-y-1">
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {group.groupLabel}
                </p>
                <div className="space-y-0.5 pt-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition",
                          active
                            ? "bg-indigo-50 font-semibold text-indigo-700"
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              signOut("/admin/login");
            }}
            className="flex w-full items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

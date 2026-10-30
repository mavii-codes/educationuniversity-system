"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, GraduationCap, X } from "lucide-react";
import { isNavItemActive, NAVIGATION_GROUPS } from "./navigation";
import { cn } from "@/lib/utils";

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  const pathname = usePathname();

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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-sm font-bold text-slate-900">
                University DataHub
              </span>
              <span className="block text-[11px] text-slate-500">
                Academic Integration
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
          {NAVIGATION_GROUPS.map((group) => (
            <div key={group.groupLabel}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-slate-400">
                {group.groupLabel}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isNavItemActive(pathname, item);
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

        {/* Mobile Status Footer */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <div className="text-xs">
              <p className="font-semibold text-slate-800">All 5 Sources Active</p>
              <p className="text-slate-500">AY 2026-2027 · 1st Semester</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


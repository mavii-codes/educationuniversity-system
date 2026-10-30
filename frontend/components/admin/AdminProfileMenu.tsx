"use client";

import React from "react";
import Link from "next/link";
import { LogOut, Settings, Shield, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface AdminProfileMenuProps {
  onClose: () => void;
  placement?: "header" | "sidebar";
}

export function AdminProfileMenu({
  onClose,
  placement = "header",
}: AdminProfileMenuProps) {
  const { user, signOut } = useAuth();

  const adminName = user?.name || "Administrator";
  const adminEmail = user?.email || "admin@university.edu";

  const handleLogout = () => {
    onClose();
    signOut();
  };

  return (
    <div
      className={cn(
        "z-50 w-60 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xl ring-1 ring-slate-900/5",
        placement === "header"
          ? "absolute right-0 top-full mt-2"
          : "absolute bottom-full left-3 right-3 mb-2 w-auto"
      )}
    >
      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <p className="truncate text-xs font-semibold text-slate-900">
          {adminName}
        </p>
        <p className="truncate text-[11px] text-slate-500">{adminEmail}</p>
        <span className="mt-1.5 inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
          Role: Administrator
        </span>
      </div>

      <div className="p-1.5">
        <Link
          href="/admin/settings?tab=profile"
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-700"
        >
          <User className="h-4 w-4 text-slate-400" />
          <span>Profile</span>
        </Link>
        <Link
          href="/admin/settings?tab=account"
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-700"
        >
          <Settings className="h-4 w-4 text-slate-400" />
          <span>Account Settings</span>
        </Link>
        <Link
          href="/admin/settings?tab=security"
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-700"
        >
          <Shield className="h-4 w-4 text-slate-400" />
          <span>Security</span>
        </Link>
      </div>

      <div className="border-t border-slate-100 p-1.5">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}


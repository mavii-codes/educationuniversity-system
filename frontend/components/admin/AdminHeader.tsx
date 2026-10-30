"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  Menu,
  Search,
  User,
} from "lucide-react";
import { getAdminPageMeta } from "./admin-navigation";
import { AdminProfileMenu } from "./AdminProfileMenu";
import { NotificationPanel } from "@/components/layout/NotificationPanel";
import { NOTIFICATIONS, STUDENTS } from "@/data/mock-data";
import { NotificationItem } from "@/types";
import { useAuth } from "@/lib/auth";

interface AdminHeaderProps {
  onOpenMobileMenu: () => void;
}

const ADMIN_QUICK_LINKS = [
  { label: "Admin Dashboard", href: "/admin/dashboard" },
  { label: "Students Directory", href: "/admin/students" },
  { label: "Student Lifecycle", href: "/admin/lifecycle" },
  { label: "Data Sources", href: "/admin/data-sources" },
  { label: "Integrations Pipeline", href: "/admin/integrations" },
  { label: "Sync History", href: "/admin/sync-history" },
  { label: "Academic Analytics", href: "/admin/analytics" },
  { label: "Reports", href: "/admin/reports" },
  { label: "User Management", href: "/admin/users" },
  { label: "Notifications", href: "/admin/notifications" },
  { label: "Settings", href: "/admin/settings" },
];

export function AdminHeader({ onOpenMobileMenu }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { title, subtitle } = getAdminPageMeta(pathname);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(NOTIFICATIONS);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const matchingStudents = searchQuery.trim()
    ? STUDENTS.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.programCode.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  const matchingPages = searchQuery.trim()
    ? ADMIN_QUICK_LINKS.filter((l) =>
        l.label.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (matchingStudents.length > 0) {
      router.push(`/admin/students/${matchingStudents[0].id}`);
    } else {
      router.push(`/admin/students?q=${encodeURIComponent(searchQuery.trim())}`);
    }
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Drawer Button + Current Module Title */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              {title}
            </h1>
            <p className="hidden truncate text-xs text-slate-500 md:block">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Search + Notifications + Admin Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Global Search */}
          <div ref={searchRef} className="relative hidden sm:block">
            <form onSubmit={handleSearchSubmit}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search students, sources, or modules..."
                className="h-9 w-52 rounded-lg border border-slate-200/90 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 transition focus:w-72 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 xl:w-72"
              />
            </form>

            {searchOpen && searchQuery.trim().length > 0 && (
              <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {matchingStudents.length === 0 && matchingPages.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-500">
                    No matching records for &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {matchingStudents.length > 0 && (
                      <div className="p-2">
                        <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Students
                        </p>
                        {matchingStudents.map((student) => (
                          <Link
                            key={student.id}
                            href={`/admin/students/${student.id}`}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery("");
                            }}
                            className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition hover:bg-slate-50"
                          >
                            <div>
                              <p className="font-medium text-slate-900">
                                {student.name}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {student.id} · {student.programCode} · {student.yearLevel}
                              </p>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                          </Link>
                        ))}
                      </div>
                    )}
                    {matchingPages.length > 0 && (
                      <div className="p-2">
                        <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Admin Modules
                        </p>
                        {matchingPages.map((page) => (
                          <Link
                            key={page.href}
                            href={page.href}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery("");
                            }}
                            className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-700"
                          >
                            <span>{page.label}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setProfileOpen(false);
              }}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
                </span>
              )}
            </button>

            {notifOpen && (
              <NotificationPanel
                notifications={notifications}
                onMarkAllRead={() =>
                  setNotifications((prev) =>
                    prev.map((n) => ({ ...n, read: true }))
                  )
                }
                onSelectNotification={(id) =>
                  setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, read: true } : n))
                  )
                }
                onClose={() => setNotifOpen(false)}
              />
            )}
          </div>

          <div className="hidden h-6 w-px bg-slate-200 sm:block" />

          {/* Administrator Profile Trigger & Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((prev) => !prev);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2.5 rounded-xl py-1 pl-1.5 pr-2 text-left transition hover:bg-slate-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-xs font-semibold text-slate-900">
                  {user?.name || "Administrator"}
                </p>
                <p className="text-[11px] text-slate-500">Administrator</p>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            </button>

            {profileOpen && (
              <AdminProfileMenu
                placement="header"
                onClose={() => setProfileOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


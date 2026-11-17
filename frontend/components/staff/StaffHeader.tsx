"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";

interface StaffHeaderProps {
  onOpenMobileMenu: () => void;
}

export function StaffHeader({ onOpenMobileMenu }: StaffHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { borrowingRequests, transactions, fines, loadState, loadError } =
    useLibraryStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const getPageTitle = () => {
    if (pathname === "/staff/dashboard") return { title: "Staff Dashboard", subtitle: "Circulation desk, request queues, and active library operations" };
    if (pathname === "/staff/books") return { title: "Books Catalog", subtitle: "Manage library collection inventory, shelf locations, and copies" };
    if (pathname === "/staff/requests") return { title: "Borrowing Requests", subtitle: "Approve or decline student borrowing requests" };
    if (pathname === "/staff/returns") return { title: "Returns & Check-in", subtitle: "Process book returns and verify item condition" };
    if (pathname === "/staff/reservations") return { title: "Reservations", subtitle: "Manage book hold requests and reservation priorities" };
    if (pathname === "/staff/fines") return { title: "Fines & Overdues", subtitle: "Monitor overdue items and manage fine payments" };
    if (pathname === "/staff/students") return { title: "Student Lookup", subtitle: "Look up student borrower cards and borrowing history" };
    if (pathname === "/staff/notifications") return { title: "Notifications", subtitle: "Circulation alerts and system messages" };
    return { title: "Library Staff Portal", subtitle: "University Library Operations" };
  };

  const { title, subtitle } = getPageTitle();
  const staffRole = user?.accessRole || "Librarian";
  const alerts = [
    ...borrowingRequests
      .filter((request) => request.status === "Pending")
      .map((request) => ({
        id: `request-${request.id}`,
        kind: "request" as const,
        title: `${request.bookTitle} borrowing request`,
        description: `${request.studentName} is waiting for request review.`,
        href: "/staff/requests",
      })),
    ...transactions
      .filter((transaction) => transaction.status === "Overdue")
      .map((transaction) => ({
        id: `overdue-${transaction.id}`,
        kind: "overdue" as const,
        title: `${transaction.bookTitle} is overdue`,
        description: `${transaction.studentName} has an overdue loan awaiting return.`,
        href: "/staff/returns",
      })),
    ...fines
      .filter((fine) => fine.paymentStatus === "Unpaid")
      .map((fine) => ({
        id: `fine-${fine.id}`,
        kind: "fine" as const,
        title: `Unpaid fine for ${fine.bookTitle}`,
        description: `${fine.studentName} · ₱${fine.fineAmount.toFixed(2)} outstanding`,
        href: "/staff/fines",
      })),
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile Menu Button + Page Titles */}
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

        {/* Right Controls: Staff Notifications + Role */}
        <div className="flex items-center gap-3">
          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-label={`Notifications${alerts.length > 0 ? `, ${alerts.length} alerts` : ""}`}
              aria-haspopup="dialog"
              aria-expanded={notificationsOpen}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs font-semibold">Notifications</span>
              {alerts.length > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {alerts.length > 99 ? "99+" : alerts.length}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <section
                role="dialog"
                aria-label="Library staff notifications"
                className="absolute right-0 top-full z-40 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl ring-1 ring-slate-900/5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Notifications
                    </h2>
                    {alerts.length > 0 && (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        {alerts.length} new
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    aria-label="Close notifications"
                    className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {loadState === "loading" && alerts.length === 0 ? (
                  <p className="px-4 py-8 text-center text-xs text-slate-500">
                    Loading current library alerts...
                  </p>
                ) : loadState === "error" && alerts.length === 0 ? (
                  <p
                    role="alert"
                    className="px-4 py-8 text-center text-xs text-rose-700"
                  >
                    {loadError || "Unable to load current library alerts."}
                  </p>
                ) : alerts.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500" />
                    <p className="mt-2 text-xs font-semibold text-slate-800">
                      You&apos;re all caught up
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      No pending requests, overdue loans, or unpaid fines.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
                    {alerts.slice(0, 8).map((alert) => (
                      <Link
                        key={alert.id}
                        href={alert.href}
                        onClick={() => setNotificationsOpen(false)}
                        className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-slate-50"
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            alert.kind === "request"
                              ? "bg-amber-50"
                              : alert.kind === "overdue"
                                ? "bg-rose-50"
                                : "bg-indigo-50"
                          }`}
                        >
                          {alert.kind === "request" ? (
                            <Clock className="h-4 w-4 text-amber-600" />
                          ) : alert.kind === "overdue" ? (
                            <AlertTriangle className="h-4 w-4 text-rose-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-indigo-600" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-slate-900">
                            {alert.title}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                            {alert.description}
                          </span>
                        </span>
                        <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </Link>
                    ))}
                    {alerts.length > 8 && (
                      <p className="px-4 py-2 text-center text-[11px] text-slate-500">
                        Showing 8 of {alerts.length} alerts
                      </p>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="hidden shrink-0 sm:inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
            <ShieldCheck className="h-3 w-3 text-indigo-600" />
            <span>{staffRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

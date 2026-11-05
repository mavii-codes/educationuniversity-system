"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookMarked,
  BookOpen,
  BookmarkCheck,
  Clock3,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { formatNumber } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { books, borrowingRequests, transactions, reservations, fines } =
    useLibraryStore();
  const isLibrarian = user?.role === "Librarian";
  const libraryPath = isLibrarian ? "/staff/books" : "/admin/library";
  const recordsPath = isLibrarian ? "/staff/books" : "/admin/library/records";

  const availableCopies = books.reduce(
    (total, book) => total + book.availableCopies,
    0
  );
  const activeLoans = transactions.filter(
    (transaction) =>
      transaction.status === "Borrowed" || transaction.status === "Overdue"
  ).length;
  const pendingRequests = borrowingRequests.filter(
    (request) => request.status === "Pending"
  ).length;
  const overdueItems = transactions.filter(
    (transaction) => transaction.status === "Overdue"
  ).length;
  const activeReservations = reservations.filter(
    (reservation) =>
      reservation.status === "Pending" ||
      reservation.status === "Ready for Pickup"
  ).length;
  const unpaidFines = fines.filter(
    (fine) => fine.paymentStatus === "Unpaid"
  ).length;

  const metrics = [
    {
      label: "Catalog titles",
      value: books.length,
      detail: "Books listed in the catalog",
      icon: BookOpen,
      tone: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Available copies",
      value: availableCopies,
      detail: "Copies currently available",
      icon: BookMarked,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Active loans",
      value: activeLoans,
      detail: "Books checked out",
      icon: BookmarkCheck,
      tone: "bg-sky-50 text-sky-600",
    },
    {
      label: "Requests to review",
      value: pendingRequests,
      detail: "Pending borrowing requests",
      icon: Clock3,
      tone: "bg-amber-50 text-amber-600",
    },
  ];

  const shortcuts = [
    {
      label: "Manage library",
      description: "Update titles and process borrowing, returns, reservations, and fines.",
      href: libraryPath,
      icon: BookOpen,
    },
    {
      label: "Catalog records",
      description: "Search titles, check availability, and review book details.",
      href: recordsPath,
      icon: BookMarked,
    },
    ...(!isLibrarian
      ? [
          {
            label: "Borrower accounts",
            description: "Review student library member accounts.",
            href: "/admin/students",
            icon: Users,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-7">
      <section className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-indigo-200">
          University Library Management System
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome, {user?.name || (isLibrarian ? "Staff Librarian" : "Administrator")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-indigo-100/90">
          Keep the catalog organized and library circulation moving. Review
          requests, track loans, and manage borrower services from one place.
        </p>
        <Link
          href={libraryPath}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-50"
        >
          Open library management
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section aria-label="Library activity" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article
              key={metric.label}
              className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
                    {formatNumber(metric.value)}
                  </p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{metric.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Circulation follow-up
            </h3>
          </div>
          <dl className="mt-4 divide-y divide-slate-100">
            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-slate-600">Active reservations</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {formatNumber(activeReservations)}
              </dd>
            </div>
            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="flex items-center gap-2 text-slate-600">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                Overdue loans
              </dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {formatNumber(overdueItems)}
              </dd>
            </div>
            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-slate-600">Unpaid fines</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {formatNumber(unpaidFines)}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
          <h3 className="text-sm font-semibold text-slate-900">
            Library tools
          </h3>
          <div className="mt-3 divide-y divide-slate-100">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className="flex items-center gap-3 py-3 transition hover:text-indigo-700"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900">
                      {shortcut.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {shortcut.description}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}

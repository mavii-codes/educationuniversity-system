"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  BookMarked,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  GraduationCap,
  History,
  Layers,
  Search,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { BookDetailModal } from "@/components/student/BookDetailModal";
import { LibraryBook } from "@/types";
import { cn } from "@/lib/utils";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const {
    books,
    getStudentSummary,
    getStudentTransactions,
    getStudentRequests,
    getStudentReservations,
    getStudentNotifications,
  } = useLibraryStore();

  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);

  const studentId = user?.studentId || user?.id || "2024-042";
  const summary = getStudentSummary(studentId);
  const studentLoans = getStudentTransactions(studentId);
  const activeLoans = studentLoans.filter(
    (t) => t.status === "Borrowed" || t.status === "Overdue"
  );
  const studentRequests = getStudentRequests(studentId);
  const pendingRequests = studentRequests.filter((r) => r.status === "Pending");
  const studentReservations = getStudentReservations(studentId);
  const activeReservations = studentReservations.filter(
    (r) => r.status === "Pending" || r.status === "Ready for Pickup"
  );
  const studentNotifications = getStudentNotifications(studentId);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <GraduationCap className="h-3.5 w-3.5 text-indigo-300" />
            <span>Library Member Portal · {user?.programName || "BS Information Technology"}</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {user?.name || "Student Member"}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
            Borrower Barcode: <span className="font-mono font-semibold text-white">{user?.borrowerCardNo || `LIB-${studentId}`}</span> · Student ID: <span className="font-mono font-semibold text-white">{studentId}</span>
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/student/books"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-indigo-950 shadow-sm hover:bg-indigo-50 transition"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Browse Catalog &amp; Borrow</span>
            </Link>
            <Link
              href="/student/borrowing"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition"
            >
              <BookMarked className="h-3.5 w-3.5" />
              <span>View Active Loans ({activeLoans.length})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Critical Overdue / Fine Alert Banner (if any) */}
      {summary.overdueBooksCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-900 shadow-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-rose-950">
              You have {summary.overdueBooksCount} overdue book(s) and {formatCurrency(summary.outstandingFinesTotal)} outstanding fine balance.
            </p>
            <p className="mt-0.5 text-rose-700 leading-relaxed">
              Please return your overdue books to the library circulation desk immediately to prevent additional daily fines and academic clearance holds.
            </p>
          </div>
          <Link
            href="/student/fines"
            className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
          >
            Review Fines
          </Link>
        </div>
      )}

      {/* Core KPI Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {/* Available Books */}
        <Link
          href="/student/books"
          className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BookOpen className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {summary.availableBooksCount}
          </p>
          <p className="text-[11px] font-medium text-slate-500">Available Books</p>
        </Link>

        {/* Current Borrowed Books */}
        <Link
          href="/student/borrowing"
          className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <BookMarked className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {summary.currentBorrowedCount} / 3
          </p>
          <p className="text-[11px] font-medium text-slate-500">Active Borrowings</p>
        </Link>

        {/* Pending Requests */}
        <Link
          href="/student/borrowing?tab=requests"
          className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {summary.pendingRequestsCount}
          </p>
          <p className="text-[11px] font-medium text-slate-500">Pending Requests</p>
        </Link>

        {/* Active Reservations */}
        <Link
          href="/student/borrowing?tab=reservations"
          className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Layers className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {summary.activeReservationsCount}
          </p>
          <p className="text-[11px] font-medium text-slate-500">Reservations</p>
        </Link>

        {/* Overdue Books */}
        <Link
          href="/student/fines"
          className={cn(
            "group rounded-2xl border p-4 shadow-sm transition",
            summary.overdueBooksCount > 0
              ? "border-rose-300 bg-rose-50/50 hover:bg-rose-50"
              : "border-slate-200/90 bg-white hover:border-slate-300"
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              summary.overdueBooksCount > 0
                ? "bg-rose-100 text-rose-700"
                : "bg-slate-100 text-slate-600"
            )}
          >
            <AlertCircle className="h-4 w-4" />
          </div>
          <p
            className={cn(
              "mt-3 text-2xl font-bold tracking-tight",
              summary.overdueBooksCount > 0 ? "text-rose-700" : "text-slate-900"
            )}
          >
            {summary.overdueBooksCount}
          </p>
          <p className="text-[11px] font-medium text-slate-500">Overdue Books</p>
        </Link>

        {/* Outstanding Fines */}
        <Link
          href="/student/fines"
          className={cn(
            "group rounded-2xl border p-4 shadow-sm transition",
            summary.outstandingFinesTotal > 0
              ? "border-rose-300 bg-rose-50/50 hover:bg-rose-50"
              : "border-slate-200/90 bg-white hover:border-slate-300"
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              summary.outstandingFinesTotal > 0
                ? "bg-rose-100 text-rose-700"
                : "bg-emerald-50 text-emerald-600"
            )}
          >
            <Coins className="h-4 w-4" />
          </div>
          <p
            className={cn(
              "mt-3 text-lg font-bold tracking-tight truncate",
              summary.outstandingFinesTotal > 0 ? "text-rose-700" : "text-emerald-700"
            )}
          >
            {formatCurrency(summary.outstandingFinesTotal)}
          </p>
          <p className="text-[11px] font-medium text-slate-500">Outstanding Fines</p>
        </Link>
      </div>

      {/* Main Grid: Currently Borrowed & Recent Notifications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Currently Borrowed & Pending Requests */}
        <div className="space-y-6 lg:col-span-2">
          {/* Current Borrowed Books */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <BookMarked className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Currently Borrowed Books
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Track loan due dates and check-in schedules
                  </p>
                </div>
              </div>
              <Link
                href="/student/borrowing"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {activeLoans.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-xs font-medium text-slate-600">
                    No active book borrowings.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Browse the library catalog to request your next study textbook.
                  </p>
                  <Link
                    href="/student/books"
                    className="mt-3 inline-block rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                activeLoans.map((loan) => {
                  const isOverdue = loan.status === "Overdue";
                  const dueDate = new Date(loan.dueDate);
                  return (
                    <div
                      key={loan.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">
                            {loan.bookTitle}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              isOverdue
                                ? "bg-rose-100 text-rose-700"
                                : "bg-emerald-50 text-emerald-700"
                            )}
                          >
                            {isOverdue ? "Overdue" : "On Loan"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 font-mono">
                          ISBN: {loan.isbn} · Tx: {loan.transactionCode}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 sm:text-right">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            Due Date
                          </span>
                          <p
                            className={cn(
                              "text-xs font-semibold",
                              isOverdue ? "text-rose-600" : "text-slate-700"
                            )}
                          >
                            {dueDate.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pending Requests & Active Reservations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pending Requests */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  Borrow Requests ({pendingRequests.length})
                </span>
                <Link
                  href="/student/borrowing?tab=requests"
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View
                </Link>
              </div>
              <div className="mt-3 space-y-2.5">
                {pendingRequests.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">
                    No pending borrowing requests.
                  </p>
                ) : (
                  pendingRequests.slice(0, 3).map((req) => (
                    <div
                      key={req.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs"
                    >
                      <p className="font-semibold text-slate-900 truncate">
                        {req.bookTitle}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{req.requestCode}</span>
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                          Pending Review
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Reservations */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-purple-600" />
                  Reservations ({activeReservations.length})
                </span>
                <Link
                  href="/student/borrowing?tab=reservations"
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View
                </Link>
              </div>
              <div className="mt-3 space-y-2.5">
                {activeReservations.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">
                    No active book reservations.
                  </p>
                ) : (
                  activeReservations.slice(0, 3).map((res) => (
                    <div
                      key={res.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs"
                    >
                      <p className="font-semibold text-slate-900 truncate">
                        {res.bookTitle}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{res.reservationCode}</span>
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-800">
                          {res.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Recent Notifications & Quick Catalog Spotlight */}
        <div className="space-y-6">
          {/* Recent Notifications */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Recent Notifications
                </h3>
              </div>
              <Link
                href="/student/notifications"
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
              >
                All
              </Link>
            </div>

            <div className="mt-3 space-y-3">
              {studentNotifications.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  No notifications.
                </p>
              ) : (
                studentNotifications.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "rounded-xl border p-3 text-xs transition",
                      n.read
                        ? "border-slate-100 bg-slate-50/60 text-slate-600"
                        : "border-indigo-100 bg-indigo-50/40 text-slate-900"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-slate-900">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {n.timestamp}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Featured Catalog Shelf */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900">
                Recommended Titles
              </span>
              <Link
                href="/student/books"
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Browse All
              </Link>
            </div>
            <div className="mt-3 space-y-3">
              {books.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBook(b)}
                  className="group flex items-start gap-3 rounded-xl border border-slate-100 p-2.5 hover:border-indigo-200 hover:bg-slate-50/80 cursor-pointer transition"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-900">
                      {b.title}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {b.author}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className="font-medium text-slate-400">
                        {b.category}
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          b.availableCopies > 0
                            ? "text-emerald-600"
                            : "text-amber-600"
                        )}
                      >
                        {b.availableCopies > 0
                          ? `${b.availableCopies} available`
                          : "Checked out"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Book Detail Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          user={user}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
}


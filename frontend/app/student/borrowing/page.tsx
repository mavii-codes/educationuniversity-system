"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookMarked,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { cn } from "@/lib/utils";
import { BookCover } from "@/components/library/BookCover";

type BorrowingTab = "current" | "requests" | "reservations";

function BorrowingContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as BorrowingTab) || "current";

  const { user } = useAuth();
  const {
    getStudentTransactions,
    getStudentRequests,
    getStudentReservations,
    cancelBorrowRequest,
    cancelReservation,
  } = useLibraryStore();

  const [activeTab, setActiveTab] = useState<BorrowingTab>(initialTab);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as BorrowingTab;
    if (tabParam && (tabParam === "current" || tabParam === "requests" || tabParam === "reservations")) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const studentId = user?.studentId || user?.id || "2024-042";

  const transactions = getStudentTransactions(studentId);
  const activeLoans = transactions.filter(
    (t) => t.status === "Borrowed" || t.status === "Overdue"
  );
  const requests = getStudentRequests(studentId);
  const reservations = getStudentReservations(studentId);

  const handleCancelRequest = async (id: string) => {
    const res = await cancelBorrowRequest(id);
    setActionMessage(res.message);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleCancelReservation = async (id: string) => {
    const res = await cancelReservation(id);
    setActionMessage(res.message);
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("current")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition",
              activeTab === "current"
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <BookMarked className="h-4 w-4" />
            <span>Currently Borrowed ({activeLoans.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition",
              activeTab === "requests"
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <Clock className="h-4 w-4" />
            <span>Borrowing Requests ({requests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reservations")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition",
              activeTab === "reservations"
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <Layers className="h-4 w-4" />
            <span>Reservations ({reservations.length})</span>
          </button>
        </div>

        <Link
          href="/student/books"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Browse Catalog to Borrow</span>
        </Link>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/90 p-3 text-xs text-indigo-900 shadow-sm animate-in fade-in-0">
          <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* TAB 1: Currently Borrowed Books */}
      {activeTab === "current" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
            <span className="font-bold text-slate-900">
              Circulation Return Policy:
            </span>{" "}
            Books must be presented physically to the University Library circulation desk for check-in and barcode scanning. Borrowing privileges are paused when loans are overdue.
          </div>

          {activeLoans.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-sm">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-900">
                You have no active book borrowings
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Search the catalog to find resources for your courses.
              </p>
              <Link
                href="/student/books"
                className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Browse Books
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeLoans.map((loan) => {
                const isOverdue = loan.status === "Overdue";
                const dueDate = new Date(loan.dueDate);
                const borrowDate = new Date(loan.borrowDate);

                return (
                  <div
                    key={loan.id}
                    className={cn(
                      "rounded-2xl border bg-white p-5 shadow-sm transition",
                      isOverdue
                        ? "border-rose-300 bg-rose-50/30 ring-1 ring-rose-200"
                        : "border-slate-200/90"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <BookCover
                          src={loan.cover_url}
                          title={loan.bookTitle}
                          size="sm"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                                isOverdue
                                  ? "bg-rose-100 text-rose-800 border-rose-300"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              )}
                            >
                              {isOverdue
                                ? "Overdue - Return Immediately"
                                : "Active Loan"}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {loan.transactionCode}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 sm:text-base">
                            {loan.bookTitle}
                          </h4>
                          <p className="text-xs text-slate-500 font-mono">
                            ISBN: {loan.isbn} · Linked Data Source: {loan.sourceSystem}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 text-xs sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            Borrowed On
                          </span>
                          <p className="font-medium text-slate-700">
                            {borrowDate.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            Scheduled Due Date
                          </span>
                          <p
                            className={cn(
                              "font-bold",
                              isOverdue ? "text-rose-600" : "text-slate-900"
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

                    <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <p>
                        Status:{" "}
                        <strong className="text-slate-900">{loan.status}</strong>
                        {isOverdue && (
                          <span className="text-rose-600 font-semibold ml-2">
                            (Accruing ₱15.00 daily fine)
                          </span>
                        )}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        Physical return verified by Librarian scanning
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Borrowing Requests */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
            <span className="font-bold text-slate-900">
              Borrowing Request Lifecycle:
            </span>{" "}
            Requests are verified by a librarian against your borrower limits. Approved titles must be claimed at the circulation desk within 48 hours.
          </div>

          {requests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-sm">
              <Clock className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-900">
                No borrowing requests submitted
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Select available catalog books and click &quot;Submit Borrowing Request&quot;.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const reqDate = new Date(req.requestDate);

                return (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <BookCover
                          src={req.cover_url}
                          title={req.bookTitle}
                          size="sm"
                        />
                        <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                              req.status === "Pending" &&
                                "bg-amber-50 text-amber-800 border-amber-200",
                              req.status === "Approved" &&
                                "bg-emerald-50 text-emerald-800 border-emerald-200",
                              req.status === "Rejected" &&
                                "bg-rose-50 text-rose-800 border-rose-200",
                              req.status === "Completed" &&
                                "bg-blue-50 text-blue-800 border-blue-200",
                              req.status === "Cancelled" &&
                                "bg-slate-100 text-slate-600 border-slate-200"
                            )}
                          >
                            Status: {req.status}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {req.requestCode}
                          </span>
                        </div>
                        <h4 className="mt-1.5 text-sm font-bold text-slate-900 sm:text-base">
                          {req.bookTitle}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium">
                          Author: {req.author} · Category: {req.category}
                        </p>
                      </div>
                      </div>

                      <div className="text-xs sm:text-right text-slate-500">
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          Date Requested
                        </span>
                        <p className="font-medium text-slate-700">
                          {reqDate.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Librarian Rejection Reason */}
                    {req.status === "Rejected" && req.rejectionReason && (
                      <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-800">
                        <span className="font-bold">Librarian Rejection Reason:</span>{" "}
                        {req.rejectionReason}
                      </div>
                    )}

                    {/* Approval Notice */}
                    {req.status === "Approved" && (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800">
                        <span className="font-bold">Ready for Pickup:</span>{" "}
                        Please claim this book at the Central Circulation Counter with your Student ID card.
                      </div>
                    )}

                    {/* Cancel action for pending */}
                    {req.status === "Pending" && (
                      <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                        <button
                          type="button"
                          onClick={() => handleCancelRequest(req.id)}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                          Cancel Request
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Active Reservations */}
      {activeTab === "reservations" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
            <span className="font-bold text-slate-900">
              Waitlist Reservations:
            </span>{" "}
            When a checked-out book is returned by another student, it is held for you at the Reserve Desk for 7 days.
          </div>

          {reservations.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-sm">
              <Layers className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-900">
                No active reservations
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                You can reserve books that are currently checked out.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((res) => {
                const resDate = new Date(res.reservedDate);
                const expDate = new Date(res.expiryDate);

                return (
                  <div
                    key={res.id}
                    className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <BookCover
                          src={res.cover_url}
                          title={res.bookTitle}
                          size="sm"
                        />
                        <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                              res.status === "Ready for Pickup"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-purple-50 text-purple-800 border-purple-200"
                            )}
                          >
                            {res.status}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {res.reservationCode}
                          </span>
                        </div>
                        <h4 className="mt-1.5 text-sm font-bold text-slate-900 sm:text-base">
                          {res.bookTitle}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">
                          ISBN: {res.isbn}
                        </p>
                      </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs sm:text-right">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            Reserved Date
                          </span>
                          <p className="font-medium text-slate-700">
                            {resDate.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            Hold Expiry
                          </span>
                          <p className="font-semibold text-indigo-700">
                            {expDate.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {res.status === "Ready for Pickup" && (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800">
                        <span className="font-bold">Book Waiting:</span> Available at Reserve Desk. Please claim before the hold expiration date.
                      </div>
                    )}

                    {(res.status === "Pending" || res.status === "Ready for Pickup") && (
                      <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                        <button
                          type="button"
                          onClick={() => handleCancelReservation(res.id)}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                          Cancel Reservation
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudentBorrowingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-12 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-xs font-medium text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <span>Loading borrowing records...</span>
          </div>
        </div>
      }
    >
      <BorrowingContent />
    </Suspense>
  );
}

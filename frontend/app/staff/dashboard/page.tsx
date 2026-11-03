"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookMarked,
  BookOpen,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { useToast } from "@/components/ui/ToastProvider";

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const {
    books,
    borrowingRequests,
    transactions,
    reservations,
    fines,
    approveBorrowRequest,
    rejectBorrowRequest,
    confirmBookReturn,
  } = useLibraryStore();
  const { showToast } = useToast();

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const pendingRequests = borrowingRequests.filter((r) => r.status === "Pending");
  const activeLoans = transactions.filter((t) => t.status === "Borrowed" || t.status === "Overdue");
  const overdueLoans = transactions.filter((t) => t.status === "Overdue");
  const activeReservations = reservations.filter((r) => r.status === "Pending" || r.status === "Ready for Pickup");

  const handleApprove = (id: string, title: string) => {
    approveBorrowRequest(id, user?.name || "Library Staff");
    showToast({
      title: "Request Approved",
      description: `Loan request for "${title}" has been approved. Due date set to 14 days.`,
      type: "success",
    });
  };

  const handleReject = () => {
    if (!rejectId) return;
    rejectBorrowRequest(rejectId, rejectReason || "Request declined by Library Staff.", user?.name || "Library Staff");
    showToast({
      title: "Request Declined",
      description: "Borrowing request has been declined.",
      type: "info",
    });
    setRejectId(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200 backdrop-blur-xs ring-1 ring-white/15">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-300" />
            <span>Circulation Desk Active</span>
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
            Welcome, {user?.name || "Library Staff"}
          </h2>
          <p className="mt-1 text-xs text-indigo-200/90 sm:text-sm">
            University Library &amp; Circulation Services · Process loans, manage returns, verify student standing, and oversee catalog inventory.
          </p>
        </div>
      </div>

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Stat 1: Pending Requests */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Requests</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{pendingRequests.length}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Awaiting staff review</p>
        </div>

        {/* Stat 2: Active Borrowed Loans */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Loans</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{activeLoans.length}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Currently in circulation</p>
        </div>

        {/* Stat 3: Overdue Books */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Overdue Items</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600">{overdueLoans.length}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Past scheduled due date</p>
        </div>

        {/* Stat 4: Active Reservations */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Reservations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Bookmark className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{activeReservations.length}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Hold queues placed</p>
        </div>
      </div>

      {/* Pending Borrowing Requests Queue */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pending Borrowing Requests</h3>
            <p className="text-xs text-slate-500">Approve or decline student loan requests</p>
          </div>
          <Link
            href="/staff/requests"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-700">All caught up!</p>
            <p className="text-[11px] text-slate-400">No pending student borrowing requests in queue.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingRequests.slice(0, 5).map((req) => (
              <div key={req.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{req.bookTitle}</h4>
                  <p className="text-[11px] text-slate-500">
                    By {req.author} · Student: <span className="font-semibold text-slate-700">{req.studentName}</span> ({req.studentId})
                  </p>
                  <p className="text-[10px] text-slate-400">Requested: {req.requestDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(req.id, req.bookTitle)}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectId(req.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/staff/returns"
          className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
            <RotateCcw className="h-5 w-5" />
          </div>
          <h4 className="mt-3 text-xs font-bold text-slate-900">Returns &amp; Check-in</h4>
          <p className="mt-1 text-[11px] text-slate-500">
            Process returned books, check item condition, and clear student loan accounts.
          </p>
        </Link>

        <Link
          href="/staff/books"
          className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <h4 className="mt-3 text-xs font-bold text-slate-900">Books Catalog</h4>
          <p className="mt-1 text-[11px] text-slate-500">
            Browse collection inventory, update availability, and manage shelf locations.
          </p>
        </Link>

        <Link
          href="/staff/students"
          className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
            <Users className="h-5 w-5" />
          </div>
          <h4 className="mt-3 text-xs font-bold text-slate-900">Student Lookup</h4>
          <p className="mt-1 text-[11px] text-slate-500">
            Inspect borrower standing, current loans, reservations, and outstanding fines.
          </p>
        </Link>
      </div>

      {/* Reject Reason Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Decline Borrowing Request</h3>
            <p className="mt-1 text-xs text-slate-500">
              Please enter the reason for declining this request. The student will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Maximum borrowing limit reached, item reserved for course reserve, or account on hold."
              rows={3}
              className="mt-3 block w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectId(null)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

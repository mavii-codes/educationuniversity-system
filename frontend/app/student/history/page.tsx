"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Filter,
  History,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { cn } from "@/lib/utils";

export default function StudentBorrowingHistoryPage() {
  const { user } = useAuth();
  const { getStudentTransactions, getStudentFines } = useLibraryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const studentId = user?.studentId || user?.id || "2024-042";
  const transactions = getStudentTransactions(studentId);
  const fines = getStudentFines(studentId);

  // Filter history items
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchQuery =
        !q ||
        t.bookTitle.toLowerCase().includes(q) ||
        t.transactionCode.toLowerCase().includes(q) ||
        t.isbn.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "returned" && t.status === "Returned") ||
        (statusFilter === "active" &&
          (t.status === "Borrowed" || t.status === "Overdue"));

      return matchQuery && matchStatus;
    });
  }, [transactions, searchQuery, statusFilter]);

  const returnedCount = transactions.filter((t) => t.status === "Returned").length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <History className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {transactions.length}
          </p>
          <p className="text-xs text-slate-500 font-medium">Total Lifetime Borrowings</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {returnedCount}
          </p>
          <p className="text-xs text-slate-500 font-medium">Successfully Returned</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Coins className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {fines.length}
          </p>
          <p className="text-xs text-slate-500 font-medium">Overdue Incidents Recorded</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search historical records by title, code, ISBN..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All Borrowing Records</option>
              <option value="returned">Completed Returns Only</option>
              <option value="active">Active &amp; Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Records Table / Cards */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-slate-900">
            Circulation History Archive
          </h3>
          <p className="text-xs text-slate-500">
            Detailed log of all external Library LMS transactions linked to Student ID {studentId}
          </p>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <History className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-xs font-semibold text-slate-700">
              No historical records found
            </p>
            <p className="text-[11px] text-slate-400">
              Try adjusting your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Book Title / Details</th>
                  <th className="px-6 py-3">Transaction ID</th>
                  <th className="px-6 py-3">Borrow Date</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Return Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Fines Accrued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const bDate = new Date(tx.borrowDate);
                  const dDate = new Date(tx.dueDate);
                  const rDate = tx.returnDate ? new Date(tx.returnDate) : null;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{tx.bookTitle}</p>
                        <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                          ISBN: {tx.isbn}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-600">
                        {tx.transactionCode}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {bDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {dDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {rDate ? (
                          rDate.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        ) : (
                          <span className="text-slate-400 italic">Not yet returned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                            tx.status === "Returned" &&
                              "bg-emerald-50 text-emerald-700 border-emerald-200",
                            tx.status === "Borrowed" &&
                              "bg-blue-50 text-blue-700 border-blue-200",
                            tx.status === "Overdue" &&
                              "bg-rose-50 text-rose-700 border-rose-200"
                          )}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {tx.finesAccrued > 0 ? (
                          <span className="text-rose-600 font-semibold">
                            ₱{tx.finesAccrued.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


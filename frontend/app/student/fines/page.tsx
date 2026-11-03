"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Coins,
  CreditCard,
  FileText,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { cn } from "@/lib/utils";

export default function StudentFinesPage() {
  const { user } = useAuth();
  const { getStudentFines, getStudentTransactions } = useLibraryStore();

  const studentId = user?.studentId || user?.id || "2024-042";
  const fines = getStudentFines(studentId);
  const transactions = getStudentTransactions(studentId);

  const overdueLoans = transactions.filter((t) => t.status === "Overdue");

  const unpaidFines = fines.filter((f) => f.paymentStatus === "Unpaid");
  const paidFines = fines.filter((f) => f.paymentStatus === "Paid" || f.paymentStatus === "Waived");

  const totalUnpaid = unpaidFines.reduce((acc, f) => acc + f.fineAmount, 0);
  const totalPaid = paidFines.reduce((acc, f) => acc + f.fineAmount, 0);

  const isCleared = totalUnpaid === 0 && overdueLoans.length === 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);

  return (
    <div className="space-y-6">
      {/* Clearance Status Banner */}
      <div
        className={cn(
          "rounded-2xl border p-5 sm:p-6 shadow-sm",
          isCleared
            ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
            : "border-rose-300 bg-rose-50/80 text-rose-950"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                isCleared ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}
            >
              {isCleared ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    isCleared ? "bg-emerald-200/60 text-emerald-900" : "bg-rose-200 text-rose-900"
                  )}
                >
                  {isCleared ? "Library Clearance: Active & Cleared" : "Library Clearance: On Hold"}
                </span>
              </div>
              <h3 className="mt-1 text-base font-bold sm:text-lg">
                {isCleared
                  ? "Your Library Account is in Good Standing"
                  : `Outstanding Balance: ${formatCurrency(totalUnpaid)}`}
              </h3>
              <p className="mt-0.5 text-xs text-slate-600">
                {isCleared
                  ? "You have zero overdue books and no unpaid fines recorded in the University Library System."
                  : "You have overdue books or unsettled library fines. Academic clearances and degree processing may be held."}
              </p>
            </div>
          </div>

          {!isCleared && (
            <div className="rounded-xl border border-rose-200 bg-white/90 p-3 text-xs text-rose-900">
              <span className="font-bold">Clearance Procedure:</span>
              <p className="mt-0.5 text-[11px] text-slate-600">
                1. Return books to the circulation desk.
                <br />
                2. Settle balance at the University Cashier / Accounting Office.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <Coins className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-rose-700">
            {formatCurrency(totalUnpaid)}
          </p>
          <p className="text-xs text-slate-500 font-medium">Unpaid Fines Balance</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <AlertCircle className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {overdueLoans.length}
          </p>
          <p className="text-xs text-slate-500 font-medium">Current Overdue Books</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {formatCurrency(totalPaid)}
          </p>
          <p className="text-xs text-slate-500 font-medium">Lifetime Settled / Cleared</p>
        </div>
      </div>

      {/* Overdue Books List */}
      {overdueLoans.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Active Overdue Items Awaiting Return
            </h3>
          </div>

          <div className="mt-3 space-y-3">
            {overdueLoans.map((loan) => {
              const due = new Date(loan.dueDate);
              const now = new Date();
              const diffMs = now.getTime() - due.getTime();
              const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
              const fineEst = days * 15.0;

              return (
                <div
                  key={loan.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/40 p-3.5 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900 text-sm">
                      {loan.bookTitle}
                    </span>
                    <p className="font-mono text-slate-500 text-[11px] mt-0.5">
                      Barcode / Tx: {loan.transactionCode} · Due: {due.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-700">
                      {days} day(s) overdue
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Estimated Accrued: ₱{fineEst.toFixed(2)} (₱15/day)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fines Ledger Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-slate-900">
            Library Fines Assessment Ledger
          </h3>
          <p className="text-xs text-slate-500">
            Calculated under Institutional Library Circulation Policy (Rate: ₱15.00 / calendar day overdue)
          </p>
        </div>

        {fines.length === 0 ? (
          <div className="p-12 text-center">
            <Coins className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-xs font-semibold text-slate-700">
              No fine records on your account
            </p>
            <p className="text-[11px] text-slate-400">
              All previous book loans have been returned on or before schedule.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Book Title / Record</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Days Overdue</th>
                  <th className="px-6 py-3">Fine Rate</th>
                  <th className="px-6 py-3">Total Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.map((f) => {
                  const dDate = new Date(f.dueDate);
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{f.bookTitle}</p>
                        <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                          Tx Ref: {f.transactionId}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {dDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {f.daysOverdue} days
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        ₱15.00 / day
                      </td>
                      <td className="px-6 py-4 font-bold text-rose-700">
                        {formatCurrency(f.fineAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                            f.paymentStatus === "Unpaid" &&
                              "bg-rose-50 text-rose-800 border-rose-200",
                            f.paymentStatus === "Paid" &&
                              "bg-emerald-50 text-emerald-800 border-emerald-200",
                            f.paymentStatus === "Waived" &&
                              "bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          {f.paymentStatus}
                        </span>
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


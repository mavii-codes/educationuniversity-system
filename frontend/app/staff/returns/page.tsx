"use client";

import React, { useState } from "react";
import { CheckCircle2, RotateCcw, Search } from "lucide-react";
import { useLibraryStore } from "@/lib/library-store";
import { useToast } from "@/components/ui/ToastProvider";
import { BookCover } from "@/components/library/BookCover";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function StaffReturnsPage() {
  const { transactions, confirmBookReturn } = useLibraryStore();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");

  const activeLoans = transactions.filter(
    (t) => t.status === "Borrowed" || t.status === "Overdue"
  );

  const filtered = activeLoans.filter((t) => {
    return (
      t.bookTitle.toLowerCase().includes(search.toLowerCase()) ||
      t.studentName.toLowerCase().includes(search.toLowerCase()) ||
      t.studentId.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleReturn = async (id: string, title: string) => {
    const result = await confirmBookReturn(id);
    showToast({
      title: result.ok ? "Book Checked In" : "Check-in Failed",
      description: result.ok
        ? `"${title}" has been successfully returned and restored to shelf inventory.`
        : result.message,
      type: result.ok ? "success" : "warning",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Returns &amp; Check-in</h2>
          <p className="text-xs text-slate-500">Scan or search active loans to process item returns</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, book title..."
            className="rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Book</th>
                <th className="px-4 py-3">Borrower</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No active loans found matching search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <BookCover src={t.cover_url} title={t.bookTitle} size="sm" />
                        <span className="font-bold text-slate-900">{t.bookTitle}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800">{t.studentName}</p>
                      <p className="text-[11px] text-slate-500">{t.studentId}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{formatDate(t.borrowDate)}</td>
                    <td className="px-4 py-3.5">
                      <span className={t.status === "Overdue" ? "font-bold text-rose-600" : "text-slate-600"}>
                        {formatDate(t.dueDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          t.status === "Overdue"
                            ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                            : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleReturn(t.id, t.bookTitle)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Process Return</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

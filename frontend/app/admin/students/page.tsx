"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookMarked,
  Search,
  Users,
} from "lucide-react";
import { getLibraryBorrowers } from "@/lib/api";
import { StudentBorrower } from "@/types";
import { Badge } from "@/components/ui/Badge";

export default function LibraryBorrowersPage() {
  const [borrowers, setBorrowers] = useState<StudentBorrower[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBorrowers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBorrowers(await getLibraryBorrowers());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load library borrower accounts."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBorrowers();
  }, [loadBorrowers]);

  const filteredBorrowers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return borrowers;
    return borrowers.filter((borrower) =>
      [
        borrower.studentName,
        borrower.studentId,
        borrower.borrowerId,
        borrower.email,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [borrowers, search]);

  const activeLoans = borrowers.reduce(
    (total, borrower) => total + borrower.activeLoansCount,
    0
  );
  const outstandingFines = borrowers.reduce(
    (total, borrower) => total + borrower.finesBalance,
    0
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Borrower Accounts
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Find library members and review their current loans and account standing.
          </p>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, member ID, or email..."
            aria-label="Search borrower accounts"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </header>

      <section
        aria-label="Borrower summary"
        className="grid gap-4 sm:grid-cols-3"
      >
        <SummaryCard
          label="Borrower accounts"
          value={borrowers.length.toLocaleString()}
          icon={Users}
        />
        <SummaryCard
          label="Active loans"
          value={activeLoans.toLocaleString()}
          icon={BookMarked}
        />
        <SummaryCard
          label="Outstanding fines"
          value={`₱${outstandingFines.toFixed(2)}`}
          icon={AlertCircle}
        />
      </section>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadBorrowers()}
            className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            Try again
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3.5">Member</th>
                <th scope="col" className="px-4 py-3.5">Member ID</th>
                <th scope="col" className="px-4 py-3.5">Active loans</th>
                <th scope="col" className="px-4 py-3.5">Fines</th>
                <th scope="col" className="px-5 py-3.5">Account status</th>
                <th scope="col" className="px-5 py-3.5">Lifecycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                    Loading borrower accounts...
                  </td>
                </tr>
              ) : filteredBorrowers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                    {error
                      ? "Borrower accounts are unavailable."
                      : search
                        ? "No borrower accounts match your search."
                        : "No borrower accounts are available yet."}
                  </td>
                </tr>
              ) : (
                filteredBorrowers.map((borrower) => (
                  <tr key={borrower.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {borrower.studentName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {borrower.email}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-600">
                      {borrower.studentId}
                    </td>
                    <td className="px-4 py-4 tabular-nums text-slate-700">
                      {borrower.activeLoansCount}
                    </td>
                    <td className="px-4 py-4 tabular-nums text-slate-700">
                      ₱{borrower.finesBalance.toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          borrower.status === "Active" || borrower.status === "Cleared"
                            ? "success"
                            : "warning"
                        }
                      >
                        {borrower.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/lifecycle?studentId=${encodeURIComponent(borrower.studentId)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                      >
                        Lifecycle
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
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

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { STUDENT_BORROWERS } from "@/data/mock-data";
import { StudentBorrower } from "@/types";

export default function StaffStudentsPage() {
  const [borrowers] = useState<StudentBorrower[]>(STUDENT_BORROWERS);
  const [search, setSearch] = useState("");

  const filtered = borrowers.filter(
    (b) =>
      b.studentName.toLowerCase().includes(search.toLowerCase()) ||
      b.studentId.toLowerCase().includes(search.toLowerCase()) ||
      b.programName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Student Borrower Directory</h2>
          <p className="text-xs text-slate-500">Look up student library standing, active loans, and card status</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student name, ID..."
            className="rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Active Loans</th>
                <th className="px-4 py-3">Unpaid Fines</th>
                <th className="px-5 py-3 text-right">Card Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{b.studentName}</td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">{b.studentId}</td>
                  <td className="px-4 py-3.5 text-slate-600">{b.programCode} · {b.yearLevel}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{b.activeLoansCount} active</td>
                  <td className="px-4 py-3.5 font-semibold text-rose-600">
                    {b.finesBalance > 0 ? `₱${b.finesBalance.toFixed(2)}` : "₱0.00"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        b.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

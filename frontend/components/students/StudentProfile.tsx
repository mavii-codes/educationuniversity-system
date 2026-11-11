"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BookMarked, BookOpen } from "lucide-react";
import { Student } from "@/types/university";
import { Badge } from "@/components/ui/Badge";
import { getStudentStatusVariant } from "@/components/students/StudentTable";
import { cn } from "@/lib/utils";

type ProfileTab = "library";

export function StudentProfile({ student }: { student: Student }) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("library");
  const pathname = usePathname();
  const backHref = pathname?.startsWith("/admin") ? "/admin/students" : "/students";

  const initials = student.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");

  const tabs: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
    { id: "library", label: "Library Account", icon: BookMarked },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Students Directory
        </Link>
        <span className="text-xs text-slate-400">
          Library member account
        </span>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4 sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-sm shadow-indigo-600/20">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  {student.name}
                </h2>
                <Badge
                  variant={getStudentStatusVariant(student.status)}
                  dot
                >
                  {student.status} Student
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-mono font-medium text-slate-700">
                  Student ID: {student.id}
                </span>
                <span className="mx-2 text-slate-300">·</span>
                <span>{student.email}</span>
              </p>
            </div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex gap-1 overflow-x-auto border-t border-slate-100 pt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition",
                  active
                    ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/15"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Library Account */}
      {activeTab === "library" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                Total Books Borrowed
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.library.totalBorrowedAllTime}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Cumulative campus library circulation
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                Returned Books
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.library.returnedBooksCount}
              </p>
              <p className="mt-1 text-xs text-emerald-700 font-medium">
                Zero overdue liabilities
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                Current Borrowed Books
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.library.currentBorrowedCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Max allowed concurrent loans: 5
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white shadow-card">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                Library Circulation Records
              </h3>
              <p className="text-xs text-slate-500">
                Current active loans and recent returned holdings synced from Library System
              </p>
            </div>

            {student.library.books.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-700">
                  No active or recent book loans
                </p>
                <p className="text-xs text-slate-500">
                  Library account is in good standing with zero active borrowings.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3">Book Title</th>
                      <th className="px-6 py-3">Author</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Borrowed Date</th>
                      <th className="px-6 py-3">Due / Returned</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {student.library.books.map((book) => (
                      <tr key={book.id} className="hover:bg-slate-50/70">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {book.title}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{book.author}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {book.category}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {book.borrowedDate}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {book.returnedDate
                            ? `Returned ${book.returnedDate}`
                            : `Due ${book.dueDate}`}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              book.status === "Returned"
                                ? "success"
                                : book.status === "Due Soon"
                                ? "warning"
                                : "info"
                            }
                          >
                            {book.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

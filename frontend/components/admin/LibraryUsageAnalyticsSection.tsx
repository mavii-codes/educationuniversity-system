"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Calendar,
  Layers,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/utils";

interface LibraryUsageAnalyticsProps {
  monthlyTrend?: {
    month: string;
    borrowed: number;
    returned: number;
    overdue: number;
  }[];
  categoryDistribution?: {
    category: string;
    count: number;
    borrowed: number;
  }[];
  programStats?: {
    program: string;
    programName: string;
    activeBorrowers: number;
    activeLoans: number;
    totalBorrows: number;
  }[];
}

const DEFAULT_MONTHLY_TREND = [
  { month: "Jun", borrowed: 620, returned: 580, overdue: 18 },
  { month: "Jul", borrowed: 890, returned: 810, overdue: 24 },
  { month: "Aug", borrowed: 1140, returned: 1020, overdue: 42 },
  { month: "Sep", borrowed: 1350, returned: 1210, overdue: 55 },
  { month: "Oct", borrowed: 1480, returned: 1390, overdue: 64 },
];

const DEFAULT_CATEGORIES = [
  { category: "Computer Science", count: 4850, borrowed: 1420 },
  { category: "Information Technology", count: 3240, borrowed: 980 },
  { category: "Business Administration", count: 2650, borrowed: 540 },
  { category: "Health Sciences & Nursing", count: 1820, borrowed: 360 },
  { category: "Engineering & Mathematics", count: 1440, borrowed: 210 },
  { category: "Education & Pedagogy", count: 850, borrowed: 90 },
];

const DEFAULT_PROGRAM_STATS = [
  { program: "BSIT", programName: "BS Information Technology", activeBorrowers: 940, activeLoans: 1120, totalBorrows: 2840 },
  { program: "BSCS", programName: "BS Computer Science", activeBorrowers: 820, activeLoans: 960, totalBorrows: 2410 },
  { program: "BSBA", programName: "BS Business Administration", activeBorrowers: 650, activeLoans: 610, totalBorrows: 1540 },
  { program: "BSN", programName: "BS Nursing", activeBorrowers: 490, activeLoans: 520, totalBorrows: 1220 },
  { program: "BSCE", programName: "BS Civil Engineering", activeBorrowers: 310, activeLoans: 240, totalBorrows: 610 },
  { program: "BSED", programName: "BS Secondary Education", activeBorrowers: 210, activeLoans: 150, totalBorrows: 300 },
];

export function LibraryUsageAnalyticsSection({
  monthlyTrend = DEFAULT_MONTHLY_TREND,
  categoryDistribution = DEFAULT_CATEGORIES,
  programStats = DEFAULT_PROGRAM_STATS,
}: LibraryUsageAnalyticsProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
              Library activity
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-500">
              Catalog and circulation
            </span>
          </div>
          <h3 className="mt-1 text-base font-semibold text-slate-900">
            Library Usage &amp; Circulation
          </h3>
          <p className="text-xs text-slate-500">
            Borrowing and return activity across the library collection
          </p>
        </div>

        <Link
          href="/admin/library"
          className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 sm:self-auto"
        >
          <span>Open Library Management</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Circulation & Loan Trends Chart */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Monthly Circulation &amp; Returns
                </h4>
                <p className="text-[11px] text-slate-400">
                  Ingested loan volume and return completion rate
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
              <Calendar className="h-3 w-3" />
              AY 2026-2027
            </span>
          </div>

          <div className="mt-4 h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyTrend}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  iconType="circle"
                />
                <Bar dataKey="borrowed" name="Books Borrowed" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returned" name="Books Returned" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue Items" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Borrowing Volume by Academic Program */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Borrowing Engagement by Academic Program
                </h4>
                <p className="text-[11px] text-slate-400">
                  Cross-matched student borrower activity by degree
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              6 Programs Matched
            </span>
          </div>

          <div className="mt-3.5 space-y-3">
            {programStats.slice(0, 5).map((p) => {
              const maxBorrow = 3000;
              const pct = Math.min(100, Math.round((p.totalBorrows / maxBorrow) * 100));
              return (
                <div key={p.program} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {p.program} · <span className="font-normal text-slate-500">{p.programName}</span>
                    </span>
                    <span className="font-medium text-slate-600 tabular-nums">
                      {formatNumber(p.totalBorrows)} loans ({p.activeBorrowers} patrons)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Holdings Category Distribution Breakdown */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Holdings &amp; Circulation by Subject Category
              </h4>
              <p className="text-[11px] text-slate-400">
                Integrated catalog titles, available shelf copies, and active loans
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500">
            Total Integrated Catalog: <strong className="text-slate-800">14,850 Titles</strong>
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categoryDistribution.map((cat) => (
            <div
              key={cat.category}
              className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-center transition hover:border-slate-200 hover:bg-slate-50"
            >
              <p className="truncate text-xs font-semibold text-slate-900" title={cat.category}>
                {cat.category}
              </p>
              <p className="mt-1 text-lg font-bold text-indigo-600 tabular-nums">
                {formatNumber(cat.count)}
              </p>
              <p className="text-[10px] text-slate-400">catalog titles</p>
              <div className="mt-2 border-t border-slate-200/60 pt-1.5 text-[11px] font-medium text-slate-600">
                <span className="text-emerald-700 font-semibold">{formatNumber(cat.borrowed)}</span> active loans
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminDashboardOverview } from "@/types";
import { formatNumber } from "@/lib/utils";

type AnalyticsPreview = AdminDashboardOverview["analyticsPreview"];

export function EnrollmentTrendsPreviewChart({
  data,
}: {
  data: AnalyticsPreview["enrollmentTrends"];
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Enrollment Trends
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Total enrolled students across recent academic terms
          </p>
        </div>
        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
          +4.8% YoY
        </span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="adminEnrollFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
            />
            <XAxis
              dataKey="term"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[9500, 13000]}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              tick={{ fill: "#64748B", fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                    <p className="font-semibold text-slate-900">{row.term}</p>
                    <p className="mt-1 font-medium text-indigo-700">
                      Enrolled: {formatNumber(row.enrolled)}
                    </p>
                    <p className="text-slate-500">
                      New intake: {formatNumber(row.newIntake)}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="enrolled"
              stroke="#4F46E5"
              strokeWidth={2.25}
              fill="url(#adminEnrollFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AcademicPerformancePreviewChart({
  data,
}: {
  data: AnalyticsPreview["academicPerformance"];
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Student Academic Performance
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Institutional average academic score and cumulative GPA
          </p>
        </div>
        <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
          3.34 Avg GPA
        </span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
            />
            <XAxis
              dataKey="term"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[80, 92]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "#64748B", fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                    <p className="font-semibold text-slate-900">{row.term}</p>
                    <p className="mt-1 font-medium text-sky-700">
                      Average Score: {row.avgScore}%
                    </p>
                    <p className="text-slate-500">
                      Mean GPA: {row.avgGpa.toFixed(2)}
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="avgScore"
              stroke="#0284C7"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "#0284C7", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function GraduationTrendsPreviewChart({
  data,
}: {
  data: AnalyticsPreview["graduationTrends"];
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Graduation Trends
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Annual graduating cohort size and post-graduation placement
          </p>
        </div>
        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          2,140 Candidates
        </span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
            />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "#F8FAFC" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                    <p className="font-semibold text-slate-900">
                      Class of {row.year}
                    </p>
                    <p className="mt-1 font-medium text-indigo-700">
                      Graduates: {formatNumber(row.graduates)}
                    </p>
                    <p className="text-emerald-700">
                      Employed (6 mos): {row.employedRate}%
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="graduates"
              fill="#6366F1"
              radius={[6, 6, 0, 0]}
              maxBarSize={42}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function StudentsAtRiskPreviewChart({
  data,
}: {
  data: AnalyticsPreview["studentsAtRisk"];
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Students at Risk
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Early-warning academic and attendance standing across active students
          </p>
        </div>
        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
          342 High Risk
        </span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#E2E8F0"
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="category"
              axisLine={false}
              tickLine={false}
              width={92}
              tick={{ fill: "#334155", fontSize: 11, fontWeight: 500 }}
            />
            <Tooltip
              cursor={{ fill: "#F8FAFC" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                    <p className="font-semibold text-slate-900">
                      {row.category}
                    </p>
                    <p className="mt-1 font-medium text-slate-700">
                      {formatNumber(row.students)} students ({row.percentage}%)
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="students" radius={[0, 6, 6, 0]} barSize={22}>
              {data.map((entry) => (
                <Cell key={entry.category} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
        {data.map((item) => (
          <div
            key={item.category}
            className="rounded-lg bg-slate-50/80 px-2.5 py-2 text-center"
          >
            <p className="text-[11px] font-medium text-slate-500">
              {item.category}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-900 tabular-nums">
              {formatNumber(item.students)} ({item.percentage}%)
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}


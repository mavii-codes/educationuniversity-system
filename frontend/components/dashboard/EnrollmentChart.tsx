"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardAnalytics } from "@/types/university";
import { formatNumber } from "@/lib/utils";

interface EnrollmentChartProps {
  data: DashboardAnalytics["enrollmentTrends"];
}

export function EnrollmentChart({ data }: EnrollmentChartProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-card">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Enrollment Trends
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Total enrolled headcount across recent academic semesters
          </p>
        </div>
        <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
          +16.2% since AY 23-24
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="semester"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              dy={8}
            />
            <YAxis
              domain={[4000, 5600]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg">
                    <p className="text-xs font-semibold text-slate-900">{label}</p>
                    <p className="mt-1 text-xs text-indigo-700 font-medium tabular-nums">
                      Total Enrolled: {formatNumber(row.students)}
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      New Enrollees: {formatNumber(row.newEnrollees)}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="students"
              stroke="#4F46E5"
              strokeWidth={2.5}
              fill="url(#enrollmentGradient)"
              activeDot={{ r: 5, fill: "#4F46E5", stroke: "#FFFFFF", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


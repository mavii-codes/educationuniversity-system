"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardAnalytics } from "@/types/university";
import { formatNumber } from "@/lib/utils";

interface ProgramEnrollmentChartProps {
  data: DashboardAnalytics["enrollmentByProgram"];
}

export function ProgramEnrollmentChart({ data }: ProgramEnrollmentChartProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-card">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Enrollment by Program
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Student distribution across major undergraduate degree programs
          </p>
        </div>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          6 Degree Programs
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="program"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "#F8FAFC" }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg">
                    <p className="text-xs font-semibold text-slate-900">
                      {row.fullName}
                    </p>
                    <p className="mt-1 text-xs font-medium text-indigo-700 tabular-nums">
                      Enrolled: {formatNumber(row.students)} students
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="students"
              fill="#4F46E5"
              radius={[6, 6, 0, 0]}
              barSize={34}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


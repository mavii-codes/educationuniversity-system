"use client";

import React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardAnalytics } from "@/types/university";

interface PerformanceChartProps {
  data: DashboardAnalytics["performanceTrends"];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-card">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Student Performance
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Campus-wide weighted academic score &amp; GPA trajectory
          </p>
        </div>
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 tabular-nums">
          Avg 87.4% · 3.31 GPA
        </span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="semester"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              dy={8}
            />
            <YAxis
              domain={[80, 92]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg">
                    <p className="text-xs font-semibold text-slate-900">{label}</p>
                    <p className="mt-1 text-xs font-medium text-indigo-700 tabular-nums">
                      Avg Grade: {row.avgScore}%
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      Equivalent GPA: {row.avgGpa.toFixed(2)} / 4.00
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="avgScore"
              stroke="#6366F1"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "#6366F1", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#4F46E5", stroke: "#FFFFFF", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


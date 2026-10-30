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

interface GraduationChartProps {
  data: DashboardAnalytics["graduationTrends"];
}

export function GraduationChart({ data }: GraduationChartProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-card">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Graduation Trends
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Annual conferred graduates by commencement year
          </p>
        </div>
        <span className="rounded-md bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 tabular-nums">
          850 in 2026
        </span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "#F8FAFC" }}
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg">
                    <p className="text-xs font-semibold text-slate-900">
                      Class of {label}
                    </p>
                    <p className="mt-1 text-xs font-medium text-violet-700 tabular-nums">
                      Graduates: {formatNumber(row.graduates)}
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      6-Mo Employment: {row.employmentRate}%
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="graduates"
              fill="#7C3AED"
              radius={[6, 6, 0, 0]}
              barSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


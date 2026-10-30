"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardAnalytics } from "@/types/university";

interface AttendanceChartProps {
  data: DashboardAnalytics["attendanceTrends"];
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-card">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Attendance Trends
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Monthly classroom &amp; lab attendance vs 90% target
          </p>
        </div>
        <span className="rounded-md bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 tabular-nums">
          92.9% Current
        </span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284C7" stopOpacity={0.16} />
                <stop offset="95%" stopColor="#0284C7" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              dy={8}
            />
            <YAxis
              domain={[85, 98]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
            />
            <ReferenceLine
              y={90}
              stroke="#94A3B8"
              strokeDasharray="4 4"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg">
                    <p className="text-xs font-semibold text-slate-900">{label} 2026</p>
                    <p className="mt-1 text-xs font-medium text-sky-700 tabular-nums">
                      Attendance Rate: {row.attendance}%
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      Institutional Target: {row.target}%
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="attendance"
              stroke="#0284C7"
              strokeWidth={2.5}
              fill="url(#attendanceGradient)"
              activeDot={{ r: 5, fill: "#0284C7", stroke: "#FFFFFF", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


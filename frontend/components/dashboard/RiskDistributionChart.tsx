"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardAnalytics } from "@/types/university";
import { formatNumber } from "@/lib/utils";

interface RiskDistributionChartProps {
  data: DashboardAnalytics["riskDistribution"];
}

export function RiskDistributionChart({ data }: RiskDistributionChartProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Students at Risk
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Active students grouped by academic &amp; attendance risk level
          </p>
        </div>
        <Link
          href="/academic-analytics"
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          Details
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 18, left: 8, bottom: 4 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="level"
              axisLine={false}
              tickLine={false}
              width={86}
              tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
            />
            <Tooltip
              cursor={{ fill: "#F8FAFC" }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 shadow-lg">
                    <p className="text-xs font-semibold text-slate-900">{row.level}</p>
                    <p className="mt-0.5 text-xs text-slate-600 tabular-nums">
                      {formatNumber(row.students)} students ({row.percentage}%)
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="students" radius={[0, 6, 6, 0]} barSize={22}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3.5">
        {data.map((item) => (
          <div key={item.level} className="rounded-lg bg-slate-50/80 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[11px] font-medium text-slate-500">
                {item.level}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">
              {formatNumber(item.students)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}


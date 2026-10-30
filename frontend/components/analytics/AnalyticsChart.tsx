"use client";

import React from "react";

interface AnalyticsChartProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  children: React.ReactNode;
}

export function AnalyticsChart({
  title,
  subtitle,
  badgeText,
  children,
}: AnalyticsChartProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-card">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
        {badgeText && (
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {badgeText}
          </span>
        )}
      </div>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}


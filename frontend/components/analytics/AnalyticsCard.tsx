import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  tone?: "indigo" | "emerald" | "amber" | "rose" | "sky";
}

const toneMap = {
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
};

export function AnalyticsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "indigo",
}: AnalyticsCardProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{title}</span>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset",
            toneMap[tone]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}


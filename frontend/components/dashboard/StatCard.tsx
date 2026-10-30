import React from "react";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  supportingText: string;
  trendDirection?: "up" | "down" | "neutral";
  trendTone?: "positive" | "warning" | "neutral";
  icon: LucideIcon;
  iconTone?: "indigo" | "sky" | "emerald" | "amber" | "violet" | "slate";
}

const iconToneStyles: Record<NonNullable<StatCardProps["iconTone"]>, string> = {
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200/70",
};

export function StatCard({
  label,
  value,
  supportingText,
  trendDirection = "neutral",
  trendTone = "neutral",
  icon: Icon,
  iconTone = "indigo",
}: StatCardProps) {
  return (
    <div className="group rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-card transition-all duration-150 hover:border-slate-300/80 hover:shadow-card-hover">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-transform duration-150 group-hover:scale-105",
            iconToneStyles[iconTone]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3">
        <p className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
          {value}
        </p>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-xs">
        {trendDirection === "up" && (
          <TrendingUp
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              trendTone === "positive"
                ? "text-emerald-600"
                : trendTone === "warning"
                ? "text-amber-600"
                : "text-slate-400"
            )}
          />
        )}
        {trendDirection === "down" && (
          <TrendingDown
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              trendTone === "positive"
                ? "text-emerald-600"
                : trendTone === "warning"
                ? "text-amber-600"
                : "text-slate-400"
            )}
          />
        )}
        <span
          className={cn(
            "truncate font-medium",
            trendTone === "positive"
              ? "text-emerald-700"
              : trendTone === "warning"
              ? "text-amber-700"
              : "text-slate-500"
          )}
        >
          {supportingText}
        </span>
      </div>
    </div>
  );
}


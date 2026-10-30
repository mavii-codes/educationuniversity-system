import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  GraduationCap,
  UserPlus,
} from "lucide-react";
import { AdminLifecycleStageStat } from "@/types";
import { formatNumber } from "@/lib/utils";

const STAGE_STYLES: Record<
  AdminLifecycleStageStat["stage"],
  { icon: React.ElementType; badgeBg: string; iconColor: string }
> = {
  Enrollment: {
    icon: UserPlus,
    badgeBg: "bg-indigo-50 ring-indigo-100",
    iconColor: "text-indigo-600",
  },
  Learning: {
    icon: BookOpen,
    badgeBg: "bg-sky-50 ring-sky-100",
    iconColor: "text-sky-600",
  },
  Graduation: {
    icon: GraduationCap,
    badgeBg: "bg-emerald-50 ring-emerald-100",
    iconColor: "text-emerald-600",
  },
  Alumni: {
    icon: Award,
    badgeBg: "bg-violet-50 ring-violet-100",
    iconColor: "text-violet-600",
  },
};

export function StudentLifecycleOverviewSection({
  stages,
}: {
  stages: AdminLifecycleStageStat[];
}) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-card">
      <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Student Lifecycle Overview
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Unified institutional progression: Enrollment → Learning → Graduation → Alumni
          </p>
        </div>
        <Link
          href="/admin/lifecycle"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
        >
          <span>Explore Lifecycle Pipeline</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((item, index) => {
          const style = STAGE_STYLES[item.stage];
          const Icon = style.icon;
          const isLast = index === stages.length - 1;

          return (
            <div key={item.stage} className="relative flex items-stretch">
              <div className="flex w-full flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 transition hover:border-indigo-200/80 hover:bg-white">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200/70 text-[11px] font-bold text-slate-700">
                      {index + 1}
                    </span>
                    {item.stage}
                  </span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ${style.badgeBg}`}
                  >
                    <Icon className={`h-4 w-4 ${style.iconColor}`} />
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                    {formatNumber(item.count)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
                </div>

                <div className="mt-3.5 border-t border-slate-100 pt-2.5">
                  <span className="text-[11px] font-medium text-indigo-700">
                    {item.sourceLabel}
                  </span>
                </div>
              </div>

              {/* Desktop Stage Flow Connector Arrow */}
              {!isLast && (
                <div className="pointer-events-none absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:flex">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-indigo-500 shadow-sm">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}


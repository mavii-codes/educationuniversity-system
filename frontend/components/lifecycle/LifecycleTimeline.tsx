"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  Check,
  CircleDot,
  ClipboardCheck,
  Database,
  GraduationCap,
  UserPlus,
} from "lucide-react";
import { LifecycleStage, LifecycleStageKey } from "@/types/university";
import { Badge } from "@/components/ui/Badge";
import { cn, formatNumber } from "@/lib/utils";

interface LifecycleTimelineProps {
  stages: LifecycleStage[];
}

const stageIcons: Record<LifecycleStageKey, React.ElementType> = {
  admission: UserPlus,
  enrollment: ClipboardCheck,
  "academic-progress": BookOpenCheck,
  graduation: GraduationCap,
  alumni: Award,
};

export function LifecycleTimeline({ stages }: LifecycleTimelineProps) {
  const [selectedKey, setSelectedKey] =
    useState<LifecycleStageKey>("academic-progress");

  const activeStage =
    stages.find((s) => s.key === selectedKey) || stages[0];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Interactive Timeline Column */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card lg:col-span-5">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-slate-900">
            Student Journey Stages
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Select any stage to inspect integrated data touchpoints and cohort metrics
          </p>
        </div>

        <div className="relative space-y-2">
          {stages.map((stage, idx) => {
            const isSelected = stage.key === selectedKey;
            const isLast = idx === stages.length - 1;
            const Icon = stageIcons[stage.key];

            return (
              <div key={stage.key} className="relative">
                {/* Connecting Vertical Line */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute left-[25px] top-12 h-[calc(100%-24px)] w-0.5",
                      stage.status === "completed"
                        ? "bg-indigo-500"
                        : "bg-slate-200"
                    )}
                  />
                )}

                <button
                  type="button"
                  onClick={() => setSelectedKey(stage.key)}
                  className={cn(
                    "relative flex w-full items-start gap-4 rounded-xl border p-3.5 text-left transition-all",
                    isSelected
                      ? "border-indigo-200 bg-indigo-50/50 shadow-sm"
                      : "border-transparent hover:bg-slate-50"
                  )}
                >
                  {/* Stage Status Node */}
                  <div
                    className={cn(
                      "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      stage.status === "completed" &&
                        "border-indigo-600 bg-indigo-600 text-white",
                      stage.status === "current" &&
                        "border-indigo-600 bg-white text-indigo-600 ring-4 ring-indigo-100",
                      stage.status === "upcoming" &&
                        "border-slate-300 bg-white text-slate-400"
                    )}
                  >
                    {stage.status === "completed" ? (
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    ) : stage.status === "current" ? (
                      <CircleDot className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>

                  {/* Stage Summary */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          isSelected ? "text-indigo-950" : "text-slate-900"
                        )}
                      >
                        {stage.title}
                      </span>
                      <Badge
                        variant={
                          stage.status === "completed"
                            ? "success"
                            : stage.status === "current"
                            ? "brand"
                            : "neutral"
                        }
                      >
                        {stage.status === "completed"
                          ? "Completed"
                          : stage.status === "current"
                          ? "Current Stage"
                          : "Upcoming"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {stage.subtitle}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-slate-700 tabular-nums">
                      {formatNumber(stage.metricCount)}{" "}
                      <span className="font-normal text-slate-400">
                        · {stage.conversionRate}
                      </span>
                    </p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Stage Detail Panel */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card lg:col-span-7">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-semibold text-slate-900">
                {activeStage.title} Stage
              </h3>
              <Badge
                variant={
                  activeStage.status === "completed"
                    ? "success"
                    : activeStage.status === "current"
                    ? "brand"
                    : "neutral"
                }
                dot
              >
                {activeStage.status === "completed"
                  ? "Completed Stage"
                  : activeStage.status === "current"
                  ? "Active Cohort Stage"
                  : "Upcoming Stage"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">{activeStage.subtitle}</p>
          </div>
          <div className="rounded-xl bg-indigo-50/70 px-4 py-2.5 text-right">
            <span className="block text-[11px] font-medium text-indigo-700">
              {activeStage.metricLabel}
            </span>
            <span className="text-xl font-bold text-indigo-950 tabular-nums">
              {formatNumber(activeStage.metricCount)}
            </span>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-slate-600">
          {activeStage.description}
        </p>

        {/* Stage Insights */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {activeStage.insights.map((insight) => (
            <div
              key={insight.label}
              className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-3.5"
            >
              <span className="text-xs text-slate-500">{insight.label}</span>
              <p className="mt-1 text-base font-semibold text-slate-900 tabular-nums">
                {insight.value}
              </p>
            </div>
          ))}
        </div>

        {/* Milestones */}
        <div className="mt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Key Lifecycle Milestones &amp; Automated Checks
          </h4>
          <ul className="mt-3 space-y-2.5">
            {activeStage.keyMilestones.map((milestone) => (
              <li
                key={milestone}
                className="flex items-start gap-2.5 text-sm text-slate-700"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </div>
                <span>{milestone}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Connected Source Systems */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contributing Data Systems
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeStage.sourceSystems.map((src) => (
                  <span
                    key={src}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    <Database className="h-3.5 w-3.5 text-indigo-600" />
                    {src}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href={
                activeStage.key === "alumni"
                  ? "/alumni"
                  : activeStage.key === "academic-progress"
                  ? "/academic-analytics"
                  : "/students"
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
            >
              Explore Stage Records
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


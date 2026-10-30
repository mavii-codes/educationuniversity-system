"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getStudentLifecycleData } from "@/services/api";
import { LIFECYCLE_OVERVIEW_STATS } from "@/data/mockData";
import { LifecycleStage } from "@/types/university";
import { LifecycleTimeline } from "@/components/students/LifecycleTimeline";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  DemoViewState,
  ViewStateControl,
} from "@/components/ui/ViewStateControl";
import { formatNumber } from "@/lib/utils";

export default function StudentLifecyclePage() {
  const [overviewStats, setOverviewStats] = useState<
    typeof LIFECYCLE_OVERVIEW_STATS
  >([]);
  const [stages, setStages] = useState<LifecycleStage[]>([]);
  const [viewState, setViewState] = useState<DemoViewState>("loading");

  const loadLifecycle = useCallback(async () => {
    setViewState("loading");
    try {
      const res = await getStudentLifecycleData();
      setOverviewStats(res.overviewStats);
      setStages(res.stages);
      setViewState("ready");
    } catch {
      setViewState("error");
    }
  }, []);

  useEffect(() => {
    loadLifecycle();
  }, [loadLifecycle]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Unified Student Lifecycle
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Track institutional progression from initial admission through graduation and alumni placement.
          </p>
        </div>
        <ViewStateControl
          current={viewState}
          onChange={setViewState}
          onRefresh={loadLifecycle}
        />
      </div>

      {viewState === "error" && (
        <ErrorState
          title="We couldn't load the student lifecycle stages."
          description="Please try again in a moment."
          onRetry={loadLifecycle}
        />
      )}

      {viewState === "loading" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <CardSkeleton key={idx} />
            ))}
          </div>
          <ChartSkeleton height="h-80" />
        </div>
      )}

      {viewState === "ready" && (
        <>
          {/* Overall Lifecycle Statistics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {overviewStats.map((stat, idx) => (
              <div
                key={stat.label}
                className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    0{idx + 1} · {stat.label}
                  </span>
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                    {stat.change}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                  {formatNumber(stat.value)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{stat.description}</p>
              </div>
            ))}
          </div>

          {/* Interactive Lifecycle Timeline */}
          {stages.length > 0 && <LifecycleTimeline stages={stages} />}
        </>
      )}
    </div>
  );
}


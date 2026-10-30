"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Clock,
  Database,
  GraduationCap,
  UserCheck,
  Users,
} from "lucide-react";
import { getAdminDashboardOverview, syncDataSource } from "@/lib/api";
import { AdminDashboardOverview } from "@/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataSourceOverviewSection } from "@/components/admin/DataSourceOverviewSection";
import { StudentLifecycleOverviewSection } from "@/components/admin/StudentLifecycleOverviewSection";
import { RecentSyncTableSection } from "@/components/admin/RecentSyncTableSection";
import {
  AcademicPerformancePreviewChart,
  EnrollmentTrendsPreviewChart,
  GraduationTrendsPreviewChart,
  StudentsAtRiskPreviewChart,
} from "@/components/charts/AdminAnalyticsCharts";
import { CardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  DemoViewState,
  ViewStateControl,
} from "@/components/ui/ViewStateControl";
import { useToast } from "@/components/ui/ToastProvider";
import { formatNumber } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [viewState, setViewState] = useState<DemoViewState>("loading");
  const { showToast } = useToast();

  const loadDashboard = useCallback(
    async (notify = false) => {
      setViewState("loading");
      try {
        const data = await getAdminDashboardOverview();
        setOverview(data);
        setViewState("ready");
        if (notify) {
          showToast({
            title: "Admin dashboard refreshed",
            description:
              "Synchronized latest metrics across SIS, LMS, HR, Library, and Alumni CRM.",
            type: "success",
          });
        }
      } catch {
        setViewState("error");
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  const handleSyncSource = async (sourceId: string) => {
    if (!overview) return;
    const target = overview.dataSources.find((s) => s.id === sourceId);
    if (!target) return;

    setOverview((prev) =>
      prev
        ? {
            ...prev,
            dataSources: prev.dataSources.map((s) =>
              s.id === sourceId ? { ...s, status: "Syncing" } : s
            ),
          }
        : prev
    );

    try {
      const res = await syncDataSource(sourceId);
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              summary: {
                ...prev.summary,
                lastSuccessfulSync: res.lastSynced,
                lastSuccessfulSyncSubtext: `${target.shortLabel} manual sync completed`,
              },
              dataSources: prev.dataSources.map((s) =>
                s.id === sourceId
                  ? { ...s, status: "Connected", lastSync: res.lastSynced }
                  : s
              ),
              recentSynchronization: prev.recentSynchronization.map((r) =>
                r.dataSource === target.shortLabel
                  ? { ...r, lastSync: res.lastSynced, status: "Connected" }
                  : r
              ),
            }
          : prev
      );
      showToast({
        title: `${target.name} synchronized`,
        description: `Verified ${formatNumber(target.records)} records with zero schema conflicts.`,
        type: "success",
      });
    } catch {
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              dataSources: prev.dataSources.map((s) =>
                s.id === sourceId ? { ...s, status: "Warning" } : s
              ),
            }
          : prev
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Dashboard Welcome Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Good morning, Administrator
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Here&apos;s an overview of your university data integration system.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <ViewStateControl
            current={viewState}
            onChange={setViewState}
            onRefresh={() => loadDashboard(true)}
          />
        </div>
      </div>

      {/* Error State */}
      {viewState === "error" && (
        <ErrorState
          title="Unable to load administrator overview"
          description="Please retry to reconnect with the institutional data integration service."
          onRetry={() => loadDashboard(true)}
        />
      )}

      {/* Loading Skeleton State */}
      {viewState === "loading" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <CardSkeleton key={idx} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <TableSkeleton rows={4} />
        </div>
      )}

      {/* Ready Content */}
      {viewState === "ready" && overview && (
        <>
          {/* 6 Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Total Students"
              value={formatNumber(overview.summary.totalStudents)}
              supportingText={overview.summary.totalStudentsSubtext}
              trendDirection="up"
              trendTone="positive"
              icon={Users}
              iconTone="indigo"
            />
            <StatCard
              label="Active Students"
              value={formatNumber(overview.summary.activeStudents)}
              supportingText={overview.summary.activeStudentsSubtext}
              trendDirection="up"
              trendTone="positive"
              icon={UserCheck}
              iconTone="emerald"
            />
            <StatCard
              label="Graduating Students"
              value={formatNumber(overview.summary.graduatingStudents)}
              supportingText={overview.summary.graduatingStudentsSubtext}
              trendDirection="up"
              trendTone="positive"
              icon={GraduationCap}
              iconTone="sky"
            />
            <StatCard
              label="Alumni"
              value={formatNumber(overview.summary.alumni)}
              supportingText={overview.summary.alumniSubtext}
              icon={Award}
              iconTone="violet"
            />
            <StatCard
              label="Connected Data Sources"
              value={overview.summary.connectedDataSources}
              supportingText={overview.summary.connectedDataSourcesSubtext}
              icon={Database}
              iconTone="emerald"
            />
            <StatCard
              label="Last Successful Sync"
              value={overview.summary.lastSuccessfulSync}
              supportingText={overview.summary.lastSuccessfulSyncSubtext}
              icon={Clock}
              iconTone="indigo"
            />
          </div>

          {/* Data Source Overview (SIS, LMS, HR / Payroll, Library System, Alumni CRM) */}
          <DataSourceOverviewSection
            sources={overview.dataSources}
            onTriggerSync={handleSyncSource}
          />

          {/* Student Lifecycle Overview (Enrollment -> Learning -> Graduation -> Alumni) */}
          <StudentLifecycleOverviewSection
            stages={overview.lifecycleOverview}
          />

          {/* Academic Analytics Preview (4 Recharts Visuals) */}
          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Academic Analytics Preview
                </h3>
                <p className="text-xs text-slate-500">
                  Key institutional enrollment, performance, graduation, and retention indicators
                </p>
              </div>
              <Link
                href="/admin/analytics"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
              >
                <span>Open Full Academic Analytics</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <EnrollmentTrendsPreviewChart
                data={overview.analyticsPreview.enrollmentTrends}
              />
              <AcademicPerformancePreviewChart
                data={overview.analyticsPreview.academicPerformance}
              />
              <GraduationTrendsPreviewChart
                data={overview.analyticsPreview.graduationTrends}
              />
              <StudentsAtRiskPreviewChart
                data={overview.analyticsPreview.studentsAtRisk}
              />
            </div>
          </section>

          {/* Recent Data Synchronization Table */}
          <RecentSyncTableSection rows={overview.recentSynchronization} />
        </>
      )}
    </div>
  );
}


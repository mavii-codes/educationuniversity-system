"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookMarked,
  BookOpen,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Database,
  GraduationCap,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react";
import { getAdminDashboardOverview, syncDataSource } from "@/lib/api";
import { AdminDashboardOverview } from "@/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataSourceOverviewSection } from "@/components/admin/DataSourceOverviewSection";
import { StudentLifecycleOverviewSection } from "@/components/admin/StudentLifecycleOverviewSection";
import { RecentSyncTableSection } from "@/components/admin/RecentSyncTableSection";
import { LibraryUsageAnalyticsSection } from "@/components/admin/LibraryUsageAnalyticsSection";
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
              "Synchronized latest metrics across Library LMS, central master records, and data pipeline.",
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

    if (target.isPlanned) {
      showToast({
        title: `${target.name} is a Planned Integration`,
        description: "API connector architecture is prepared for upcoming deployment phases.",
        type: "info",
      });
      return;
    }

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
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Library LMS Connected
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-500">
              1st Working Integration Active
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Good morning, Administrator
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Unified University Data Integration System · Institutional Data Fabric &amp; Academic Analytics
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
          {/* Key Integration Metrics (Library Priority Integration) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Library Integration KPIs (First Working Source)
              </h3>
              <Link
                href="/admin/library"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                View Library Hub →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard
                label="Total Integrated Books"
                value={formatNumber(overview.summary.totalIntegratedBooks || 14850)}
                supportingText={overview.summary.totalIntegratedBooksSubtext || "Catalog titles & holdings"}
                trendDirection="up"
                trendTone="positive"
                icon={BookOpen}
                iconTone="indigo"
              />
              <StatCard
                label="Student Borrowers"
                value={formatNumber(overview.summary.totalStudentBorrowers || 3420)}
                supportingText={overview.summary.totalStudentBorrowersSubtext || "Registered student patrons"}
                trendDirection="up"
                trendTone="positive"
                icon={UserCheck}
                iconTone="emerald"
              />
              <StatCard
                label="Borrowing Transactions"
                value={formatNumber(overview.summary.totalBorrowingTransactions || 8920)}
                supportingText={overview.summary.totalBorrowingTransactionsSubtext || "Cumulative loans logged"}
                icon={BookMarked}
                iconTone="sky"
              />
              <StatCard
                label="Available vs Borrowed"
                value={`${formatNumber(overview.summary.availableBooks || 11250)} / ${formatNumber(overview.summary.borrowedBooks || 3600)}`}
                supportingText="75.8% shelf availability"
                icon={BookmarkCheck}
                iconTone="violet"
              />
              <StatCard
                label="Overdue Transactions"
                value={formatNumber(overview.summary.overdueTransactions || 64)}
                supportingText={overview.summary.overdueTransactionsSubtext || "Pending clearance"}
                trendDirection="neutral"
                trendTone="warning"
                icon={AlertCircle}
                iconTone="amber"
              />
              <StatCard
                label="Connection Status"
                value={overview.summary.connectedDataSources}
                supportingText={overview.summary.connectedDataSourcesSubtext}
                icon={Database}
                iconTone="emerald"
              />
            </div>
          </div>

          {/* Secondary Campus Records Strip */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  Central University Master Records
                </p>
                <p className="text-[11px] text-slate-500">
                  Institutional population matched with campus data fabric
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-xs">
                <div>
                  <span className="text-slate-400">Total Students: </span>
                  <span className="font-semibold text-slate-800">{formatNumber(overview.summary.totalStudents)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Active Enrolled: </span>
                  <span className="font-semibold text-emerald-600">{formatNumber(overview.summary.activeStudents)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Graduating Candidates: </span>
                  <span className="font-semibold text-sky-600">{formatNumber(overview.summary.graduatingStudents)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Library Patrons: </span>
                  <span className="font-semibold text-violet-600">{formatNumber(overview.summary.totalStudentBorrowers ?? 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Source Overview (Library Management System) */}
          <DataSourceOverviewSection
            sources={overview.dataSources}
            onTriggerSync={handleSyncSource}
          />

          {/* Library Usage Analytics Section (Monthly Trends, Program Borrows, Categories) */}
          <LibraryUsageAnalyticsSection />

          {/* Recent Synchronization Activity (Library ETL Ingestion) */}
          <RecentSyncTableSection
            rows={overview.recentSynchronization}
          />

          {/* Student Lifecycle Overview */}
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
                className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 sm:self-auto"
              >
                <span>View Full Academic Analytics</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
        </>
      )}
    </div>
  );
}

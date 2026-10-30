"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Award,
  Briefcase,
  GraduationCap,
  UserCheck,
  Users,
} from "lucide-react";
import { getDashboardData } from "@/lib/api";
import { ActivityFeedItem, DashboardAnalytics } from "@/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { EnrollmentChart } from "@/components/dashboard/EnrollmentChart";
import { ProgramEnrollmentChart } from "@/components/dashboard/ProgramEnrollmentChart";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { RiskDistributionChart } from "@/components/dashboard/RiskDistributionChart";
import { GraduationChart } from "@/components/dashboard/GraduationChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  DemoViewState,
  ViewStateControl,
} from "@/components/ui/ViewStateControl";
import { useToast } from "@/components/ui/ToastProvider";
import { formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityFeedItem[]>([]);
  const [viewState, setViewState] = useState<DemoViewState>("loading");
  const { showToast } = useToast();

  const loadData = useCallback(async (notify = false) => {
    setViewState("loading");
    try {
      const res = await getDashboardData();
      setAnalytics(res.analytics);
      setRecentActivity(res.recentActivity);
      setViewState("ready");
      if (notify) {
        showToast({
          title: "Dashboard updated",
          description: "Synchronized latest campus metrics across all 5 systems.",
          type: "success",
        });
      }
    } catch {
      setViewState("error");
    }
  }, [showToast]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Good morning, Administrator
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Here&apos;s an overview of your university data integration system.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ViewStateControl
            current={viewState}
            onChange={setViewState}
            onRefresh={() => loadData(true)}
          />
        </div>
      </div>

      {viewState === "error" && (
        <ErrorState
          title="We couldn't load today's university overview."
          description="Please try again in a moment while we reconnect to the campus data hub."
          onRetry={() => loadData(true)}
        />
      )}

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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      )}

      {viewState === "ready" && analytics && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Total Students"
              value={formatNumber(analytics.summary.totalStudents)}
              supportingText={analytics.summary.totalStudentsTrend}
              trendDirection="up"
              trendTone="positive"
              icon={Users}
              iconTone="indigo"
            />
            <StatCard
              label="Active Students"
              value={formatNumber(analytics.summary.activeStudents)}
              supportingText={analytics.summary.activeStudentsSubtext}
              trendDirection="up"
              trendTone="positive"
              icon={UserCheck}
              iconTone="emerald"
            />
            <StatCard
              label="At-Risk Students"
              value={formatNumber(analytics.summary.atRiskStudents)}
              supportingText={analytics.summary.atRiskTrend}
              trendDirection="down"
              trendTone="positive"
              icon={AlertTriangle}
              iconTone="amber"
            />
            <StatCard
              label="Faculty / Staff"
              value={formatNumber(analytics.summary.facultyStaff)}
              supportingText={analytics.summary.facultySubtext}
              icon={Briefcase}
              iconTone="sky"
            />
            <StatCard
              label="Graduates"
              value={formatNumber(analytics.summary.graduates)}
              supportingText={analytics.summary.graduatesSubtext}
              trendDirection="up"
              trendTone="positive"
              icon={GraduationCap}
              iconTone="violet"
            />
            <StatCard
              label="Alumni"
              value={formatNumber(analytics.summary.alumni)}
              supportingText={analytics.summary.alumniSubtext}
              icon={Award}
              iconTone="indigo"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <EnrollmentChart data={analytics.enrollmentTrends} />
            <ProgramEnrollmentChart data={analytics.enrollmentByProgram} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PerformanceChart data={analytics.performanceTrends} />
            <AttendanceChart data={analytics.attendanceTrends} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <RiskDistributionChart data={analytics.riskDistribution} />
            </div>
            <div className="lg:col-span-4">
              <GraduationChart data={analytics.graduationTrends} />
            </div>
            <div className="lg:col-span-4">
              <RecentActivity items={recentActivity} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

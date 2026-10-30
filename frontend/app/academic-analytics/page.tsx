"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CalendarCheck,
  CheckCircle2,
  UserMinus,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAcademicAnalyticsData } from "@/services/api";
import { DashboardAnalytics, Program, Student } from "@/types/university";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { AnalyticsChart } from "@/components/analytics/AnalyticsChart";
import { Badge } from "@/components/ui/Badge";
import { getRiskVariant } from "@/components/students/StudentTable";
import { CardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  DemoViewState,
  ViewStateControl,
} from "@/components/ui/ViewStateControl";
import { formatNumber } from "@/lib/utils";

export default function AcademicAnalyticsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<Student[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [viewState, setViewState] = useState<DemoViewState>("loading");

  const loadAnalytics = useCallback(async () => {
    setViewState("loading");
    try {
      const res = await getAcademicAnalyticsData();
      setPrograms(res.programs);
      setAtRiskStudents(res.atRiskStudents);
      setAnalytics(res.analytics);
      setViewState("ready");
    } catch {
      setViewState("error");
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const filteredPrograms =
    selectedDept === "All"
      ? programs
      : programs.filter((p) => p.code === selectedDept);

  return (
    <div className="space-y-6">
      {/* Header & Program Filter */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Academic &amp; Retention Analytics
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Unified academic performance, classroom attendance, risk advising, and program metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            aria-label="Filter analytics by program"
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none"
          >
            <option value="All">All Degree Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.code}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <ViewStateControl
            current={viewState}
            onChange={setViewState}
            onRefresh={loadAnalytics}
          />
        </div>
      </div>

      {viewState === "error" && (
        <ErrorState
          title="We couldn't load academic analytics."
          description="Please try again in a moment."
          onRetry={loadAnalytics}
        />
      )}

      {viewState === "loading" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, idx) => (
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

      {viewState === "ready" && analytics && (
        <>
          {/* Section 1 & 2: Student Performance + Attendance KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <AnalyticsCard
              title="Average GPA"
              value="3.31 / 4.00"
              subtitle="+0.06 vs previous semester"
              icon={Award}
              tone="indigo"
            />
            <AnalyticsCard
              title="Passing Rate"
              value="94.2%"
              subtitle="4,540 of 4,820 active learners"
              icon={CheckCircle2}
              tone="emerald"
            />
            <AnalyticsCard
              title="Failing Rate"
              value="5.8%"
              subtitle="Targeted for midterm tutoring"
              icon={UserMinus}
              tone="rose"
            />
            <AnalyticsCard
              title="Average Attendance"
              value="92.4%"
              subtitle="Exceeds 90% campus benchmark"
              icon={CalendarCheck}
              tone="sky"
            />
            <AnalyticsCard
              title="Low-Attendance Students"
              value="68"
              subtitle="Below 80% attendance threshold"
              icon={AlertTriangle}
              tone="amber"
            />
          </div>

          {/* Section 4: Program Analytics Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AnalyticsChart
              title="Enrollment & Average GPA by Program"
              subtitle="Active student headcount alongside program GPA average"
              badgeText="SIS + LMS"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredPrograms}
                  margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                  />
                  <XAxis
                    dataKey="code"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[2.5, 4.0]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#F8FAFC" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const p = payload[0].payload as Program;
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg text-xs">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="mt-1 text-indigo-700 font-medium tabular-nums">
                            Enrolled: {formatNumber(p.enrolledCount)}
                          </p>
                          <p className="text-sky-700 font-medium tabular-nums">
                            Average GPA: {p.averageGpa.toFixed(2)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    yAxisId="left"
                    name="Enrolled Students"
                    dataKey="enrolledCount"
                    fill="#4F46E5"
                    radius={[6, 6, 0, 0]}
                    barSize={26}
                  />
                  <Bar
                    yAxisId="right"
                    name="Average GPA"
                    dataKey="averageGpa"
                    fill="#0EA5E9"
                    radius={[6, 6, 0, 0]}
                    barSize={26}
                  />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsChart>

            <AnalyticsChart
              title="Graduation Rate vs Withdrawal Rate"
              subtitle="Cohort completion and attrition rates across degree programs"
              badgeText="Outcomes"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredPrograms}
                  margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                  />
                  <XAxis
                    dataKey="code"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    cursor={{ fill: "#F8FAFC" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const p = payload[0].payload as Program;
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg text-xs">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="mt-1 text-emerald-700 font-medium tabular-nums">
                            Graduation Rate: {p.graduationRate}%
                          </p>
                          <p className="text-rose-600 font-medium tabular-nums">
                            Withdrawal Rate: {p.withdrawalRate}%
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    name="Graduation Rate (%)"
                    dataKey="graduationRate"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                    barSize={26}
                  />
                  <Bar
                    name="Withdrawal Rate (%)"
                    dataKey="withdrawalRate"
                    fill="#F43F5E"
                    radius={[6, 6, 0, 0]}
                    barSize={26}
                  />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsChart>
          </div>

          {/* Section 3: At-Risk Students Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  At-Risk Students Requiring Early Advising
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Identified by cross-referencing SIS midterm GPA, classroom attendance, and LMS engagement
                </p>
              </div>
              <Link
                href="/students"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
              >
                Full Student Directory
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Program</th>
                    <th className="px-6 py-3.5">Attendance</th>
                    <th className="px-6 py-3.5">GPA</th>
                    <th className="px-6 py-3.5">Risk</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {atRiskStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {student.name}
                        </p>
                        <p className="font-mono text-xs text-slate-400">
                          {student.id} · {student.yearLevel}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800">
                          {student.programCode}
                        </span>
                        <span className="ml-2 hidden text-xs text-slate-400 sm:inline">
                          {student.programName}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800 tabular-nums">
                        {student.attendanceRate}% Attendance
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 tabular-nums">
                        {student.gpa.toFixed(2)} GPA
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getRiskVariant(student.riskLevel)}>
                          {student.riskLevel} Risk
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/students/${student.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          View Profile
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Program Summary Breakdown Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                Program Analytics Summary
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Side-by-side comparison of enrollment, GPA, attendance, graduation, and withdrawal metrics
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3.5">Program</th>
                    <th className="px-6 py-3.5 text-right">Enrolled</th>
                    <th className="px-6 py-3.5 text-right">Average GPA</th>
                    <th className="px-6 py-3.5 text-right">Attendance</th>
                    <th className="px-6 py-3.5 text-right">Graduation Rate</th>
                    <th className="px-6 py-3.5 text-right">Withdrawal Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPrograms.map((prog) => (
                    <tr key={prog.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-3.5">
                        <span className="font-semibold text-slate-900">
                          {prog.name}
                        </span>
                        <span className="ml-2 text-xs text-slate-400">
                          ({prog.code})
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium text-slate-800 tabular-nums">
                        {formatNumber(prog.enrolledCount)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-indigo-700 tabular-nums">
                        {prog.averageGpa.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-right text-slate-700 tabular-nums">
                        {prog.attendanceRate}%
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium text-emerald-700 tabular-nums">
                        {prog.graduationRate}%
                      </td>
                      <td className="px-6 py-3.5 text-right text-slate-600 tabular-nums">
                        {prog.withdrawalRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


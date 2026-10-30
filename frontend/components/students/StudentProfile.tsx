"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  CalendarCheck,
  Check,
  CheckCircle2,
  CircleDot,
  Clock,
  GraduationCap,
  Laptop,
  Mail,
  MapPin,
  Milestone,
  Phone,
  RefreshCw,
  User,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Student } from "@/types/university";
import { Badge } from "@/components/ui/Badge";
import {
  getRiskVariant,
  getStudentStatusVariant,
} from "@/components/students/StudentTable";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";

type ProfileTab =
  | "overview"
  | "academic"
  | "attendance"
  | "lms"
  | "library"
  | "lifecycle";

export function StudentProfile({ student }: { student: Student }) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const { showToast } = useToast();

  const initials = student.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");

  const tabs: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: User },
    { id: "academic", label: "Academic Records", icon: GraduationCap },
    { id: "attendance", label: "Attendance", icon: CalendarCheck },
    { id: "lms", label: "LMS Activity", icon: Laptop },
    { id: "library", label: "Library", icon: BookMarked },
    { id: "lifecycle", label: "Student Lifecycle", icon: Milestone },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Students Directory
        </Link>
        <span className="text-xs text-slate-400">
          Last unified sync: {student.lastSyncedAt}
        </span>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4 sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-sm shadow-indigo-600/20">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  {student.name}
                </h2>
                <Badge
                  variant={getStudentStatusVariant(student.status)}
                  dot
                >
                  {student.status} Student
                </Badge>
                <Badge variant={getRiskVariant(student.riskLevel)}>
                  {student.riskLevel} Risk
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-mono font-medium text-slate-700">
                  Student ID: {student.id}
                </span>
                <span className="mx-2 text-slate-300">·</span>
                <span>
                  {student.programName} · {student.yearLevel}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {student.syncedSystems.map((sys) => (
                  <span
                    key={sys}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    {sys} Synced
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                showToast({
                  title: "Student profile refreshed",
                  description: `Pulled latest SIS, LMS, and Library records for ${student.name}.`,
                  type: "success",
                })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sync Record
            </button>
            <button
              type="button"
              onClick={() =>
                showToast({
                  title: "Academic summary prepared",
                  description: `Unified advising sheet for ${student.id} is ready for download.`,
                  type: "info",
                })
              }
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
            >
              Export Advising Summary
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex gap-1 overflow-x-auto border-t border-slate-100 pt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition",
                  active
                    ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/15"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Unified Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                Cumulative GPA (SIS)
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.gpa.toFixed(2)}{" "}
                <span className="text-sm font-normal text-slate-400">/ 4.00</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {student.performanceScore}% weighted average
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                Attendance Rate
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.attendance.overallPercentage}%
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {student.attendance.absencesCount} absences ·{" "}
                {student.attendance.lateCount} late logs
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                LMS Completion Rate
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.lmsActivity.overallCompletionRate}%
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {student.lmsActivity.weeklyLogins} logins/week avg
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                Library Standing
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.library.currentBorrowedCount}{" "}
                <span className="text-sm font-normal text-slate-500">
                  active loans
                </span>
              </p>
              <p className="mt-1 text-xs text-emerald-700 font-medium">
                Cleared · {student.library.totalBorrowedAllTime} total borrowed
              </p>
            </div>
          </div>

          {/* Student Information & Enrollment Details */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card lg:col-span-2">
              <h3 className="text-base font-semibold text-slate-900">
                Student &amp; Enrollment Information
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Official demographic and curriculum details synchronized from SIS
              </p>

              <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 text-sm">
                <div className="rounded-lg bg-slate-50/70 p-3.5">
                  <dt className="text-xs text-slate-500">Degree Program</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {student.programName} ({student.programCode})
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-50/70 p-3.5">
                  <dt className="text-xs text-slate-500">College / Department</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {student.department}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-50/70 p-3.5">
                  <dt className="text-xs text-slate-500">
                    Year Level &amp; Cohort
                  </dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {student.yearLevel} · Admitted {student.admissionYear}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-50/70 p-3.5">
                  <dt className="text-xs text-slate-500">Enrollment Status</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {student.status} ({student.academicRecords.currentSemester})
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-50/70 p-3.5">
                  <dt className="text-xs text-slate-500">Academic Adviser</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {student.adviser}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-50/70 p-3.5">
                  <dt className="text-xs text-slate-500">
                    Scholarship / Distinction
                  </dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {student.scholarship || "Regular Tuition Track"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
              <h3 className="text-base font-semibold text-slate-900">
                Contact &amp; Curriculum Progress
              </h3>
              <div className="mt-4 space-y-3.5 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{student.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>{student.contactNumber}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>{student.address}</span>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">
                    Curriculum Units Completed
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {student.academicRecords.totalUnitsEarned} /{" "}
                    {student.academicRecords.totalUnitsRequired} units
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (student.academicRecords.totalUnitsEarned /
                            student.academicRecords.totalUnitsRequired) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Expected Graduation: Class of {student.expectedGraduation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMIC RECORDS */}
      {activeTab === "academic" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Current Enrolled Subjects &amp; Grades
                </h3>
                <p className="text-xs text-slate-500">
                  {student.academicRecords.currentSemester}
                </p>
              </div>
              <Badge variant="brand">
                Cumulative GPA: {student.gpa.toFixed(2)}
              </Badge>
            </div>

            {student.academicRecords.subjects.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No active course load for the current term ({student.status}).
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3">Code</th>
                      <th className="px-6 py-3">Subject Title</th>
                      <th className="px-6 py-3">Units</th>
                      <th className="px-6 py-3">Midterm</th>
                      <th className="px-6 py-3">Current / Final</th>
                      <th className="px-6 py-3">GPA Eq.</th>
                      <th className="px-6 py-3">Instructor</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {student.academicRecords.subjects.map((sub) => (
                      <tr key={sub.code} className="hover:bg-slate-50/70">
                        <td className="px-6 py-3.5 font-mono text-xs font-semibold text-indigo-700">
                          {sub.code}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {sub.title}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 tabular-nums">
                          {sub.units}
                        </td>
                        <td className="px-6 py-3.5 text-slate-700 tabular-nums">
                          {sub.midtermGrade}%
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-900 tabular-nums">
                          {sub.finalGrade}%
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 tabular-nums">
                          {sub.gpaEquivalent.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {sub.instructor}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge
                            variant={
                              sub.status === "Passed"
                                ? "success"
                                : sub.status === "At Risk"
                                ? "danger"
                                : "info"
                            }
                          >
                            {sub.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Academic History */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
            <h3 className="text-base font-semibold text-slate-900">
              Academic History by Term
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Historical semester GPA and academic standing from Registrar SIS
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {student.academicRecords.history.map((term) => (
                <div
                  key={term.semester}
                  className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      {term.semester}
                    </span>
                    <Badge
                      variant={
                        term.standing.includes("Warning") ||
                        term.standing.includes("Probation")
                          ? "warning"
                          : "success"
                      }
                    >
                      {term.standing}
                    </Badge>
                  </div>
                  <p className="mt-2.5 text-xl font-semibold text-slate-900 tabular-nums">
                    {term.gpa.toFixed(2)} GPA
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {term.unitsCompleted} curriculum units credited
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                Overall Attendance Percentage
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.attendance.overallPercentage}%
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Minimum university threshold: 80%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                Recorded Absences
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.attendance.absencesCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {student.attendance.excusedAbsences} excused medical/official
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                Late Arrival Records
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.attendance.lateCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Logged across lecture &amp; lab sessions
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
            <h3 className="text-base font-semibold text-slate-900">
              Monthly Attendance Trend
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Classroom &amp; laboratory attendance rate by month
            </p>
            <div className="mt-5 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={student.attendance.monthlyTrend}
                  margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="studentAttGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 12 }}
                  />
                  <YAxis
                    domain={[60, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const row = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg text-xs">
                          <p className="font-semibold text-slate-900">{label}</p>
                          <p className="mt-1 text-indigo-700 font-medium">
                            Attendance: {row.rate}%
                          </p>
                          <p className="text-slate-500">
                            Present: {row.presentDays}d · Absent: {row.absentDays}d · Late:{" "}
                            {row.lateDays}d
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    fill="url(#studentAttGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LMS ACTIVITY */}
      {activeTab === "lms" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                Weekly Login / Activity Count
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.lmsActivity.weeklyLogins} sessions
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {student.lmsActivity.totalHoursThisMonth} active learning hrs this month
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                Assignments Submitted
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.lmsActivity.assignmentsSubmitted} /{" "}
                {student.lmsActivity.assignmentsTotal}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Synchronized from University LMS
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                Module Completion Rate
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.lmsActivity.overallCompletionRate}%
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Across all active digital courses
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Course Progress List */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
              <h3 className="text-base font-semibold text-slate-900">
                Course Learning Progress
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Per-subject LMS module progress and assignment completion
              </p>

              {student.lmsActivity.courses.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">
                  No active LMS course shells for this term.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {student.lmsActivity.courses.map((course) => (
                    <div
                      key={course.courseCode}
                      className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-semibold text-indigo-700">
                            {course.courseCode}
                          </span>
                          <p className="text-sm font-medium text-slate-900">
                            {course.courseTitle}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">
                          {course.completionRate}%
                        </span>
                      </div>
                      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${course.completionRate}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>
                          Assignments: {course.assignmentsCompleted}/
                          {course.assignmentsTotal}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.lastActive}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Engagement Chart */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
              <h3 className="text-base font-semibold text-slate-900">
                Weekly LMS Login Activity
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Portal logins and submitted coursework over the past 5 weeks
              </p>

              {student.lmsActivity.weeklyEngagement.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">
                  No recent weekly LMS engagement recorded.
                </p>
              ) : (
                <div className="mt-5 h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={student.lmsActivity.weeklyEngagement}
                      margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E2E8F0"
                      />
                      <XAxis
                        dataKey="week"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748B", fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748B", fontSize: 11 }}
                      />
                      <Tooltip
                        cursor={{ fill: "#F8FAFC" }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length) return null;
                          const row = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 shadow-lg text-xs">
                              <p className="font-semibold text-slate-900">{label}</p>
                              <p className="mt-1 text-indigo-700 font-medium">
                                Logins: {row.logins}
                              </p>
                              <p className="text-slate-500">
                                Submissions: {row.submissions}
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="logins"
                        fill="#4F46E5"
                        radius={[6, 6, 0, 0]}
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LIBRARY */}
      {activeTab === "library" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                Total Books Borrowed
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.library.totalBorrowedAllTime}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Cumulative campus library circulation
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                Returned Books
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.library.returnedBooksCount}
              </p>
              <p className="mt-1 text-xs text-emerald-700 font-medium">
                Zero overdue liabilities
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <span className="text-xs font-medium text-slate-500">
                Current Borrowed Books
              </span>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {student.library.currentBorrowedCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Max allowed concurrent loans: 5
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white shadow-card">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                Library Circulation Records
              </h3>
              <p className="text-xs text-slate-500">
                Current active loans and recent returned holdings synced from Library System
              </p>
            </div>

            {student.library.books.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-700">
                  No active or recent book loans
                </p>
                <p className="text-xs text-slate-500">
                  Library account is in good standing with zero active borrowings.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3">Book Title</th>
                      <th className="px-6 py-3">Author</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Borrowed Date</th>
                      <th className="px-6 py-3">Due / Returned</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {student.library.books.map((book) => (
                      <tr key={book.id} className="hover:bg-slate-50/70">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {book.title}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{book.author}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {book.category}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {book.borrowedDate}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {book.returnedDate
                            ? `Returned ${book.returnedDate}`
                            : `Due ${book.dueDate}`}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              book.status === "Returned"
                                ? "success"
                                : book.status === "Due Soon"
                                ? "warning"
                                : "info"
                            }
                          >
                            {book.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: STUDENT LIFECYCLE */}
      {activeTab === "lifecycle" && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Individual Student Lifecycle Progression
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Cross-system milestones from initial admission ({student.admissionYear}) through expected graduation ({student.expectedGraduation})
              </p>
            </div>
            <Badge variant="brand">
              {Math.min(
                100,
                Math.round(
                  (student.academicRecords.totalUnitsEarned /
                    student.academicRecords.totalUnitsRequired) *
                    100
                )
              )}
              % Degree Units Completed
            </Badge>
          </div>

          <div className="mt-6 space-y-4">
            {[
              {
                stage: "Admission",
                state: "completed",
                detail: `Admitted in ${student.admissionYear} under ${student.programName}. Credentials and entrance exam verified in SIS.`,
                system: "SIS Admissions",
              },
              {
                stage: "Enrollment",
                state: "completed",
                detail: `Registered as ${student.yearLevel} student (${student.academicRecords.currentSemester}) under adviser ${student.adviser}.`,
                system: "SIS + LMS + Library",
              },
              {
                stage: "Academic Progress",
                state: student.status === "Graduated" ? "completed" : "current",
                detail: `${student.academicRecords.totalUnitsEarned} of ${student.academicRecords.totalUnitsRequired} units earned · Cumulative GPA ${student.gpa.toFixed(2)} · Attendance ${student.attendanceRate}%.`,
                system: "SIS + LMS Analytics",
              },
              {
                stage: "Graduation",
                state: student.status === "Graduated" ? "completed" : "upcoming",
                detail:
                  student.status === "Graduated"
                    ? `Degree conferred in Class of ${student.expectedGraduation} with zero institutional liabilities.`
                    : `Scheduled for Class of ${student.expectedGraduation} upon completion of remaining ${
                        student.academicRecords.totalUnitsRequired -
                        student.academicRecords.totalUnitsEarned
                      } units and clearance.`,
                system: "Registrar & Library Clearance",
              },
              {
                stage: "Alumni",
                state: student.status === "Graduated" ? "current" : "upcoming",
                detail:
                  student.status === "Graduated"
                    ? "Profile active in Alumni CRM for career outcome tracking and industry networking."
                    : "Record will automatically transition to Alumni CRM upon commencement.",
                system: "Alumni CRM",
              },
            ].map((item, idx, arr) => (
              <div key={item.stage} className="relative flex items-start gap-4">
                {idx < arr.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-[17px] top-9 h-[calc(100%-16px)] w-0.5",
                      item.state === "completed" ? "bg-indigo-500" : "bg-slate-200"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2",
                    item.state === "completed" &&
                      "border-indigo-600 bg-indigo-600 text-white",
                    item.state === "current" &&
                      "border-indigo-600 bg-white text-indigo-600 ring-4 ring-indigo-100",
                    item.state === "upcoming" &&
                      "border-slate-300 bg-white text-slate-400"
                  )}
                >
                  {item.state === "completed" ? (
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  ) : (
                    <CircleDot className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {item.stage}
                    </span>
                    <span className="text-xs font-medium text-indigo-700">
                      {item.system}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  GraduationCap,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import {
  getStudentLifecycle,
  getStudentLifecycleData,
  getStudents,
} from "@/lib/api";
import {
  LifecycleStage,
  LifecycleStageDetail,
  Student,
  StudentLifecycle,
} from "@/types";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/ToastProvider";
import { cn, formatNumber } from "@/lib/utils";

interface OverviewStat {
  label: string;
  value: number;
  change: string;
  description: string;
}

const STAGE_LABELS: Record<string, string> = {
  ADMISSIONS: "Admissions",
  ENROLLMENT: "Enrollment",
  LMS_ENGAGEMENT: "LMS Engagement",
  LIBRARY_ACTIVITY: "Library Activity",
  FINANCIAL_STANDING: "Financial Standing",
  ALUMNI: "Alumni",
};

const DETAIL_STATUS_STYLES: Record<
  LifecycleStageDetail["status"],
  string
> = {
  Completed:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  Active: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20",
  Upcoming:
    "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/15",
  Alumni:
    "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20",
};

const COHORT_STAGE_STYLES: Record<LifecycleStage["status"], string> = {
  completed:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  current: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20",
  upcoming:
    "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/15",
};

function formatStage(value: string): string {
  return STAGE_LABELS[value] ?? value.replace(/_/g, " ");
}

function formatDate(value: string | null): string {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function cohortStageLabel(status: LifecycleStage["status"]): string {
  if (status === "completed") return "Completed";
  if (status === "current") return "Active";
  return "Upcoming";
}

function LifecyclePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-3 h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="mt-4 h-10 w-full" />
      </div>
    </div>
  );
}

function AdminLifecycleContent() {
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get("studentId");

  const [overviewStats, setOverviewStats] = useState<OverviewStat[]>([]);
  const [cohortStages, setCohortStages] = useState<LifecycleStage[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [lifecycle, setLifecycle] = useState<StudentLifecycle | null>(null);
  const [cohortLoading, setCohortLoading] = useState<boolean>(true);
  const [studentsLoading, setStudentsLoading] = useState<boolean>(true);
  const [lifecycleLoading, setLifecycleLoading] = useState<boolean>(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);
  const [pickerQuery, setPickerQuery] = useState<string>("");
  const pickerRef = useRef<HTMLDivElement>(null);

  const loadCohort = useCallback(async () => {
    setCohortLoading(true);
    try {
      const data = await getStudentLifecycleData();
      setOverviewStats(data.overviewStats);
      setCohortStages(data.stages);
    } catch (error) {
      showToast({
        title: "Cohort overview unavailable",
        description:
          error instanceof Error
            ? error.message
            : "Unable to load aggregate lifecycle statistics.",
        type: "warning",
      });
    } finally {
      setCohortLoading(false);
    }
  }, [showToast]);

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    try {
      setStudents(await getStudents());
    } catch (error) {
      showToast({
        title: "Student list unavailable",
        description:
          error instanceof Error
            ? error.message
            : "Unable to load the student directory.",
        type: "warning",
      });
    } finally {
      setStudentsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadCohort();
    void loadStudents();
  }, [loadCohort, loadStudents]);

  // Resolve the picker selection from `?studentId=` and fall back to the
  // first student so the explorer is usable on first load.
  useEffect(() => {
    if (students.length === 0) return;

    setSelectedStudentId((previous) => {
      if (
        studentIdParam &&
        students.some((student) => student.id === studentIdParam)
      ) {
        return studentIdParam;
      }
      if (previous && students.some((student) => student.id === previous)) {
        return previous;
      }
      return students[0].id;
    });
  }, [students, studentIdParam]);

  useEffect(() => {
    if (!selectedStudentId) {
      setLifecycle(null);
      return;
    }

    let cancelled = false;
    setLifecycleLoading(true);
    setLifecycleError(null);

    (async () => {
      try {
        const data = await getStudentLifecycle(selectedStudentId);
        if (!cancelled) {
          setLifecycle(data);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to load the student lifecycle.";
          setLifecycle(null);
          setLifecycleError(message);
          showToast({
            title: "Student lifecycle unavailable",
            description: message,
            type: "warning",
          });
        }
      } finally {
        if (!cancelled) {
          setLifecycleLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedStudentId, refreshNonce, showToast]);

  useEffect(() => {
    if (!pickerOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [pickerOpen]);

  const filteredStudents = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) =>
      [
        student.name,
        student.id,
        student.programCode,
        student.programName,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [students, pickerQuery]);

  const selectedStudent =
    students.find((student) => student.id === selectedStudentId) ?? null;

  const orderedTimeline = useMemo(() => {
    if (!lifecycle) return [];
    return [...lifecycle.timeline].sort(
      (a, b) =>
        new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
    );
  }, [lifecycle]);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setPickerOpen(false);
    setPickerQuery("");
    router.replace(
      `/admin/lifecycle?studentId=${encodeURIComponent(studentId)}`,
      { scroll: false }
    );
  };

  const handleRefresh = () => {
    void loadCohort();
    void loadStudents();
    setRefreshNonce((previous) => previous + 1);
  };

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
              Unified Lifecycle Intelligence
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-500">
              Admissions to Alumni
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Student Lifecycle
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Track institution-wide cohort progression and inspect each student&apos;s
            milestones across the SIS, LMS, library, finance, and alumni systems.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={cohortLoading || studentsLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5 text-slate-500",
              (cohortLoading || studentsLoading) && "animate-spin"
            )}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Aggregate Cohort Overview */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Aggregate Cohort Overview
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Institution-wide progression metrics across the unified lifecycle
            </p>
          </div>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            All active cohorts
          </span>
        </div>

        {cohortLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : overviewStats.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Cohort overview unavailable"
            description="Aggregate lifecycle statistics could not be loaded. Try refreshing the page."
            actionLabel="Try again"
            onAction={() => void loadCohort()}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {overviewStats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      0{index + 1} · {stat.label}
                    </span>
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                      {stat.change}
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                    {formatNumber(stat.value)}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>

            {cohortStages.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {cohortStages.map((stage) => (
                  <div
                    key={stage.key}
                    className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {stage.title}
                      </span>
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${COHORT_STAGE_STYLES[stage.status]}`}
                      >
                        {cohortStageLabel(stage.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-xl font-bold tabular-nums text-slate-900">
                      {formatNumber(stage.metricCount)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {stage.metricLabel}
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-indigo-700">
                      {stage.conversionRate}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Per-Student Explorer */}
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Per-Student Lifecycle Explorer
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Select a student to inspect stage status, source metrics, and
                cross-system timeline events.
              </p>
            </div>

            <div ref={pickerRef} className="relative w-full sm:max-w-sm">
              <button
                type="button"
                onClick={() => setPickerOpen((previous) => !previous)}
                disabled={studentsLoading}
                className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-xs text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {selectedStudent
                    ? `${selectedStudent.name} · ${selectedStudent.id}`
                    : studentsLoading
                      ? "Loading students..."
                      : "Select a student"}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-slate-400 transition",
                    pickerOpen && "rotate-180"
                  )}
                />
              </button>

              {pickerOpen && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 p-2">
                    <input
                      autoFocus
                      type="search"
                      value={pickerQuery}
                      onChange={(event) => setPickerQuery(event.target.value)}
                      placeholder="Search name, student ID, or program..."
                      aria-label="Search students"
                      className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                  <ul className="max-h-64 overflow-y-auto py-1">
                    {filteredStudents.length === 0 ? (
                      <li className="px-3 py-6 text-center text-xs text-slate-500">
                        No students match your search.
                      </li>
                    ) : (
                      filteredStudents.map((student) => (
                        <li key={student.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectStudent(student.id)}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-slate-50",
                              student.id === selectedStudentId &&
                                "bg-indigo-50/70"
                            )}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold text-slate-900">
                                {student.name}
                              </span>
                              <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                                {student.id} · {student.programCode} ·{" "}
                                {student.yearLevel}
                              </span>
                            </span>
                            {student.id === selectedStudentId && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600" />
                            )}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {lifecycleLoading ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="mt-3 h-4 w-80" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-3 h-3 w-20" />
                  <Skeleton className="mt-3 h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-4/5" />
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <Skeleton className="h-5 w-40" />
              <div className="mt-5 space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-4 w-72" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : lifecycleError ? (
          <EmptyState
            icon={AlertCircle}
            title="Student lifecycle unavailable"
            description={lifecycleError}
            actionLabel="Try again"
            onAction={() => setRefreshNonce((previous) => previous + 1)}
          />
        ) : !lifecycle ? (
          <EmptyState
            icon={UserRound}
            title="Select a student"
            description="Choose a student from the picker to explore their unified lifecycle stages and timeline."
          />
        ) : (
          <>
            {/* Student Summary */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
                    <UserRound className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {lifecycle.studentName}
                      </h3>
                      <Badge variant="brand" dot>
                        {lifecycle.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {lifecycle.studentId} · {lifecycle.programName} (
                      {lifecycle.programCode}) · {lifecycle.yearLevel}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                    Current Stage
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-indigo-950">
                    {formatStage(lifecycle.currentStage)}
                  </p>
                </div>
              </div>
            </div>

            {/* Stage Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {lifecycle.stages.map((stage) => (
                <article
                  key={stage.key}
                  className={cn(
                    "rounded-xl border bg-white p-4 shadow-card",
                    stage.status === "Active"
                      ? "border-indigo-200 ring-1 ring-indigo-100"
                      : "border-slate-200/80"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900">
                      {stage.label}
                    </h4>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${DETAIL_STATUS_STYLES[stage.status]}`}
                    >
                      {stage.status}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="h-3 w-3 shrink-0" />
                    {formatDate(stage.date)}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                    {stage.summary}
                  </p>
                  {stage.metrics.length > 0 && (
                    <dl className="mt-3 space-y-1 border-t border-slate-100 pt-2">
                      {stage.metrics.map((metric) => (
                        <div
                          key={metric.label}
                          className="flex items-center justify-between gap-2 text-[10px]"
                        >
                          <dt className="text-slate-400">{metric.label}</dt>
                          <dd className="font-semibold tabular-nums text-slate-700">
                            {metric.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </article>
              ))}
            </div>

            {/* Vertical Timeline */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Lifecycle Timeline
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Cross-system milestones recorded for this student
                  </p>
                </div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {lifecycle.timeline.length} event
                  {lifecycle.timeline.length === 1 ? "" : "s"}
                </span>
              </div>

              {orderedTimeline.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  No lifecycle events have been recorded for this student yet.
                </p>
              ) : (
                <ol className="relative mt-5 space-y-5 border-l border-slate-200 pl-6">
                  {orderedTimeline.map((event) => (
                    <li key={event.id} className="relative">
                      <span className="absolute -left-[31px] top-1.5 flex h-2.5 w-2.5 rounded-full border-2 border-white bg-indigo-500 ring-2 ring-indigo-100" />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                          {formatStage(event.stage)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          <Database className="h-3 w-3 text-indigo-500" />
                          {event.sourceSystem}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(event.occurredAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-slate-900">
                        {event.title}
                      </p>
                      {event.description && (
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                          {event.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default function AdminLifecyclePage() {
  return (
    <Suspense fallback={<LifecyclePageSkeleton />}>
      <AdminLifecycleContent />
    </Suspense>
  );
}

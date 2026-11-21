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
  ArrowRight,
  BookLock,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Filter,
  IdCard,
  Inbox,
  Library,
  PhilippinePeso,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getStudentLifecycle,
  getStudentLifecycleData,
  getStudents,
  getStudentsPaged,
} from "@/lib/api";
import {
  LifecycleStage,
  LifecycleStageDetail,
  Student,
  StudentLifecycle,
  StudentListPage,
} from "@/types";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/ToastProvider";
import { cn, formatNumber } from "@/lib/utils";
import { PROGRAMS } from "@/data/mock-data";

interface OverviewStat {
  label: string;
  value: number;
  change: string;
  description: string;
}

const YEAR_LEVEL_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
];

const ROSTER_PAGE_SIZES = [10, 25, 50] as const;

const STUDENT_STATUS_BADGES: Record<Student["status"], BadgeVariant> = {
  Active: "success",
  Graduated: "brand",
  "On Leave": "warning",
  Withdrawn: "danger",
};

const RISK_LEVEL_BADGES: Record<Student["riskLevel"], BadgeVariant> = {
  Low: "success",
  Medium: "warning",
  High: "danger",
};

const STAGE_LABELS: Record<string, string> = {
  MEMBERSHIP: "Library Membership",
  REQUESTS: "Borrowing Requests",
  BORROWING: "Borrowing Activity",
  FINES: "Fines & Payments",
  STANDING: "Current Standing",
};

const STAGE_ICONS: Record<string, LucideIcon> = {
  MEMBERSHIP: IdCard,
  REQUESTS: Inbox,
  BORROWING: BookOpen,
  FINES: Receipt,
  STANDING: ShieldCheck,
};

const FALLBACK_STAGE_ICON = Library;

/** Per-student stage card icon; unknown keys fall back to a neutral icon. */
function stageIcon(stageKey: string): LucideIcon {
  return STAGE_ICONS[stageKey] ?? FALLBACK_STAGE_ICON;
}

/** Aggregate cohort card icon; unknown keys fall back to a neutral icon. */
function cohortStageIcon(cohortKey: string): LucideIcon {
  return COHORT_STAGE_ICONS[cohortKey] ?? FALLBACK_STAGE_ICON;
}

const COHORT_STAGE_ICONS: Record<string, LucideIcon> = {
  NO_ACTIVITY: IdCard,
  REQUESTS_PENDING: Inbox,
  ACTIVE_BORROWERS: BookOpen,
  OUTSTANDING_FINES: Receipt,
  RESTRICTED: BookLock,
};

/**
 * Cohort chips keyed by cohort key. Unknown keys fall back to the generic
 * status label so defensively-rendered cohorts stay legible.
 */
const COHORT_ACCENTS: Record<string, { label: string; className: string }> = {
  NO_ACTIVITY: {
    label: "Onboard",
    className: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/15",
  },
  REQUESTS_PENDING: {
    label: "In Queue",
    className: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20",
  },
  ACTIVE_BORROWERS: {
    label: "Active",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  },
  OUTSTANDING_FINES: {
    label: "Follow Up",
    className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  },
  RESTRICTED: {
    label: "Action Needed",
    className: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
  },
};

/** Overview stat card icons matched on label; unknown labels fall back to a neutral icon. */
const OVERVIEW_STAT_ICONS: Record<string, LucideIcon> = {
  "registered members": IdCard,
  "library members": IdCard,
  "active borrowers": BookOpen,
  "loans in circulation": BookOpen,
  "outstanding fines": PhilippinePeso,
  "overdue loans": Clock,
};

/** Keyword fallbacks keep stat icons sensible when the API renames a metric. */
const OVERVIEW_STAT_ICON_RULES: Array<{ pattern: RegExp; icon: LucideIcon }> = [
  { pattern: /overdue|late|past due/, icon: Clock },
  { pattern: /fine|fee|payment|balance|unsettled/, icon: PhilippinePeso },
  { pattern: /borrower|borrowing/, icon: BookOpen },
  { pattern: /loan|circulation|checkout|checked out/, icon: BookOpen },
  { pattern: /member|card|registered/, icon: IdCard },
];

function overviewStatIcon(label: string): LucideIcon {
  const normalized = label.trim().toLowerCase();
  const exact = OVERVIEW_STAT_ICONS[normalized];
  if (exact) return exact;
  const rule = OVERVIEW_STAT_ICON_RULES.find(({ pattern }) =>
    pattern.test(normalized)
  );
  return rule?.icon ?? Activity;
}

const DETAIL_STATUS_STYLES: Record<
  LifecycleStageDetail["status"],
  string
> = {
  Completed:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  Active: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20",
  Upcoming:
    "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/15",
};

const NEUTRAL_STATUS_STYLE =
  "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/15";

function detailStatusStyle(status: LifecycleStageDetail["status"]): string {
  return DETAIL_STATUS_STYLES[status] ?? NEUTRAL_STATUS_STYLE;
}

function cohortChip(stage: LifecycleStage): { label: string; className: string } {
  return (
    COHORT_ACCENTS[stage.key] ?? {
      label: tidyStageKey(stage.key),
      className: NEUTRAL_STATUS_STYLE,
    }
  );
}

function formatStage(value: string): string {
  return STAGE_LABELS[value] ?? tidyStageKey(value);
}

/** Library events show a friendly source label; unexpected sources are tidied. */
function formatSourceSystem(value: string): string {
  if (!value) return "Library";
  if (value.trim().toUpperCase() === "LIBRARY") return "Library";
  return tidyStageKey(value);
}

/** Title-cases raw stage keys the same way the audit log tidies raw codes. */
function tidyStageKey(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
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

function RosterTableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-3.5 w-20" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-7 items-center gap-4 px-5 py-4"
          >
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-md" />
            <Skeleton className="ml-auto h-8 w-28 rounded-lg" />
          </div>
        ))}
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
  const lifecycleSectionRef = useRef<HTMLElement>(null);

  // Roster filters, pagination, and server-backed page state.
  const [roster, setRoster] = useState<StudentListPage | null>(null);
  const [rosterLoading, setRosterLoading] = useState<boolean>(true);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [rosterSearchInput, setRosterSearchInput] = useState<string>("");
  const [rosterSearch, setRosterSearch] = useState<string>("");
  const [rosterYearLevel, setRosterYearLevel] = useState<string>("All");
  const [rosterProgram, setRosterProgram] = useState<string>("All");
  const [rosterPage, setRosterPage] = useState<number>(1);
  const [rosterPageSize, setRosterPageSize] = useState<number>(10);
  const [rosterRefreshNonce, setRosterRefreshNonce] = useState<number>(0);

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

  // Debounce the roster search so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setRosterSearch(rosterSearchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [rosterSearchInput]);

  // Every filter change restarts the roster at page 1.
  useEffect(() => {
    setRosterPage(1);
  }, [rosterSearch, rosterYearLevel, rosterProgram, rosterPageSize]);

  useEffect(() => {
    let cancelled = false;
    setRosterLoading(true);
    setRosterError(null);

    (async () => {
      try {
        const data = await getStudentsPaged(
          {
            search: rosterSearch || undefined,
            yearLevel: rosterYearLevel,
            program: rosterProgram,
          },
          rosterPage,
          rosterPageSize
        );
        if (!cancelled) {
          setRoster(data);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to load the student roster.";
          setRosterError(message);
          setRoster(null);
          showToast({
            title: "Student roster unavailable",
            description: message,
            type: "warning",
          });
        }
      } finally {
        if (!cancelled) {
          setRosterLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    rosterSearch,
    rosterYearLevel,
    rosterProgram,
    rosterPage,
    rosterPageSize,
    rosterRefreshNonce,
    showToast,
  ]);

  // Deep links (`?studentId=`) scroll straight to the selected lifecycle panel.
  useEffect(() => {
    if (!studentIdParam || selectedStudentId !== studentIdParam) return;
    lifecycleSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [studentIdParam, selectedStudentId]);

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

  const clearRosterFilters = () => {
    setRosterSearchInput("");
    setRosterSearch("");
    setRosterYearLevel("All");
    setRosterProgram("All");
    setRosterPage(1);
  };

  const hasRosterFilters =
    rosterSearchInput.trim().length > 0 ||
    rosterYearLevel !== "All" ||
    rosterProgram !== "All";

  const handleRefresh = () => {
    void loadCohort();
    void loadStudents();
    setRosterRefreshNonce((previous) => previous + 1);
    setRefreshNonce((previous) => previous + 1);
  };

  const rosterTotalPages = Math.max(1, roster?.totalPages ?? 1);
  const rosterRangeStart =
    roster && roster.total > 0 ? (roster.page - 1) * roster.pageSize + 1 : 0;
  const rosterRangeEnd = roster
    ? Math.min(roster.page * roster.pageSize, roster.total)
    : 0;

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
              <Library className="h-3.5 w-3.5 text-indigo-600" />
              Library Record
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-500">
              Membership to Standing
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Student Lifecycle
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Each student&apos;s complete library record — membership, borrowing
            requests, loans, fines, and standing. Browse the full roster and
            open any member&apos;s full history with the library.
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

      {/* Library Engagement Overview */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Library Engagement Overview
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Drawn live from the library circulation, requests, reservations,
              and fines records.
            </p>
          </div>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            All library members
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
            title="Library engagement overview unavailable"
            description="Library engagement statistics could not be loaded. Try refreshing the page."
            actionLabel="Try again"
            onAction={() => void loadCohort()}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {overviewStats.map((stat, index) => {
                const StatIcon = overviewStatIcon(stat.label);
                return (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <StatIcon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                        <span className="min-w-0 flex-1 break-words leading-snug">
                          0{index + 1} · {stat.label}
                        </span>
                      </span>
                      <span className="max-w-[46%] break-words rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium leading-snug text-indigo-700">
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
                );
              })}
            </div>

            {cohortStages.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {cohortStages.map((stage) => {
                  const CohortIcon = cohortStageIcon(stage.key);
                  const chip = cohortChip(stage);
                  return (
                    <div
                      key={stage.key}
                      className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <CohortIcon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                          <span className="min-w-0 flex-1 break-words leading-snug">
                            {stage.title || tidyStageKey(stage.key)}
                          </span>
                        </span>
                        <span
                          className={`max-w-[46%] break-words rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-snug ${chip.className}`}
                        >
                          {chip.label}
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
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* Student Roster */}
      <section className="space-y-4" aria-labelledby="student-roster-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3
              id="student-roster-heading"
              className="text-sm font-bold text-slate-900"
            >
              Student Roster
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Browse students across every year level and section, then open
              their complete library record.
            </p>
          </div>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {roster ? `${formatNumber(roster.total)} student${roster.total === 1 ? "" : "s"}` : "All levels"}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="search"
                value={rosterSearchInput}
                onChange={(event) => setRosterSearchInput(event.target.value)}
                placeholder="Search name, student ID, or email..."
                aria-label="Search student roster"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <select
                  value={rosterYearLevel}
                  onChange={(event) => setRosterYearLevel(event.target.value)}
                  aria-label="Filter by year level"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none sm:w-auto"
                >
                  <option value="All">All Year Levels</option>
                  {YEAR_LEVEL_OPTIONS.map((yearLevel) => (
                    <option key={yearLevel} value={yearLevel}>
                      {yearLevel}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={rosterProgram}
                onChange={(event) => setRosterProgram(event.target.value)}
                aria-label="Filter by section or program"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none sm:w-auto"
              >
                <option value="All">All Sections / Programs</option>
                {PROGRAMS.map((program) => (
                  <option key={program.code} value={program.code}>
                    {program.code} · {program.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {rosterLoading ? (
          <RosterTableSkeleton rows={Math.min(rosterPageSize, 10)} />
        ) : rosterError ? (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{rosterError}</p>
            <button
              type="button"
              onClick={() => setRosterRefreshNonce((previous) => previous + 1)}
              className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              Try again
            </button>
          </div>
        ) : !roster || roster.students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students match the current filters"
            description="Try a different year level, section, or search term to find the student you need."
            actionLabel={hasRosterFilters ? "Clear filters" : undefined}
            onAction={hasRosterFilters ? clearRosterFilters : undefined}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">
                      Student
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Student ID
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Section / Program
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Year Level
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Risk
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right">
                      Lifecycle
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.students.map((student) => (
                    <tr
                      key={student.id}
                      className={cn(
                        "transition hover:bg-slate-50/60",
                        student.id === selectedStudentId && "bg-indigo-50/40"
                      )}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {student.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {student.email}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-600">
                        {student.id}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800">
                          {student.programCode}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {student.programName}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {student.yearLevel}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={STUDENT_STATUS_BADGES[student.status]}
                          dot
                        >
                          {student.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={RISK_LEVEL_BADGES[student.riskLevel]}
                          dot
                        >
                          {student.riskLevel}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectStudent(student.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                          aria-label={`Open lifecycle for ${student.name}`}
                        >
                          Open Lifecycle
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                <span>
                  Showing {rosterRangeStart}–{rosterRangeEnd} of{" "}
                  {formatNumber(roster.total)}
                </span>
                <label className="inline-flex items-center gap-1.5">
                  <span>Rows per page</span>
                  <select
                    value={rosterPageSize}
                    onChange={(event) =>
                      setRosterPageSize(Number(event.target.value))
                    }
                    aria-label="Rows per page"
                    className="h-7 rounded-md border border-slate-200 bg-white px-1.5 text-[11px] font-medium text-slate-700 focus:border-indigo-400 focus:outline-none"
                  >
                    {ROSTER_PAGE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setRosterPage((previous) => Math.max(1, previous - 1))
                  }
                  disabled={rosterPage <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </button>
                <span className="text-[11px] font-medium text-slate-600">
                  Page {roster.page} of {rosterTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setRosterPage((previous) => previous + 1)}
                  disabled={rosterPage >= rosterTotalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Per-Student Explorer */}
      <section ref={lifecycleSectionRef} className="space-y-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Per-Student Library Record
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Inspect the student&apos;s complete library record — membership,
                requests, borrowing, fines, and standing.
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
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
            description="Choose a student from the picker to explore their library membership, borrowing activity, fines, and standing."
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {lifecycle.stages.map((stage) => {
                const StageIcon = stageIcon(stage.key);
                return (
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
                      <h4 className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-slate-900">
                        <StageIcon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                        <span className="min-w-0 break-words">
                          {stage.label || formatStage(stage.key)}
                        </span>
                      </h4>
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${detailStatusStyle(stage.status)}`}
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
                );
              })}
            </div>

            {/* Vertical Timeline */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Library Activity Timeline
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Library circulation milestones recorded for this student
                  </p>
                </div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {lifecycle.timeline.length} event
                  {lifecycle.timeline.length === 1 ? "" : "s"}
                </span>
              </div>

              {orderedTimeline.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  No library activity yet — borrowing, requests, and fine events
                  will appear here.
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
                          {formatSourceSystem(event.sourceSystem)}
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

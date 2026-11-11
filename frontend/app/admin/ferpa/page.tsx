"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  EyeOff,
  FileCheck2,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  getFerpaAccessLog,
  getFerpaConsents,
  getFerpaDirectorySettings,
  getFerpaOverview,
  getStudents,
  recordFerpaConsent,
  updateFerpaDirectorySetting,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  FerpaAccessEvent,
  FerpaConsent,
  FerpaConsentType,
  FerpaDirectorySetting,
  FerpaOverview,
  Student,
} from "@/types";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";

const CONSENT_TYPE_LABELS: Record<FerpaConsentType, string> = {
  RECORDS_RELEASE: "Records Release",
  DIRECTORY_INFO: "Directory Information",
  THIRD_PARTY: "Third Party Disclosure",
  RESEARCH_USE: "Research Use",
};

const CONSENT_TYPE_OPTIONS = (
  Object.keys(CONSENT_TYPE_LABELS) as FerpaConsentType[]
).map((value) => ({ value, label: CONSENT_TYPE_LABELS[value] }));

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

function formatDate(value: string | null): string {
  if (!value) return "No expiration";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function actionVariant(action: string): BadgeVariant {
  if (/DELETE|REVOKE|RESTRICT/i.test(action)) return "danger";
  if (/EXPORT|DOWNLOAD/i.test(action)) return "warning";
  if (/UPDATE|WRITE|EDIT/i.test(action)) return "brand";
  return "info";
}

function OverviewStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | null;
  hint: string;
  icon: typeof FileCheck2;
  tone: "emerald" | "rose" | "indigo" | "amber";
}) {
  const toneStyles = {
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    rose: "bg-rose-50 text-rose-600 ring-rose-100",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
  };

  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
            {value === null ? "—" : value.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            {hint}
          </p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${toneStyles[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

export default function AdminFerpaPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const isAdministrator = user?.role === "Administrator";

  const [overview, setOverview] = useState<FerpaOverview | null>(null);
  const [directorySettings, setDirectorySettings] = useState<
    FerpaDirectorySetting[]
  >([]);
  const [consents, setConsents] = useState<FerpaConsent[]>([]);
  const [accessEvents, setAccessEvents] = useState<FerpaAccessEvent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(
    null
  );

  const [consentModalOpen, setConsentModalOpen] = useState<boolean>(false);
  const [savingConsent, setSavingConsent] = useState<boolean>(false);
  const [consentStudentId, setConsentStudentId] = useState<string>("");
  const [consentType, setConsentType] =
    useState<FerpaConsentType>("RECORDS_RELEASE");
  const [consentGranted, setConsentGranted] = useState<boolean>(true);
  const [consentNote, setConsentNote] = useState<string>("");

  const loadData = useCallback(
    async (announceRefresh = false) => {
      setLoading(true);

      const results = await Promise.allSettled([
        getFerpaOverview(),
        getFerpaDirectorySettings(),
        getFerpaConsents(),
        getFerpaAccessLog(100),
        getStudents(),
      ]);

      const [
        overviewResult,
        directoryResult,
        consentResult,
        accessResult,
        studentsResult,
      ] = results;

      const failures: string[] = [];

      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value);
      } else {
        failures.push("overview statistics");
      }

      if (directoryResult.status === "fulfilled") {
        setDirectorySettings(directoryResult.value);
      } else {
        failures.push("directory settings");
      }

      if (consentResult.status === "fulfilled") {
        setConsents(consentResult.value);
      } else {
        failures.push("consent registry");
      }

      if (accessResult.status === "fulfilled") {
        setAccessEvents(accessResult.value);
      } else {
        failures.push("access log");
      }

      if (studentsResult.status === "fulfilled") {
        setStudents(studentsResult.value);
      } else {
        failures.push("student directory");
      }

      if (failures.length > 0) {
        showToast({
          title:
            failures.length === results.length
              ? "FERPA data unavailable"
              : "FERPA data partially unavailable",
          description: `Could not load ${failures.join(", ")}.`,
          type: "warning",
        });
      } else if (announceRefresh) {
        showToast({
          title: "FERPA records refreshed",
          description:
            "Consent, directory, and access-log records are up to date.",
          type: "success",
        });
      }

      setLoading(false);
    },
    [showToast]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleToggleDirectoryOptOut = async (
    setting: FerpaDirectorySetting
  ) => {
    if (!isAdministrator) return;

    setUpdatingStudentId(setting.studentId);
    try {
      const updated = await updateFerpaDirectorySetting(
        setting.studentId,
        !setting.directoryOptOut
      );
      setDirectorySettings((previous) =>
        previous.map((candidate) =>
          candidate.studentId === updated.studentId ? updated : candidate
        )
      );
      setOverview((previous) => {
        if (!previous) return previous;
        if (updated.directoryOptOut === setting.directoryOptOut) {
          return previous;
        }
        return {
          ...previous,
          directoryOptOuts: Math.max(
            0,
            previous.directoryOptOuts + (updated.directoryOptOut ? 1 : -1)
          ),
        };
      });
      showToast({
        title: updated.directoryOptOut
          ? "Directory opt-out enabled"
          : "Directory opt-out removed",
        description: `${updated.studentName} is now ${
          updated.directoryOptOut ? "excluded from" : "included in"
        } directory information.`,
        type: "success",
      });
    } catch (error) {
      showToast({
        title: "Directory setting update failed",
        description:
          error instanceof Error
            ? error.message
            : "The directory setting could not be updated.",
        type: "warning",
      });
    } finally {
      setUpdatingStudentId(null);
    }
  };

  const openConsentModal = () => {
    if (!isAdministrator) return;
    setConsentStudentId(students[0]?.id ?? "");
    setConsentType("RECORDS_RELEASE");
    setConsentGranted(true);
    setConsentNote("");
    setConsentModalOpen(true);
  };

  const handleRecordConsent = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!isAdministrator || !consentStudentId) return;

    setSavingConsent(true);
    try {
      const consent = await recordFerpaConsent({
        studentId: consentStudentId,
        consentType,
        granted: consentGranted,
        note: consentNote.trim() || undefined,
      });
      setConsents((previous) => [consent, ...previous]);
      setConsentModalOpen(false);
      showToast({
        title: consentGranted
          ? "Consent recorded"
          : "Consent revocation recorded",
        description: `${consent.studentName} · ${
          CONSENT_TYPE_LABELS[consent.consentType]
        }`,
        type: "success",
      });
      getFerpaOverview()
        .then((updatedOverview) => setOverview(updatedOverview))
        .catch(() => undefined);
    } catch (error) {
      showToast({
        title: "Consent record failed",
        description:
          error instanceof Error
            ? error.message
            : "The consent record could not be saved.",
        type: "warning",
      });
    } finally {
      setSavingConsent(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              FERPA Governance
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-500">
              Privacy &amp; Protected Records
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            FERPA Compliance
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage consent records, directory information opt-outs, and
            protected-record access activity across the university.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadData(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5 text-slate-500",
                loading && "animate-spin"
              )}
            />
            <span>Refresh</span>
          </button>
          {isAdministrator ? (
            <button
              type="button"
              onClick={openConsentModal}
              disabled={loading || students.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              <span>Record Consent</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
              Read-only access
            </span>
          )}
        </div>
      </div>

      {/* Privacy banner / Librarian notice */}
      {!isAdministrator ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="leading-relaxed">
            <span className="font-semibold">Read-only access.</span> Directory
            opt-out changes and consent records are restricted to
            Administrators. You can review the compliance data below.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-xs text-indigo-950">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
          <p className="leading-relaxed">
            <span className="font-semibold">FERPA protection in effect.</span>{" "}
            Consent and directory changes are recorded in the access audit
            trail. Review student records only when there is a legitimate
            educational need.
          </p>
        </div>
      )}

      {/* Overview Stats */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewStatCard
            label="Active Consents"
            value={overview?.activeConsents ?? null}
            hint="Granted consents currently on file"
            icon={FileCheck2}
            tone="emerald"
          />
          <OverviewStatCard
            label="Directory Opt-Outs"
            value={overview?.directoryOptOuts ?? null}
            hint="Students excluded from directory information"
            icon={EyeOff}
            tone="rose"
          />
          <OverviewStatCard
            label="Access Events (30d)"
            value={overview?.accessEventsLast30Days ?? null}
            hint="Protected-record views and exports"
            icon={Activity}
            tone="indigo"
          />
          <OverviewStatCard
            label="Restricted Students"
            value={overview?.restrictedStudents ?? null}
            hint="Records with an active access restriction"
            icon={ShieldAlert}
            tone="amber"
          />
        </div>
      )}

      {/* Directory Opt-Outs */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Directory Information Opt-Outs
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Toggle whether a student&apos;s directory information may be
            published. Administrator approval is required for changes.
          </p>
        </div>

        {loading ? (
          <TableSkeleton rows={5} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
                    <th className="px-5 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Student ID</th>
                    <th className="px-4 py-3 font-semibold">
                      Directory Status
                    </th>
                    <th className="px-4 py-3 font-semibold">Last Updated</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Opt-Out
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {directorySettings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No directory settings have been recorded yet.
                      </td>
                    </tr>
                  ) : (
                    directorySettings.map((setting) => (
                      <tr
                        key={setting.studentId}
                        className="transition hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                          {setting.studentName}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                          {setting.studentId}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant={
                              setting.directoryOptOut ? "danger" : "success"
                            }
                            dot
                          >
                            {setting.directoryOptOut ? "Opted out" : "Listed"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                          {formatDateTime(setting.updatedAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={setting.directoryOptOut}
                              aria-label={`Toggle directory opt-out for ${setting.studentName}`}
                              onClick={() =>
                                void handleToggleDirectoryOptOut(setting)
                              }
                              disabled={
                                !isAdministrator ||
                                updatingStudentId === setting.studentId
                              }
                              title={
                                !isAdministrator
                                  ? "Directory opt-outs can only be changed by an Administrator."
                                  : undefined
                              }
                              className={cn(
                                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                                setting.directoryOptOut
                                  ? "bg-rose-500"
                                  : "bg-slate-200"
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-block h-4 w-4 transform rounded-full bg-white shadow transition",
                                  setting.directoryOptOut
                                    ? "translate-x-4"
                                    : "translate-x-0.5"
                                )}
                              />
                            </button>
                            <span className="w-14 text-right text-[11px] font-medium text-slate-500">
                              {updatingStudentId === setting.studentId
                                ? "Saving..."
                                : setting.directoryOptOut
                                  ? "Opted out"
                                  : "Listed"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Consent Registry */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Consent Registry
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Recorded disclosure authorizations and revocations across all
              students.
            </p>
          </div>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {consents.length} record{consents.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <TableSkeleton rows={5} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
                    <th className="px-5 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Consent Type</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Effective</th>
                    <th className="px-4 py-3 font-semibold">Expires</th>
                    <th className="px-4 py-3 font-semibold">Recorded By</th>
                    <th className="px-5 py-3 font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {consents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No consent records have been created yet.
                      </td>
                    </tr>
                  ) : (
                    consents.map((consent) => (
                      <tr
                        key={consent.id}
                        className="transition hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">
                            {consent.studentName}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">
                            {consent.studentId}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">
                          {CONSENT_TYPE_LABELS[consent.consentType]}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant={
                              consent.status === "Granted"
                                ? "success"
                                : "danger"
                            }
                          >
                            {consent.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                          {formatDateTime(consent.effectiveAt)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                          {formatDate(consent.expiresAt)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {consent.recordedByName ?? "—"}
                        </td>
                        <td className="max-w-xs px-5 py-3.5 text-slate-500">
                          {consent.note ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Access Log */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Protected Record Access Log
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Recent views, exports, and updates against protected student
              records.
            </p>
          </div>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            Latest {accessEvents.length} event
            {accessEvents.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <TableSkeleton rows={6} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
                    <th className="px-5 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Viewer</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accessEvents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No access events have been recorded yet.
                      </td>
                    </tr>
                  ) : (
                    accessEvents.map((event) => (
                      <tr
                        key={event.id}
                        className="transition hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">
                          {formatDateTime(event.occurredAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900">
                            {event.studentName}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">
                            {event.studentId}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">
                          {event.viewerName}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {event.viewerRole}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={actionVariant(event.action)}>
                            {event.action.replace(/_/g, " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Record Consent Modal */}
      <Modal
        open={consentModalOpen}
        onClose={() => {
          if (!savingConsent) setConsentModalOpen(false);
        }}
        title="Record FERPA Consent"
        subtitle="Create a consent or revocation record for a student."
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleRecordConsent} className="space-y-4">
          <div>
            <label
              htmlFor="ferpa-consent-student"
              className="block text-xs font-semibold text-slate-700"
            >
              Student
            </label>
            <select
              id="ferpa-consent-student"
              required
              value={consentStudentId}
              onChange={(event) => setConsentStudentId(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
            >
              <option value="" disabled>
                Select a student
              </option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} · {student.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="ferpa-consent-type"
              className="block text-xs font-semibold text-slate-700"
            >
              Consent Type
            </label>
            <select
              id="ferpa-consent-type"
              value={consentType}
              onChange={(event) =>
                setConsentType(event.target.value as FerpaConsentType)
              }
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
            >
              {CONSENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="block text-xs font-semibold text-slate-700">
              Decision
            </legend>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition",
                  consentGranted
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-600"
                )}
              >
                <input
                  type="radio"
                  name="ferpa-consent-decision"
                  checked={consentGranted}
                  onChange={() => setConsentGranted(true)}
                  className="h-3.5 w-3.5 text-emerald-600 focus:ring-emerald-500"
                />
                Granted
              </label>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition",
                  !consentGranted
                    ? "border-rose-300 bg-rose-50 text-rose-800"
                    : "border-slate-200 bg-white text-slate-600"
                )}
              >
                <input
                  type="radio"
                  name="ferpa-consent-decision"
                  checked={!consentGranted}
                  onChange={() => setConsentGranted(false)}
                  className="h-3.5 w-3.5 text-rose-600 focus:ring-rose-500"
                />
                Revoked
              </label>
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="ferpa-consent-note"
              className="block text-xs font-semibold text-slate-700"
            >
              Note (optional)
            </label>
            <textarea
              id="ferpa-consent-note"
              rows={3}
              value={consentNote}
              onChange={(event) => setConsentNote(event.target.value)}
              placeholder="Reason for disclosure, requesting office, or related case reference..."
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setConsentModalOpen(false)}
              disabled={savingConsent}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingConsent || !consentStudentId}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingConsent ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              <span>{savingConsent ? "Saving..." : "Record Consent"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardList,
  Download,
  Search,
  Shield,
  ShieldAlert,
  UserX,
  XCircle,
} from "lucide-react";
import { getAuditLogs } from "@/lib/api";
import { AuditLogCategory, AuditLogRecord } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";

// -------------------------------------------------------------
// Constants
// -------------------------------------------------------------

const AUDIT_CATEGORIES: AuditLogCategory[] = [
  "Authentication",
  "Library",
  "FERPA & Privacy",
  "Data Integration",
  "Administration",
  "Members",
  "System",
];

/** Consistent tint per category; kept subtle so Outcome stays the loudest signal. */
const CATEGORY_BADGE_STYLES: Record<AuditLogCategory, string> = {
  Authentication: "bg-sky-50 text-sky-700 ring-sky-600/20",
  Library: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  "FERPA & Privacy": "bg-violet-50 text-violet-700 ring-violet-600/20",
  "Data Integration": "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  Administration: "bg-stone-100 text-stone-600 ring-stone-500/20",
  Members: "bg-teal-50 text-teal-700 ring-teal-600/20",
  System: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const ACRONYMS = new Set([
  "API",
  "CSV",
  "ETL",
  "FERPA",
  "GDPR",
  "ID",
  "IP",
  "ISBN",
  "LMS",
  "MFA",
]);

// -------------------------------------------------------------
// CSV helpers (export stays audit-grade: raw machine values preserved)
// -------------------------------------------------------------

function escapeCsvValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: string[][]): void {
  const csv = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getDateStamp(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// -------------------------------------------------------------
// Display helpers
// -------------------------------------------------------------

/** Human local timestamp ("Nov 17, 2026 · 15:37"); raw string is kept for the tooltip. */
function formatTimestamp(iso: string): { label: string; full: string } {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { label: iso, full: iso };
  }
  const datePart = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return { label: `${datePart} · ${timePart}`, full: date.toISOString() };
}

/** Tidies a raw action code (e.g. `auth.login_succeeded`) into readable text. */
function humanizeActionCode(code: string): string {
  const stem = code.includes(".") ? code.slice(code.lastIndexOf(".") + 1) : code;
  const words = stem.split(/[_\-\s]+/).filter(Boolean);
  if (words.length === 0) return code;
  return words
    .map((word) =>
      ACRONYMS.has(word.toUpperCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
}

/** Turns raw resource paths into readable text without the leading slash. */
function tidyResourcePath(path: string): string {
  if (!path.startsWith("/")) return path;
  const segments = path
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      if (/^\d/.test(segment)) return segment;
      return segment
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((word) =>
          ACRONYMS.has(word.toUpperCase())
            ? word.toUpperCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    });
  return segments.length > 0 ? segments.join(" › ") : path;
}

/**
 * Resolves the Event Details cell value: prefers the API-provided `detailsExtra`
 * and otherwise keeps `details` only when it says something beyond
 * Action + Target + HTTP status (older APIs duplicate those into details).
 */
function resolveDetails(log: AuditLogRecord): string | null {
  const extra = log.detailsExtra?.trim();
  if (extra) return extra;

  const raw = (log.details ?? "").trim();
  if (!raw) return null;

  let remainder = raw.toLowerCase();
  const actionToken = log.action?.toLowerCase().replace(/[._-]+/g, " ").trim();
  if (actionToken && actionToken.length >= 3) {
    remainder = remainder.split(actionToken).join(" ");
  }
  const resourceToken = log.resource?.toLowerCase().trim();
  if (resourceToken && resourceToken.length >= 3) {
    remainder = remainder.split(resourceToken).join(" ");
  }
  remainder = remainder
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/http\s*\d{3}/gi, " ")
    .replace(/[·•|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return remainder.length >= 3 ? raw : null;
}

/** "System" / "Unauthenticated" actors get a distinct muted treatment. */
function isMachineActor(actor: string): boolean {
  return /^(system|unauthenticated|anonymous|unknown)( service| daemon| user)?$/.test(
    actor.trim()
  );
}

function isUnauthenticatedActor(actor: string): boolean {
  return /^(unauthenticated|anonymous|unknown)$/.test(actor.trim());
}

// -------------------------------------------------------------
// Small presentational pieces
// -------------------------------------------------------------

function CategoryBadge({ category }: { category: string }) {
  const style =
    CATEGORY_BADGE_STYLES[category as AuditLogCategory] ??
    "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
        style
      )}
    >
      {category}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="mt-1 inline-flex w-fit items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
      {role}
    </span>
  );
}

function OutcomePill({ status }: { status: AuditLogRecord["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
        status === "Success"
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
          : status === "Warning"
          ? "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20"
          : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
      }`}
    >
      {status === "Success" ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : status === "Warning" ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      <span>{status}</span>
    </span>
  );
}

function AuditLogRow({ log }: { log: AuditLogRecord }) {
  const timestamp = formatTimestamp(log.timestamp);

  const machineActor = isMachineActor(log.actor);

  const actionLabel =
    log.actionLabel?.trim() || humanizeActionCode(log.action ?? "");
  const showActionCode = log.action !== actionLabel;
  const actionTone =
    log.status === "Failure"
      ? "text-rose-700"
      : log.status === "Warning"
      ? "text-amber-800"
      : "text-slate-900";

  const resourceLabel =
    log.resourceLabel?.trim() || tidyResourcePath(log.resource ?? "");

  const details = resolveDetails(log);

  return (
    <tr className="transition hover:bg-slate-50/60">
      {/* Timestamp — human local, full ISO on hover */}
      <td
        className="whitespace-nowrap px-4 py-3 text-slate-600"
        title={timestamp.full}
      >
        <span className="tabular-nums">{timestamp.label}</span>
      </td>

      {/* Actor & Role — one clean cell; system actors styled distinctly */}
      <td className="px-4 py-3">
        {machineActor ? (
          <p className="flex items-center gap-1.5 font-medium italic text-slate-500">
            {isUnauthenticatedActor(log.actor) ? (
              <UserX className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Bot className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{log.actor}</span>
          </p>
        ) : (
          <p className="font-semibold text-slate-900">{log.actor}</p>
        )}
        <RoleBadge role={log.actorRole} />
      </td>

      {/* Action / Event — human label first, raw code preserved as source value */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("font-semibold", actionTone)}>{actionLabel}</span>
          {log.category && <CategoryBadge category={log.category} />}
        </div>
        {showActionCode && (
          <p className="mt-0.5 break-all font-mono text-[10px] text-slate-400">
            {log.action}
          </p>
        )}
      </td>

      {/* Target Resource — friendly text, full raw path in tooltip */}
      <td
        className="max-w-[240px] break-words px-4 py-3 text-slate-700"
        title={resourceLabel !== log.resource ? log.resource : undefined}
      >
        {resourceLabel}
      </td>

      {/* IP Address */}
      <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-500">
        {log.ipAddress?.trim() ? log.ipAddress : "—"}
      </td>

      {/* Outcome */}
      <td className="px-3 py-3">
        <OutcomePill status={log.status} />
      </td>

      {/* Event Details — only substantive extras; never repeats Action/Target/HTTP 200 */}
      <td className="max-w-[280px] break-words px-4 py-3 text-slate-600">
        {details ? (
          details
        ) : (
          <span className="text-slate-300" aria-hidden="true">
            —
          </span>
        )}
      </td>
    </tr>
  );
}

// -------------------------------------------------------------
// Page
// -------------------------------------------------------------

export default function AdminAuditLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getAuditLogs();
        setLogs(data);
      } catch (loadError) {
        setLogs([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load audit logs."
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      // Search matches raw machine values AND human labels/categories.
      const haystack = [
        log.actor,
        log.actorRole,
        log.action,
        log.actionLabel,
        log.resource,
        log.resourceLabel,
        log.category,
        log.details,
        log.detailsExtra,
        log.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = query === "" || haystack.includes(query);
      const matchesOutcome =
        outcomeFilter === "All" || log.status === outcomeFilter;
      const matchesCategory =
        categoryFilter === "All" || (log.category ?? "") === categoryFilter;
      return matchesSearch && matchesOutcome && matchesCategory;
    });
  }, [logs, searchQuery, outcomeFilter, categoryFilter]);

  const failureCount = filteredLogs.filter((log) => log.status === "Failure").length;
  const warningCount = filteredLogs.filter((log) => log.status === "Warning").length;

  const handleExport = () => {
    // Raw codes and paths stay in the export for audit traceability;
    // the human labels ship as extra columns beside them.
    const rows = [
      [
        "Timestamp",
        "Actor",
        "Actor Role",
        "Category",
        "Action (Code)",
        "Action Label",
        "Target Resource (Path)",
        "Target Resource Label",
        "IP Address",
        "Outcome",
        "Event Details",
        "Details Extra",
      ],
      ...filteredLogs.map((log) => [
        log.timestamp,
        log.actor,
        log.actorRole,
        log.category ?? "",
        log.action,
        log.actionLabel ?? "",
        log.resource,
        log.resourceLabel ?? "",
        log.ipAddress,
        log.status,
        log.details,
        log.detailsExtra ?? "",
      ]),
    ];
    downloadCsv(`audit-logs-${getDateStamp()}.csv`, rows);
    showToast({
      title: "Audit Log Exported",
      description: `${filteredLogs.length} record${
        filteredLogs.length === 1 ? "" : "s"
      } downloaded as CSV.`,
      type: "success",
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setOutcomeFilter("All");
    setCategoryFilter("All");
  };

  const hasActiveFilters =
    searchQuery !== "" || outcomeFilter !== "All" || categoryFilter !== "All";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-400/20">
              <Shield className="h-3.5 w-3.5 text-indigo-600" />
              Library System Security
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-500">
              FERPA &amp; GDPR Informed Audit Trail
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Library System Audit Logs
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Review account access, catalog changes, and circulation activity recorded by the library system.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Privacy Governance Banner */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs text-indigo-950">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
          <div className="space-y-1">
            <p className="font-semibold text-indigo-950">
              Account Privacy &amp; Access Control
            </p>
            <p className="leading-relaxed text-indigo-800">
              Library account and circulation actions should be limited to authorized staff and handled with care.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-card sm:grid-cols-12">
        <div className="relative sm:col-span-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by actor, event, target, or details..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            aria-label="Filter by event outcome"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-indigo-300 focus:outline-none"
          >
            <option value="All">All Event Outcomes</option>
            <option value="Success">Success</option>
            <option value="Warning">Warning</option>
            <option value="Failure">Failure</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by event category"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-indigo-300 focus:outline-none"
          >
            <option value="All">All Categories</option>
            {AUDIT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Load Error */}
      {error && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 text-center shadow-card">
          <div className="flex flex-col items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Audit log unavailable
            </h3>
            <p className="text-xs text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : !error && filteredLogs.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={
            logs.length === 0
              ? "No audit events recorded yet"
              : "No matching audit events"
          }
          description={
            logs.length === 0
              ? "Security and circulation events will appear here as the library system records them."
              : "Try adjusting your search, outcome, or category filters."
          }
          actionLabel={hasActiveFilters ? "Reset Filters" : undefined}
          onAction={hasActiveFilters ? resetFilters : undefined}
        />
      ) : (
        !error && (
          <div className="space-y-3">
            {/* Result summary */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                Showing {filteredLogs.length} of {logs.length} event
                {logs.length === 1 ? "" : "s"}
              </span>
              {(failureCount > 0 || warningCount > 0) && (
                <div className="flex items-center gap-3 text-[11px] font-medium">
                  {warningCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      {warningCount} warning{warningCount === 1 ? "" : "s"}
                    </span>
                  )}
                  {failureCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-rose-600">
                      <XCircle className="h-3 w-3" />
                      {failureCount} failure{failureCount === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
                      <th className="w-[150px] px-4 py-3 font-semibold">
                        Timestamp
                      </th>
                      <th className="w-[180px] px-4 py-3 font-semibold">
                        Actor &amp; Role
                      </th>
                      <th className="min-w-[190px] px-4 py-3 font-semibold">
                        Action / Event
                      </th>
                      <th className="min-w-[170px] px-4 py-3 font-semibold">
                        Target Resource
                      </th>
                      <th className="min-w-[110px] px-4 py-3 font-semibold">
                        IP Address
                      </th>
                      <th className="w-[100px] px-3 py-3 font-semibold">
                        Outcome
                      </th>
                      <th className="min-w-[160px] px-4 py-3 font-semibold">
                        Event Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => (
                      <AuditLogRow key={log.id} log={log} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

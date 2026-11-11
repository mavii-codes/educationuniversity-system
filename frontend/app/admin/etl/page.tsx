"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  FileCheck2,
  FileSpreadsheet,
  Filter,
  Loader2,
  Play,
  RefreshCw,
  Terminal,
  UserRoundCheck,
  XCircle,
} from "lucide-react";
import { getLibraryETLLogs, runLibraryETL } from "@/lib/api";
import { LibraryETLLog } from "@/types";
import { useToast } from "@/components/ui/ToastProvider";

const LIBRARY_ETL_STAGES = [
  {
    title: "Extract Library Records",
    description: "Read catalog, borrower, circulation, reservation, and fine records.",
    icon: FileSpreadsheet,
  },
  {
    title: "Validate Incoming Data",
    description: "Check required catalog metadata, identifiers, and circulation dates.",
    icon: FileCheck2,
  },
  {
    title: "Check Duplicate Records",
    description: "Detect duplicate ISBNs without changing the source catalog.",
    icon: Filter,
  },
  {
    title: "Match Borrowers",
    description: "Resolve library borrower identifiers against student records.",
    icon: UserRoundCheck,
  },
  {
    title: "Update Student Lifecycle",
    description: "Persist library loans, reservations, and fines to student timelines.",
    icon: Database,
  },
  {
    title: "Record Run Results",
    description: "Show record counts, errors, and execution timing.",
    icon: Terminal,
  },
];

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminETLPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<LibraryETLLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<LibraryETLLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const results = await getLibraryETLLogs();
      setLogs(results);
      setSelectedLog((current) =>
        current ? results.find((log) => log.id === current.id) ?? results[0] ?? null : results[0] ?? null
      );
    } catch (error) {
      showToast({
        title: "Library ETL history unavailable",
        description:
          error instanceof Error ? error.message : "Could not load library ETL runs.",
        type: "warning",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const runPipeline = async () => {
    setRunning(true);
    try {
      const result = await runLibraryETL("Admin Console");
      setLogs((current) => [result, ...current.filter((log) => log.id !== result.id)]);
      setSelectedLog(result);
      showToast({
        title: "Library ETL completed",
        description: `Loaded ${result.recordsLoaded.toLocaleString()} lifecycle events from live Library records; detected ${result.duplicatesCleaned.toLocaleString()} duplicate ISBNs.`,
        type: "success",
      });
    } catch (error) {
      showToast({
        title: "Library ETL failed",
        description:
          error instanceof Error ? error.message : "The library ETL run could not complete.",
        type: "warning",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
              <Database className="h-3.5 w-3.5" />
              Library data source
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Library ETL Pipeline
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Extracts and validates the live Library catalog and circulation
              records in PostgreSQL, then persists loan, reservation, and fine
              events to student lifecycle timelines. Source records are never
              replaced by demo data.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadLogs()}
              disabled={loading || running}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void runPipeline()}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
            >
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
              {running ? "Running library sync..." : "Run Library ETL"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">Library ingestion workflow</h2>
          <p className="mt-1 text-xs text-slate-500">
            Live database extraction, validation, identity matching, and persistent lifecycle loading.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {LIBRARY_ETL_STAGES.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <article
                key={stage.title}
                className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {index + 1}. {stage.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    {stage.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Library ETL run history</h2>
            <p className="mt-1 text-xs text-slate-500">
              Ingestion results for the Library source only.
            </p>
          </div>
          <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
            {logs.length} run{logs.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 px-5 py-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading library ETL history...
          </div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Database className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-800">No library ETL runs yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Run the library pipeline to record its first result.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="divide-y divide-slate-100">
              {logs.map((log) => {
                const active = selectedLog?.id === log.id;
                return (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => setSelectedLog(log)}
                    className={`w-full px-5 py-4 text-left transition hover:bg-slate-50 ${
                      active ? "bg-indigo-50/60" : ""
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-slate-900">
                          {log.jobName}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                          <Clock3 className="h-3 w-3" />
                          {formatDateTime(log.startedAt)}
                        </span>
                      </span>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold ${
                          log.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : log.status === "Running"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {log.status === "Completed" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : log.status === "Running" ? (
                          <Clock3 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {log.status}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedLog && (
              <div className="border-t border-slate-100 bg-slate-50/60 p-5 lg:border-l lg:border-t-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Run details</h3>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {selectedLog.duration} · started {formatDateTime(selectedLog.startedAt)}
                    </p>
                  </div>
                  {selectedLog.errors.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {selectedLog.errors.length} issue{selectedLog.errors.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    ["Extracted", selectedLog.recordsExtracted],
                    ["Validated", selectedLog.recordsValidated],
                    ["Duplicates cleaned", selectedLog.duplicatesCleaned],
                    ["Borrowers matched", selectedLog.studentsMatched],
                    ["Loaded", selectedLog.recordsLoaded],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-lg border border-slate-200 bg-white p-3">
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        {label}
                      </dt>
                      <dd className="mt-1 text-sm font-bold tabular-nums text-slate-900">
                        {Number(value).toLocaleString()}
                      </dd>
                    </div>
                  ))}
                </dl>
                {selectedLog.errors.length > 0 && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    {selectedLog.errors.map((error, index) => (
                      <p key={`${error}-${index}`}>{error}</p>
                    ))}
                  </div>
                )}
                <div className="mt-4 max-h-64 space-y-1 overflow-y-auto rounded-lg bg-slate-950 p-3 font-mono text-[10px] leading-relaxed text-slate-200">
                  {selectedLog.executionLog.map((line, index) => (
                    <p key={`${line}-${index}`}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

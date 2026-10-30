"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CopyCheck,
  Database,
  RefreshCw,
} from "lucide-react";
import { getIntegrationsData } from "@/services/api";
import { IntegrationSummary, IntegrationSyncLog } from "@/types/university";
import { IntegrationPipeline } from "@/components/integration/IntegrationPipeline";
import { IntegrationTable } from "@/components/integration/IntegrationTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DemoViewState,
  ViewStateControl,
} from "@/components/ui/ViewStateControl";
import { useToast } from "@/components/ui/ToastProvider";
import { formatNumber } from "@/lib/utils";

export default function DataIntegrationPage() {
  const [summary, setSummary] = useState<IntegrationSummary | null>(null);
  const [logs, setLogs] = useState<IntegrationSyncLog[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [runningBatch, setRunningBatch] = useState(false);
  const [viewState, setViewState] = useState<DemoViewState>("loading");

  const { showToast } = useToast();

  const loadIntegration = useCallback(async () => {
    setViewState("loading");
    try {
      const data = await getIntegrationsData();
      setSummary(data.summary);
      setLogs(data.logs);
      setViewState("ready");
    } catch {
      setViewState("error");
    }
  }, []);

  useEffect(() => {
    loadIntegration();
  }, [loadIntegration]);

  const handleRunIntegration = async () => {
    setRunningBatch(true);
    await new Promise((r) => setTimeout(r, 950));
    const newEntry: IntegrationSyncLog = {
      id: `sync-${Date.now()}`,
      sourceCode: "ALL",
      sourceName: "SIS + LMS + Library",
      recordsProcessed: 15190,
      duplicatesDetected: 0,
      failedRecords: 0,
      duration: "11.4s",
      status: "Successful",
      dateLabel: "Today",
      timestamp: "Just now",
      notes: "Manual incremental unification batch completed with zero conflicts.",
    };
    setLogs((prev) => [newEntry, ...prev]);
    setSummary((prev) =>
      prev
        ? {
            ...prev,
            lastIntegration: "Just now",
            totalRecordsProcessed: prev.totalRecordsProcessed + 38,
            successfulRecords: prev.successfulRecords + 38,
          }
        : prev
    );
    setRunningBatch(false);
    showToast({
      title: "Unified integration run complete",
      description: "Incremental records merged cleanly into Unified Student Data.",
      type: "success",
    });
  };

  const filteredLogs =
    statusFilter === "All"
      ? logs
      : logs.filter((l) => l.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Data Integration &amp; Unification
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Monitor record consolidation, duplicate resolution, and synchronization history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ViewStateControl
            current={viewState}
            onChange={setViewState}
            onRefresh={loadIntegration}
          />
          <button
            type="button"
            disabled={runningBatch}
            onClick={handleRunIntegration}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${runningBatch ? "animate-spin" : ""}`}
            />
            {runningBatch ? "Running Pipeline..." : "Run Integration Batch"}
          </button>
        </div>
      </div>

      {viewState === "error" && (
        <ErrorState
          title="We couldn't load the data integration pipeline."
          description="Please try again in a moment."
          onRetry={loadIntegration}
        />
      )}

      {viewState === "loading" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <CardSkeleton key={idx} />
            ))}
          </div>
          <TableSkeleton rows={5} />
        </div>
      )}

      {viewState === "ready" && summary && (
        <>
          {/* Visual Pipeline Architecture */}
          <IntegrationPipeline />

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Total Records Processed"
              value={formatNumber(summary.totalRecordsProcessed)}
              supportingText="Across all 5 campus sources"
              icon={Database}
              iconTone="indigo"
            />
            <StatCard
              label="Successful Records"
              value={formatNumber(summary.successfulRecords)}
              supportingText="99.88% validation pass rate"
              trendDirection="up"
              trendTone="positive"
              icon={CheckCircle2}
              iconTone="emerald"
            />
            <StatCard
              label="Failed Records"
              value={formatNumber(summary.failedRecords)}
              supportingText="Isolated in retry queue"
              icon={AlertTriangle}
              iconTone="amber"
            />
            <StatCard
              label="Duplicate Records"
              value={formatNumber(summary.duplicateRecords)}
              supportingText="Flagged for identity merge"
              icon={CopyCheck}
              iconTone="sky"
            />
            <StatCard
              label="Last Integration"
              value="5m ago"
              supportingText={summary.lastIntegration}
              icon={Clock}
              iconTone="slate"
            />
            <StatCard
              label="Integration Status"
              value={summary.currentStatus}
              supportingText={`${summary.uptimePercentage}% pipeline uptime`}
              trendDirection="up"
              trendTone="positive"
              icon={Activity}
              iconTone="emerald"
            />
          </div>

          {/* Filter & Synchronization History */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white p-1">
              {["All", "Successful", "Warning", "Failed"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    statusFilter === st
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">
              Showing {filteredLogs.length} synchronization batches
            </span>
          </div>

          {filteredLogs.length === 0 ? (
            <EmptyState
              title={`No ${statusFilter.toLowerCase()} synchronization runs`}
              description="Try selecting a different status filter to view historical sync batches."
              actionLabel="Show All History"
              onAction={() => setStatusFilter("All")}
            />
          ) : (
            <IntegrationTable logs={filteredLogs} />
          )}
        </>
      )}
    </div>
  );
}


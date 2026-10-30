"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Server } from "lucide-react";
import { getDataSources, syncDataSource } from "@/services/api";
import { DataSource, DataSourceStatus } from "@/types/university";
import { DataSourceCard } from "@/components/integration/DataSourceCard";
import { SyncStatus } from "@/components/integration/SyncStatus";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import {
  DemoViewState,
  ViewStateControl,
} from "@/components/ui/ViewStateControl";
import { formatNumber } from "@/lib/utils";

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [viewState, setViewState] = useState<DemoViewState>("loading");
  const { showToast } = useToast();

  const loadSources = useCallback(async () => {
    setViewState("loading");
    try {
      const data = await getDataSources();
      setSources(data);
      setViewState("ready");
    } catch {
      setViewState("error");
    }
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const handleSync = async (id: string) => {
    const target = sources.find((s) => s.id === id);
    if (!target) return;

    const previousStatus = target.status;
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "Syncing" } : s))
    );

    try {
      const result = await syncDataSource(id);
      setSources((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: "Connected", lastSynced: result.lastSynced }
            : s
        )
      );
      showToast({
        title: `${target.name} synchronized`,
        description: `${formatNumber(target.recordCount)} records verified and up to date.`,
        type: "success",
      });
    } catch {
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: previousStatus } : s))
      );
      showToast({
        title: "Synchronization interrupted",
        description: `Could not reach ${target.name}. Please try again.`,
        type: "warning",
      });
    }
  };

  const handleSyncAll = async () => {
    showToast({
      title: "Campus-wide synchronization started",
      description: "Refreshing SIS, LMS, HR / Payroll, Library, and Alumni CRM...",
      type: "info",
    });
    setSources((prev) => prev.map((s) => ({ ...s, status: "Syncing" })));
    await new Promise((r) => setTimeout(r, 1100));
    setSources((prev) =>
      prev.map((s) => ({ ...s, status: "Connected", lastSynced: "Just now" }))
    );
    showToast({
      title: "All 5 university systems synchronized",
      description: "23,976 records verified across DataHub.",
      type: "success",
    });
  };

  const handleSimulateStatus = (id: string, nextStatus: DataSourceStatus) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: nextStatus } : s))
    );
    setSelectedSource((prev) =>
      prev && prev.id === id ? { ...prev, status: nextStatus } : prev
    );
    showToast({
      title: "Connection state updated",
      description: `Set source status to ${nextStatus} for UI preview.`,
      type: nextStatus === "Connected" ? "success" : "warning",
    });
  };

  const filteredSources =
    statusFilter === "All"
      ? sources
      : sources.filter((s) => s.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Connected University Systems
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage data connectors for SIS, LMS, HR / Payroll, Library, and Alumni CRM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ViewStateControl
            current={viewState}
            onChange={setViewState}
            onRefresh={loadSources}
          />
          <button
            type="button"
            onClick={handleSyncAll}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync All Systems
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      {viewState === "ready" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-card">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["All", "Connected", "Syncing", "Warning", "Disconnected"] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    statusFilter === st
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>
          <span className="text-xs text-slate-400">
            Showing {filteredSources.length} of {sources.length} campus connectors
          </span>
        </div>
      )}

      {viewState === "error" && (
        <ErrorState
          title="We couldn't load the connected data sources."
          description="Please try again in a moment."
          onRetry={loadSources}
        />
      )}

      {viewState === "loading" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <CardSkeleton key={idx} />
          ))}
        </div>
      )}

      {viewState === "ready" && filteredSources.length === 0 && (
        <EmptyState
          icon={Server}
          title={`No ${statusFilter.toLowerCase()} data sources`}
          description="All campus systems are currently operating under a different status."
          actionLabel="Show All Systems"
          onAction={() => setStatusFilter("All")}
        />
      )}

      {viewState === "ready" && filteredSources.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredSources.map((source) => (
            <DataSourceCard
              key={source.id}
              source={source}
              onSync={handleSync}
              onViewDetails={setSelectedSource}
            />
          ))}
        </div>
      )}

      {/* View Details Modal */}
      <Modal
        open={Boolean(selectedSource)}
        onClose={() => setSelectedSource(null)}
        title={selectedSource?.name || "System Details"}
        subtitle={selectedSource?.maintainerDept}
      >
        {selectedSource && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-4">
              <div>
                <span className="text-xs text-slate-500">Connection Status</span>
                <div className="mt-1">
                  <SyncStatus status={selectedSource.status} />
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Health Score</span>
                <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">
                  {selectedSource.healthScore}%
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Sync Schedule</span>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedSource.syncFrequency}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Synchronized Entities
              </h4>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {selectedSource.entitiesSynced.map((entity) => (
                  <span
                    key={entity}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {entity}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
              <span className="text-xs font-semibold text-slate-700">
                Future Express.js REST Endpoint
              </span>
              <p className="mt-1 font-mono text-xs text-indigo-700">
                GET {selectedSource.endpointPreview}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Ready for PostgreSQL integration adapter without UI changes.
              </p>
            </div>

            {/* Optional Status Preview Simulator */}
            <div className="border-t border-slate-100 pt-4">
              <span className="block text-xs font-medium text-slate-500">
                Test Connection Status Indicator:
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  ["Connected", "Syncing", "Warning", "Disconnected"] as DataSourceStatus[]
                ).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleSimulateStatus(selectedSource.id, st)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


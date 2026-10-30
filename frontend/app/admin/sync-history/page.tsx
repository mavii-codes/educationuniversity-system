"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Database,
  History,
  RefreshCw,
  Search,
} from "lucide-react";
import { getSyncHistory } from "@/lib/api";
import { SyncHistoryRecord } from "@/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { SyncStatus } from "@/components/integration/SyncStatus";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  DemoViewState,
  ViewStateControl,
} from "@/components/ui/ViewStateControl";
import { useToast } from "@/components/ui/ToastProvider";
import { formatNumber } from "@/lib/utils";

export default function AdminSyncHistoryPage() {
  const [records, setRecords] = useState<SyncHistoryRecord[]>([]);
  const [sourceFilter, setSourceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [runningSync, setRunningSync] = useState(false);
  const [viewState, setViewState] = useState<DemoViewState>("loading");

  const { showToast } = useToast();

  const loadHistory = useCallback(async () => {
    setViewState("loading");
    try {
      const data = await getSyncHistory();
      setRecords(data);
      setViewState("ready");
    } catch {
      setViewState("error");
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRunManualSync = async () => {
    setRunningSync(true);
    await new Promise((resolve) => setTimeout(resolve, 900));

    const newItem: SyncHistoryRecord = {
      id: `SH-${Math.floor(9050 + Math.random() * 400)}`,
      dataSource: "SIS",
      fullName: "Student Information System",
      syncMode: "Manual Full Sync",
      lastSync: "Just now",
      records: 12450,
      duration: "5.2s",
      status: "Connected",
      notes: "Manual administrator verification completed across all enrolled records.",
    };

    setRecords((prev) => [newItem, ...prev]);
    setRunningSync(false);
    showToast({
      title: "Synchronization batch logged",
      description: "SIS incremental reconciliation completed with 12,450 verified records.",
      type: "success",
    });
  };

  const filteredRecords = records.filter((item) => {
    const matchesSource =
      sourceFilter === "All" || item.dataSource === sourceFilter;
    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;
    const matchesSearch =
      !search.trim() ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.fullName.toLowerCase().includes(search.toLowerCase()) ||
      item.notes.toLowerCase().includes(search.toLowerCase());
    return matchesSource && matchesStatus && matchesSearch;
  });

  const totalSyncedRecords = records.reduce((acc, r) => acc + r.records, 0);
  const connectedRuns = records.filter((r) => r.status === "Connected").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Data Synchronization History
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Complete audit log of scheduled and manual synchronization batches across university systems.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ViewStateControl
            current={viewState}
            onChange={setViewState}
            onRefresh={loadHistory}
          />
          <button
            type="button"
            disabled={runningSync}
            onClick={handleRunManualSync}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-65"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${runningSync ? "animate-spin" : ""}`}
            />
            <span>{runningSync ? "Syncing..." : "Run Manual Sync"}</span>
          </button>
        </div>
      </div>

      {viewState === "error" && (
        <ErrorState
          title="Unable to load synchronization history"
          description="Please retry to fetch recent connector audit logs."
          onRetry={loadHistory}
        />
      )}

      {viewState === "loading" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <TableSkeleton rows={6} />
        </div>
      )}

      {viewState === "ready" && (
        <>
          {/* Summary Strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Logged Sync Runs"
              value={formatNumber(records.length)}
              supportingText="Past 24-hour audit window"
              icon={History}
              iconTone="indigo"
            />
            <StatCard
              label="Healthy Completions"
              value={`${connectedRuns} / ${records.length}`}
              supportingText="Verified schema integrity"
              icon={CheckCircle2}
              iconTone="emerald"
            />
            <StatCard
              label="Records Verified"
              value={formatNumber(totalSyncedRecords)}
              supportingText="Cumulative batch volume"
              icon={Database}
              iconTone="sky"
            />
            <StatCard
              label="Latest Sync"
              value={records[0]?.lastSync || "Today, 9:42 AM"}
              supportingText={`${records[0]?.dataSource || "SIS"} connector`}
              icon={Clock}
              iconTone="violet"
            />
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-card sm:grid-cols-12">
            <div className="relative sm:col-span-6">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search batch ID, data source, or notes..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                aria-label="Filter by data source"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-indigo-300 focus:outline-none"
              >
                <option value="All">All Data Sources</option>
                <option value="SIS">SIS</option>
                <option value="LMS">LMS</option>
                <option value="HR / Payroll">HR / Payroll</option>
                <option value="Library">Library</option>
                <option value="Alumni CRM">Alumni CRM</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by sync status"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-indigo-300 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Connected">Connected</option>
                <option value="Syncing">Syncing</option>
                <option value="Warning">Warning</option>
                <option value="Disconnected">Disconnected</option>
              </select>
            </div>
          </div>

          {/* Audit Table */}
          {filteredRecords.length === 0 ? (
            <EmptyState
              icon={History}
              title="No matching synchronization logs"
              description="Adjust your source or status filters to view historical sync batches."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearch("");
                setSourceFilter("All");
                setStatusFilter("All");
              }}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3.5">Batch ID</th>
                      <th className="px-5 py-3.5">Data Source</th>
                      <th className="px-5 py-3.5">Sync Type</th>
                      <th className="px-5 py-3.5">Last Sync</th>
                      <th className="px-5 py-3.5">Records</th>
                      <th className="px-5 py-3.5">Duration</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((row) => (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-medium text-slate-600">
                          {row.id}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {row.dataSource}
                          </p>
                          <p className="text-xs text-slate-500">
                            {row.fullName}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-600">
                          {row.syncMode}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {row.lastSync}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900 tabular-nums">
                          {formatNumber(row.records)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-500">
                          {row.duration}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <SyncStatus status={row.status} />
                        </td>
                        <td className="min-w-[240px] px-5 py-4 text-xs text-slate-600">
                          {row.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


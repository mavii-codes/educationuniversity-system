"use client";

import React from "react";
import { ArrowRight, Award, Database, RefreshCw } from "lucide-react";
import { AlumniCrmSourceInfo } from "@/types";
import { SyncStatus } from "@/components/integration/SyncStatus";
import { formatNumber } from "@/lib/utils";

interface AlumniSourceInfoCardProps {
  sourceInfo: AlumniCrmSourceInfo;
  onSync: () => void;
}

export function AlumniSourceInfoCard({
  sourceInfo,
  onSync,
}: AlumniSourceInfoCardProps) {
  const isSyncing = sourceInfo.connectionStatus === "Syncing";

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                External Data Source Integration
              </h3>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                <span>Alumni CRM</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span>{sourceInfo.integrationMethod}</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span>University Data Integration System</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Read-only alumni records synchronized from the university&apos;s external Alumni CRM repository.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isSyncing}
          onClick={onSync}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-indigo-600" : "text-slate-500"}`}
          />
          <span>{isSyncing ? "Syncing..." : "Sync Alumni CRM"}</span>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-slate-50/80 px-3.5 py-3">
          <span className="text-[11px] font-medium text-slate-500">
            Data Source
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <Award className="h-4 w-4 text-indigo-600" />
            <span>{sourceInfo.dataSource}</span>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50/80 px-3.5 py-3">
          <span className="text-[11px] font-medium text-slate-500">
            Connection Status
          </span>
          <div className="mt-1">
            <SyncStatus status={sourceInfo.connectionStatus} />
          </div>
        </div>

        <div className="rounded-lg bg-slate-50/80 px-3.5 py-3">
          <span className="text-[11px] font-medium text-slate-500">
            Last Synchronization
          </span>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {sourceInfo.lastSynchronization}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50/80 px-3.5 py-3">
          <span className="text-[11px] font-medium text-slate-500">
            Records Synchronized
          </span>
          <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">
            {formatNumber(sourceInfo.recordsSynchronized)}
          </p>
        </div>
      </div>
    </section>
  );
}


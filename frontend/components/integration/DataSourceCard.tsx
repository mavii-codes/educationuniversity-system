"use client";

import React from "react";
import {
  Award,
  BookMarked,
  Briefcase,
  Database,
  Eye,
  Laptop,
  RefreshCw,
} from "lucide-react";
import { DataSource } from "@/types/university";
import { SyncStatus } from "./SyncStatus";
import { cn, formatNumber } from "@/lib/utils";

interface DataSourceCardProps {
  source: DataSource;
  onSync: (id: string) => void;
  onViewDetails: (source: DataSource) => void;
}

export function DataSourceCard({
  source,
  onSync,
  onViewDetails,
}: DataSourceCardProps) {
  const isSyncing = source.status === "Syncing";

  const Icon =
    source.code === "SIS"
      ? Database
      : source.code === "LMS"
      ? Laptop
      : source.code === "HR"
      ? Briefcase
      : source.code === "LIBRARY"
      ? BookMarked
      : Award;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-150 hover:border-slate-300/80 hover:shadow-card-hover">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-600/15">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {source.name}
              </h3>
              <p className="text-xs text-slate-400">{source.maintainerDept}</p>
            </div>
          </div>
          <SyncStatus status={source.status} />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          {source.description}
        </p>

        {/* Metrics Row */}
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50/80 p-3.5">
          <div>
            <span className="block text-[11px] font-medium text-slate-400">
              Records Synced
            </span>
            <span className="mt-0.5 block text-base font-semibold text-slate-900 tabular-nums">
              {formatNumber(source.recordCount)}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-slate-400">
              Last Synchronized
            </span>
            <span className="mt-0.5 block text-sm font-medium text-slate-700">
              {isSyncing ? "Syncing records..." : source.lastSynced}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => onViewDetails(source)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <Eye className="h-3.5 w-3.5 text-slate-500" />
          View Details
        </button>
        <button
          type="button"
          disabled={isSyncing}
          onClick={() => onSync(source.id)}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium shadow-sm transition",
            isSyncing
              ? "cursor-not-allowed bg-indigo-100 text-indigo-700"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          )}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
          {isSyncing ? "Syncing..." : "Sync"}
        </button>
      </div>
    </div>
  );
}


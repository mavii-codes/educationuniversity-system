"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookMarked,
  Briefcase,
  CheckCircle2,
  Database,
  Laptop,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { AdminDataSourceOverviewItem, DataSourceStatus } from "@/types";
import { SyncStatus } from "@/components/integration/SyncStatus";
import { formatNumber } from "@/lib/utils";

interface DataSourceOverviewSectionProps {
  sources: AdminDataSourceOverviewItem[];
  onTriggerSync: (id: string) => void;
}

function getSourceIcon(code: string) {
  switch (code) {
    case "SIS":
      return Database;
    case "LMS":
      return Laptop;
    case "HR":
      return Briefcase;
    case "LIBRARY":
      return BookMarked;
    default:
      return Award;
  }
}

const STATUS_LEGEND: { label: DataSourceStatus; icon: React.ElementType; tone: string }[] = [
  { label: "Connected", icon: CheckCircle2, tone: "text-emerald-600" },
  { label: "Syncing", icon: RefreshCw, tone: "text-indigo-600" },
  { label: "Warning", icon: AlertTriangle, tone: "text-amber-600" },
  { label: "Disconnected", icon: XCircle, tone: "text-rose-600" },
];

export function DataSourceOverviewSection({
  sources,
  onTriggerSync,
}: DataSourceOverviewSectionProps) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-card">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Data Source Overview
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Live connection health across integrated university systems
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Accessible Status Key (Icons + Text) */}
          <div className="hidden items-center gap-3 rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600 xl:flex">
            {STATUS_LEGEND.map((item) => {
              const LegendIcon = item.icon;
              return (
                <span key={item.label} className="inline-flex items-center gap-1">
                  <LegendIcon className={`h-3.5 w-3.5 ${item.tone}`} />
                  <span>{item.label}</span>
                </span>
              );
            })}
          </div>

          <Link
            href="/admin/data-sources"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            <span>Manage Data Sources</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {sources.map((source) => {
          const Icon = getSourceIcon(source.code);
          const isSyncing = source.status === "Syncing";

          return (
            <div
              key={source.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:border-indigo-200 hover:bg-white hover:shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/80">
                    <Icon className="h-4 w-4" />
                  </div>
                  <SyncStatus status={source.status} />
                </div>

                <h4 className="mt-3.5 text-sm font-semibold text-slate-900">
                  {source.name}
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {source.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs">
                <div>
                  <p className="font-semibold text-slate-800 tabular-nums">
                    {formatNumber(source.records)} records
                  </p>
                  <p className="text-[11px] text-slate-400">{source.lastSync}</p>
                </div>
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={() => onTriggerSync(source.id)}
                  title={`Sync ${source.name}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`}
                  />
                  <span>Sync</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


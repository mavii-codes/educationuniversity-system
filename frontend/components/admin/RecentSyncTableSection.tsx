import React from "react";
import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { RecentSyncRow } from "@/types";
import { SyncStatus } from "@/components/integration/SyncStatus";
import { formatNumber } from "@/lib/utils";

export function RecentSyncTableSection({ rows }: { rows: RecentSyncRow[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Recent Data Synchronization
            </h3>
            <p className="text-xs text-slate-500">
              Latest synchronization batches across connected campus repositories
            </p>
          </div>
        </div>

        <Link
          href="/admin/sync-history"
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/60 sm:self-auto"
        >
          <span>View Sync History</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3.5 sm:px-6">Data Source</th>
              <th className="px-5 py-3.5">Last Sync</th>
              <th className="px-5 py-3.5">Records</th>
              <th className="px-5 py-3.5 sm:px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="transition-colors hover:bg-slate-50/80"
              >
                <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                  <p className="font-semibold text-slate-900">
                    {row.dataSource}
                  </p>
                  <p className="text-xs text-slate-500">{row.fullName}</p>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                  {row.lastSync}
                </td>
                <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900 tabular-nums">
                  {formatNumber(row.records)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                  <SyncStatus status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


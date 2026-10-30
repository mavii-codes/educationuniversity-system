import React from "react";
import { IntegrationSyncLog } from "@/types/university";
import { SyncStatus } from "./SyncStatus";
import { formatNumber } from "@/lib/utils";

interface IntegrationTableProps {
  logs: IntegrationSyncLog[];
}

export function IntegrationTable({ logs }: IntegrationTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-base font-semibold text-slate-900">
          Synchronization History
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Recent batch runs, processed record counts, and reconciliation status
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-6 py-3.5">Source</th>
              <th className="px-6 py-3.5 text-right">Records</th>
              <th className="px-6 py-3.5">Duplicates</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Date</th>
              <th className="px-6 py-3.5">Summary Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="transition-colors hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="font-semibold text-slate-900">
                    {log.sourceName}
                  </span>
                  <span className="ml-2 text-xs text-slate-400">
                    ({log.duration})
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-slate-900 tabular-nums">
                  {formatNumber(log.recordsProcessed)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-slate-600 tabular-nums">
                  {log.duplicatesDetected > 0 ? (
                    <span className="font-medium text-amber-700">
                      {log.duplicatesDetected} flagged
                    </span>
                  ) : (
                    <span className="text-slate-400">0</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <SyncStatus status={log.status} />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    {log.dateLabel}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    {log.timestamp}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-600">
                  {log.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="divide-y divide-slate-100 md:hidden">
        {logs.map((log) => (
          <div key={log.id} className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">
                {log.sourceName}
              </span>
              <SyncStatus status={log.status} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-800 tabular-nums">
                {formatNumber(log.recordsProcessed)} records
              </span>
              <span>{log.timestamp}</span>
            </div>
            <p className="mt-2 text-xs text-slate-600">{log.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


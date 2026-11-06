"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  Filter,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  XCircle,
} from "lucide-react";
import { getAuditLogs } from "@/lib/api";
import { AuditLogRecord } from "@/types";
import { useToast } from "@/components/ui/ToastProvider";

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

export default function AdminAuditLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
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

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const rows = [
      [
        "Timestamp",
        "Actor",
        "Actor Role",
        "Action / Event",
        "Target Resource",
        "IP Address",
        "Outcome",
        "Event Details",
      ],
      ...filteredLogs.map((log) => [
        log.timestamp,
        log.actor,
        log.actorRole,
        log.action,
        log.resource,
        log.ipAddress,
        log.status,
        log.details,
      ]),
    ];
    downloadCsv(`audit-logs-${getDateStamp()}.csv`, rows);
    showToast({
      title: "Audit Log Exported",
      description: `${filteredLogs.length} record${filteredLogs.length === 1 ? "" : "s"} downloaded as CSV.`,
      type: "success",
    });
  };

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

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit records by actor, action, resource, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="All">All Event Outcomes</option>
            <option value="Success">Success</option>
            <option value="Warning">Warning</option>
            <option value="Failure">Failure</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
              <th className="px-4 py-3 font-semibold">Timestamp</th>
              <th className="px-4 py-3 font-semibold">Actor &amp; Role</th>
              <th className="px-4 py-3 font-semibold">Action / Event</th>
              <th className="px-4 py-3 font-semibold">Target Resource</th>
              <th className="px-4 py-3 font-semibold">IP Address</th>
              <th className="px-4 py-3 font-semibold">Outcome</th>
              <th className="px-4 py-3 font-semibold">Event Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading audit logs...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  {error
                    ? "Audit log records could not be loaded."
                    : "No audit events have been recorded yet."}
                </td>
              </tr>
            ) : filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/60 transition">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {log.timestamp}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{log.actor}</p>
                  <p className="text-[11px] text-slate-400">{log.actorRole}</p>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] font-semibold text-indigo-700">
                  {log.action}
                </td>
                <td className="px-4 py-3 text-slate-700">{log.resource}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                  {log.ipAddress}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      log.status === "Success"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                        : log.status === "Warning"
                        ? "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20"
                        : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
                    }`}
                  >
                    {log.status === "Success" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : log.status === "Warning" ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    <span>{log.status}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 leading-relaxed max-w-xs">
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

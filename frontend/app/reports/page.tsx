"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  Search,
} from "lucide-react";
import { getReportsData } from "@/services/api";
import { ReportItem } from "@/types/university";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import {
  DemoViewState,
  ViewStateControl,
} from "@/components/ui/ViewStateControl";

const CATEGORIES = [
  "All",
  "Enrollment",
  "Academic",
  "Attendance",
  "Retention",
  "Graduation",
  "Alumni",
  "Integration",
] as const;

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);
  const [viewState, setViewState] = useState<DemoViewState>("loading");

  const { showToast } = useToast();

  const loadReports = useCallback(async () => {
    setViewState("loading");
    try {
      const data = await getReportsData();
      setReports(data);
      setViewState("ready");
    } catch {
      setViewState("error");
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredReports = reports.filter((rep) => {
    const matchesCat =
      selectedCategory === "All" || rep.category === selectedCategory;
    const matchesSearch =
      !search.trim() ||
      rep.title.toLowerCase().includes(search.toLowerCase()) ||
      rep.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleExport = (report: ReportItem, format: "PDF" | "CSV") => {
    showToast({
      title: `Exporting ${report.title} (${format})`,
      description: `Generating ${format} file (${report.fileSize}) from unified campus data.`,
      type: "success",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Institutional Reports
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Generate, preview, and export standardized university reports across integrated systems.
          </p>
        </div>
        <ViewStateControl
          current={viewState}
          onChange={setViewState}
          onRefresh={loadReports}
        />
      </div>

      {/* Search & Category Bar */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-card lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                selectedCategory === cat
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a report..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {viewState === "error" && (
        <ErrorState
          title="We couldn't load the institutional reports."
          description="Please try again in a moment."
          onRetry={loadReports}
        />
      )}

      {viewState === "loading" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <CardSkeleton key={idx} />
          ))}
        </div>
      )}

      {viewState === "ready" && filteredReports.length === 0 && (
        <EmptyState
          title="No matching reports found"
          description="Try clearing your search or selecting another report category."
          actionLabel="Show All Reports"
          onAction={() => {
            setSelectedCategory("All");
            setSearch("");
          }}
        />
      )}

      {viewState === "ready" && filteredReports.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-150 hover:border-slate-300/80 hover:shadow-card-hover"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-600/15">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {report.title}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {report.frequency}
                      </p>
                    </div>
                  </div>
                  <Badge variant="brand">{report.category}</Badge>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {report.description}
                </p>

                {/* Highlights */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50/80 p-3">
                  {report.highlights.map((h) => (
                    <div key={h.label}>
                      <span className="block text-[11px] text-slate-400">
                        {h.label}
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold text-slate-900 tabular-nums">
                        {h.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Last generated: {report.lastGenerated}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReport(report)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                    View Report
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport(report, "CSV")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Preview Modal */}
      <Modal
        open={Boolean(activeReport)}
        onClose={() => setActiveReport(null)}
        title={activeReport?.title || "Report Preview"}
        subtitle={
          activeReport
            ? `Last generated ${activeReport.lastGenerated} · Sources: ${activeReport.sourceSystems.join(", ")}`
            : undefined
        }
        maxWidthClass="max-w-3xl"
      >
        {activeReport && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {activeReport.highlights.map((h) => (
                <div
                  key={h.label}
                  className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5"
                >
                  <span className="text-xs text-slate-500">{h.label}</span>
                  <p className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">
                    {h.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {activeReport.previewHeaders.map((hdr) => (
                      <th key={hdr} className="px-4 py-3">
                        {hdr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeReport.previewRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {row.col1}
                      </td>
                      <td className="px-4 py-3 text-slate-700 tabular-nums">
                        {row.col2}
                      </td>
                      <td className="px-4 py-3 text-slate-700 tabular-nums">
                        {row.col3}
                      </td>
                      <td className="px-4 py-3 font-medium text-indigo-700 tabular-nums">
                        {row.col4}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                {activeReport.sourceSystems.map((src) => (
                  <span
                    key={src}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    <Database className="h-3 w-3 text-indigo-600" />
                    {src}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExport(activeReport, "CSV")}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleExport(activeReport, "PDF")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


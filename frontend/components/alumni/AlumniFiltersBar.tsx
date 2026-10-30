"use client";

import React from "react";
import { RotateCcw, Search } from "lucide-react";

interface AlumniFiltersBarProps {
  search: string;
  batch: string;
  program: string;
  status: string;
  batches: string[];
  programs: { code: string; name: string }[];
  onSearchChange: (value: string) => void;
  onBatchChange: (value: string) => void;
  onProgramChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReset: () => void;
}

export function AlumniFiltersBar({
  search,
  batch,
  program,
  status,
  batches,
  programs,
  onSearchChange,
  onBatchChange,
  onProgramChange,
  onStatusChange,
  onReset,
}: AlumniFiltersBarProps) {
  const hasFilters =
    Boolean(search.trim()) ||
    batch !== "All" ||
    program !== "All" ||
    status !== "All";

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
        {/* Search alumni... */}
        <div className="relative sm:col-span-2 lg:col-span-5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search alumni..."
            aria-label="Search alumni by name, student ID, or program"
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>

        {/* Graduation Batch Filter */}
        <div className="lg:col-span-2">
          <select
            value={batch}
            onChange={(e) => onBatchChange(e.target.value)}
            aria-label="Filter by graduation batch"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition focus:border-indigo-400 focus:outline-none"
          >
            <option value="All">All Batches</option>
            {batches.map((b) => (
              <option key={b} value={b}>
                Batch {b}
              </option>
            ))}
          </select>
        </div>

        {/* Program Filter */}
        <div className="lg:col-span-3">
          <select
            value={program}
            onChange={(e) => onProgramChange(e.target.value)}
            aria-label="Filter by degree program"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition focus:border-indigo-400 focus:outline-none"
          >
            <option value="All">All Programs</option>
            {programs.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter + Reset */}
        <div className="flex items-center gap-2 lg:col-span-2">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter by status"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition focus:border-indigo-400 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Alumni">Alumni</option>
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={onReset}
              title="Reset filters"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


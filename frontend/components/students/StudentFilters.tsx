"use client";

import React from "react";
import { RotateCcw, Search } from "lucide-react";
import { Program } from "@/types/university";

interface StudentFiltersProps {
  search: string;
  program: string;
  yearLevel: string;
  status: string;
  riskLevel: string;
  programs: Program[];
  onSearchChange: (val: string) => void;
  onProgramChange: (val: string) => void;
  onYearLevelChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onRiskLevelChange: (val: string) => void;
  onReset: () => void;
}

export function StudentFilters({
  search,
  program,
  yearLevel,
  status,
  riskLevel,
  programs,
  onSearchChange,
  onProgramChange,
  onYearLevelChange,
  onStatusChange,
  onRiskLevelChange,
  onReset,
}: StudentFiltersProps) {
  const hasActiveFilters =
    search.trim() !== "" ||
    program !== "All" ||
    yearLevel !== "All" ||
    status !== "All" ||
    riskLevel !== "All";

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
        {/* Search Input */}
        <div className="relative sm:col-span-2 lg:col-span-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by student name or ID..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>

        {/* Program Filter */}
        <div className="lg:col-span-2">
          <select
            value={program}
            onChange={(e) => onProgramChange(e.target.value)}
            aria-label="Filter by program"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
          >
            <option value="All">All Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.code}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Year Level Filter */}
        <div className="lg:col-span-2">
          <select
            value={yearLevel}
            onChange={(e) => onYearLevelChange(e.target.value)}
            aria-label="Filter by year level"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
          >
            <option value="All">All Year Levels</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="lg:col-span-2">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter by status"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Graduated">Graduated</option>
            <option value="On Leave">On Leave</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>

        {/* Risk Filter */}
        <div className="flex items-center gap-2 lg:col-span-2">
          <select
            value={riskLevel}
            onChange={(e) => onRiskLevelChange(e.target.value)}
            aria-label="Filter by risk level"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
          >
            <option value="All">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              title="Reset filters"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


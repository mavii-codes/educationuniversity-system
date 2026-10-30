import React from "react";
import {
  ArrowDown,
  ArrowRight,
  Award,
  BarChart3,
  BookMarked,
  Briefcase,
  Database,
  GitMerge,
  Laptop,
  Layers,
} from "lucide-react";

const SOURCES = [
  { code: "SIS", label: "Student Info System", count: "5,240", icon: Database },
  { code: "LMS", label: "Learning Management", count: "5,100", icon: Laptop },
  { code: "HR", label: "HR / Payroll", count: "386", icon: Briefcase },
  { code: "Library", label: "Library System", count: "4,850", icon: BookMarked },
  { code: "Alumni", label: "Alumni CRM", count: "8,400", icon: Award },
];

export function IntegrationPipeline() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Unified Data Integration Pipeline
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            How campus systems converge into a single verified student record for analytics
          </p>
        </div>
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          Identity Resolution Active · Student ID Key
        </span>
      </div>

      <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-12">
        {/* Step 1: 5 University Source Systems */}
        <div className="space-y-2 lg:col-span-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            1. Campus Source Systems
          </p>
          {SOURCES.map((src) => {
            const Icon = src.icon;
            return (
              <div
                key={src.code}
                className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/70">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900">
                      {src.code}
                    </span>
                    <span className="ml-1.5 text-xs text-slate-500">
                      {src.label}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-600 tabular-nums">
                  {src.count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Connector 1 */}
        <div className="flex justify-center lg:col-span-1">
          <ArrowRight className="hidden h-5 w-5 text-indigo-400 lg:block" />
          <ArrowDown className="h-5 w-5 text-indigo-400 lg:hidden" />
        </div>

        {/* Step 2: Data Integration Engine */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <GitMerge className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-indigo-950">
              Data Integration
            </p>
            <p className="mt-1 text-xs leading-relaxed text-indigo-800/80">
              Schema mapping, validation &amp; duplicate detection
            </p>
          </div>
        </div>

        {/* Connector 2 */}
        <div className="flex justify-center lg:col-span-1">
          <ArrowRight className="hidden h-5 w-5 text-indigo-400 lg:block" />
          <ArrowDown className="h-5 w-5 text-indigo-400 lg:hidden" />
        </div>

        {/* Step 3: Unified Student Data */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
              <Layers className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              Unified Student Data
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              360-degree lifecycle &amp; cross-system profile
            </p>
          </div>
        </div>

        {/* Connector 3 + Step 4: Academic Analytics */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex justify-center lg:hidden">
            <ArrowDown className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              Academic Analytics
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Retention insights, GPA trends &amp; reports
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


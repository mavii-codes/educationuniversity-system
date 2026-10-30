import React from "react";
import {
  ArrowRight,
  Award,
  BookMarked,
  Briefcase,
  CheckCircle2,
  Database,
  GitMerge,
  GraduationCap,
  Laptop,
  ShieldCheck,
} from "lucide-react";

const CONNECTED_NODES = [
  { name: "Student Information System", tag: "SIS", records: "12,450", icon: Database },
  { name: "Learning Management System", tag: "LMS", records: "10,820", icon: Laptop },
  { name: "HR / Payroll", tag: "HR", records: "940", icon: Briefcase },
  { name: "Library System", tag: "Library", records: "8,421", icon: BookMarked },
  { name: "Alumni CRM", tag: "Alumni", records: "18,560", icon: Award },
];

export function LoginBrandingPanel() {
  return (
    <div className="relative flex flex-col justify-between border-b border-slate-200/80 bg-slate-50/90 p-8 sm:p-10 lg:min-h-screen lg:border-b-0 lg:border-r lg:p-14">
      {/* Subtle Top Institutional Header */}
      <div>
        <div className="inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-sm font-bold tracking-tight text-slate-900">
              University Data Integration System
            </span>
            <span className="block text-xs text-slate-500">
              Institutional Data &amp; Analytics Platform
            </span>
          </div>
        </div>

        <div className="mt-10 max-w-lg">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            University Data Integration System
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Securely connect, manage, and understand university data in one place.
          </p>
        </div>

        {/* Elegant Connected Systems & Lifecycle Architectural Visual */}
        <div className="mt-8 max-w-lg rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2">
              <GitMerge className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-800">
                Unified Campus Data Architecture
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              5 Systems Active
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {CONNECTED_NODES.map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.tag}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-indigo-600 ring-1 ring-slate-200/80">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium text-slate-800">
                      {node.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                      {node.records}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Student Lifecycle Strip */}
          <div className="mt-4 rounded-xl bg-indigo-50/60 px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
              Unified Student Lifecycle
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-700">
              <span>Enrollment</span>
              <ArrowRight className="h-3 w-3 text-indigo-400" />
              <span>Learning</span>
              <ArrowRight className="h-3 w-3 text-indigo-400" />
              <span>Graduation</span>
              <ArrowRight className="h-3 w-3 text-indigo-400" />
              <span>Alumni</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Security Footer */}
      <div className="mt-8 flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-600" />
        <span>
          Role-based institutional governance · Authorized university personnel only
        </span>
      </div>
    </div>
  );
}


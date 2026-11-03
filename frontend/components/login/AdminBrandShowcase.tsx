"use client";

import React from "react";
import {
  BookMarked,
  BookOpen,
  ClipboardList,
  Database,
  GraduationCap,
  Network,
  ShieldCheck,
} from "lucide-react";

/**
 * Creative, administration-focused showcase for the Administrator / Library Staff login page.
 * Highlights core administrative library operations and centralized data integration
 * without displaying fake records, fake ISBNs, or fake numbers.
 */
export function AdminBrandShowcase() {
  return (
    <div className="flex flex-col justify-center space-y-6 lg:pr-6">
      {/* 1. Institutional Brand Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-4 ring-indigo-50">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              University Data Integration System
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Institutional Data &amp; Analytics Platform
            </p>
          </div>
        </div>
      </div>

      {/* 2 & 3. Badge & Main Headline */}
      <div className="space-y-2.5">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-[11px] font-semibold text-indigo-700">
          <ShieldCheck className="h-3 w-3 text-indigo-600" />
          <span>Library Administration</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-[32px] leading-tight">
          Manage your library,{" "}
          <span className="text-indigo-600 font-extrabold">connected.</span>
        </h2>
        <p className="max-w-md text-xs sm:text-sm text-slate-600 leading-relaxed">
          Manage library operations, borrowing activity, and integrated library data from one centralized workspace.
        </p>
      </div>

      {/* 4 & 5. ONE Large Beautiful Visual Card with 3 Feature Areas */}
      <div className="relative rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white/95 to-slate-50/90 p-5 shadow-sm backdrop-blur-sm sm:p-6">
        {/* Subtle decorative background connection lines and abstract nodes */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-40 pointer-events-none">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <line
              x1="24"
              y1="36"
              x2="260"
              y2="110"
              stroke="#CBD5E1"
              strokeWidth="0.8"
              strokeDasharray="3 3"
            />
            <line
              x1="260"
              y1="110"
              x2="480"
              y2="40"
              stroke="#CBD5E1"
              strokeWidth="0.8"
              strokeDasharray="3 3"
            />
            <circle cx="24" cy="36" r="2.5" fill="#818CF8" />
            <circle cx="260" cy="110" r="2" fill="#CBD5E1" />
            <circle cx="480" cy="40" r="2.5" fill="#818CF8" />
          </svg>
        </div>

        <div className="relative space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight sm:text-base">
              Library Administration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Everything you need for everyday library operations.
            </p>
          </div>

          {/* Three Feature Areas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Feature 1: Library Records */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-indigo-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <BookOpen className="h-4 w-4" />
              </div>
              <h4 className="mt-2.5 text-xs font-bold text-slate-900">
                Library Records
              </h4>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                Manage books, categories, copies, and availability.
              </p>
            </div>

            {/* Feature 2: Borrowing & Returns */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-indigo-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <ClipboardList className="h-4 w-4" />
              </div>
              <h4 className="mt-2.5 text-xs font-bold text-slate-900">
                Borrowing &amp; Returns
              </h4>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                Process requests, returns, reservations, and fines.
              </p>
            </div>

            {/* Feature 3: Integrated Data */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-indigo-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Database className="h-4 w-4" />
              </div>
              <h4 className="mt-2.5 text-xs font-bold text-slate-900">
                Integrated Data
              </h4>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                Access centralized library data and monitor integration activity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Subtle Footer Indicators */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-[11px] font-medium text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Library Management
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          Integrated Library Data
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          Centralized Administration
        </span>
      </div>
    </div>
  );
}

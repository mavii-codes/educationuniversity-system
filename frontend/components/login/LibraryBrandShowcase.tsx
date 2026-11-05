"use client";

import React from "react";
import {
  Bookmark,
  BookMarked,
  BookOpen,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

/**
 * Creative, student-focused library experience preview for the Student Login page.
 * Highlights core student capabilities (Browse Catalog, My Borrowings, Reservations)
 * without displaying any fabricated or fake system records.
 */
export function LibraryBrandShowcase() {
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
              University Library Management System
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Books, borrowing, and library services
            </p>
          </div>
        </div>
      </div>

      {/* 2 & 3. Badge & Main Headline */}
      <div className="space-y-2.5">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-[11px] font-semibold text-indigo-700">
          <BookOpen className="h-3 w-3 text-indigo-600" />
          <span>Student Library Experience</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-[32px] leading-tight">
          Your library,{" "}
          <span className="text-indigo-600 font-extrabold">
            all in one place.
          </span>
        </h2>
        <p className="max-w-md text-xs sm:text-sm text-slate-600 leading-relaxed">
          Discover books, manage your borrowing, and keep track of your library
          activity from one simple portal.
        </p>
      </div>

      {/* 4 & 5. Explore your library Card with 3 Compact Feature Cards */}
      <div className="relative rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white/95 to-slate-50/90 p-5 shadow-sm backdrop-blur-sm sm:p-6">
        {/* Subtle decorative background connection lines */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-35 pointer-events-none">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <line
              x1="30"
              y1="40"
              x2="280"
              y2="120"
              stroke="#CBD5E1"
              strokeWidth="0.8"
              strokeDasharray="3 3"
            />
            <circle cx="30" cy="40" r="2" fill="#818CF8" />
            <circle cx="280" cy="120" r="2" fill="#CBD5E1" />
          </svg>
        </div>

        <div className="relative space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight sm:text-base">
              Explore your library
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Everything you need to manage your library experience.
            </p>
          </div>

          {/* Three Compact Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Browse Catalog */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-indigo-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <BookOpen className="h-4 w-4" />
              </div>
              <h4 className="mt-2.5 text-xs font-bold text-slate-900">
                Browse Catalog
              </h4>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                Find books and check availability.
              </p>
            </div>

            {/* Card 2: My Borrowings */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-indigo-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <BookMarked className="h-4 w-4" />
              </div>
              <h4 className="mt-2.5 text-xs font-bold text-slate-900">
                My Borrowings
              </h4>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                Track your current and past loans.
              </p>
            </div>

            {/* Card 3: Reservations */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-indigo-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Bookmark className="h-4 w-4" />
              </div>
              <h4 className="mt-2.5 text-xs font-bold text-slate-900">
                Reservations
              </h4>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                Keep track of books you&apos;ve reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Bottom Benefits Row */}
      <div className="flex flex-wrap items-center gap-y-2 gap-x-5 pt-1 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          <span>Secure Student Access</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          <span>Library Catalog</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          <span>Borrowing &amp; Reservations</span>
        </div>
      </div>
    </div>
  );
}

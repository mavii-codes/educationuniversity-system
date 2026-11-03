"use client";

import React from "react";
import {
  BookMarked,
  BookOpen,
  CheckCircle2,
  Database,
  GraduationCap,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

/**
 * Creative, modern, and elegant brand presentation for the Student Library Portal.
 * Features a refined academic aesthetic, subtle library-data visual composition,
 * and key university library pillars without feeling like a generic SaaS hero.
 */
export function LibraryBrandShowcase() {
  return (
    <div className="flex flex-col justify-center space-y-7 lg:pr-6">
      {/* Institutional Brand Header */}
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

      {/* Hero Headline & Purpose Statement */}
      <div className="space-y-2.5">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/70 px-3 py-1 text-[11px] font-semibold text-indigo-700">
          <Sparkles className="h-3 w-3 text-indigo-500" />
          <span>Library Management System Integration</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-[32px] leading-tight">
          Your university library,{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 bg-clip-text text-transparent">
            connected.
          </span>
        </h2>
        <p className="max-w-md text-xs sm:text-sm text-slate-600 leading-relaxed">
          Discover resources, manage your borrowing, and stay connected to your
          academic library through a unified institutional data hub.
        </p>
      </div>

      {/* Modern Abstract Library & Data Visual Composition */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white/90 to-slate-50/80 p-5 shadow-sm backdrop-blur-sm sm:p-6">
        {/* Subtle decorative background connection grid */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-40 pointer-events-none">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <line
              x1="20"
              y1="50"
              x2="320"
              y2="140"
              stroke="#CBD5E1"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <line
              x1="180"
              y1="20"
              x2="80"
              y2="150"
              stroke="#CBD5E1"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          </svg>
        </div>

        <div className="relative space-y-3.5">
          {/* Main Visual Catalog Card */}
          <div className="flex items-start gap-3.5 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold font-mono tracking-wide uppercase text-indigo-600">
                  Catalog Acquisition · Section B-4
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Available Now
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-900 truncate">
                Modern Database Architectures &amp; Distributed Systems
              </p>
              <p className="text-[11px] text-slate-500">
                Dr. Ronald Vance · ISBN 978-0-13-468599-1
              </p>
            </div>
          </div>

          {/* Connected Circulation Indicator Strip */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white/80 p-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Borrower Card
                </p>
                <p className="text-xs font-semibold text-slate-900 truncate">
                  Digital Card Active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white/80 p-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
                <Database className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  REST API Pipeline
                </p>
                <p className="text-xs font-semibold text-slate-900 truncate">
                  Synchronized
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supporting Academic Trust Badges */}
      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-1 text-[11px] font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
          <span>Real-time loan requests</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
          <span>Centralized campus catalog</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
          <span>FERPA &amp; GDPR privacy protected</span>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import React from "react";
import { AdminBrandShowcase } from "@/components/login/AdminBrandShowcase";
import { AdminLoginFormCard } from "@/components/login/AdminLoginFormCard";

export const metadata: Metadata = {
  title: "Staff & Admin Portal · University Library Management System",
  description:
    "Sign in for library administration: catalog records, circulation, integrated library data, and system governance.",
};

/**
 * Staff & Admin Portal entry page. Mirrors the student /login layout
 * (responsive two-column grid: brand showcase on the left, elevated login
 * card on the right) with the administration-focused brand mood.
 */
export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-[#F8FAFC] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 overflow-x-hidden">
      {/* Subtle administration-flavored background composition */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 select-none overflow-hidden"
      >
        {/* Soft ambient lighting orbs (mirrored vs the student mood) */}
        <div className="absolute -top-36 -right-36 h-[480px] w-[480px] rounded-full bg-gradient-to-bl from-indigo-200/35 to-slate-100/20 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-slate-200/30 via-indigo-100/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-violet-100/25 via-slate-100/20 to-transparent blur-3xl" />

        {/* Very faint connective admin network grid */}
        <svg
          className="absolute inset-0 h-full w-full text-slate-300/40"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="administrative-mesh"
              width="56"
              height="56"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 56 0 L 0 0 0 56"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2 6"
              />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#administrative-mesh)"
            opacity="0.45"
          />

          {/* Faint governance-flow connection lines & nodes */}
          <g stroke="#CBD5E1" strokeWidth="0.8" fill="none" opacity="0.35">
            <path d="M 520 200 Q 340 140 220 260" />
            <path d="M 1520 420 Q 1120 560 900 400" />
            <circle cx="520" cy="200" r="3" fill="#C7D2FE" stroke="#818CF8" />
            <circle cx="220" cy="260" r="2.5" fill="#E2E8F0" />
            <circle cx="1520" cy="420" r="3" fill="#C7D2FE" stroke="#818CF8" />
            <circle cx="900" cy="400" r="2.5" fill="#E2E8F0" />
          </g>
        </svg>
      </div>

      {/* Responsive two-column staff/admin portal layout */}
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Administrative Brand & Library Operations */}
          <div className="w-full lg:col-span-7">
            <AdminBrandShowcase />
          </div>

          {/* Right Column: Elevated Admin Login Card */}
          <div className="flex w-full justify-center lg:col-span-5 lg:justify-end">
            <AdminLoginFormCard />
          </div>
        </div>
      </div>
    </main>
  );
}

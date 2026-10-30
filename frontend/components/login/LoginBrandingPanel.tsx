import React from "react";
import { GraduationCap } from "lucide-react";

/**
 * Extremely subtle background SVG network motif evoking connected university
 * systems and academic data flow without competing with the centered login card.
 */
export function LoginSubtleBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      <svg
        className="h-full w-full text-slate-200/70"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="udis-subtle-grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#udis-subtle-grid)" opacity="0.45" />

        {/* Faint abstract connection lines & nodes */}
        <g stroke="#CBD5E1" strokeWidth="1" fill="none" opacity="0.45">
          <path d="M 80 140 Q 260 90 420 190" />
          <path d="M 80 140 Q 190 290 340 330" />
          <circle cx="80" cy="140" r="3.5" fill="#C7D2FE" stroke="#818CF8" />
          <circle cx="420" cy="190" r="3" fill="#E2E8F0" />
          <circle cx="340" cy="330" r="3" fill="#E2E8F0" />
        </g>

        <g stroke="#CBD5E1" strokeWidth="1" fill="none" opacity="0.4">
          <path d="M 1180 160 Q 1340 240 1480 150" />
          <path d="M 1180 160 Q 1280 340 1440 390" />
          <circle cx="1180" cy="160" r="3" fill="#E2E8F0" />
          <circle cx="1480" cy="150" r="3.5" fill="#C7D2FE" stroke="#818CF8" />
          <circle cx="1440" cy="390" r="3" fill="#E2E8F0" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Compact centered institutional branding header placed directly above the login card.
 */
export function LoginBrandingPanel() {
  return (
    <div className="mb-7 flex flex-col items-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 ring-4 ring-indigo-50">
        <GraduationCap className="h-6 w-6" />
      </div>

      <h1 className="mt-4 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
        University Data Integration System
      </h1>
      <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
        Institutional Data &amp; Analytics Platform
      </p>
    </div>
  );
}

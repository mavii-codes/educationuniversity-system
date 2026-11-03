import React from "react";

/**
 * Sophisticated, ultra-subtle academic background with faint data-fabric grid,
 * gentle ambient glow, and delicate geometric connection motifs.
 * Designed to evoke connected university library systems without distracting from the login card.
 */
export function StudentLoginBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden select-none"
    >
      {/* Soft ambient lighting orbs */}
      <div className="absolute -top-36 -left-36 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-indigo-200/35 to-violet-100/20 blur-3xl" />
      <div className="absolute top-1/3 -right-32 h-[420px] w-[420px] rounded-full bg-gradient-to-bl from-indigo-100/30 via-slate-100/20 to-transparent blur-3xl" />
      <div className="absolute -bottom-40 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-slate-200/25 via-indigo-100/20 to-transparent blur-3xl" />

      {/* Very faint academic geometric grid pattern */}
      <svg
        className="absolute inset-0 h-full w-full text-slate-300/40"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="academic-mesh"
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
        <rect width="100%" height="100%" fill="url(#academic-mesh)" opacity="0.45" />

        {/* Faint subtle data connection lines & nodes */}
        <g stroke="#CBD5E1" strokeWidth="0.8" fill="none" opacity="0.35">
          <path d="M 60 220 Q 240 160 380 260" />
          <path d="M 120 600 Q 320 520 480 640" />
          <circle cx="60" cy="220" r="3" fill="#C7D2FE" stroke="#818CF8" />
          <circle cx="380" cy="260" r="2.5" fill="#E2E8F0" />
          <circle cx="120" cy="600" r="3" fill="#C7D2FE" stroke="#818CF8" />
          <circle cx="480" cy="640" r="2.5" fill="#E2E8F0" />
        </g>
      </svg>
    </div>
  );
}

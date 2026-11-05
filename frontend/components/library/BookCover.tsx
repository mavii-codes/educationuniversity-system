"use client";

import React, { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  src?: string | null;
  title: string;
  size: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-16 w-11",
  md: "h-[150px] w-[100px]",
  lg: "h-[270px] w-[180px]",
} as const;

function resolveCoverSource(src: string): string {
  let source = src;
  if (source.startsWith("/uploads/")) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const backendBaseUrl = apiUrl
      .replace(/\/api\/?$/i, "")
      .replace(/\/$/, "");
    source = `${backendBaseUrl}${source}`;
  }
  if (/^https:\/\/covers\.openlibrary\.org\//i.test(source) && !/[?&]default=false(?:&|$)/i.test(source)) {
    source += source.includes("?") ? "&default=false" : "?default=false";
  }
  return source;
}

export function BookCover({ src, title, size, className }: BookCoverProps) {
  const resolvedSrc = src ? resolveCoverSource(src) : null;
  const [loading, setLoading] = useState(Boolean(resolvedSrc));
  const [failed, setFailed] = useState(!resolvedSrc);
  const initials =
    title
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase() || "BK";

  useEffect(() => {
    setLoading(Boolean(resolvedSrc));
    setFailed(!resolvedSrc);
  }, [resolvedSrc]);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100",
        SIZE_CLASSES[size],
        className
      )}
      aria-label={`Cover for ${title}`}
    >
      {resolvedSrc && !failed && (
        <img
          src={resolvedSrc}
          alt={`Cover of ${title}`}
          className={cn(
            "h-full w-full object-cover transition-opacity",
            loading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => {
            setLoading(false);
          }}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
        />
      )}
      {loading && (
        <div className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden="true" />
      )}
      {failed && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-100 text-slate-400">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px] font-bold tracking-wider text-slate-500">
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}

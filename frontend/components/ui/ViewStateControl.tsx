"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type DemoViewState = "ready" | "loading" | "error";

interface ViewStateControlProps {
  current: DemoViewState;
  onChange: (state: DemoViewState) => void;
  onRefresh?: () => void;
}

export function ViewStateControl({
  current,
  onChange,
  onRefresh,
}: ViewStateControlProps) {
  if (!onRefresh) return null;

  const isLoading = current === "loading";

  return (
    <button
      type="button"
      onClick={() => {
        if (current === "error") onChange("ready");
        onRefresh();
      }}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
    >
      <RefreshCw
        className={cn("h-3.5 w-3.5 text-slate-500", isLoading && "animate-spin")}
      />
      <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
    </button>
  );
}

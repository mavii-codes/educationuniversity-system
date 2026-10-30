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
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white p-1 text-xs shadow-sm">
      <button
        type="button"
        onClick={() => onChange("ready")}
        className={cn(
          "rounded-md px-2.5 py-1 font-medium transition",
          current === "ready"
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-500 hover:text-slate-800"
        )}
      >
        Live View
      </button>
      <button
        type="button"
        onClick={() => onChange("loading")}
        className={cn(
          "rounded-md px-2.5 py-1 font-medium transition",
          current === "loading"
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-500 hover:text-slate-800"
        )}
      >
        Loading
      </button>
      <button
        type="button"
        onClick={() => onChange("error")}
        className={cn(
          "rounded-md px-2.5 py-1 font-medium transition",
          current === "error"
            ? "bg-rose-50 text-rose-700"
            : "text-slate-500 hover:text-slate-800"
        )}
      >
        Error
      </button>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          title="Refresh data"
          className="ml-0.5 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}


import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { DataSourceStatus, SyncLogStatus } from "@/types";
import { cn } from "@/lib/utils";

export function SyncStatus({
  status,
  className,
}: {
  status: DataSourceStatus | SyncLogStatus;
  className?: string;
}) {
  switch (status) {
    case "Connected":
    case "Successful":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
            className
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <span>{status}</span>
        </span>
      );
    case "Syncing":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20",
            className
          )}
        >
          <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin text-indigo-600" />
          <span>Syncing</span>
        </span>
      );
    case "Warning":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/25",
            className
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>Warning</span>
        </span>
      );
    case "Disconnected":
    case "Failed":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20",
            className
          )}
        >
          <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
          <span>{status}</span>
        </span>
      );
  }
}

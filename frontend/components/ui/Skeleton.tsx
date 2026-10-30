import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/75",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-7 w-20" />
      <Skeleton className="mt-2.5 h-3.5 w-36" />
    </div>
  );
}

export function ChartSkeleton({ height = "h-72" }: { height?: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>
      <div className={cn("flex items-end gap-3 pt-4", height)}>
        <Skeleton className="h-[45%] flex-1 rounded-t-md" />
        <Skeleton className="h-[62%] flex-1 rounded-t-md" />
        <Skeleton className="h-[54%] flex-1 rounded-t-md" />
        <Skeleton className="h-[78%] flex-1 rounded-t-md" />
        <Skeleton className="h-[70%] flex-1 rounded-t-md" />
        <Skeleton className="h-[88%] flex-1 rounded-t-md" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
      <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-3.5">
        <div className="grid grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-3.5 w-20" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-6 items-center gap-4 px-6 py-4">
            <Skeleton className="h-4 w-20" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="ml-auto h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-5 w-28 rounded-md" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <CardSkeleton key={idx} />
        ))}
      </div>
      <TableSkeleton rows={4} />
    </div>
  );
}


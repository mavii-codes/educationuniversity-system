import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookMarked,
  Users,
} from "lucide-react";
import { ActivityFeedItem } from "@/types/university";
import { cn } from "@/lib/utils";

interface RecentActivityProps {
  items: ActivityFeedItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  const getSourceIcon = (source: ActivityFeedItem["source"]) => {
    switch (source) {
      case "Library":
        return BookMarked;
      default:
        return Users;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Recent Activity
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Latest cross-system synchronization events across campus
          </p>
        </div>
        <Link
          href="/data-integration"
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          Sync History
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const Icon = getSourceIcon(item.source);
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                  item.source === "Library"
                    ? "bg-indigo-50 text-indigo-600 ring-indigo-600/15"
                    : "bg-slate-50 text-slate-600 ring-slate-600/15"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-900 leading-snug">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">
                  {item.detail}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                  <span>{item.source}</span>
                  <span>&bull;</span>
                  <span>{item.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

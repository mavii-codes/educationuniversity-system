import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  BookMarked,
  Database,
  Laptop,
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
      case "SIS":
        return Database;
      case "LMS":
        return Laptop;
      case "Library":
        return BookMarked;
      case "Alumni":
        return Award;
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
              className="flex items-start gap-3.5 py-3.5 first:pt-1 last:pb-0"
            >
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                  item.status === "success" &&
                    "bg-emerald-50 text-emerald-600 ring-emerald-600/15",
                  item.status === "warning" &&
                    "bg-amber-50 text-amber-600 ring-amber-600/15",
                  item.status === "info" &&
                    "bg-indigo-50 text-indigo-600 ring-indigo-600/15"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">
                    {item.title}
                  </p>
                  <span className="text-xs text-slate-400">{item.timestamp}</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  {item.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BellOff,
  CheckCheck,
  CheckCircle2,
  Info,
} from "lucide-react";
import { getNotifications } from "@/lib/api";
import { NotificationItem } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useToast } from "@/components/ui/ToastProvider";
import {
  DemoViewState,
  ViewStateControl,
} from "@/components/ui/ViewStateControl";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "unread" | "warning" | "alert" | "success";

export default function NotificationsPage() {
  const pathname = usePathname();
  const isAdmin = Boolean(pathname?.startsWith("/admin"));
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [viewState, setViewState] = useState<DemoViewState>("loading");
  const { showToast } = useToast();

  const loadNotifications = useCallback(async () => {
    setViewState("loading");
    try {
      const data = await getNotifications();
      setItems(data);
      setViewState("ready");
    } catch {
      setViewState("error");
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = items.filter((n) => !n.read).length;

  const filteredItems = items.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "warning") return n.type === "warning" || n.type === "info";
    if (filter === "alert") return n.type === "alert";
    if (filter === "success") return n.type === "success";
    return true;
  });

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast({
      title: "All notifications marked as read",
      description: "Your notification inbox is caught up.",
      type: "success",
    });
  };

  const handleToggleRead = (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const renderIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "alert":
        return <AlertCircle className="h-5 w-5 text-rose-600" />;
      default:
        return <Info className="h-5 w-5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              System Notifications &amp; Alerts
            </h2>
            {unreadCount > 0 && (
              <Badge variant="brand">{unreadCount} unread</Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            Updates from campus synchronization pipelines, duplicate checks, and academic risk monitors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ViewStateControl
            current={viewState}
            onChange={setViewState}
            onRefresh={loadNotifications}
          />
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-2 shadow-card">
        {(
          [
            { id: "all", label: "All Notifications" },
            { id: "unread", label: "Unread" },
            { id: "alert", label: "High-Risk Alerts" },
            { id: "warning", label: "Warnings & Duplicates" },
            { id: "success", label: "Completed Syncs" },
          ] as { id: FilterTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              filter === tab.id
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {viewState === "error" && (
        <ErrorState
          title="We couldn't load notifications."
          description="Please try again in a moment."
          onRetry={loadNotifications}
        />
      )}

      {viewState === "loading" && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <CardSkeleton key={idx} />
          ))}
        </div>
      )}

      {viewState === "ready" && filteredItems.length === 0 && (
        <EmptyState
          icon={BellOff}
          title="No notifications in this category"
          description="You're all caught up. Switch back to view all recent platform events."
          actionLabel="View All Notifications"
          onAction={() => setFilter("all")}
        />
      )}

      {viewState === "ready" && filteredItems.length > 0 && (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
          {filteredItems.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "flex flex-col justify-between gap-4 p-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center",
                !notif.read && "bg-indigo-50/25"
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    notif.type === "success" && "bg-emerald-50",
                    notif.type === "warning" && "bg-amber-50",
                    notif.type === "alert" && "bg-rose-50",
                    notif.type === "info" && "bg-indigo-50"
                  )}
                >
                  {renderIcon(notif.type)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={cn(
                        "text-sm text-slate-900",
                        !notif.read ? "font-semibold" : "font-medium"
                      )}
                    >
                      {notif.title}
                    </h3>
                    <Badge variant="neutral">{notif.source}</Badge>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {notif.description}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400">
                    {notif.timestamp}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleToggleRead(notif.id)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  {notif.read ? "Mark unread" : "Mark read"}
                </button>
                {notif.href && (
                  <Link
                    href={
                      !isAdmin
                        ? notif.href
                        : notif.href === "/data-integration" || notif.href === "/integration"
                        ? "/admin/integrations"
                        : notif.href === "/academic-analytics" || notif.href === "/analytics"
                        ? "/admin/analytics"
                        : notif.href === "/data-sources"
                        ? "/admin/data-sources"
                        : notif.href.startsWith("/students")
                        ? `/admin${notif.href}`
                        : "/admin/dashboard"
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                  >
                    Inspect
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


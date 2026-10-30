"use client";

import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  Info,
} from "lucide-react";
import { NotificationItem } from "@/types/university";
import { cn } from "@/lib/utils";

interface NotificationPanelProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onSelectNotification: (id: string) => void;
  onClose: () => void;
}

export function NotificationPanel({
  notifications,
  onMarkAllRead,
  onSelectNotification,
  onClose,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "alert":
        return <AlertCircle className="h-4 w-4 text-rose-600" />;
      default:
        return <Info className="h-4 w-4 text-indigo-600" />;
    }
  };

  return (
    <div className="absolute right-0 top-full z-40 mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl ring-1 ring-slate-900/5">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
        {notifications.map((item) => {
          const content = (
            <div
              onClick={() => {
                onSelectNotification(item.id);
                onClose();
              }}
              className={cn(
                "flex cursor-pointer items-start gap-3 px-4 py-3.5 transition hover:bg-slate-50",
                !item.read && "bg-indigo-50/30"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  item.type === "success" && "bg-emerald-50",
                  item.type === "warning" && "bg-amber-50",
                  item.type === "alert" && "bg-rose-50",
                  item.type === "info" && "bg-indigo-50"
                )}
              >
                {getIcon(item.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "text-xs leading-snug text-slate-900",
                      !item.read ? "font-semibold" : "font-medium"
                    )}
                  >
                    {item.title}
                  </p>
                  {!item.read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                  )}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  {item.description}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-medium text-slate-500">{item.source}</span>
                  <span>·</span>
                  <span>{item.timestamp}</span>
                </div>
              </div>
            </div>
          );

          return item.href ? (
            <Link key={item.id} href={item.href}>
              {content}
            </Link>
          ) : (
            <div key={item.id}>{content}</div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-center">
        <Link
          href="/notifications"
          onClick={onClose}
          className="text-xs font-medium text-slate-600 transition hover:text-indigo-600"
        >
          View all notifications &amp; system alerts
        </Link>
      </div>
    </div>
  );
}


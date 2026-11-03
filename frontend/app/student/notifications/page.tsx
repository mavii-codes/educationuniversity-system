"use client";

import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { cn } from "@/lib/utils";

export default function StudentNotificationsPage() {
  const { user } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } =
    useLibraryStore();

  const studentId = user?.studentId || user?.id || "2024-042";
  const studentNotifications = notifications.filter(
    (n) => n.studentId === studentId
  );
  const unreadCount = studentNotifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "BorrowRequest":
        return <BookOpen className="h-4 w-4 text-indigo-600" />;
      case "DueDate":
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case "Reservation":
        return <Layers className="h-4 w-4 text-purple-600" />;
      case "Fine":
        return <Coins className="h-4 w-4 text-rose-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Library Activity &amp; System Alerts
              </h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Real-time updates regarding your loan requests, reservations, and clearance records
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsRead(studentId)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Check className="h-3.5 w-3.5 text-indigo-600" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        {studentNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-xs font-semibold text-slate-700">
              No notifications yet
            </p>
            <p className="text-[11px] text-slate-400">
              You will receive updates here when you request books or place reservations.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {studentNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={cn(
                  "flex items-start gap-4 p-5 transition-colors cursor-pointer",
                  notif.read
                    ? "bg-white hover:bg-slate-50/70"
                    : "bg-indigo-50/30 hover:bg-indigo-50/60"
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {notif.timestamp}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.actionUrl && (
                    <div className="mt-2.5">
                      <Link
                        href={notif.actionUrl}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        <span>Take Action</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


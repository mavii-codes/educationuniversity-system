"use client";

import React from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { useLibraryStore } from "@/lib/library-store";

export default function StaffNotificationsPage() {
  const { notifications } = useLibraryStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Circulation Alerts &amp; Notifications</h2>
        <p className="text-xs text-slate-500">Activity log of system events, loan confirmations, and hold notices</p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No circulation alerts recorded.
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="flex items-start gap-3.5 p-4 hover:bg-slate-50/50 transition">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mt-0.5">
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{n.message}</p>
                {n.studentId && (
                  <span className="mt-1.5 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                    Student ID: {n.studentId}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

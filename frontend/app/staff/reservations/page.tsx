"use client";

import React from "react";
import { Bookmark, Clock } from "lucide-react";
import { useLibraryStore } from "@/lib/library-store";

export default function StaffReservationsPage() {
  const { reservations } = useLibraryStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Reservations Queue</h2>
        <p className="text-xs text-slate-500">Monitor hold requests and item pickup readiness</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Book</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Reservation Date</th>
                <th className="px-4 py-3">Reservation Date</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{r.bookTitle}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800">{r.studentName}</p>
                    <p className="text-[11px] text-slate-500">{r.studentId}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{r.reservedDate}</td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">{r.expiryDate}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.status === "Ready for Pickup"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

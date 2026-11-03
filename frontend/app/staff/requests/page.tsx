"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, Filter, Search, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { useToast } from "@/components/ui/ToastProvider";

export default function StaffRequestsPage() {
  const { user } = useAuth();
  const { borrowingRequests, approveBorrowRequest, rejectBorrowRequest } = useLibraryStore();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState("All");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = borrowingRequests.filter((r) => {
    if (statusFilter === "All") return true;
    return r.status === statusFilter;
  });

  const handleApprove = (id: string, title: string) => {
    approveBorrowRequest(id, user?.name || "Library Staff");
    showToast({
      title: "Request Approved",
      description: `Loan request for "${title}" approved. Book checked out for 14 days.`,
      type: "success",
    });
  };

  const handleReject = () => {
    if (!rejectId) return;
    rejectBorrowRequest(rejectId, rejectReason || "Request declined by Library Staff.", user?.name || "Library Staff");
    showToast({
      title: "Request Declined",
      description: "Borrowing request has been declined.",
      type: "info",
    });
    setRejectId(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Borrowing Requests</h2>
          <p className="text-xs text-slate-500">Review, approve, and manage student loan requests</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="All">All Requests ({borrowingRequests.length})</option>
            <option value="Pending">Pending ({borrowingRequests.filter((r) => r.status === "Pending").length})</option>
            <option value="Approved">Approved</option>
            <option value="Declined">Declined</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Book Title</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Request Date</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900">{req.bookTitle}</p>
                    <p className="text-[11px] text-slate-500">By {req.author}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800">{req.studentName}</p>
                    <p className="text-[11px] text-slate-500">{req.studentId}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{req.requestDate}</td>
                  <td className="px-4 py-3.5 text-slate-600">14 days</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        req.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : req.status === "Pending"
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {req.status === "Pending" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(req.id, req.bookTitle)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectId(req.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Decline Borrowing Request</h3>
            <p className="mt-1 text-xs text-slate-500">
              Please enter the reason for declining this request.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Book currently in repair, student limit reached, etc."
              rows={3}
              className="mt-3 block w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectId(null)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

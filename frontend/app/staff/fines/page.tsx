"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useLibraryStore } from "@/lib/library-store";
import { useToast } from "@/components/ui/ToastProvider";

export default function StaffFinesPage() {
  const { fines, settleFine } = useLibraryStore();
  const { showToast } = useToast();
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  const handlePay = async (id: string, amount: number) => {
    setProcessingIds((current) => [...current, id]);
    try {
      const result = await settleFine(id);
      showToast({
        title: result.ok ? "Fine Settled" : "Payment Failed",
        description: result.ok
          ? `Payment of ₱${amount.toFixed(2)} recorded successfully at circulation desk.`
          : result.message,
        type: result.ok ? "success" : "warning",
      });
    } finally {
      setProcessingIds((current) => current.filter((fineId) => fineId !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Fines &amp; Overdue Accounts</h2>
        <p className="text-xs text-slate-500">Track overdue book penalties and settle payments</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Book</th>
                <th className="px-4 py-3">Borrower</th>
                <th className="px-4 py-3">Days Overdue</th>
                <th className="px-4 py-3">Fine Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fines.map((f) => {
                const isSettled = f.paymentStatus === "Paid";
                const isProcessing = processingIds.includes(f.id);
                return (
                  <tr key={f.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{f.bookTitle}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800">{f.studentName}</p>
                      <p className="text-[11px] text-slate-500">{f.studentId}</p>
                    </td>
                    <td className="px-4 py-3.5 text-rose-600 font-bold">{f.daysOverdue} days</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">₱{f.fineAmount.toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isSettled
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                        }`}
                      >
                        {isSettled ? "Paid" : f.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {!isSettled ? (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => void handlePay(f.id, f.fineAmount)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition disabled:cursor-wait disabled:opacity-60"
                        >
                          {!isProcessing && <CheckCircle2 className="h-3.5 w-3.5" />}
                          <span>{isProcessing ? "Saving..." : "Settle Fine"}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Settled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

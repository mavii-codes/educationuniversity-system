"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Library,
  Loader2,
  MapPin,
  X,
} from "lucide-react";
import { LibraryBook } from "@/types";
import { SessionUser } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { cn } from "@/lib/utils";
import { BookCover } from "@/components/library/BookCover";

interface BookDetailModalProps {
  book: LibraryBook | null;
  user: SessionUser | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BookDetailModal({
  book,
  user,
  onClose,
  onSuccess,
}: BookDetailModalProps) {
  const { submitBorrowRequest, submitReservation } = useLibraryStore();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  if (!book) return null;

  const isAvailable = book.availableCopies > 0;

  const handleAction = async () => {
    if (!user) return;
    setSubmitting(true);
    setFeedback(null);

    if (isAvailable) {
      const res = await submitBorrowRequest(book.id, user);
      setSubmitting(false);
      if (res.ok) {
        setFeedback({ type: "success", message: res.message });
        if (onSuccess) onSuccess();
      } else {
        setFeedback({ type: "error", message: res.message });
      }
    } else {
      const res = await submitReservation(book.id, user);
      setSubmitting(false);
      if (res.ok) {
        setFeedback({ type: "success", message: res.message });
        if (onSuccess) onSuccess();
      } else {
        setFeedback({ type: "error", message: res.message });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 uppercase tracking-wide">
                {book.category}
              </span>
              <h3 className="text-base font-semibold text-slate-900 sm:text-lg mt-0.5">
                {book.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex justify-center border-b border-slate-100 py-4">
          <BookCover src={book.cover_url} title={book.title} size="lg" />
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={cn(
              "mt-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-medium",
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-700"
            )}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="mt-5 space-y-4 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3.5 rounded-xl bg-slate-50/80 p-4 border border-slate-100">
            <div>
              <span className="text-[11px] font-medium text-slate-400">Author</span>
              <p className="font-semibold text-slate-900 mt-0.5">{book.author}</p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400">ISBN-13</span>
              <p className="font-mono font-medium text-slate-700 mt-0.5">{book.isbn}</p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400">Publisher</span>
              <p className="font-medium text-slate-800 mt-0.5">
                {book.publisher} ({book.publicationYear})
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400">Call Number</span>
              <p className="font-mono font-medium text-slate-700 mt-0.5">{book.callNumber}</p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400">Location / Shelf</span>
              <p className="font-medium text-slate-800 mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                {book.location}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400">Inventory Standing</span>
              <p className="font-medium text-slate-800 mt-0.5">
                <span className="font-bold text-slate-900">{book.availableCopies}</span> of{" "}
                {book.totalCopies} copies available
              </p>
            </div>
          </div>

          {/* Availability Status Badge */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  isAvailable ? "bg-emerald-500" : "bg-amber-500"
                )}
              />
              <span className="font-medium text-slate-700">
                {isAvailable ? "Available in Stack" : "Currently Checked Out"}
              </span>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                isAvailable
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              )}
            >
              {book.availableCopies} Copies Available
            </span>
          </div>

          {/* Policy Information */}
          <div className="rounded-xl bg-indigo-50/50 p-3.5 border border-indigo-100 text-slate-600">
            <p className="font-semibold text-indigo-950 mb-1">
              Circulation &amp; Borrowing Policy
            </p>
            <ul className="space-y-1 text-[11px] list-disc list-inside">
              <li>Standard loan period: 14 calendar days upon librarian checkout.</li>
              <li>Limit: maximum of 3 concurrent active loans per student account.</li>
              <li>Overdue rate: ₱15.00 / calendar day of delay past the scheduled due date.</li>
            </ul>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Close
          </button>

          {isAvailable ? (
            <button
              type="button"
              disabled={submitting}
              onClick={handleAction}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Submit Borrowing Request</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleAction}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Placing Reservation...</span>
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>Place Reservation on Next Return</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

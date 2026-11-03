"use client";

import React from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Coins,
  GraduationCap,
  Hash,
  Lock,
  Mail,
  QrCode,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";

export default function StudentProfilePage() {
  const { user } = useAuth();
  const { getStudentSummary } = useLibraryStore();

  const studentId = user?.studentId || user?.id || "2024-042";
  const summary = getStudentSummary(studentId);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Profile Header */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-2xl shadow-md shadow-indigo-600/20">
            {user?.name ? user.name[0] : "S"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/60">
                Authorized Library Borrower
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                Active Member
              </span>
            </div>
            <h2 className="mt-1.5 text-xl font-bold text-slate-900 sm:text-2xl">
              {user?.name || "Marco Villanueva"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {user?.programName || "BS Information Technology"} ·{" "}
              {user?.yearLevel || "2nd Year"}
            </p>
          </div>
        </div>
      </div>

      {/* Library Borrower Card Badge */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                University Library Card
              </p>
              <p className="text-[11px] text-slate-300">
                Digital Borrower Identification
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-indigo-200 bg-white/10 px-2.5 py-1 rounded-lg">
            {user?.borrowerCardNo || `LIB-${studentId}`}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-indigo-300">
              Cardholder Name
            </span>
            <p className="mt-1 font-bold text-sm text-white">{user?.name || "Student"}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-indigo-300">
              Student ID
            </span>
            <p className="mt-1 font-mono font-bold text-sm text-white">{studentId}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-indigo-300">
              Loan Allowance
            </span>
            <p className="mt-1 font-bold text-sm text-white">
              {summary.currentBorrowedCount} / 3 Books
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-indigo-300">
              Clearance Standing
            </span>
            <p className="mt-1 font-bold text-sm text-emerald-400">
              {summary.outstandingFinesTotal === 0 ? "Good Standing" : "Hold Active"}
            </p>
          </div>
        </div>

        {/* Mock Barcode Visualization */}
        <div className="mt-6 rounded-xl bg-white p-3.5 text-center text-slate-900">
          <div className="mx-auto flex h-10 w-full max-w-xs items-center justify-center gap-1">
            {[3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 2].map(
              (w, idx) => (
                <div
                  key={idx}
                  className="h-full bg-slate-900"
                  style={{ width: `${w * 2.5}px` }}
                />
              )
            )}
          </div>
          <p className="mt-1.5 font-mono text-[11px] font-bold tracking-widest text-slate-700">
            *{user?.borrowerCardNo || `LIB-${studentId}`}*
          </p>
        </div>
      </div>

      {/* Account Details Form Grid */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
          Academic Identity &amp; Profile Metadata
        </h3>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-400">
              University Email
            </label>
            <p className="mt-1 font-medium text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              {user?.email || "student@university.edu"}
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400">
              Student ID Number
            </label>
            <p className="mt-1 font-mono font-medium text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              {studentId}
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400">
              Academic Program
            </label>
            <p className="mt-1 font-medium text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              {user?.programName || "BS Information Technology (BSIT)"}
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400">
              Department / College
            </label>
            <p className="mt-1 font-medium text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              {user?.department || "College of Computing & Information Sciences"}
            </p>
          </div>
        </div>
      </div>

      {/* FERPA / GDPR Privacy Protection Compliance Notice */}
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Lock className="h-5 w-5" />
          </div>
          <div className="text-xs text-slate-600 space-y-1.5">
            <h4 className="font-bold text-slate-900">
              FERPA &amp; GDPR Student Data Privacy Notice
            </h4>
            <p className="leading-relaxed">
              Your borrowing records, circulation history, and fine balances are personal educational records protected under institutional data governance policies informed by <strong>FERPA</strong> and <strong>GDPR</strong> principles.
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500 pt-1">
              <li>Role-based isolation: only you and authorized library circulation staff can view your loans.</li>
              <li>No student-to-student exposure: search catalogs do not reveal which peer has checked out a title.</li>
              <li>Data minimization: only library management identifiers are synchronized through external LMS APIs.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


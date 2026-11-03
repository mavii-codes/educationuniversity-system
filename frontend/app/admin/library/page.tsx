"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookMarked,
  BookOpen,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
} from "lucide-react";
import {
  getLibraryBooks,
  getLibraryBorrowers,
  getLibraryFines,
  getLibraryOverview,
  getLibraryReservations,
  getLibraryTransactions,
  runLibraryETL,
} from "@/lib/api";
import {
  BorrowingTransaction,
  LibraryBook,
  LibraryOverview,
  OverdueFineRecord,
  ReservationRecord,
  StudentBorrower,
} from "@/types";
import { useToast } from "@/components/ui/ToastProvider";
import { formatNumber } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";

type LibraryTab =
  | "overview"
  | "requests"
  | "books"
  | "transactions"
  | "borrowers"
  | "reservations"
  | "fines";

export default function AdminLibraryPage() {
  const { user } = useAuth();
  const {
    borrowingRequests,
    transactions: storeTransactions,
    books: storeBooks,
    reservations: storeReservations,
    fines: storeFines,
    approveBorrowRequest,
    rejectBorrowRequest,
    confirmBookReturn,
  } = useLibraryStore();

  const [activeTab, setActiveTab] = useState<LibraryTab>("overview");
  const [overview, setOverview] = useState<LibraryOverview | null>(null);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [transactions, setTransactions] = useState<BorrowingTransaction[]>([]);
  const [borrowers, setBorrowers] = useState<StudentBorrower[]>([]);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [fines, setFines] = useState<OverdueFineRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [rejectModalReqId, setRejectModalReqId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ovData, bkData, txData, brwData, resData, fnData] =
        await Promise.all([
          getLibraryOverview(),
          getLibraryBooks(),
          getLibraryTransactions(),
          getLibraryBorrowers(),
          getLibraryReservations(),
          getLibraryFines(),
        ]);
      setOverview(ovData);
      setBooks(bkData);
      setTransactions(txData);
      setBorrowers(brwData);
      setReservations(resData);
      setFines(fnData);
    } catch {
      showToast({
        title: "Connection Alert",
        description: "Failed to load latest Library API records.",
        type: "warning",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTriggerETL = async () => {
    setSyncing(true);
    showToast({
      title: "ETL Pipeline Triggered",
      description: "Extracting, validating, deduplicating, and matching library records...",
      type: "info",
    });

    try {
      const log = await runLibraryETL("Admin Console");
      await loadData();
      showToast({
        title: "Library Synchronization Complete",
        description: `Ingested ${log.recordsLoaded} records. Cleaned ${log.duplicatesCleaned} duplicates. Matched ${log.studentsMatched} students.`,
        type: "success",
      });
    } catch {
      showToast({
        title: "ETL Sync Interrupted",
        description: "Unable to complete Library ETL pipeline.",
        type: "warning",
      });
    } finally {
      setSyncing(false);
    }
  };

  const effectiveTransactions =
    storeTransactions.length > 0 ? storeTransactions : transactions;
  const effectiveBooks = storeBooks.length > 0 ? storeBooks : books;
  const effectiveReservations =
    storeReservations.length > 0 ? storeReservations : reservations;
  const effectiveFines = storeFines.length > 0 ? storeFines : fines;

  const handleApproveRequest = async (id: string) => {
    const res = await approveBorrowRequest(id, user?.name || "Administrator");
    showToast({
      title: res.ok ? "Borrowing Request Approved" : "Action Failed",
      description: res.message,
      type: res.ok ? "success" : "warning",
    });
  };

  const handleRejectRequest = async () => {
    if (!rejectModalReqId) return;
    const res = await rejectBorrowRequest(
      rejectModalReqId,
      rejectReason.trim() || "Maximum borrowing quota exceeded.",
      user?.name || "Administrator"
    );
    setRejectModalReqId(null);
    setRejectReason("");
    showToast({
      title: "Request Rejected",
      description: res.message,
      type: "info",
    });
  };

  const handleConfirmReturn = async (id: string) => {
    const res = await confirmBookReturn(id);
    showToast({
      title: "Book Return Confirmed",
      description: res.message,
      type: res.fineAccrued > 0 ? "warning" : "success",
    });
  };

  // Filtered Books
  const filteredBooks = effectiveBooks.filter((b) => {
    const matchesSearch =
      searchQuery === "" ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn.includes(searchQuery) ||
      b.callNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || b.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filtered Transactions
  const filteredTransactions = effectiveTransactions.filter((t) => {
    const matchesSearch =
      searchQuery === "" ||
      t.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.studentId.includes(searchQuery) ||
      t.transactionCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Borrowers
  const filteredBorrowers = borrowers.filter((brw) => {
    const matchesSearch =
      searchQuery === "" ||
      brw.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brw.studentId.includes(searchQuery) ||
      brw.borrowerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brw.programCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const categories = [
    "All",
    "Computer Science",
    "Information Technology",
    "Business Administration",
    "Health Sciences & Nursing",
    "Engineering & Mathematics",
    "Education & Pedagogy",
  ];

  return (
    <div className="space-y-6">
      {/* Header and Live Status */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              First Working Integration · Active
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-500">
              Library LMS REST API Adapter
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Library Management System Integration
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Centralized ingestion of catalog books, borrowing transactions, student borrowers, reservations, and fine ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={syncing || loading}
            onClick={handleTriggerETL}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
            />
            <span>{syncing ? "Running ETL Pipeline..." : "Sync Library API"}</span>
          </button>
        </div>
      </div>

      {/* Scope & Governance Notice (Strict EDM Compliance Boundary) */}
      <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-4 text-xs text-blue-900">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
          <div className="space-y-1">
            <p className="font-semibold text-blue-950">
              Platform Integration Scope &amp; Privacy Governance
            </p>
            <p className="leading-relaxed text-blue-800">
              Circulation desks, checkout scans, physical book returns, and fine payments are operated directly within the external Library Management System.
              Our platform extracts, cleans, deduplicates, and cross-references library records with the student master for academic analytics and institutional audit.
              Privacy controls are informed by FERPA and GDPR principles (data minimization and role-based access). This does not claim formal legal compliance certification.
            </p>
          </div>
        </div>
      </div>

      {/* Quick KPIs Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
          <span className="text-[11px] font-medium text-slate-500">Integrated Books</span>
          <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
            {formatNumber(overview?.kpis.totalIntegratedBooks || 14850)}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Catalog synced</span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
          <span className="text-[11px] font-medium text-slate-500">Student Borrowers</span>
          <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
            {formatNumber(overview?.kpis.totalStudentBorrowers || 3420)}
          </p>
          <span className="text-[10px] text-indigo-600 font-medium">Matched by Student ID</span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
          <span className="text-[11px] font-medium text-slate-500">Total Transactions</span>
          <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
            {formatNumber(overview?.kpis.totalBorrowingTransactions || 8920)}
          </p>
          <span className="text-[10px] text-slate-500">Circulation loans</span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
          <span className="text-[11px] font-medium text-slate-500">Shelf Availability</span>
          <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
            {formatNumber(overview?.kpis.availableBooks || 11250)}
          </p>
          <span className="text-[10px] text-slate-500">3,600 currently on loan</span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
          <span className="text-[11px] font-medium text-slate-500">Overdue Items</span>
          <p className="mt-1 text-xl font-bold text-rose-600 tabular-nums">
            {formatNumber(overview?.kpis.overdueTransactions || 64)}
          </p>
          <span className="text-[10px] text-rose-500 font-medium">Clearance required</span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
          <span className="text-[11px] font-medium text-slate-500">API Connection</span>
          <p className="mt-1 text-sm font-bold text-emerald-600">
            REST Ingestion
          </p>
          <span className="text-[10px] text-slate-400">9-stage automated ETL</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          {[
            { id: "overview", label: "Overview & Health", icon: Database },
            {
              id: "requests",
              label: `Borrowing Requests (${borrowingRequests.filter((r) => r.status === "Pending").length})`,
              icon: Clock,
            },
            {
              id: "books",
              label: `Catalog Books (${effectiveBooks.length})`,
              icon: BookOpen,
            },
            {
              id: "transactions",
              label: `Borrowing Loans (${effectiveTransactions.length})`,
              icon: BookMarked,
            },
            {
              id: "borrowers",
              label: `Student Patrons (${borrowers.length})`,
              icon: UserCheck,
            },
            {
              id: "reservations",
              label: `Reservations (${effectiveReservations.length})`,
              icon: Clock,
            },
            {
              id: "fines",
              label: `Overdue & Fines (${effectiveFines.length})`,
              icon: AlertCircle,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as LibraryTab);
                  setSearchQuery("");
                }}
                className={`flex items-center gap-2 border-b-2 py-3 text-xs font-semibold transition ${
                  active
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW & CONNECTION HEALTH */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Connector Configuration Card */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
              <h3 className="text-sm font-bold text-slate-900">
                Library REST API Connector
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Configuration for external Koha/Folio/Alma automated data pull
              </p>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400">Endpoint URL:</span>
                  <p className="mt-0.5 rounded bg-slate-50 p-2 font-mono text-[11px] text-slate-800 break-all border border-slate-200/60">
                    https://lms-api.university-external.edu/v1 (Mock Adapter)
                  </p>
                </div>

                <div>
                  <span className="text-slate-400">Adapter Protocol:</span>
                  <p className="font-semibold text-slate-800">REST / JSON over TLS 1.3</p>
                </div>

                <div>
                  <span className="text-slate-400">Authentication:</span>
                  <p className="font-semibold text-slate-800">OAuth2 Bearer Token (Simulated)</p>
                </div>

                <div>
                  <span className="text-slate-400">Extraction Schedule:</span>
                  <p className="font-semibold text-slate-800">Hourly Incremental · Daily Full Reconciliation</p>
                </div>

                <div>
                  <span className="text-slate-400">Last Successful Sync:</span>
                  <p className="font-semibold text-emerald-700">{overview?.kpis.lastSyncTimestamp || "Just now"}</p>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <Link
                  href="/admin/library/records"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  <BookMarked className="h-4 w-4" />
                  <span>View Integrated Library Records</span>
                </Link>
              </div>
            </div>

            {/* Ingested Holdings by Category */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Holdings Breakdown by Category
                </h3>
                <span className="text-xs font-medium text-slate-500">
                  6 Curricular Categories
                </span>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {(overview?.categoryDistribution || []).map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{cat.category}</p>
                      <p className="text-[11px] text-slate-400">
                        {formatNumber(cat.count)} titles in catalog
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                        {formatNumber(cat.borrowed)} borrowed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BORROWING REQUESTS QUEUE */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Student Borrowing Requests Queue
                </h3>
                <p className="text-xs text-slate-500">
                  Review student requests, verify borrower limits, and approve or reject titles.
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
                    <th className="px-4 py-3 font-semibold">Request Code</th>
                    <th className="px-4 py-3 font-semibold">Book Title</th>
                    <th className="px-4 py-3 font-semibold">Student Borrower</th>
                    <th className="px-4 py-3 font-semibold">Date Requested</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Librarian Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {borrowingRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No student borrowing requests submitted yet.
                      </td>
                    </tr>
                  ) : (
                    borrowingRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-4 py-3 font-mono text-[11px] font-semibold text-slate-700">
                          {req.requestCode}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{req.bookTitle}</p>
                          <p className="text-[11px] text-slate-400 font-mono">ISBN: {req.isbn}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{req.studentName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">ID: {req.studentId} · {req.programCode}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(req.requestDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              req.status === "Approved"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                                : req.status === "Pending"
                                ? "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20"
                                : req.status === "Rejected"
                                ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {req.status}
                          </span>
                          {req.status === "Rejected" && req.rejectionReason && (
                            <p className="mt-1 text-[10px] text-rose-600 max-w-xs">{req.rejectionReason}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {req.status === "Pending" ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApproveRequest(req.id)}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectModalReqId(req.id);
                                  setRejectReason("");
                                }}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              {req.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATALOG BOOKS */}
      {activeTab === "books" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog by title, author, ISBN, or call number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="All">All Availability</option>
                <option value="Available">Available</option>
                <option value="Partially Available">Partially Available</option>
                <option value="Checked Out">Checked Out</option>
              </select>
            </div>
          </div>

          {/* Books Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-semibold">Title &amp; Author</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">ISBN</th>
                  <th className="px-4 py-3 font-semibold">Call Number</th>
                  <th className="px-4 py-3 font-semibold">Copies (Avail / Total)</th>
                  <th className="px-4 py-3 font-semibold">Shelf Location</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{b.title}</p>
                      <p className="text-[11px] text-slate-500">{b.author} · {b.publicationYear}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{b.category}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{b.isbn}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{b.callNumber}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <span className="text-emerald-700 font-semibold">{b.availableCopies}</span> / {b.totalCopies}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.location}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          b.status === "Available"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                            : b.status === "Partially Available"
                            ? "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20"
                            : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BORROWING TRANSACTIONS */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search loans by transaction code, book, or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="All">All Loan Statuses</option>
              <option value="Borrowed">Active Loan</option>
              <option value="Returned">Returned</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-semibold">Tx Code</th>
                  <th className="px-4 py-3 font-semibold">Book Title</th>
                  <th className="px-4 py-3 font-semibold">Student Borrower</th>
                  <th className="px-4 py-3 font-semibold">Program</th>
                  <th className="px-4 py-3 font-semibold">Loan Date</th>
                  <th className="px-4 py-3 font-semibold">Due Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Fine</th>
                  <th className="px-4 py-3 font-semibold text-right">Circulation Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono text-[11px] font-semibold text-slate-700">
                      {tx.transactionCode}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{tx.bookTitle}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{tx.studentName}</p>
                      <p className="font-mono text-[11px] text-slate-400">{tx.studentId}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-700">{tx.programCode}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(tx.borrowDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(tx.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          tx.status === "Returned"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                            : tx.status === "Borrowed"
                            ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20"
                            : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {tx.finesAccrued > 0 ? (
                        <span className="text-rose-600">₱{tx.finesAccrued.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tx.status !== "Returned" ? (
                        <button
                          type="button"
                          onClick={() => handleConfirmReturn(tx.id)}
                          className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-600 hover:text-white transition"
                        >
                          Confirm Return
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Returned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STUDENT BORROWERS */}
      {activeTab === "borrowers" && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, student ID, or card number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-semibold">Student Name</th>
                  <th className="px-4 py-3 font-semibold">Student ID</th>
                  <th className="px-4 py-3 font-semibold">Borrower Card</th>
                  <th className="px-4 py-3 font-semibold">Program</th>
                  <th className="px-4 py-3 font-semibold">Active Loans</th>
                  <th className="px-4 py-3 font-semibold">Total Loans</th>
                  <th className="px-4 py-3 font-semibold">Unpaid Fines</th>
                  <th className="px-4 py-3 font-semibold">Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBorrowers.map((brw) => (
                  <tr key={brw.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{brw.studentName}</p>
                      <p className="text-[11px] text-slate-400">{brw.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700 font-semibold">{brw.studentId}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{brw.borrowerId}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800">{brw.programCode}</span>
                      <span className="ml-1 text-slate-400">({brw.yearLevel})</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-700">{brw.activeLoansCount}</td>
                    <td className="px-4 py-3 text-slate-600">{brw.totalLoansHistory}</td>
                    <td className="px-4 py-3">
                      {brw.finesBalance > 0 ? (
                        <span className="font-semibold text-rose-600">₱{brw.finesBalance.toFixed(2)}</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          brw.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                            : brw.status === "Cleared"
                            ? "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20"
                            : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
                        }`}
                      >
                        {brw.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: RESERVATIONS */}
      {activeTab === "reservations" && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-semibold">Reservation Code</th>
                  <th className="px-4 py-3 font-semibold">Book Title</th>
                  <th className="px-4 py-3 font-semibold">Student Patron</th>
                  <th className="px-4 py-3 font-semibold">Program</th>
                  <th className="px-4 py-3 font-semibold">Reserved On</th>
                  <th className="px-4 py-3 font-semibold">Valid Until</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono text-[11px] font-semibold text-slate-700">
                      {r.reservationCode}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.bookTitle}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{r.studentName}</p>
                      <p className="font-mono text-[11px] text-slate-400">{r.studentId}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-700">{r.programCode}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(r.reservedDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(r.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          r.status === "Ready for Pickup"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                            : r.status === "Pending"
                            ? "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20"
                            : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-400/20"
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
      )}

      {/* TAB 6: OVERDUE RECORDS & FINES */}
      {activeTab === "fines" && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-semibold">Book Title</th>
                  <th className="px-4 py-3 font-semibold">Student Name</th>
                  <th className="px-4 py-3 font-semibold">Student ID</th>
                  <th className="px-4 py-3 font-semibold">Program</th>
                  <th className="px-4 py-3 font-semibold">Due Date</th>
                  <th className="px-4 py-3 font-semibold">Days Overdue</th>
                  <th className="px-4 py-3 font-semibold">Fine Amount</th>
                  <th className="px-4 py-3 font-semibold">Clearance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">{f.bookTitle}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{f.studentName}</td>
                    <td className="px-4 py-3 font-mono text-slate-700 font-semibold">{f.studentId}</td>
                    <td className="px-4 py-3 font-semibold text-indigo-700">{f.programCode}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(f.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-rose-600 tabular-nums">
                      {f.daysOverdue} days
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 tabular-nums">
                      ₱{f.fineAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                        {f.paymentStatus} (Hold Placed)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Borrowing Request Modal */}
      {rejectModalReqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setRejectModalReqId(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10 animate-in fade-in-0 zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              Reject Borrowing Request
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Please specify a clear reason for the student explaining why this borrowing request cannot be approved.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rejection Reason
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Maximum allowed active borrowings (3 books limit) reached. Please return overdue books."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectModalReqId(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectRequest}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

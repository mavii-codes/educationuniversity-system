"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  BookMarked,
  BookOpen,
  CheckCircle2,
  Download,
  Filter,
  Layers,
  RefreshCw,
  Search,
} from "lucide-react";
import { getBookCategories, getLibraryBooks } from "@/lib/api";
import { BookCategory, LibraryBook } from "@/types";
import { formatNumber } from "@/lib/utils";
import { BookCover } from "@/components/library/BookCover";
import { useAuth } from "@/lib/auth";

export default function IntegratedLibraryRecordsPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [bks, cats] = await Promise.all([
          getLibraryBooks(),
          getBookCategories(),
        ]);
        if (active) {
          setBooks(bks);
          setCategories(cats);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load library catalog records."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      searchQuery === "" ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn.includes(searchQuery) ||
      b.callNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || b.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "All" || b.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={
                user?.role === "Librarian"
                  ? "/staff/books"
                  : "/admin/library"
              }
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Library Hub</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-medium">Catalog Holdings</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Catalog Records
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Browse and manage the books, copies, and availability in your library catalog.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            alert("Exporting centralized library catalog records to CSV...");
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          <span>Export Catalog (CSV)</span>
        </button>
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Could not load catalog records</p>
              <p className="mt-1 text-xs">{loadError}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Retry
          </button>
        </div>
      )}

      {/* Category Summary Badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() =>
              setSelectedCategory(
                selectedCategory === c.name ? "All" : c.name
              )
            }
            className={`rounded-xl border p-3 text-left transition ${
              selectedCategory === c.name
                ? "border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-600/20"
                : "border-slate-200/80 bg-white hover:border-slate-300"
            }`}
          >
            <p className="truncate text-xs font-semibold text-slate-900" title={c.name}>
              {c.name}
            </p>
            <p className="mt-1 text-base font-bold text-indigo-700 tabular-nums">
              {formatNumber(c.totalTitles)}
            </p>
            <p className="text-[10px] text-slate-400">titles in collection</p>
          </button>
        ))}
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, author, ISBN, or call number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Partially Available">Partially Available</option>
            <option value="Checked Out">Checked Out</option>
          </select>
        </div>
      </div>

      {/* Holdings Records Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
              <th className="px-4 py-3 font-semibold">Book Title &amp; Author</th>
              <th className="px-4 py-3 font-semibold">Curricular Category</th>
              <th className="px-4 py-3 font-semibold">ISBN-13</th>
              <th className="px-4 py-3 font-semibold">Call Number</th>
              <th className="px-4 py-3 font-semibold">Available / Total Copies</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBooks.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  No catalog records match your search criteria.
                </td>
              </tr>
            ) : (
              filteredBooks.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <BookCover src={b.cover_url} title={b.title} size="sm" />
                      <div>
                        <p className="font-semibold text-slate-900">{b.title}</p>
                        <p className="text-[11px] text-slate-500">
                          {b.author} · {b.publisher} ({b.publicationYear})
                        </p>
                      </div>
                    </div>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

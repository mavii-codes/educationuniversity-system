"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  Loader2,
  MapPin,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { BookDetailModal } from "@/components/student/BookDetailModal";
import { BookCover } from "@/components/library/BookCover";
import { LibraryBook } from "@/types";
import { cn } from "@/lib/utils";

function BooksContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const { user } = useAuth();
  const { books } = useLibraryStore();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "available" | "checked-out"
  >("all");
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => set.add(b.category));
    return ["All", ...Array.from(set)];
  }, [books]);

  // Filter books
  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books.filter((b) => {
      const matchQuery =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q);

      const matchCategory =
        selectedCategory === "All" || b.category === selectedCategory;

      const matchAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && b.availableCopies > 0) ||
        (availabilityFilter === "checked-out" && b.availableCopies === 0);

      return matchQuery && matchCategory && matchAvailability;
    });
  }, [books, searchQuery, selectedCategory, availabilityFilter]);

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by book title, author, category, ISBN..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>

            {/* Availability Filter Buttons */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setAvailabilityFilter("all")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  availabilityFilter === "all"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                All Titles
              </button>
              <button
                type="button"
                onClick={() => setAvailabilityFilter("available")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  availabilityFilter === "available"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Available Now
              </button>
              <button
                type="button"
                onClick={() => setAvailabilityFilter("checked-out")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  availabilityFilter === "checked-out"
                    ? "bg-white text-amber-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Checked Out
              </button>
            </div>
          </div>
        </div>

        {/* Results Count & Active Filters */}
        <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-900">{filteredBooks.length}</strong> of{" "}
            {books.length} catalog items
          </span>
          {(searchQuery || selectedCategory !== "All" || availabilityFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setAvailabilityFilter("all");
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Book Grid */}
      {filteredBooks.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-sm">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-900">
            No books found matching your criteria
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search terms or clearing the active category filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
              setAvailabilityFilter("all");
            }}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Reset Catalog Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => {
            const isAvailable = book.availableCopies > 0;
            return (
              <div
                key={book.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition"
              >
                <div>
                  <div className="mb-4 flex justify-center">
                    <BookCover src={book.cover_url} title={book.title} size="md" />
                  </div>
                  {/* Top Category & Status Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                      {book.category}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                        isAvailable
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                          : "bg-amber-50 text-amber-700 border-amber-200/80"
                      )}
                    >
                      {isAvailable
                        ? `${book.availableCopies} Available`
                        : "Checked Out"}
                    </span>
                  </div>

                  {/* Title & Author */}
                  <h4 className="mt-3 text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition">
                    {book.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 font-medium">
                    {book.author}
                  </p>

                  {/* Metadata Chips */}
                  <div className="mt-3.5 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                    <p className="font-mono">ISBN: {book.isbn}</p>
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{book.location}</span>
                    </p>
                    <p>
                      Publisher: {book.publisher} ({book.publicationYear})
                    </p>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-5 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedBook(book)}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold shadow-sm transition",
                      isAvailable
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                    )}
                  >
                    {isAvailable ? (
                      <>
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>View Details &amp; Borrow</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3.5 w-3.5" />
                        <span>View Details &amp; Reserve</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Detail & Action Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          user={user}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
}

export default function StudentBrowseBooksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-12 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-xs font-medium text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <span>Loading book catalog...</span>
          </div>
        </div>
      }
    >
      <BooksContent />
    </Suspense>
  );
}

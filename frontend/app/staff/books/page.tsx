"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  Loader2,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  API_CONFIG,
  createLibraryBook,
  getLibraryBooks,
  lookupLibraryBookCover,
  updateLibraryBook,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLibraryStore } from "@/lib/library-store";
import { useToast } from "@/components/ui/ToastProvider";
import { BookCover } from "@/components/library/BookCover";
import { LibraryBookForm } from "@/components/admin/LibraryBookForm";
import { LibraryBook, LibraryBookInput } from "@/types";

function buildMockBook(
  input: LibraryBookInput,
  coverUrl: string | null,
  base: LibraryBook | null
): LibraryBook {
  const borrowedCopies = Math.max(0, input.totalCopies - input.availableCopies);
  return {
    id: base?.id ?? `local-book-${Date.now()}`,
    isbn: input.isbn,
    bookPrice: input.bookPrice,
    cover_url: coverUrl,
    title: input.title,
    author: input.author,
    publisher: input.publisher,
    publicationYear: input.publicationYear,
    category: input.category,
    callNumber: input.callNumber,
    totalCopies: input.totalCopies,
    availableCopies: input.availableCopies,
    borrowedCopies,
    location: input.location,
    status:
      input.availableCopies === 0
        ? "Checked Out"
        : borrowedCopies > 0
          ? "Partially Available"
          : "Available",
    lastSyncedAt: new Date().toISOString(),
  };
}

function statusClasses(status: LibraryBook["status"]): string {
  if (status === "Available") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }
  if (status === "Partially Available") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }
  return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
}

function StaffBooksFallback() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-12 shadow-xs">
      <div className="flex flex-col items-center gap-3 text-xs font-medium text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
        <span>Loading book catalog...</span>
      </div>
    </div>
  );
}

interface CopiesStepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}

function CopiesStepper({ label, value, min, max, onChange }: CopiesStepperProps) {
  const clamp = (next: number) =>
    Math.max(min, Math.min(max, Math.floor(Number.isFinite(next) ? next : min)));

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <span className="text-[10px] text-slate-400">
          Min {min} · Max {max}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - 1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(clamp(Number(event.target.value)))}
          className="h-9 w-20 rounded-lg border border-slate-200 bg-white text-center text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 5))}
          className="h-9 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +5
        </button>
      </div>
    </div>
  );
}

interface RestockModalProps {
  book: LibraryBook;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (totalCopies: number, availableCopies: number) => Promise<void>;
}

function RestockModal({ book, saving, onCancel, onConfirm }: RestockModalProps) {
  const [totalCopies, setTotalCopies] = useState(book.totalCopies);
  const [availableCopies, setAvailableCopies] = useState(book.availableCopies);
  const [error, setError] = useState("");

  const updateTotal = (nextTotal: number) => {
    const delta = nextTotal - totalCopies;
    setTotalCopies(nextTotal);
    setAvailableCopies((current) =>
      delta > 0
        ? Math.min(nextTotal, current + delta)
        : Math.min(current, nextTotal)
    );
    setError("");
  };

  const updateAvailable = (nextAvailable: number) => {
    setAvailableCopies(nextAvailable);
    setError("");
  };

  const handleConfirm = async () => {
    if (totalCopies < 1) {
      setError("Total copies must be at least 1.");
      return;
    }
    if (availableCopies > totalCopies) {
      setError("Available copies cannot exceed total copies.");
      return;
    }
    if (totalCopies < book.borrowedCopies) {
      setError(
        `Total copies cannot be lower than the ${book.borrowedCopies} copy(s) currently on loan.`
      );
      return;
    }
    setError("");
    await onConfirm(totalCopies, availableCopies);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="restock-modal-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          <BookCover src={book.cover_url} title={book.title} size="sm" />
          <div className="min-w-0">
            <h3
              id="restock-modal-title"
              className="text-base font-bold text-slate-900"
            >
              Restock Copies
            </h3>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-700">
              {book.title}
            </p>
            <p className="text-[11px] text-slate-500">
              {book.availableCopies} available · {book.totalCopies} total ·{" "}
              {book.borrowedCopies} on loan
            </p>
          </div>
        </div>

        <p className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-[11px] leading-relaxed text-indigo-800">
          Restocking adds new physical copies to the shelf. Increasing total
          copies also adds them to availability; adjust Available copies
          separately to account for damaged or returned units.
        </p>

        <div className="mt-4 grid gap-4">
          <CopiesStepper
            label="Total copies"
            value={totalCopies}
            min={Math.max(1, book.borrowedCopies)}
            max={9999}
            onChange={updateTotal}
          />
          <CopiesStepper
            label="Available copies"
            value={availableCopies}
            min={0}
            max={totalCopies}
            onChange={updateAvailable}
          />
        </div>

        {error && (
          <p role="alert" className="mt-3 text-xs font-medium text-rose-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {saving ? "Restocking..." : "Confirm Restock"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffBooksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { books: storeBooks, upsertBook } = useLibraryStore();

  const isLive = API_CONFIG.useLiveApi;
  const canManageBooks =
    user?.role === "Librarian" || user?.role === "Administrator";

  const [liveBooks, setLiveBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(isLive);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // undefined = closed, null = adding, LibraryBook = editing.
  const [bookEditor, setBookEditor] = useState<
    LibraryBook | null | undefined
  >(undefined);
  const [bookSaving, setBookSaving] = useState(false);
  const [restockTarget, setRestockTarget] = useState<LibraryBook | null>(null);
  const [restockSaving, setRestockSaving] = useState(false);

  const sourceBooks = isLive ? liveBooks : storeBooks;

  // Live catalog fetch. The mock demo store stays authoritative when the live
  // API is disabled, so local add/edit actions still reflect immediately.
  useEffect(() => {
    if (!isLive) {
      setLoading(false);
      setLoadError(null);
      return;
    }

    let active = true;
    setLoading(true);
    const timer = window.setTimeout(() => {
      const query = searchQuery.trim();
      getLibraryBooks(query ? { search: query } : undefined)
        .then((list) => {
          if (!active) return;
          setLiveBooks(list);
          setLoadError(null);
        })
        .catch((error: unknown) => {
          if (!active) return;
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load the book catalog."
          );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isLive, searchQuery, loadAttempt]);

  const categories = useMemo(() => {
    const names = new Set(
      sourceBooks.map((book) => book.category).filter(Boolean)
    );
    return ["All", ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [sourceBooks]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sourceBooks.filter((book) => {
      const matchesSearch =
        query === "" ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn.toLowerCase().includes(query) ||
        book.callNumber.toLowerCase().includes(query);
      const matchesCategory =
        categoryFilter === "All" || book.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [sourceBooks, searchQuery, categoryFilter]);

  // Deep links from the Borrowing Requests toolbar: ?add=1 opens the add form,
  // ?restock=1 opens restock on the first loaded book. Handle once, then strip
  // the query so closing the dialog does not reopen it.
  const handledQueryRef = useRef(false);

  const clearQueryParams = useCallback(() => {
    if (
      searchParams.get("add") === "1" ||
      searchParams.get("restock") === "1"
    ) {
      router.replace("/staff/books", { scroll: false });
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (handledQueryRef.current || !canManageBooks) return;
    if (searchParams.get("add") === "1") {
      handledQueryRef.current = true;
      setBookEditor(null);
      clearQueryParams();
    }
  }, [searchParams, canManageBooks, clearQueryParams]);

  useEffect(() => {
    if (
      handledQueryRef.current ||
      !canManageBooks ||
      searchParams.get("restock") !== "1"
    ) {
      return;
    }
    if (loading || sourceBooks.length === 0) return;
    handledQueryRef.current = true;
    setRestockTarget(sourceBooks[0]);
    clearQueryParams();
  }, [
    searchParams,
    canManageBooks,
    loading,
    sourceBooks,
    clearQueryParams,
  ]);

  const handleRefreshBookCover = useCallback(
    (input: LibraryBookInput) =>
      lookupLibraryBookCover({
        isbn: input.isbn,
        title: input.title,
        author: input.author,
      }),
    []
  );

  const handleSaveBook = async (
    input: LibraryBookInput,
    coverFile?: File | null
  ) => {
    const editingBook = bookEditor ?? null;
    setBookSaving(true);
    try {
      if (coverFile && !isLive) {
        throw new Error("Cover uploads require the live API to be enabled.");
      }

      if (isLive) {
        if (editingBook) {
          await updateLibraryBook(editingBook.id, input, coverFile);
        } else {
          await createLibraryBook(input, coverFile);
        }
        setLoadAttempt((attempt) => attempt + 1);
      } else {
        let coverUrl = input.cover_url;
        const identityChanged =
          !editingBook ||
          input.isbn !== editingBook.isbn ||
          input.title !== editingBook.title ||
          input.author !== editingBook.author;
        if (identityChanged && !coverUrl) {
          try {
            coverUrl = await handleRefreshBookCover(input);
          } catch {
            coverUrl = null;
          }
        }
        upsertBook(buildMockBook(input, coverUrl, editingBook));
      }

      setBookEditor(undefined);
      showToast({
        title: editingBook ? "Book updated" : "Book added",
        description: `${input.title} is ${editingBook ? "updated in" : "added to"} the catalog.`,
        type: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to save book",
        description:
          error instanceof Error
            ? error.message
            : "The book could not be saved.",
        type: "warning",
      });
    } finally {
      setBookSaving(false);
    }
  };

  const handleRestock = async (
    book: LibraryBook,
    totalCopies: number,
    availableCopies: number
  ) => {
    const input: LibraryBookInput = {
      isbn: book.isbn,
      bookPrice: book.bookPrice ?? 0,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      publicationYear: book.publicationYear,
      category: book.category,
      callNumber: book.callNumber,
      totalCopies,
      availableCopies,
      location: book.location,
      cover_url: book.cover_url ?? null,
    };

    setRestockSaving(true);
    try {
      if (isLive) {
        await updateLibraryBook(book.id, input);
        setLoadAttempt((attempt) => attempt + 1);
      } else {
        upsertBook(buildMockBook(input, book.cover_url ?? null, book));
      }
      setRestockTarget(null);
      showToast({
        title: "Copies restocked",
        description: `${book.title} now has ${availableCopies} available of ${totalCopies} total copies.`,
        type: "success",
      });
    } catch (error) {
      showToast({
        title: "Restock failed",
        description:
          error instanceof Error
            ? error.message
            : "The copy count could not be updated.",
        type: "warning",
      });
    } finally {
      setRestockSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Book Management
          </h2>
          <p className="text-xs text-slate-500">
            Add books, organize shelving details, and restock copies for the
            university collection
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, authors, ISBN..."
              className="rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
            />
            {loading && (
              <Loader2 className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 animate-spin text-indigo-500" />
            )}
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-hidden"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {canManageBooks && (
            <button
              type="button"
              onClick={() => setBookEditor(null)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Book</span>
            </button>
          )}
        </div>
      </div>

      {!canManageBooks && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500">
          Read-only catalog view. Book editing and restocking are limited to
          Librarian and Administrator accounts.
        </p>
      )}

      {loadError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Could not load the book catalog</p>
              <p className="mt-1 text-xs">{loadError}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Retry
          </button>
        </div>
      )}

      {/* Books Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Book Details</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Call No.</th>
                <th className="px-4 py-3">Shelf Location</th>
                <th className="px-4 py-3">Copies</th>
                <th className="px-4 py-3">Status</th>
                {canManageBooks && (
                  <th className="px-5 py-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && sourceBooks.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManageBooks ? 7 : 6}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    <span className="inline-flex items-center gap-2 text-xs font-medium">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                      Loading catalog records...
                    </span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManageBooks ? 7 : 6}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    {loadError
                      ? "Catalog records are unavailable right now."
                      : "No books match your search criteria."}
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="transition hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <BookCover src={b.cover_url} title={b.title} size="sm" />
                        <div>
                          <p className="font-bold text-slate-900">{b.title}</p>
                          <p className="text-[11px] text-slate-500">
                            By {b.author} · ISBN: {b.isbn}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">{b.category}</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                      {b.callNumber || "—"}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                      {b.location || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900 tabular-nums">
                        <span className="text-emerald-700">
                          {b.availableCopies}
                        </span>{" "}
                        / {b.totalCopies}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {b.borrowedCopies} on loan
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClasses(b.status)}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    {canManageBooks && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setRestockTarget(b)}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Restock Copies</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookEditor(b)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <BookOpen className="h-3.5 w-3.5" />
        {filtered.length} book{filtered.length === 1 ? "" : "s"} shown
        {canManageBooks
          ? " · Use Edit to organize category, call number, and shelf location."
          : ""}
      </p>

      {canManageBooks && bookEditor !== undefined && (
        <LibraryBookForm
          book={bookEditor}
          saving={bookSaving}
          onCancel={() => setBookEditor(undefined)}
          onRefresh={handleRefreshBookCover}
          onSubmit={handleSaveBook}
        />
      )}

      {canManageBooks && restockTarget && (
        <RestockModal
          key={restockTarget.id}
          book={restockTarget}
          saving={restockSaving}
          onCancel={() => setRestockTarget(null)}
          onConfirm={(totalCopies, availableCopies) =>
            handleRestock(restockTarget, totalCopies, availableCopies)
          }
        />
      )}
    </div>
  );
}

export default function StaffBooksPage() {
  return (
    <Suspense fallback={<StaffBooksFallback />}>
      <StaffBooksContent />
    </Suspense>
  );
}

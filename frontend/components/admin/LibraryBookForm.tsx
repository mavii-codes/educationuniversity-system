"use client";

import React, { DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import { BookCover } from "@/components/library/BookCover";
import { LibraryBook, LibraryBookInput } from "@/types";

interface LibraryBookFormProps {
  book: LibraryBook | null;
  saving: boolean;
  onCancel: () => void;
  onRefresh: (input: LibraryBookInput) => Promise<string | null>;
  onSubmit: (
    input: LibraryBookInput,
    coverFile?: File | null
  ) => Promise<void>;
}

function getInitialInput(book: LibraryBook | null): LibraryBookInput {
  return {
    isbn: book?.isbn ?? "",
    title: book?.title ?? "",
    author: book?.author ?? "",
    publisher: book?.publisher ?? "",
    publicationYear: book?.publicationYear ?? new Date().getFullYear(),
    category: book?.category ?? "",
    callNumber: book?.callNumber ?? "",
    totalCopies: book?.totalCopies ?? 1,
    availableCopies: book?.availableCopies ?? 1,
    location: book?.location ?? "",
    cover_url: book?.cover_url ?? null,
  };
}

export function LibraryBookForm({
  book,
  saving,
  onCancel,
  onRefresh,
  onSubmit,
}: LibraryBookFormProps) {
  const [form, setForm] = useState(() => getInitialInput(book));
  const [refreshing, setRefreshing] = useState(false);
  const [coverMessage, setCoverMessage] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(getInitialInput(book));
    setCoverFile(null);
    setCoverPreview(null);
    setUploadError("");
    setCoverMessage("");
  }, [book]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(coverFile);
    setCoverPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [coverFile]);

  const update = <K extends keyof LibraryBookInput>(
    key: K,
    value: LibraryBookInput[K]
  ) => setForm((current) => ({ ...current, [key]: value }));

  const handleRefresh = async () => {
    setRefreshing(true);
    setCoverMessage("");
    try {
      const coverUrl = await onRefresh(form);
      update("cover_url", coverUrl);
      setCoverMessage(
        coverUrl ? "Cover found." : "No cover found. You can enter a URL manually."
      );
    } catch (error) {
      setCoverMessage(
        error instanceof Error ? error.message : "Cover lookup failed."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(form, coverFile);
  };

  const chooseCover = (file?: File) => {
    setUploadError("");
    if (!file) return;
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedMimeTypes.includes(file.type) || !allowedExtensions.includes(extension)) {
      setUploadError("Choose a JPG, JPEG, PNG, or WebP image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Cover image must be 2 MB or smaller.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setCoverFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    chooseCover(event.dataTransfer.files[0]);
  };

  const textField = (
    label: string,
    key: keyof Pick<
      LibraryBookInput,
      | "isbn"
      | "title"
      | "author"
      | "publisher"
      | "category"
      | "callNumber"
      | "location"
    >,
    required = false
  ) => (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <input
        required={required}
        value={form[key]}
        onChange={(event) => update(key, event.target.value)}
        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-normal text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-5">
          <h3 className="text-lg font-bold text-slate-900">
            {book ? "Edit Book" : "Add Book"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Cover lookup runs automatically for new or changed ISBN, title, or author.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-[1fr_auto]">
          <div className="grid gap-3 sm:grid-cols-2">
            {textField("Title", "title", true)}
            {textField("Author", "author", true)}
            {textField("ISBN", "isbn")}
            {textField("Publisher", "publisher")}
            <label className="block text-xs font-semibold text-slate-700">
              Publication year
              <input
                type="number"
                min={0}
                max={3000}
                required
                value={form.publicationYear}
                onChange={(event) =>
                  update("publicationYear", Number(event.target.value))
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-normal text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </label>
            {textField("Category", "category", true)}
            {textField("Call number", "callNumber")}
            {textField("Shelf location", "location")}
            <label className="block text-xs font-semibold text-slate-700">
              Total copies
              <input
                type="number"
                min={1}
                required
                value={form.totalCopies}
                onChange={(event) =>
                  update("totalCopies", Number(event.target.value))
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-normal text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Available copies
              <input
                type="number"
                min={0}
                max={form.totalCopies}
                required
                value={form.availableCopies}
                onChange={(event) =>
                  update("availableCopies", Number(event.target.value))
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-normal text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="flex flex-col items-center gap-3">
            <BookCover
              src={coverPreview ?? form.cover_url}
              title={form.title || "Book"}
              size="md"
            />
            <button
              type="button"
              disabled={refreshing || !form.title.trim()}
              onClick={handleRefresh}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh cover"}
            </button>
          </div>

          <label className="block text-xs font-semibold text-slate-700 md:col-span-2">
            Cover image URL (optional manual override)
            <input
              type="url"
              value={form.cover_url ?? ""}
              onChange={(event) =>
                update("cover_url", event.target.value || null)
              }
              placeholder="https://..."
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
            />
            {coverMessage && (
              <span className="mt-1 block font-normal text-slate-500">
                {coverMessage}
              </span>
            )}
          </label>

          <div className="md:col-span-2">
            <span className="block text-xs font-semibold text-slate-700">
              Upload cover (optional)
            </span>
            <label
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className="mt-1.5 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40"
            >
              <span className="text-xs font-semibold text-indigo-700">
                Drag an image here or click to choose
              </span>
              <span className="mt-1 text-[11px] text-slate-500">
                JPG, PNG, or WebP · Maximum 2 MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => chooseCover(event.target.files?.[0])}
              />
            </label>
            {coverFile && (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
                <span className="min-w-0 truncate text-slate-700">
                  {coverFile.name} · {(coverFile.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCoverFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="shrink-0 font-semibold text-rose-600 hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
            )}
            {uploadError && (
              <p role="alert" className="mt-1 text-xs text-rose-600">
                {uploadError}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : book ? "Save changes" : "Add book"}
          </button>
        </div>
      </form>
    </div>
  );
}

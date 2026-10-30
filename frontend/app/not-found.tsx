import React from "react";
import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-6 py-20 text-center shadow-card">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
        <Compass className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-slate-900">
        Page not found
      </h2>
      <p className="mt-1.5 max-w-md text-sm text-slate-500">
        We couldn&apos;t find the module or student record you were looking for. Return to the Admin Portal to continue managing university data.
      </p>
      <Link
        href="/admin/dashboard"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
      >
        Back to Admin Portal
      </Link>
    </div>
  );
}


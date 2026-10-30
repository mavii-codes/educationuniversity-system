"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";
import {
  LoginBrandingPanel,
  LoginSubtleBackground,
} from "@/components/login/LoginBrandingPanel";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your university email.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid university email address.");
      return;
    }

    setIsSending(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    setIsSending(false);
    setSubmitted(true);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12 sm:px-6 lg:px-8">
      <LoginSubtleBackground />

      <div className="relative z-10 flex w-full max-w-[440px] flex-col items-center">
        <LoginBrandingPanel />

        <div className="w-full rounded-2xl border border-slate-200/90 bg-white p-7 shadow-card sm:p-9">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                Check your university email
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                If an administrator account matches{" "}
                <strong className="font-semibold text-slate-900">{email}</strong>,
                a password reset link has been sent.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  Reset password
                </h2>
                <p className="mt-1.5 text-sm text-slate-500">
                  Enter your university email to receive a password reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    University Email
                  </label>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="admin@university.edu"
                      className={cn(
                        "h-11 w-full rounded-xl border bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2",
                        error
                          ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/15"
                          : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-500/15"
                      )}
                    />
                  </div>
                  {error && (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">
                      {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-75"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition hover:text-indigo-600"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

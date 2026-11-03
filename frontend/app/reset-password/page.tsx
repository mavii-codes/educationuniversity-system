"use client";

import React, { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import {
  LoginBrandingPanel,
  LoginSubtleBackground,
} from "@/components/login/LoginBrandingPanel";
import { API_CONFIG } from "@/lib/api";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  useEffect(() => {
    const resetToken = new URLSearchParams(window.location.search).get("token") || "";
    setToken(resetToken);
    if (resetToken) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is invalid. Request a new one.");
      return;
    }
    if (password.length < 12) {
      setError("Your password must be at least 12 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok) {
        throw new Error(body.message || "Unable to reset your password.");
      }
      setCompleted(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to reach the server. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12 sm:px-6 lg:px-8">
      <LoginSubtleBackground />
      <div className="relative z-10 flex w-full max-w-[440px] flex-col items-center">
        <LoginBrandingPanel />
        <div className="w-full rounded-2xl border border-slate-200/90 bg-white p-7 shadow-card sm:p-9">
          {completed ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Password updated
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Your password has been changed. Sign in with your new password.
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
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  Choose a new password
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  Use at least 12 characters.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    New password
                  </label>
                  <div className="relative mt-1.5">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={12}
                      maxLength={200}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={200}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                  />
                </div>
                {error && (
                  <p role="alert" className="text-xs font-medium text-rose-600">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-75"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </form>
              <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition hover:text-indigo-600"
                >
                  Request another reset link
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

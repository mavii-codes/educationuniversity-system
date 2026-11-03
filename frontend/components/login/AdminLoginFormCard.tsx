"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { API_CONFIG } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function AdminLoginFormCard() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation errors
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdentifierError("");
    setPasswordError("");
    setFormError("");

    let hasValidationError = false;
    if (!identifier.trim()) {
      setIdentifierError("Please enter your university administrator email.");
      hasValidationError = true;
    }
    if (!password) {
      setPasswordError("Please enter your administrative password.");
      hasValidationError = true;
    }
    if (hasValidationError) return;

    setIsSubmitting(true);
    const result = await signIn({
      identifier,
      password,
      rememberMe,
      expectedRole: "Administrator",
    });

    if (!result.ok) {
      setFormError(
        result.error ||
          "Invalid administrative credentials. Please verify your login details and try again."
      );
      setIsSubmitting(false);
      return;
    }

    router.push("/admin/dashboard");
  };

  return (
    <div className="w-full max-w-[460px]">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
        {/* Administrator Portal Badge Header */}
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span>Administrator / Librarian Portal</span>
          </div>

          <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Institutional Sign In
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Sign in with administrative credentials for external Library API
            data integration, circulation administration, and system governance.
          </p>
        </div>

        {/* Mock-mode demo hint (hidden entirely against the live API) */}
        {!API_CONFIG.useLiveApi && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[11px] leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-700">
              Demo credentials (mock mode)
            </p>
            <p className="mt-1 font-mono">
              Admin: admin@university.edu / Admin123!
            </p>
            <p className="font-mono">
              Registrar: registrar@university.edu / Registrar123!
            </p>
          </div>
        )}

        {/* Global Error Banner */}
        {formError && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div className="flex-1 leading-relaxed">{formError}</div>
          </div>
        )}

        {/* Administrative Sign In Form */}
        <form onSubmit={handleSignInSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="admin-identifier"
              className="block text-xs font-semibold text-slate-700"
            >
              Institutional Email / Username
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="admin-identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (identifierError) setIdentifierError("");
                }}
                placeholder="admin@university.edu"
                className={cn(
                  "h-10 w-full rounded-xl border bg-white pl-10 pr-3.5 text-xs text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2",
                  identifierError
                    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/15"
                    : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-500/15"
                )}
              />
            </div>
            {identifierError && (
              <p className="mt-1 text-[11px] font-medium text-rose-600">
                {identifierError}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-slate-700"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                placeholder="Enter administrative password"
                className={cn(
                  "h-10 w-full rounded-xl border bg-white pl-10 pr-10 text-xs text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2",
                  passwordError
                    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/15"
                    : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-500/15"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordError && (
              <p className="mt-1 text-[11px] font-medium text-rose-600">
                {passwordError}
              </p>
            )}
          </div>

          <div className="flex items-center">
            <input
              id="admin-remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
            />
            <label
              htmlFor="admin-remember"
              className="ml-2 text-xs font-medium text-slate-600 select-none cursor-pointer"
            >
              Keep me signed in
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-75"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In as Administrator</span>
            )}
          </button>
        </form>

        {/* Clear Portal Separator Footnote to Student Login */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-[11px] text-slate-500">
            Looking for the Student Library Portal?
          </p>
          <Link
            href="/login"
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            <span>Go to Student / Member Portal</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
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

  // Form Validation & Error state
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
      setIdentifierError("Please enter your institutional email or username.");
      hasValidationError = true;
    }
    if (!password) {
      setPasswordError("Please enter your password.");
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
    <div className="w-full max-w-[420px]">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
        {/* Administrator / Library Staff Portal Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-[11px] font-semibold text-indigo-700">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
          <span>Administrator / Library Staff Portal</span>
        </div>

          <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Institutional Sign In
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Sign in with administrative credentials for external Library API
            data integration, circulation administration, and system governance.
          </p>

        {/* Error Alert Box */}
        {formError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-700 shadow-xs"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <span className="leading-relaxed">{formError}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSignInSubmit} className="mt-5 space-y-4" noValidate>
          {/* Institutional Email / Username */}
          <div>
            <label
              htmlFor="admin-identifier"
              className="block text-xs font-semibold text-slate-700"
            >
              Institutional Email / Username
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                id="admin-identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (identifierError) setIdentifierError("");
                  if (formError) setFormError("");
                }}
                placeholder="Enter your institutional email or username"
                className={cn(
                  "block w-full rounded-xl border bg-slate-50/60 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition",
                  identifierError
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                )}
              />
            </div>
            {identifierError && (
              <p className="mt-1 text-xs text-rose-600 font-medium">
                {identifierError}
              </p>
            )}
          </div>

          {/* Password */}
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
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                  if (formError) setFormError("");
                }}
                placeholder="Enter your password"
                className={cn(
                  "block w-full rounded-xl border bg-slate-50/60 py-2.5 pl-9 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition",
                  passwordError
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordError && (
              <p className="mt-1 text-xs text-rose-600 font-medium">
                {passwordError}
              </p>
            )}
          </div>

          {/* Keep me signed in */}
          <div className="flex items-center pt-0.5">
            <input
              id="admin-remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
            />
            <label
              htmlFor="admin-remember-me"
              className="ml-2 block text-xs text-slate-600 select-none"
            >
              Keep me signed in
            </label>
          </div>

          {/* Primary Action Button: Sign In */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center rounded-xl bg-indigo-600 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Clean bottom with subtle security statement */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <Lock className="h-3 w-3 text-slate-400" />
            <span>Secure administrative access</span>
          </p>
        </div>
      </div>
    </div>
  );
}

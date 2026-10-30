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
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function LoginFormCard() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdentifierError("");
    setPasswordError("");
    setFormError("");

    let hasValidationError = false;
    if (!identifier.trim()) {
      setIdentifierError("Please enter your university email.");
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
    });

    if (!result.ok) {
      setFormError(
        result.error ||
          "Invalid email or password. Please check your credentials and try again."
      );
      setIsSubmitting(false);
      return;
    }

    router.push(
      result.role === "Registrar" ? "/registrar/alumni" : "/admin/dashboard"
    );
  };

  const handleUseDemoCredentials = () => {
    setIdentifier("admin@university.edu");
    setPassword("Admin123!");
    setIdentifierError("");
    setPasswordError("");
    setFormError("");
  };

  return (
    <div className="w-full max-w-[440px]">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-card sm:p-9">
        <div className="text-center">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Sign in to the Admin Portal
          </p>
        </div>

        {/* Invalid Credentials Error Alert */}
        {formError && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <span className="font-medium leading-relaxed">{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          {/* University Email / Admin ID */}
          <div>
            <label
              htmlFor="admin-identifier"
              className="block text-xs font-semibold text-slate-700"
            >
              University Email / Admin ID
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
                  if (formError) setFormError("");
                }}
                placeholder="admin@university.edu"
                className={cn(
                  "h-11 w-full rounded-xl border bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2",
                  identifierError
                    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/15"
                    : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-500/15"
                )}
              />
            </div>
            {identifierError && (
              <p className="mt-1.5 text-xs font-medium text-rose-600">
                {identifierError}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-slate-700"
            >
              Password
            </label>
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
                  if (formError) setFormError("");
                }}
                placeholder="Enter your password"
                className={cn(
                  "h-11 w-full rounded-xl border bg-white pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2",
                  passwordError
                    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/15"
                    : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-500/15"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
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
              <p className="mt-1.5 text-xs font-medium text-rose-600">
                {passwordError}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Remember me</span>
            </label>

            <Link
              href="/forgot-password"
              className="text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              Forgot password?
            </Link>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-75"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Admin Access Only Notice + Subtle Development Credential Fill */}
        <div className="mt-6 border-t border-slate-100 pt-5 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>Admin access only</span>
          </div>

          <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[11px] text-slate-500">
            <span>Demo credentials: </span>
            <button
              type="button"
              onClick={handleUseDemoCredentials}
              className="font-mono font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 transition hover:text-indigo-700"
            >
              admin@university.edu / Admin123!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

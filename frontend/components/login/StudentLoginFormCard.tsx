"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "register";
type PortalRole = "student" | "admin" | "librarian";

export function StudentLoginFormCard() {
  const router = useRouter();
  const { signIn, registerStudent } = useAuth();

  const [activePortal, setActivePortal] = useState<PortalRole>("student");
  const [mode, setMode] = useState<AuthMode>("signin");

  // Sign In state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student Registration state
  const [regName, setRegName] = useState("");
  const [regStudentId, setRegStudentId] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regProgram, setRegProgram] = useState("BSIT");
  const [regYearLevel, setRegYearLevel] = useState("2nd Year");
  const [regPassword, setRegPassword] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState("");

  // Validation & Error states
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");

  const handlePortalChange = (portal: PortalRole) => {
    setActivePortal(portal);
    setMode("signin");
    setFormError("");
    setRegSuccessMsg("");
    setIdentifierError("");
    setPasswordError("");
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdentifierError("");
    setPasswordError("");
    setFormError("");
    setRegSuccessMsg("");

    let hasError = false;
    if (!identifier.trim()) {
      setIdentifierError(
        activePortal === "student"
          ? "Please enter your Student ID or university email."
          : "Please enter your institutional email or ID."
      );
      hasError = true;
    }
    if (!password) {
      setPasswordError("Please enter your password.");
      hasError = true;
    }
    if (hasError) return;

    setIsSubmitting(true);
    const result = await signIn({
      identifier,
      password,
      rememberMe,
      expectedRole:
        activePortal === "student"
          ? "Student"
          : activePortal === "librarian"
            ? "Librarian"
            : "Administrator",
    });

    if (!result.ok) {
      // Integrated, polished, user-friendly error message
      setFormError(result.error || "Unable to sign in. Please check your credentials and try again.");
      setIsSubmitting(false);
      return;
    }

    if (result.role === "Student") {
      router.push("/student/dashboard");
    } else if (result.role === "Librarian") {
      router.push("/staff/dashboard");
    } else {
      router.push("/admin/dashboard");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setRegSuccessMsg("");

    if (
      !regName.trim() ||
      !regStudentId.trim() ||
      !regEmail.trim() ||
      !regPassword
    ) {
      setFormError("Please fill in all required registration fields.");
      return;
    }

    if (!regEmail.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (regPassword.length < 12) {
      setFormError("Password must be at least 12 characters in length.");
      return;
    }

    setIsSubmitting(true);
    const res = await registerStudent({
      name: regName.trim(),
      studentId: regStudentId.trim(),
      email: regEmail.trim(),
      programCode: regProgram,
      programName: regProgram,
      yearLevel: regYearLevel,
      password: regPassword,
    });

    if (!res.ok) {
      setFormError(
        res.error || "Unable to complete registration. Please try again."
      );
      setIsSubmitting(false);
      return;
    }

    // Auto sign-in upon successful registration
    const signRes = await signIn({
      identifier: regStudentId.trim(),
      password: regPassword,
      rememberMe: true,
      expectedRole: "Student",
    });

    if (signRes.ok) {
      router.push("/student/dashboard");
    } else {
      setIsSubmitting(false);
      setMode("signin");
      setIdentifier(regStudentId.trim());
      setRegSuccessMsg("Account registered successfully! Please sign in with your credentials.");
    }
  };

  return (
    <div className="w-full max-w-[420px] transition-all duration-300">
      <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-7 sm:p-9 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.08),0_1px_3px_0_rgba(15,23,42,0.03)] backdrop-blur-md">
        <div
          aria-label="Choose a portal"
          className="mb-6 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1"
        >
          {([
            { id: "student", label: "Student", Icon: GraduationCap },
            { id: "admin", label: "Admin", Icon: ShieldCheck },
            { id: "librarian", label: "Staff Librarian", Icon: BookOpen },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handlePortalChange(id)}
              aria-pressed={activePortal === id}
              className={cn(
                "flex min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[11px] font-semibold transition sm:gap-1.5 sm:px-2 sm:text-xs",
                activePortal === id
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Top Portal Badge */}
        <div className="flex flex-col items-start">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700">
            {activePortal === "student" ? (
              <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            )}
            <span>
              {activePortal === "student"
                ? "Student Portal"
                : activePortal === "librarian"
                  ? "Staff Librarian Portal"
                  : "Administrator Portal"}
            </span>
          </div>

          <h3 className="mt-3.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
            {mode === "signin"
              ? activePortal === "student"
                ? "Welcome back"
                : `Sign in as ${activePortal === "librarian" ? "Staff Librarian" : "Administrator"}`
              : "Create an account"}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
            {mode === "signin"
              ? activePortal === "student"
                ? "Sign in to access your university library."
                : "Sign in with your university account to continue."
              : "Register your student card to borrow books and access digital catalogs."}
          </p>
        </div>

        {/* Integrated Clean Error Alert */}
        {formError && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200/90 bg-rose-50/90 p-3.5 text-xs text-rose-900 animate-in fade-in-0 duration-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold block text-rose-950">
                {mode === "signin" ? "Unable to sign in" : "Registration failed"}
              </span>
              <span>{formError}</span>
            </div>
          </div>
        )}

        {/* Integrated Success Banner */}
        {regSuccessMsg && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-emerald-900 animate-in fade-in-0 duration-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="flex-1 leading-relaxed font-medium">
              {regSuccessMsg}
            </div>
          </div>
        )}

        {/* Sign In Mode */}
        {mode === "signin" && (
          <form
            onSubmit={handleSignInSubmit}
            noValidate
            className="mt-6 space-y-4"
          >
            {/* Account ID / University Email */}
            <div>
              <label
                htmlFor="student-identifier"
                className="block text-xs font-semibold text-slate-700"
              >
                {activePortal === "student"
                  ? "Student ID or University Email"
                  : "Institutional Email or ID"}
              </label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="student-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (identifierError) setIdentifierError("");
                    if (formError) setFormError("");
                  }}
                  placeholder={
                    activePortal === "student"
                      ? "Enter your student ID or university email"
                      : "Enter your institutional email or ID"
                  }
                  className={cn(
                    "h-11 w-full rounded-xl border bg-slate-50/50 pl-10 pr-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-4",
                    identifierError
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10"
                      : "border-slate-200/90 focus:border-indigo-500 focus:ring-indigo-500/10"
                  )}
                />
              </div>
              {identifierError && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">
                  {identifierError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="student-password"
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
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="student-password"
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
                    "h-11 w-full rounded-xl border bg-slate-50/50 pl-10 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-4",
                    passwordError
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10"
                      : "border-slate-200/90 focus:border-indigo-500 focus:ring-indigo-500/10"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 transition"
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

            {/* Remember Me Checkbox */}
            <div className="flex items-center pt-0.5">
              <input
                id="student-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
              />
              <label
                htmlFor="student-remember"
                className="ml-2 text-xs font-medium text-slate-600 select-none cursor-pointer"
              >
                Keep me signed in
              </label>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition-all duration-150 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>
                  {activePortal === "student"
                    ? "Sign In"
                    : `Sign In as ${activePortal === "librarian" ? "Staff Librarian" : "Administrator"}`}
                </span>
              )}
            </button>

            {/* Secondary Create Account Link */}
            <div className="pt-3 text-center">
              {activePortal === "student" && (
                <p className="text-xs text-slate-600">
                  New to the library portal?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setFormError("");
                      setRegSuccessMsg("");
                    }}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    Create an account
                  </button>
                </p>
              )}
            </div>
          </form>
        )}

        {/* Register Mode */}
        {mode === "register" && (
          <form
            onSubmit={handleRegisterSubmit}
            noValidate
            className="mt-6 space-y-3.5"
          >
            <div>
              <label
                htmlFor="reg-name"
                className="block text-xs font-semibold text-slate-700"
              >
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Maria Clara Santos"
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 transition focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="reg-id"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Student ID
                </label>
                <input
                  id="reg-id"
                  type="text"
                  value={regStudentId}
                  onChange={(e) => setRegStudentId(e.target.value)}
                  placeholder="2024-042"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-mono text-slate-900 transition focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-year"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Year Level
                </label>
                <select
                  id="reg-year"
                  value={regYearLevel}
                  onChange={(e) => setRegYearLevel(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 transition focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-program"
                className="block text-xs font-semibold text-slate-700"
              >
                Degree Program
              </label>
              <select
                id="reg-program"
                value={regProgram}
                onChange={(e) => setRegProgram(e.target.value)}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 transition focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              >
                <option value="BSIT">
                  BS Information Technology
                </option>
                <option value="BSCS">BS Computer Science</option>
                <option value="BSBA">BS Business Administration</option>
                <option value="BSN">BS Nursing</option>
                <option value="BSCE">
                  BS Civil Engineering
                </option>
                <option value="BSED">BS Secondary Education</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-semibold text-slate-700"
              >
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 transition focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="reg-password"
                  type={regShowPassword ? "text" : "password"}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 12 characters"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-3 pr-10 text-xs text-slate-900 transition focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                />
                <button
                  type="button"
                  onClick={() => setRegShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {regShowPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition-all duration-150 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>

            <div className="pt-2 text-center">
              <p className="text-xs text-slate-600">
                Already have a student account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setFormError("");
                    setRegSuccessMsg("");
                  }}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type StudentMode = "signin" | "register";

export function StudentLoginFormCard() {
  const router = useRouter();
  const { signIn, registerStudent } = useAuth();

  const [mode, setMode] = useState<StudentMode>("signin");

  // Sign In fields
  const [identifier, setIdentifier] = useState("student@university.edu");
  const [password, setPassword] = useState("Student123!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student Register fields
  const [regName, setRegName] = useState("");
  const [regStudentId, setRegStudentId] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regProgram, setRegProgram] = useState("BS Information Technology");
  const [regYearLevel, setRegYearLevel] = useState("2nd Year");
  const [regPassword, setRegPassword] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState("");

  // Validation errors
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdentifierError("");
    setPasswordError("");
    setFormError("");
    setRegSuccessMsg("");

    let hasValidationError = false;
    if (!identifier.trim()) {
      setIdentifierError("Please enter your Student ID or institutional email.");
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
      expectedRole: "Student",
    });

    if (!result.ok) {
      setFormError(
        result.error ||
          "Invalid credentials. Please verify your Student ID and password."
      );
      setIsSubmitting(false);
      return;
    }

    router.push("/student/dashboard");
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
      setFormError("All registration fields are required.");
      return;
    }

    if (!regEmail.includes("@")) {
      setFormError("Please provide a valid institutional email address.");
      return;
    }

    if (regPassword.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    const res = await registerStudent({
      name: regName.trim(),
      studentId: regStudentId.trim(),
      email: regEmail.trim(),
      programCode: "BSIT",
      programName: regProgram,
      yearLevel: regYearLevel,
      password: regPassword,
    });

    if (!res.ok) {
      setFormError(res.error || "Failed to register student account.");
      setIsSubmitting(false);
      return;
    }

    // Automatically sign in the registered student
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
      setRegSuccessMsg("Account registered successfully! Please sign in.");
    }
  };

  const handleUseDemo = () => {
    setFormError("");
    setRegSuccessMsg("");
    setIdentifierError("");
    setPasswordError("");
    setMode("signin");
    setIdentifier("student@university.edu");
    setPassword("Student123!");
  };

  return (
    <div className="w-full max-w-[460px]">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
        {/* Student Portal Badge Header */}
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Student Library Portal</span>
          </div>

          <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {mode === "signin" ? "Student / Member Sign In" : "Register Student Card"}
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            {mode === "signin"
              ? "Access university catalog, request book loans, track reservations, and view fines."
              : "Create a digital borrower profile with your University Student ID."}
          </p>
        </div>

        {/* Mode Switcher: Sign In vs Create Account */}
        <div className="mt-5 flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setFormError("");
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all",
              mode === "signin"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setFormError("");
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all",
              mode === "register"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Quick Demo Fill (Student) */}
        {mode === "signin" && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-[11px] font-medium text-slate-400">Quick Test:</span>
            <button
              type="button"
              onClick={handleUseDemo}
              className="rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              Fill Student Demo (student@university.edu)
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {formError && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div className="flex-1 leading-relaxed">{formError}</div>
          </div>
        )}

        {/* Global Success Banner */}
        {regSuccessMsg && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="flex-1 leading-relaxed">{regSuccessMsg}</div>
          </div>
        )}

        {/* Mode: Sign In Form */}
        {mode === "signin" && (
          <form onSubmit={handleSignInSubmit} noValidate className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="student-identifier"
                className="block text-xs font-semibold text-slate-700"
              >
                Student ID / University Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="student-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (identifierError) setIdentifierError("");
                  }}
                  placeholder="2024-042 or student@university.edu"
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
                  htmlFor="student-password"
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
                  id="student-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  placeholder="Enter your student password"
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
                id="student-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
              />
              <label
                htmlFor="student-remember"
                className="ml-2 text-xs font-medium text-slate-600 select-none cursor-pointer"
              >
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In as Student</span>
              )}
            </button>
          </form>
        )}

        {/* Mode: Student Registration Form */}
        {mode === "register" && (
          <form
            onSubmit={handleRegisterSubmit}
            noValidate
            className="mt-5 space-y-3.5"
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
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
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
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-mono text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
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
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
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
                htmlFor="reg-email"
                className="block text-xs font-semibold text-slate-700"
              >
                Institutional Email
              </label>
              <input
                id="reg-email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="student@university.edu"
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              />
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
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              >
                <option value="BS Information Technology">
                  BS Information Technology
                </option>
                <option value="BS Computer Science">BS Computer Science</option>
                <option value="BS Computer Engineering">
                  BS Computer Engineering
                </option>
                <option value="BS Information Systems">
                  BS Information Systems
                </option>
                <option value="BS Education">BS Education</option>
              </select>
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
                  placeholder="Minimum 6 characters"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                />
                <button
                  type="button"
                  onClick={() => setRegShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <span>Register Student Account</span>
              )}
            </button>
          </form>
        )}

        {/* Clear Portal Separator Footnote to Administrator Login */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-[11px] text-slate-500">
            University Administrator or Librarian?
          </p>
          <Link
            href="/admin/login"
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            <span>Go to Administrator / Librarian Login</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

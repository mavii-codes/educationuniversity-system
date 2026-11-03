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
  UserPlus,
} from "lucide-react";
import { API_CONFIG } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type PortalRoleTab = "student" | "admin";
type StudentAuthMode = "signin" | "register";

export function LoginFormCard() {
  const router = useRouter();
  const { signIn, registerStudent } = useAuth();

  const [activeTab, setActiveTab] = useState<PortalRoleTab>("student");
  const [studentMode, setStudentMode] = useState<StudentAuthMode>("signin");

  // Sign in fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
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
  const [regSuccessMsg, setRegSuccessMsg] = useState("");

  // Validation errors
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");

  const handleTabChange = (tab: PortalRoleTab) => {
    setActiveTab(tab);
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

    let hasValidationError = false;
    if (!identifier.trim()) {
      setIdentifierError(
        activeTab === "student"
          ? "Please enter your Student ID or email."
          : "Please enter your university administrator email."
      );
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
      expectedRole: activeTab === "student" ? "Student" : "Administrator",
    });

    if (!result.ok) {
      setFormError(
        result.error ||
          "Invalid credentials. Please verify your login details and try again."
      );
      setIsSubmitting(false);
      return;
    }

    if (result.role === "Student") {
      router.push("/student/dashboard");
    } else {
      router.push("/admin/dashboard");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setRegSuccessMsg("");

    if (!regName.trim() || !regStudentId.trim() || !regEmail.trim() || !regPassword) {
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
      setFormError(res.error || "Failed to register account.");
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
      setStudentMode("signin");
      setIdentifier(regStudentId.trim());
      setRegSuccessMsg("Account registered successfully! Please sign in.");
    }
  };

  return (
    <div className="w-full max-w-[460px]">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
        {/* Role Segmented Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => handleTabChange("student")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all",
              activeTab === "student"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Student / Member</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("admin")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all",
              activeTab === "admin"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Administrator</span>
          </button>
        </div>

        {/* Header Title */}
        <div className="mt-5 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {activeTab === "student"
              ? studentMode === "register"
                ? "Register Student Card"
                : "Student Library Portal"
              : "Administrator Portal"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {activeTab === "student"
              ? studentMode === "register"
                ? "Create your student borrower profile to access university catalog"
                : "Sign in to browse catalog, manage borrowings, and view fines"
              : "Sign in with institutional credentials for data integration & administration"}
          </p>
        </div>

        {/* Mock-mode demo hint (hidden entirely against the live API) */}
        {!API_CONFIG.useLiveApi && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[11px] leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-700">
              Demo credentials (mock mode)
            </p>
            <p className="mt-1 font-mono">
              Student: student@university.edu / Student123!
            </p>
            <p className="font-mono">
              Administrator: admin@university.edu / Admin123!
            </p>
          </div>
        )}

        {/* Success Message Alert */}
        {regSuccessMsg && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-medium leading-relaxed">{regSuccessMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {formError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <span className="font-medium leading-relaxed">{formError}</span>
          </div>
        )}

        {/* Student Register Form */}
        {activeTab === "student" && studentMode === "register" ? (
          <form onSubmit={handleRegisterSubmit} noValidate className="mt-5 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Juan Dela Cruz"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Student ID
                </label>
                <input
                  type="text"
                  value={regStudentId}
                  onChange={(e) => setRegStudentId(e.target.value)}
                  placeholder="2024-00101"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Year Level
                </label>
                <select
                  value={regYearLevel}
                  onChange={(e) => setRegYearLevel(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Academic Program
              </label>
              <select
                value={regProgram}
                onChange={(e) => setRegProgram(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              >
                <option value="BS Information Technology">BS Information Technology (BSIT)</option>
                <option value="BS Computer Science">BS Computer Science (BSCS)</option>
                <option value="BS Data Science">BS Data Science (BSDS)</option>
                <option value="BS Information Systems">BS Information Systems (BSIS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Institutional Email
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="juan.delacruz@university.edu"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Create password (min. 6 characters)"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 font-semibold text-xs text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registering Student Card...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Complete Student Registration</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setStudentMode("signin")}
                className="text-xs font-medium text-slate-600 hover:text-indigo-600"
              >
                Already have a Student account? <span className="font-semibold text-indigo-600">Sign in</span>
              </button>
            </div>
          </form>
        ) : (
          /* Sign In Form */
          <form onSubmit={handleSignInSubmit} noValidate className="mt-5 space-y-4">
            {/* Identifier */}
            <div>
              <label
                htmlFor="user-identifier"
                className="block text-xs font-semibold text-slate-700"
              >
                {activeTab === "student"
                  ? "Student ID / University Email"
                  : "Administrator Email / ID"}
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="user-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (identifierError) setIdentifierError("");
                    if (formError) setFormError("");
                  }}
                  placeholder={
                    activeTab === "student"
                      ? "student@university.edu or 2024-042"
                      : "admin@university.edu"
                  }
                  className={cn(
                    "h-11 w-full rounded-xl border bg-white pl-10 pr-3.5 text-xs text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2",
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

            {/* Password */}
            <div>
              <label
                htmlFor="user-password"
                className="block text-xs font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="user-password"
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
                    "h-11 w-full rounded-xl border bg-white pl-10 pr-10 text-xs text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2",
                    passwordError
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/15"
                      : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-500/15"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                <p className="mt-1 text-[11px] font-medium text-rose-600">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-600">Keep me signed in</span>
              </label>

              {activeTab === "student" && (
                <button
                  type="button"
                  onClick={() => setStudentMode("register")}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Create Account
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 font-semibold text-xs text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>
                  {activeTab === "student"
                    ? "Sign In to Student Portal"
                    : "Sign In as Administrator"}
                </span>
              )}
            </button>
          </form>
        )}

        {/* Privacy Note */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-[11px] text-slate-400">
            Protected by FERPA &amp; GDPR Data Privacy Principles
          </p>
        </div>
      </div>
    </div>
  );
}

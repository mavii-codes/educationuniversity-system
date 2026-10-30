"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building,
  CheckCircle2,
  Database,
  KeyRound,
  Lock,
  Save,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "account" | "security";

function AdminSettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as SettingsTab | null;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  useEffect(() => {
    if (
      tabParam === "profile" ||
      tabParam === "account" ||
      tabParam === "security"
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Profile State
  const [adminName, setAdminName] = useState(user?.name || "Administrator");
  const [adminEmail, setAdminEmail] = useState(
    user?.email || "admin@university.edu"
  );
  const [department, setDepartment] = useState(
    user?.department || "Office of Institutional Data & Systems"
  );
  const [officeLocation, setOfficeLocation] = useState(
    "Administration Building, Suite 304"
  );

  // Account & Platform State
  const [institutionName, setInstitutionName] = useState(
    "Metropolitan State University"
  );
  const [academicYear, setAcademicYear] = useState("AY 2026-2027");
  const [semester, setSemester] = useState("1st Semester");
  const [syncInterval, setSyncInterval] = useState("15");
  const [dailyDigest, setDailyDigest] = useState(true);
  const [syncFailureAlerts, setSyncFailureAlerts] = useState(true);

  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPassword("");
    setNewPassword("");
    showToast({
      title: "Settings updated",
      description: "Your administrator preferences and security settings have been saved.",
      type: "success",
    });
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "account", label: "Account Settings", icon: Settings },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Administrator &amp; Platform Settings
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage your administrator profile, institutional sync preferences, and account security.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-card">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition",
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: PROFILE */}
        {activeTab === "profile" && (
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">
                  Administrator Profile
                </h3>
              </div>
              <Badge variant="brand">Role: Administrator</Badge>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Display Name
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  University Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Department / Governance Unit
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Campus Office
                </label>
                <input
                  type="text"
                  value={officeLocation}
                  onChange={(e) => setOfficeLocation(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACCOUNT SETTINGS */}
        {activeTab === "account" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <Building className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">
                  Institution &amp; Term Defaults
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    University Name
                  </label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Active Academic Year
                    </label>
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
                    >
                      <option value="AY 2026-2027">AY 2026-2027</option>
                      <option value="AY 2025-2026">AY 2025-2026</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Active Semester
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
                    >
                      <option value="1st Semester">1st Semester</option>
                      <option value="2nd Semester">2nd Semester</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <Database className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">
                  Synchronization &amp; Alert Preferences
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Scheduled Connector Sync Interval
                  </label>
                  <select
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="15">Every 15 minutes (Recommended)</option>
                    <option value="30">Every 30 minutes</option>
                    <option value="60">Hourly</option>
                  </select>
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                  <div>
                    <span className="block text-xs font-semibold text-slate-900">
                      Daily Integration Summary Digest
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Send morning sync report to {adminEmail}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={dailyDigest}
                    onChange={(e) => setDailyDigest(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                  <div>
                    <span className="block text-xs font-semibold text-slate-900">
                      Immediate Connector Warning Alerts
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Alert on schema mismatch or disconnected campus sources
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={syncFailureAlerts}
                    onChange={(e) => setSyncFailureAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <Lock className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">
                  Update Administrator Password
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters with symbol"
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <KeyRound className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">
                  Multi-Factor Authentication &amp; Session
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                      <span className="block text-xs font-semibold text-slate-900">
                        Institutional Two-Factor Authentication (MFA)
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-600">
                        Protects administrative access across SIS, LMS, HR, Library, and Alumni connectors.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={mfaEnabled}
                    onChange={(e) => setMfaEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-600">
                  <p className="font-semibold text-slate-900">
                    Active Session Governance
                  </p>
                  <p className="mt-1">
                    Signed in as <strong>{adminEmail}</strong> · Prepared for Express.js + JWT + PostgreSQL session verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 text-xs text-slate-500">
          Loading administrator settings...
        </div>
      }
    >
      <AdminSettingsContent />
    </Suspense>
  );
}


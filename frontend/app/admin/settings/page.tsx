"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building,
  CheckCircle2,
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
    user?.department || "Library Services"
  );
  const [officeLocation, setOfficeLocation] = useState(
    "Library Office"
  );

  const [libraryName, setLibraryName] = useState("University Library");
  const [dueDateReminders, setDueDateReminders] = useState(true);
  const [fineNotifications, setFineNotifications] = useState(true);

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
            Library Account Settings
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage your library profile, member reminders, and account security.
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
                  Library Administrator Profile
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

        {/* TAB 2: LIBRARY SETTINGS */}
        {activeTab === "account" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <Building className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">
                  Library Details
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Library Name
                  </label>
                  <input
                    type="text"
                    value={libraryName}
                    onChange={(e) => setLibraryName(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">
                  Member Reminder Preferences
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                  <div>
                    <span className="block text-xs font-semibold text-slate-900">
                      Due-date reminders
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Send upcoming return reminders to library members
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={dueDateReminders}
                    onChange={(e) => setDueDateReminders(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                  <div>
                    <span className="block text-xs font-semibold text-slate-900">
                      Fine and overdue notices
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Notify members when a loan is overdue or a fine is updated
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={fineNotifications}
                    onChange={(e) => setFineNotifications(e.target.checked)}
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
                        Protects administrative access to external Library LMS and centralized university data.
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

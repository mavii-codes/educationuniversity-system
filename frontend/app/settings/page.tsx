"use client";

import React, { useState } from "react";
import {
  Bell,
  Building,
  CheckCircle2,
  Database,
  Save,
  Server,
  ShieldAlert,
} from "lucide-react";
import { API_CONFIG } from "@/services/api";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastProvider";

export default function SettingsPage() {
  const { showToast } = useToast();

  const [universityName, setUniversityName] = useState(
    "Metropolitan State University"
  );
  const [academicYear, setAcademicYear] = useState("AY 2026-2027");
  const [currentSemester, setCurrentSemester] = useState("1st Semester");
  const [autoSyncInterval, setAutoSyncInterval] = useState("15");
  const [duplicatePolicy, setDuplicatePolicy] = useState("queue_review");
  const [minAttendanceThreshold, setMinAttendanceThreshold] = useState("80");
  const [highRiskGpaThreshold, setHighRiskGpaThreshold] = useState("2.25");
  const [dailyDigest, setDailyDigest] = useState(true);
  const [riskAlerts, setRiskAlerts] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      title: "Platform settings saved",
      description:
        "Updated academic term, sync schedules, and early-warning risk thresholds.",
      type: "success",
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Platform Settings
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Configure institutional term defaults, synchronization rules, and advising thresholds.
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 sm:self-auto"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* Institutional & Academic Term */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <Building className="h-4 w-4 text-indigo-600" />
              <h3 className="text-base font-semibold text-slate-900">
                Institution &amp; Academic Term
              </h3>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Active Academic Year
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-300 focus:outline-none"
                >
                  <option value="AY 2026-2027">AY 2026-2027</option>
                  <option value="AY 2025-2026">AY 2025-2026</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Active Semester
                </label>
                <select
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-300 focus:outline-none"
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="Midyear Term">Midyear Term</option>
                </select>
              </div>
            </div>
          </div>

          {/* Synchronization & Identity Resolution */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <Database className="h-4 w-4 text-indigo-600" />
              <h3 className="text-base font-semibold text-slate-900">
                Synchronization &amp; Duplicate Resolution
              </h3>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Automated Sync Cadence (SIS &amp; LMS)
                </label>
                <select
                  value={autoSyncInterval}
                  onChange={(e) => setAutoSyncInterval(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-300 focus:outline-none"
                >
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Every hour</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Duplicate Record Handling Policy
                </label>
                <select
                  value={duplicatePolicy}
                  onChange={(e) => setDuplicatePolicy(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-300 focus:outline-none"
                >
                  <option value="queue_review">
                    Flag &amp; queue for Registrar review
                  </option>
                  <option value="sis_primary">
                    Auto-merge using SIS as source of truth
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Academic Risk Thresholds */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <h3 className="text-base font-semibold text-slate-900">
                Early-Warning Risk Thresholds
              </h3>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Minimum Attendance Threshold (%)
                </label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={minAttendanceThreshold}
                  onChange={(e) => setMinAttendanceThreshold(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-300 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Students below this attendance rate trigger advising review.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  High-Risk GPA Threshold (4.00 Scale)
                </label>
                <input
                  type="text"
                  value={highRiskGpaThreshold}
                  onChange={(e) => setHighRiskGpaThreshold(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-300 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Combined with LMS engagement to classify High Risk standing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Notifications & Future API Readiness */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <Bell className="h-4 w-4 text-indigo-600" />
              <h3 className="text-base font-semibold text-slate-900">
                Notification Preferences
              </h3>
            </div>

            <div className="mt-4 space-y-4">
              <label className="flex cursor-pointer items-start justify-between gap-3">
                <div>
                  <span className="block text-sm font-medium text-slate-900">
                    Daily Sync Summary Digest
                  </span>
                  <span className="text-xs text-slate-500">
                    Morning email recap of overnight integrations
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={dailyDigest}
                  onChange={(e) => setDailyDigest(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <label className="flex cursor-pointer items-start justify-between gap-3">
                <div>
                  <span className="block text-sm font-medium text-slate-900">
                    High-Risk Student Alerts
                  </span>
                  <span className="text-xs text-slate-500">
                    Notify deans &amp; advisers when risk changes
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={riskAlerts}
                  onChange={(e) => setRiskAlerts(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>

          {/* Backend Architecture Compatibility Card */}
          <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/40 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  API Service Adapter
                </h3>
              </div>
              <Badge variant="brand">Mock Mode</Badge>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
              Frontend data services are structured for seamless connection to the upcoming{" "}
              <strong className="font-semibold text-slate-800">
                Express.js + PostgreSQL
              </strong>{" "}
              REST API.
            </p>
            <div className="mt-4 space-y-1.5 rounded-lg border border-indigo-100 bg-white p-3 font-mono text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 text-indigo-700">
                <CheckCircle2 className="h-3 w-3 shrink-0" />
                <span>Base: {API_CONFIG.baseUrl}</span>
              </div>
              <p>GET /api/students</p>
              <p>GET /api/students/:id</p>
              <p>GET /api/programs</p>
              <p>GET /api/analytics</p>
              <p>GET /api/data-sources</p>
              <p>GET /api/integrations</p>
              <p>GET /api/alumni</p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}


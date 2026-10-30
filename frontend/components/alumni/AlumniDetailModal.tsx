"use client";

import React from "react";
import {
  ArrowRight,
  Award,
  Check,
  Database,
  GraduationCap,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { IntegratedAlumniRecord } from "@/types";
import { AlumniRolePermissions } from "@/lib/permissions";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

interface AlumniDetailModalProps {
  alumni: IntegratedAlumniRecord | null;
  permissions: AlumniRolePermissions;
  onClose: () => void;
}

const LIFECYCLE_STAGES = [
  { key: "Enrollment", completed: true, current: false },
  { key: "Learning", completed: true, current: false },
  { key: "Graduation", completed: true, current: false },
  { key: "Alumni", completed: false, current: true },
] as const;

export function AlumniDetailModal({
  alumni,
  permissions,
  onClose,
}: AlumniDetailModalProps) {
  return (
    <Modal
      open={Boolean(alumni)}
      onClose={onClose}
      title={alumni?.fullName || "Alumni Details"}
      subtitle={
        alumni
          ? `Student ID: ${alumni.studentId} · Batch ${alumni.batch}`
          : undefined
      }
      maxWidthClass="max-w-2xl"
    >
      {alumni && (
        <div className="space-y-5 text-sm">
          {/* 1. Personal Information */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2.5">
              <User className="h-4 w-4 text-indigo-600" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Personal Information
              </h4>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="text-xs text-slate-500">Full Name</span>
                <p className="mt-0.5 font-semibold text-slate-900">
                  {alumni.fullName}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-500">Student ID</span>
                <p className="mt-0.5 font-mono text-xs font-semibold text-slate-900">
                  {alumni.studentId}
                </p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-xs text-slate-500">
                  Contact Information
                </span>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-700">
                  {alumni.email ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{alumni.email}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">No email on file</span>
                  )}

                  {permissions.canViewExtendedContact && alumni.contactNumber && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{alumni.contactNumber}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Academic Information */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2.5">
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Academic Information
              </h4>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="text-xs text-slate-500">Program</span>
                <p className="mt-0.5 font-semibold text-slate-900">
                  {alumni.program} ({alumni.programCode})
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-500">Department</span>
                <p className="mt-0.5 font-medium text-slate-800">
                  {alumni.department}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-500">Graduation Batch</span>
                <p className="mt-0.5 font-semibold text-slate-900 tabular-nums">
                  {alumni.batch}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-500">Graduation Date</span>
                <p className="mt-0.5 font-semibold text-slate-900">
                  {alumni.graduationDate}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Lifecycle Information */}
          <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/35 p-4">
            <div className="flex items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-indigo-600" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                  Lifecycle Information
                </h4>
              </div>
              <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                Current Stage: Alumni
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {LIFECYCLE_STAGES.map((stage, idx) => (
                <div key={stage.key} className="relative flex items-center">
                  <div
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition",
                      stage.current
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200"
                        : "border-slate-200 bg-white text-slate-700"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        stage.current
                          ? "bg-white/20 text-white"
                          : "bg-emerald-50 text-emerald-600"
                      )}
                    >
                      {stage.completed ? (
                        <Check className="h-3 w-3 stroke-[2.5]" />
                      ) : (
                        <Award className="h-3 w-3" />
                      )}
                    </span>
                    <span className="truncate">{stage.key}</span>
                  </div>

                  {idx < LIFECYCLE_STAGES.length - 1 && (
                    <ArrowRight className="ml-1 hidden h-3.5 w-3.5 shrink-0 text-indigo-400 sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* External Source Transparency (Authorized Admin Only) */}
          {permissions.canViewCrmIntegrationInfo && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/70 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                <Database className="h-3.5 w-3.5 text-indigo-600" />
                Integrated Source: {alumni.source}
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                CRM ID: {alumni.id}
              </span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}


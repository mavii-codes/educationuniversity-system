"use client";

import React, { useState } from "react";
import { MapPin } from "lucide-react";
import { AlumniRecord } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface AlumniDirectoryTableProps {
  records: AlumniRecord[];
}

export function getEmploymentBadge(status: AlumniRecord["employmentStatus"]) {
  switch (status) {
    case "Employed":
      return (
        <Badge variant="success" dot>
          Employed
        </Badge>
      );
    case "Self-Employed":
      return (
        <Badge variant="brand" dot>
          Self-Employed
        </Badge>
      );
    case "Postgraduate Studies":
      return (
        <Badge variant="info" dot>
          Postgraduate Studies
        </Badge>
      );
    case "Seeking Opportunities":
      return (
        <Badge variant="warning" dot>
          Seeking Opportunities
        </Badge>
      );
  }
}

export function AlumniDirectoryTable({ records }: AlumniDirectoryTableProps) {
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniRecord | null>(
    null
  );

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Alumni ID</th>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Graduation Year</th>
                <th className="px-5 py-3.5">Program</th>
                <th className="px-5 py-3.5">Employment Status</th>
                <th className="px-5 py-3.5">Company</th>
                <th className="px-5 py-3.5">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((alum) => (
                <tr
                  key={alum.id}
                  onClick={() => setSelectedAlumni(alum)}
                  className="cursor-pointer transition-colors hover:bg-slate-50/80"
                >
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-medium text-slate-600">
                    {alum.id}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{alum.name}</p>
                    <p className="text-xs text-slate-400">{alum.jobTitle}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-700 tabular-nums">
                    {alum.graduationYear}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-medium text-slate-800">
                      {alum.programCode}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {alum.programName}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    {getEmploymentBadge(alum.employmentStatus)}
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {alum.currentCompany}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {alum.location}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {records.map((alum) => (
          <div
            key={alum.id}
            onClick={() => setSelectedAlumni(alum)}
            className="cursor-pointer rounded-xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:border-indigo-200"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-slate-500">{alum.id}</p>
                <h3 className="mt-0.5 text-sm font-semibold text-slate-900">
                  {alum.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {alum.programCode} · Class of {alum.graduationYear}
                </p>
              </div>
              {getEmploymentBadge(alum.employmentStatus)}
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs">
              <p className="font-medium text-slate-800">{alum.currentCompany}</p>
              <p className="mt-0.5 text-slate-500">
                {alum.jobTitle} · {alum.location}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Alumni Details Modal */}
      <Modal
        open={Boolean(selectedAlumni)}
        onClose={() => setSelectedAlumni(null)}
        title={selectedAlumni?.name || "Alumni Record"}
        subtitle={
          selectedAlumni
            ? `${selectedAlumni.id} · Class of ${selectedAlumni.graduationYear}`
            : undefined
        }
      >
        {selectedAlumni && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3.5">
                <span className="text-xs text-slate-500">Degree Program</span>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedAlumni.programName}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3.5">
                <span className="text-xs text-slate-500">Employment Status</span>
                <div className="mt-1">
                  {getEmploymentBadge(selectedAlumni.employmentStatus)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3.5">
                <span className="text-xs text-slate-500">Organization</span>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedAlumni.currentCompany}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3.5">
                <span className="text-xs text-slate-500">Role &amp; Industry</span>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedAlumni.jobTitle} ({selectedAlumni.industry})
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}


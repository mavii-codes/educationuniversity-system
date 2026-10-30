"use client";

import React from "react";
import { Award, Eye } from "lucide-react";
import { IntegratedAlumniRecord } from "@/types";

interface AlumniTableProps {
  records: IntegratedAlumniRecord[];
  onSelectAlumni: (record: IntegratedAlumniRecord) => void;
}

export function AlumniTable({ records, onSelectAlumni }: AlumniTableProps) {
  return (
    <div>
      {/* Desktop & Tablet Responsive Table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Alumni Name</th>
                <th className="px-5 py-3.5">Student ID</th>
                <th className="px-5 py-3.5">Program</th>
                <th className="px-5 py-3.5">Graduation Batch</th>
                <th className="px-5 py-3.5">Graduation Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((item) => {
                const initials = item.fullName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("");

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectAlumni(item)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/15">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {item.fullName}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            Record ID: {item.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-medium text-slate-700">
                      {item.studentId}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800">
                        {item.programCode}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {item.program}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800 tabular-nums">
                      {item.batch}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {item.graduationDate}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                        <Award className="h-3.5 w-3.5 text-indigo-600" />
                        <span>{item.status}</span>
                      </span>
                    </td>

                    <td
                      className="whitespace-nowrap px-5 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectAlumni(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Friendly Stacked Cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {records.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectAlumni(item)}
            className="cursor-pointer rounded-xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:border-indigo-200"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-slate-500">
                  {item.studentId}
                </p>
                <h3 className="mt-0.5 text-base font-semibold text-slate-900">
                  {item.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  {item.programCode} · {item.program}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                <Award className="h-3 w-3 text-indigo-600" />
                <span>{item.status}</span>
              </span>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-lg bg-slate-50/80 p-3 text-xs">
              <div>
                <span className="text-slate-400">Graduation Batch</span>
                <p className="mt-0.5 font-semibold text-slate-900 tabular-nums">
                  Batch {item.batch}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Graduation Date</span>
                <p className="mt-0.5 font-semibold text-slate-900">
                  {item.graduationDate}
                </p>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAlumni(item);
                }}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>View Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


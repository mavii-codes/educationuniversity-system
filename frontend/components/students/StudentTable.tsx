import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RiskLevel, Student, StudentStatus } from "@/types/university";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface StudentTableProps {
  students: Student[];
}

export function getStudentStatusVariant(status: StudentStatus): BadgeVariant {
  switch (status) {
    case "Active":
      return "success";
    case "Graduated":
      return "brand";
    case "On Leave":
      return "warning";
    case "Withdrawn":
      return "neutral";
  }
}

export function getRiskVariant(risk: RiskLevel): BadgeVariant {
  switch (risk) {
    case "Low":
      return "success";
    case "Medium":
      return "warning";
    case "High":
      return "danger";
  }
}

export function StudentTable({ students }: StudentTableProps) {
  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Student ID</th>
                <th className="px-5 py-3.5">Student Name</th>
                <th className="px-5 py-3.5">Program</th>
                <th className="px-5 py-3.5">Year Level</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Academic Performance</th>
                <th className="px-5 py-3.5">Risk Level</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {students.map((student) => {
                const initials = student.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("");

                return (
                  <tr
                    key={student.id}
                    className="group transition-colors hover:bg-slate-50/80"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-medium text-slate-600">
                      {student.id}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/15">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/students/${student.id}`}
                            className="block truncate font-semibold text-slate-900 transition hover:text-indigo-600"
                          >
                            {student.name}
                          </Link>
                          <span className="block truncate text-xs text-slate-400">
                            {student.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {student.programName}
                      </p>
                      <p className="text-xs text-slate-400">{student.programCode}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {student.yearLevel}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <Badge
                        variant={getStudentStatusVariant(student.status)}
                        dot
                      >
                        {student.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {student.performanceScore}%
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              student.performanceScore >= 85
                                ? "bg-indigo-600"
                                : student.performanceScore >= 76
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            )}
                            style={{ width: `${student.performanceScore}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 tabular-nums">
                          ({student.gpa.toFixed(2)})
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <Badge variant={getRiskVariant(student.riskLevel)}>
                        {student.riskLevel} Risk
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <Link
                        href={`/students/${student.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        View Student
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {students.map((student) => (
          <div
            key={student.id}
            className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-slate-500">{student.id}</p>
                <h3 className="mt-0.5 text-base font-semibold text-slate-900">
                  {student.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {student.programName} · {student.yearLevel}
                </p>
              </div>
              <Badge variant={getStudentStatusVariant(student.status)} dot>
                {student.status}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50/80 p-3 text-xs">
              <div>
                <span className="text-slate-400">Performance</span>
                <p className="mt-0.5 font-semibold text-slate-900 tabular-nums">
                  {student.performanceScore}% ({student.gpa.toFixed(2)} GPA)
                </p>
              </div>
              <div>
                <span className="text-slate-400">Risk Standing</span>
                <div className="mt-0.5">
                  <Badge variant={getRiskVariant(student.riskLevel)}>
                    {student.riskLevel} Risk
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex justify-end">
              <Link
                href={`/students/${student.id}`}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
              >
                View Student
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


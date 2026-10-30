"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Users } from "lucide-react";
import { getPrograms, getStudents } from "@/services/api";
import { Program, Student } from "@/types/university";
import { StudentFilters } from "@/components/students/StudentFilters";
import { StudentTable } from "@/components/students/StudentTable";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  DemoViewState,
  ViewStateControl,
} from "@/components/ui/ViewStateControl";
import { useToast } from "@/components/ui/ToastProvider";

function StudentsDirectoryContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [search, setSearch] = useState(initialQuery);
  const [program, setProgram] = useState("All");
  const [yearLevel, setYearLevel] = useState("All");
  const [status, setStatus] = useState("All");
  const [riskLevel, setRiskLevel] = useState("All");
  const [viewState, setViewState] = useState<DemoViewState>("loading");

  const { showToast } = useToast();

  useEffect(() => {
    getPrograms().then(setPrograms).catch(() => {});
  }, []);

  const fetchFilteredStudents = useCallback(async () => {
    setViewState("loading");
    try {
      const results = await getStudents({
        search,
        program,
        yearLevel,
        status,
        riskLevel,
      });
      setStudents(results);
      setViewState("ready");
    } catch {
      setViewState("error");
    }
  }, [search, program, yearLevel, status, riskLevel]);

  useEffect(() => {
    fetchFilteredStudents();
  }, [fetchFilteredStudents]);

  const handleClearFilters = () => {
    setSearch("");
    setProgram("All");
    setYearLevel("All");
    setStatus("All");
    setRiskLevel("All");
  };

  return (
    <div className="space-y-6">
      {/* Page Intro & Controls */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Unified Student Directory
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            View enrollment standing, academic performance, and retention risk in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ViewStateControl
            current={viewState}
            onChange={setViewState}
            onRefresh={fetchFilteredStudents}
          />
          <button
            type="button"
            onClick={() =>
              showToast({
                title: "Student roster export started",
                description: `Preparing CSV export for ${students.length} filtered student records.`,
                type: "info",
              })
            }
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export Roster
          </button>
        </div>
      </div>

      {/* Search & Multi-Facet Filters */}
      <StudentFilters
        search={search}
        program={program}
        yearLevel={yearLevel}
        status={status}
        riskLevel={riskLevel}
        programs={programs}
        onSearchChange={setSearch}
        onProgramChange={setProgram}
        onYearLevelChange={setYearLevel}
        onStatusChange={setStatus}
        onRiskLevelChange={setRiskLevel}
        onReset={handleClearFilters}
      />

      {/* Result Count Bar */}
      {viewState === "ready" && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            <span>
              Showing{" "}
              <strong className="font-semibold text-slate-900">
                {students.length}
              </strong>{" "}
              {students.length === 1 ? "student record" : "student records"}{" "}
              (representative campus sample)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setRiskLevel((prev) => (prev === "High" ? "All" : "High"))
              }
              className="rounded-md bg-rose-50 px-2.5 py-1 font-medium text-rose-700 transition hover:bg-rose-100"
            >
              {riskLevel === "High"
                ? "Showing High-Risk Only (Clear)"
                : "Quick Filter: High Risk"}
            </button>
          </div>
        </div>
      )}

      {/* States */}
      {viewState === "loading" && <TableSkeleton rows={6} />}

      {viewState === "error" && (
        <ErrorState
          title="We couldn't load the student records."
          description="Please try again in a moment."
          onRetry={fetchFilteredStudents}
        />
      )}

      {viewState === "ready" && students.length === 0 && (
        <EmptyState
          title="No students found"
          description="Try adjusting your search or filters."
          actionLabel="Clear Filters"
          onAction={handleClearFilters}
        />
      )}

      {viewState === "ready" && students.length > 0 && (
        <StudentTable students={students} />
      )}
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={6} />}>
      <StudentsDirectoryContent />
    </Suspense>
  );
}


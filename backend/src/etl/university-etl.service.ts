import { z } from "zod";
import { env } from "../config/env";
import { seedDataset } from "../data/dataset";
import { libraryETLService } from "../services/library.service";
import type { LibraryETLLogModel } from "../models";
import * as etlRepository from "../repositories/university-etl.repository";
import {
  ALL_ETL_SOURCE_CODES,
  ETL_SOURCE_DEFINITIONS,
  EtlSourceCode,
  RAW_ALUMNI_CRM_RECORDS,
  RAW_HR_EMPLOYMENT,
  RAW_LMS_PROGRESS,
  RAW_SIS_ENROLLMENTS,
  RAW_SIS_STUDENTS,
  RawAlumniCrmRecord,
  RawHrEmployment,
  RawLmsProgress,
  RawSisEnrollment,
  RawSisStudent,
} from "./sources";

// ---------------------------------------------------------------------------
// Public result shapes (pinned API contract)
// ---------------------------------------------------------------------------

export interface EtlRunTotals {
  extracted: number;
  validated: number;
  cleaned: number;
  transformed: number;
  loaded: number;
  rejected: number;
}

export interface EtlRunResult {
  sourceCode: EtlSourceCode;
  status: "Completed" | "Failed";
  recordsExtracted: number;
  recordsValidated: number;
  recordsCleaned: number;
  recordsTransformed: number;
  recordsLoaded: number;
  recordsRejected: number;
  durationMs: number;
  startedAt: string;
  completedAt: string;
  errors: string[];
  executionLog: string[];
}

export interface EtlRunResponse {
  runId: string;
  status: "Completed" | "Partial" | "Failed";
  startedAt: string;
  completedAt: string;
  durationMs: number;
  totals: EtlRunTotals;
  results: EtlRunResult[];
}

export interface EtlRunSummary {
  id: string;
  triggeredBy: string;
  status: "Completed" | "Partial" | "Failed";
  startedAt: string;
  completedAt: string | null;
  durationMs: number;
  totals: EtlRunTotals;
  sourceCodes: string[];
  errors: string[];
}

export interface EtlSource {
  code: EtlSourceCode;
  name: string;
  description: string;
  adapter: string;
  status: "Connected" | "Degraded" | "Disabled";
  lastSyncedAt: string | null;
}

interface SourceStageCounts {
  extracted: number;
  validated: number;
  cleaned: number;
  transformed: number;
  loaded: number;
  rejected: number;
}

interface PerSourceOutcome {
  counts: SourceStageCounts;
  errors: string[];
  executionLog: string[];
  status: "Completed" | "Failed";
  startedAt: Date;
  completedAt: Date;
}

// ---------------------------------------------------------------------------
// Validation schemas (one per external source)
// ---------------------------------------------------------------------------

const studentNumber = z.string().trim().regex(/^\d{4}-\d{3}$/, "Invalid student number format");

const sisStudentSchema = z.object({
  student_number: studentNumber,
  full_name: z.string().trim().min(1),
  campus_email: z.email(),
  program_code: z.string().trim().min(2).max(16),
  year_level: z.string().trim().min(1).max(24),
  enrollment_status: z.enum(["Active", "Graduated", "On Leave", "Withdrawn"]),
  performance_score: z.number().min(0).max(100),
  cumulative_gpa: z.number().min(0).max(4),
  attendance_rate: z.number().min(0).max(100),
  risk_level: z.enum(["Low", "Medium", "High"]),
  department: z.string().trim().min(1).max(160).optional(),
  adviser: z.string().trim().min(1).max(120).optional(),
  admission_year: z.number().int().min(1900).max(2200).optional(),
  expected_graduation: z.number().int().min(1900).max(2200).optional(),
  contact_number: z.string().trim().min(1).max(48).optional(),
  address: z.string().trim().min(1).max(240).optional(),
  current_semester: z.string().trim().min(1).max(64).optional(),
  units_earned: z.number().int().min(0).optional(),
  units_required: z.number().int().min(0).optional(),
});

const gradeValue = z.number().min(0).max(100).nullable().optional();
const gpaValue = z.number().min(0).max(4).nullable().optional();

const sisEnrollmentSchema = z.object({
  student_number: studentNumber,
  course_code: z.string().trim().min(1).max(24),
  course_title: z.string().trim().min(1).max(160),
  term: z.string().trim().min(1).max(64),
  units: z.number().int().positive(),
  midterm_grade: gradeValue,
  final_grade: gradeValue,
  gpa_equivalent: gpaValue,
  instructor: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["Passed", "In Progress", "At Risk"]),
});

const lmsProgressSchema = z.object({
  student_number: studentNumber,
  course_code: z.string().trim().min(1).max(24),
  course_title: z.string().trim().min(1).max(160),
  completion_pct: z.number().min(0).max(100),
  assignments_completed: z.number().int().min(0),
  assignments_total: z.number().int().min(0),
  last_active_at: z.string().min(4),
});

const hrEmploymentSchema = z.object({
  employment_id: z.string().trim().min(1).max(64),
  student_number: studentNumber,
  department: z.string().trim().min(1).max(120),
  position_title: z.string().trim().min(1).max(120),
  employment_status: z.enum(["Active", "Ended", "On Leave"]),
  hired_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "hired_on must be YYYY-MM-DD"),
  supervisor: z.string().trim().min(1).max(160).optional(),
  weekly_hours: z.number().positive().max(60),
});

const alumniCrmSchema = z.object({
  crm_record_id: z.string().trim().min(1).max(32),
  student_number: studentNumber,
  full_name: z.string().trim().min(1).max(160),
  graduation_year: z.number().int().min(1900).max(2200),
  program_code: z.string().trim().min(2).max(16),
  program_name: z.string().trim().min(1).max(160),
  department: z.string().trim().min(1).max(160),
  batch: z.string().trim().min(1).max(16),
  graduation_date: z.string().trim().min(1).max(48),
  enrollment_year: z.string().trim().min(1).max(16),
  employment_status: z.string().trim().min(1).max(48),
  current_company: z.string().trim().min(1).max(160).optional(),
  location: z.string().trim().min(1).max(120).optional(),
  email: z.email().optional(),
  contact_number: z.string().trim().min(1).max(48).optional(),
  aligned_with_degree: z.boolean(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parseIsoOrNull(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dedupe<T>(rows: readonly T[], keyOf: (row: T) => string): { kept: T[]; removed: number } {
  const seen = new Set<string>();
  const kept: T[] = [];
  let removed = 0;
  for (const row of rows) {
    const key = keyOf(row);
    if (seen.has(key)) {
      removed += 1;
      continue;
    }
    seen.add(key);
    kept.push(row);
  }
  return { kept, removed };
}

function logLine(executionLog: string[], startedAt: number, message: string): void {
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  executionLog.push(`[+${elapsed}s] ${message}`);
}

function sumTotals(results: EtlRunResult[]): EtlRunTotals {
  return results.reduce<EtlRunTotals>(
    (totals, result) => ({
      extracted: totals.extracted + result.recordsExtracted,
      validated: totals.validated + result.recordsValidated,
      cleaned: totals.cleaned + result.recordsCleaned,
      transformed: totals.transformed + result.recordsTransformed,
      loaded: totals.loaded + result.recordsLoaded,
      rejected: totals.rejected + result.recordsRejected,
    }),
    { extracted: 0, validated: 0, cleaned: 0, transformed: 0, loaded: 0, rejected: 0 },
  );
}

function runStatusFor(results: EtlRunResult[]): EtlRunResponse["status"] {
  const failed = results.filter((result) => result.status === "Failed").length;
  if (failed === 0) return "Completed";
  if (failed === results.length) return "Failed";
  return "Partial";
}

function summaryFromRow(row: etlRepository.EtlRunRow): EtlRunSummary {
  return {
    id: row.id,
    triggeredBy: row.triggered_by,
    status: row.status as EtlRunSummary["status"],
    startedAt: row.started_at.toISOString(),
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    durationMs: row.duration_ms,
    totals: {
      extracted: row.total_extracted,
      validated: row.total_validated,
      cleaned: row.total_cleaned,
      transformed: row.total_transformed,
      loaded: row.total_loaded,
      rejected: row.total_rejected,
    },
    sourceCodes: Array.isArray(row.source_codes) ? row.source_codes : [],
    errors: Array.isArray(row.errors) ? row.errors : [],
  };
}

function mockCentralStudentIds(): Set<string> {
  return new Set(seedDataset.students.map((student) => student.id));
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class UniversityETLService {
  // Mock-mode (DB_ENABLED=false) state so the API stays functional without DB.
  private mockRunHistory: EtlRunSummary[] = [];
  private mockLastSynced = new Map<EtlSourceCode, string>();

  async getSources(): Promise<EtlSource[]> {
    if (env.db.enabled) {
      await etlRepository.ensureDefaultSources();
      const rows = await etlRepository.listSources();
      return rows.map((row) => ({
        code: row.code as EtlSourceCode,
        name: row.name,
        description: row.description ?? "",
        adapter: row.adapter,
        status: row.status as EtlSource["status"],
        lastSyncedAt: row.last_synced_at ? row.last_synced_at.toISOString() : null,
      }));
    }

    return ETL_SOURCE_DEFINITIONS.map((definition) => ({
      code: definition.code,
      name: definition.name,
      description: definition.description,
      adapter: definition.adapter,
      status: "Connected" as const,
      lastSyncedAt: this.mockLastSynced.get(definition.code) ?? null,
    }));
  }

  async getRuns(limit = 10): Promise<EtlRunSummary[]> {
    if (env.db.enabled) {
      const rows = await etlRepository.listRuns(limit);
      return rows.map(summaryFromRow);
    }
    return this.mockRunHistory.slice(0, limit);
  }

  async runSync(
    options: { sourceIds?: string[]; triggeredBy?: string } = {},
  ): Promise<EtlRunResponse> {
    const triggeredBy = options.triggeredBy ?? "Admin Console";
    const requested = options.sourceIds?.length
      ? ALL_ETL_SOURCE_CODES.filter((code) => options.sourceIds!.includes(code))
      : ALL_ETL_SOURCE_CODES;

    const runStartedAt = new Date();
    const runStartedMs = Date.now();

    const outcomes = new Map<EtlSourceCode, PerSourceOutcome>();
    for (const code of requested) {
      const startedAt = new Date();
      const startedMs = Date.now();
      try {
        let outcome: PerSourceOutcome;
        if (code === "SIS") outcome = await this.runSisSource(triggeredBy, startedMs);
        else if (code === "LMS") outcome = await this.runLmsSource(triggeredBy, startedMs);
        else if (code === "HR") outcome = await this.runHrSource(triggeredBy, startedMs);
        else if (code === "ALUMNI_CRM") outcome = await this.runAlumniSource(triggeredBy, startedMs);
        else outcome = await this.runLibrarySource(triggeredBy, startedMs);
        outcomes.set(code, outcome);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown source error";
        outcomes.set(code, {
          counts: { extracted: 0, validated: 0, cleaned: 0, transformed: 0, loaded: 0, rejected: 0 },
          errors: [message],
          executionLog: [`[+0.0s] Source ${code} failed: ${message}`],
          status: "Failed",
          startedAt,
          completedAt: new Date(),
        });
      }
    }

    const completedAt = new Date();
    const durationMs = Date.now() - runStartedMs;

    const results: EtlRunResult[] = [];
    for (const code of requested) {
      const outcome = outcomes.get(code);
      if (!outcome) continue;
      results.push({
        sourceCode: code,
        status: outcome.status,
        recordsExtracted: outcome.counts.extracted,
        recordsValidated: outcome.counts.validated,
        recordsCleaned: outcome.counts.cleaned,
        recordsTransformed: outcome.counts.transformed,
        recordsLoaded: outcome.counts.loaded,
        recordsRejected: outcome.counts.rejected,
        durationMs: outcome.completedAt.getTime() - outcome.startedAt.getTime(),
        startedAt: outcome.startedAt.toISOString(),
        completedAt: outcome.completedAt.toISOString(),
        errors: outcome.errors,
        executionLog: outcome.executionLog,
      });
    }

    const totals = sumTotals(results);
    const status = runStatusFor(results);
    const runId = `etl-run-${runStartedAt.getTime()}-${slug(triggeredBy) || "manual"}`;

    if (env.db.enabled) {
      await etlRepository.insertRun({
        id: runId,
        triggeredBy,
        status,
        startedAt: runStartedAt,
        completedAt,
        durationMs,
        totals,
        sourceCodes: results.map((result) => result.sourceCode),
        errors: results.flatMap((result) => result.errors),
      });
      for (const result of results) {
        const outcome = outcomes.get(result.sourceCode)!;
        await etlRepository.insertRunSource({
          id: `${runId}-${slug(result.sourceCode)}`,
          runId,
          sourceCode: result.sourceCode,
          status: result.status,
          records: {
            extracted: result.recordsExtracted,
            validated: result.recordsValidated,
            cleaned: result.recordsCleaned,
            transformed: result.recordsTransformed,
            loaded: result.recordsLoaded,
            rejected: result.recordsRejected,
          },
          durationMs: result.durationMs,
          errors: result.errors,
        });
        await etlRepository.touchSource(
          result.sourceCode,
          result.status === "Completed" ? "Connected" : "Degraded",
          outcome.completedAt,
        );
      }
    } else {
      this.mockRunHistory.unshift({
        id: runId,
        triggeredBy,
        status,
        startedAt: runStartedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs,
        totals,
        sourceCodes: results.map((result) => result.sourceCode),
        errors: results.flatMap((result) => result.errors),
      });
      this.mockRunHistory = this.mockRunHistory.slice(0, 50);
      for (const result of results) {
        if (result.status === "Completed") {
          this.mockLastSynced.set(result.sourceCode, result.completedAt);
        }
      }
    }

    return {
      runId,
      status,
      startedAt: runStartedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs,
      totals,
      results,
    };
  }

  // -------------------------------------------------------------------------
  // Source pipelines
  // -------------------------------------------------------------------------

  private centralStudentIds(): Promise<Set<string>> {
    if (env.db.enabled) {
      const all = new Set<string>();
      const fixtureIds = new Set<string>([
        ...RAW_SIS_STUDENTS.map((row) => row.student_number),
        ...RAW_LMS_PROGRESS.map((row) => row.student_number),
        ...RAW_HR_EMPLOYMENT.map((row) => row.student_number),
        ...RAW_ALUMNI_CRM_RECORDS.map((row) => row.student_number),
      ]);
      return etlRepository
        .findExistingStudentIds([...fixtureIds])
        .then((found) => {
          for (const id of found) all.add(id);
          return all;
        });
    }
    return Promise.resolve(mockCentralStudentIds());
  }

  private async runSisSource(triggeredBy: string, startedMs: number): Promise<PerSourceOutcome> {
    const executionLog: string[] = [];
    const errors: string[] = [];
    const counts: SourceStageCounts = {
      extracted: RAW_SIS_STUDENTS.length + RAW_SIS_ENROLLMENTS.length,
      validated: 0,
      cleaned: 0,
      transformed: 0,
      loaded: 0,
      rejected: 0,
    };

    logLine(executionLog, startedMs, `Triggered SIS ETL by [${triggeredBy}]; extracted ${counts.extracted} raw records (students: ${RAW_SIS_STUDENTS.length}, enrollments: ${RAW_SIS_ENROLLMENTS.length})`);
    logLine(executionLog, startedMs, "Validating SIS extract schemas...");

    return this.finishSis(executionLog, errors, counts, startedMs);
  }

  private async finishSis(
    executionLog: string[],
    errors: string[],
    counts: SourceStageCounts,
    startedMs: number,
  ): Promise<PerSourceOutcome> {
    // Validation
    const validatedStudents: RawSisStudent[] = [];
    for (const row of RAW_SIS_STUDENTS) {
      const parsed = sisStudentSchema.safeParse(row);
      if (parsed.success) validatedStudents.push(row);
      else {
        counts.rejected += 1;
        errors.push(`SIS student ${row.student_number || "(missing id)"} rejected: ${parsed.error.issues[0]?.message ?? "invalid"}`);
      }
    }
    const validatedEnrollments: RawSisEnrollment[] = [];
    for (const row of RAW_SIS_ENROLLMENTS) {
      const parsed = sisEnrollmentSchema.safeParse(row);
      if (parsed.success) validatedEnrollments.push(row);
      else {
        counts.rejected += 1;
        errors.push(`SIS enrollment ${row.student_number}/${row.course_code || "(missing course)"} rejected: ${parsed.error.issues[0]?.message ?? "invalid"}`);
      }
    }
    counts.validated = validatedStudents.length + validatedEnrollments.length;

    // Clean duplicates
    const uniqueStudents = dedupe(validatedStudents, (row) => row.student_number);
    const uniqueEnrollments = dedupe(
      validatedEnrollments,
      (row) => `${row.student_number}|${row.course_code}|${row.term}`,
    );
    counts.cleaned = uniqueStudents.removed + uniqueEnrollments.removed;

    // Identity matching against central student master
    logLine(executionLog, startedMs, `Validation complete: ${counts.validated} valid, ${counts.rejected} rejected; cleaning removed ${counts.cleaned} duplicates`);
    const centralIds = await this.centralStudentIds();
    const knownStudents = uniqueStudents.kept.filter(
      (row) => centralIds.has(row.student_number) || env.db.enabled,
    );
    const unknownStudents = uniqueStudents.kept.filter(
      (row) => !centralIds.has(row.student_number) && !env.db.enabled,
    );
    counts.rejected += unknownStudents.length;
    for (const row of unknownStudents) {
      errors.push(`SIS student ${row.student_number} could not be matched to central student master`);
    }
    const knownEnrollments = uniqueEnrollments.kept.filter(
      (row) => centralIds.has(row.student_number) || env.db.enabled,
    );
    counts.transformed = knownStudents.length + knownEnrollments.length;

    const studentRows: etlRepository.StudentUpsertRow[] = knownStudents.map((row) => ({
      id: row.student_number,
      name: row.full_name,
      email: row.campus_email,
      program_code: row.program_code,
      year_level: row.year_level,
      status: row.enrollment_status,
      performance_score: row.performance_score,
      gpa: row.cumulative_gpa,
      attendance_rate: row.attendance_rate,
      risk_level: row.risk_level,
      department: row.department ?? null,
      adviser: row.adviser ?? null,
      admission_year: row.admission_year ?? null,
      expected_graduation: row.expected_graduation ?? null,
      contact_number: row.contact_number ?? null,
      address: row.address ?? null,
      current_semester: row.current_semester ?? null,
      units_earned: row.units_earned ?? 0,
      units_required: row.units_required ?? 0,
    }));

    const enrollmentRows: etlRepository.EnrollmentUpsertRow[] = knownEnrollments.map((row) => ({
      student_id: row.student_number,
      course_code: row.course_code,
      course_title: row.course_title,
      term: row.term,
      units: row.units,
      midterm_grade: row.midterm_grade ?? null,
      final_grade: row.final_grade ?? null,
      gpa_equivalent: row.gpa_equivalent ?? null,
      instructor: row.instructor ?? null,
      status: row.status,
    }));

    const eventRows: etlRepository.LifecycleEventRow[] = [];
    for (const student of knownStudents) {
      if (student.admission_year) {
        eventRows.push({
          id: `etl-sis-${student.student_number}-admission`,
          student_id: student.student_number,
          stage: "ADMISSIONS",
          source_system: "SIS",
          title: `Admitted to ${student.program_code}`,
          description: `Admission recorded by SIS extract for ${student.full_name}.`,
          occurred_at: new Date(`${student.admission_year}-06-01T00:00:00Z`),
          metadata: { program_code: student.program_code, admission_year: student.admission_year },
        });
      }
    }
    for (const [index, enrollment] of knownEnrollments.entries()) {
      eventRows.push({
        id: `etl-sis-${enrollment.student_number}-enrollment-${index}-${slug(enrollment.course_code)}`,
        student_id: enrollment.student_number,
        stage: "ENROLLMENT",
        source_system: "SIS",
        title: `Enrolled in ${enrollment.course_code}`,
        description: `${enrollment.course_title} (${enrollment.term}) — ${enrollment.status}.`,
        occurred_at: new Date(),
        metadata: {
          course_code: enrollment.course_code,
          term: enrollment.term,
          units: enrollment.units,
        },
      });
    }

    if (env.db.enabled) {
      await etlRepository.upsertStudents(studentRows);
      await etlRepository.upsertEnrollments(enrollmentRows);
      await etlRepository.insertLifecycleEvents(eventRows);
      counts.loaded = studentRows.length + enrollmentRows.length;
    } else {
      counts.loaded = counts.transformed;
    }

    logLine(executionLog, startedMs, `Transformed ${counts.transformed} SIS records and loaded ${counts.loaded} into central tables (students: ${studentRows.length}, enrollments: ${enrollmentRows.length}, lifecycle events: ${eventRows.length})`);

    return {
      counts,
      errors,
      executionLog,
      status: "Completed",
      startedAt: new Date(startedMs),
      completedAt: new Date(),
    };
  }

  private async runLmsSource(triggeredBy: string, startedMs: number): Promise<PerSourceOutcome> {
    const executionLog: string[] = [];
    const errors: string[] = [];
    const counts: SourceStageCounts = {
      extracted: RAW_LMS_PROGRESS.length,
      validated: 0,
      cleaned: 0,
      transformed: 0,
      loaded: 0,
      rejected: 0,
    };
    logLine(executionLog, startedMs, `Triggered LMS ETL by [${triggeredBy}]; extracted ${counts.extracted} raw course-progress records`);
    logLine(executionLog, startedMs, "Validating LMS extract schemas...");

    const validated: RawLmsProgress[] = [];
    for (const row of RAW_LMS_PROGRESS) {
      const parsed = lmsProgressSchema.safeParse(row);
      if (parsed.success) validated.push(row);
      else {
        counts.rejected += 1;
        errors.push(`LMS progress ${row.student_number}/${row.course_code || "(missing course)"} rejected: ${parsed.error.issues[0]?.message ?? "invalid"}`);
      }
    }
    counts.validated = validated.length;

    const unique = dedupe(validated, (row) => `${row.student_number}|${row.course_code}`);
    counts.cleaned = unique.removed;

    const centralIds = await this.centralStudentIds();
    const known = unique.kept.filter(
      (row) => centralIds.has(row.student_number) || env.db.enabled,
    );
    const unknown = unique.kept.filter(
      (row) => !centralIds.has(row.student_number) && !env.db.enabled,
    );
    counts.rejected += unknown.length;
    for (const row of unknown) {
      errors.push(`LMS progress ${row.student_number}/${row.course_code} could not be matched to central student master`);
    }
    counts.transformed = known.length;

    const progressRows: etlRepository.LmsProgressUpsertRow[] = known.map((row) => ({
      student_id: row.student_number,
      course_code: row.course_code,
      course_title: row.course_title,
      completion_rate: row.completion_pct,
      assignments_completed: row.assignments_completed,
      assignments_total: row.assignments_total,
      last_active_at: parseIsoOrNull(row.last_active_at),
    }));

    const eventRows: etlRepository.LifecycleEventRow[] = known.map((row) => ({
      id: `etl-lms-${row.student_number}-${slug(row.course_code)}`,
      student_id: row.student_number,
      stage: "LMS_ENGAGEMENT",
      source_system: "LMS",
      title: `LMS progress ${row.completion_pct}% in ${row.course_code}`,
      description: `${row.course_title}: ${row.assignments_completed}/${row.assignments_total} assignments completed.`,
      occurred_at: parseIsoOrNull(row.last_active_at) ?? new Date(),
      metadata: {
        course_code: row.course_code,
        completion_pct: row.completion_pct,
      },
    }));

    if (env.db.enabled) {
      await etlRepository.upsertLmsProgress(progressRows);
      await etlRepository.insertLifecycleEvents(eventRows);
      counts.loaded = progressRows.length;
    } else {
      counts.loaded = counts.transformed;
    }

    logLine(executionLog, startedMs, `Validated ${counts.validated}, cleaned ${counts.cleaned}, loaded ${counts.loaded} LMS progress rows (+${eventRows.length} lifecycle events)`);

    return {
      counts,
      errors,
      executionLog,
      status: "Completed",
      startedAt: new Date(startedMs),
      completedAt: new Date(),
    };
  }

  private async runHrSource(triggeredBy: string, startedMs: number): Promise<PerSourceOutcome> {
    const executionLog: string[] = [];
    const errors: string[] = [];
    const counts: SourceStageCounts = {
      extracted: RAW_HR_EMPLOYMENT.length,
      validated: 0,
      cleaned: 0,
      transformed: 0,
      loaded: 0,
      rejected: 0,
    };
    logLine(executionLog, startedMs, `Triggered HR ETL by [${triggeredBy}]; extracted ${counts.extracted} raw employment records`);
    logLine(executionLog, startedMs, "Validating HR extract schemas...");

    const validated: RawHrEmployment[] = [];
    for (const row of RAW_HR_EMPLOYMENT) {
      const parsed = hrEmploymentSchema.safeParse(row);
      if (parsed.success) validated.push(row);
      else {
        counts.rejected += 1;
        errors.push(`HR employment ${row.employment_id} rejected: ${parsed.error.issues[0]?.message ?? "invalid"}`);
      }
    }
    counts.validated = validated.length;

    const unique = dedupe(validated, (row) => row.employment_id);
    counts.cleaned = unique.removed;

    const centralIds = await this.centralStudentIds();
    const known = unique.kept.filter(
      (row) => centralIds.has(row.student_number) || env.db.enabled,
    );
    const unknown = unique.kept.filter(
      (row) => !centralIds.has(row.student_number) && !env.db.enabled,
    );
    counts.rejected += unknown.length;
    for (const row of unknown) {
      errors.push(`HR employment ${row.employment_id} could not be matched to central student master`);
    }
    counts.transformed = known.length;

    const employmentRows: etlRepository.HrEmploymentUpsertRow[] = known.map((row) => ({
      id: row.employment_id,
      student_id: row.student_number,
      department: row.department,
      position_title: row.position_title,
      employment_status: row.employment_status,
      hired_on: row.hired_on,
      supervisor: row.supervisor ?? null,
      weekly_hours: row.weekly_hours,
    }));

    if (env.db.enabled) {
      await etlRepository.upsertHrEmployment(employmentRows);
      counts.loaded = employmentRows.length;
    } else {
      counts.loaded = counts.transformed;
    }

    logLine(executionLog, startedMs, `Validated ${counts.validated}, cleaned ${counts.cleaned}, loaded ${counts.loaded} HR employment records`);

    return {
      counts,
      errors,
      executionLog,
      status: "Completed",
      startedAt: new Date(startedMs),
      completedAt: new Date(),
    };
  }

  private async runAlumniSource(triggeredBy: string, startedMs: number): Promise<PerSourceOutcome> {
    const executionLog: string[] = [];
    const errors: string[] = [];
    const counts: SourceStageCounts = {
      extracted: RAW_ALUMNI_CRM_RECORDS.length,
      validated: 0,
      cleaned: 0,
      transformed: 0,
      loaded: 0,
      rejected: 0,
    };
    logLine(executionLog, startedMs, `Triggered Alumni CRM ETL by [${triggeredBy}]; extracted ${counts.extracted} raw alumni records`);
    logLine(executionLog, startedMs, "Validating Alumni CRM extract schemas...");

    const validated: RawAlumniCrmRecord[] = [];
    for (const row of RAW_ALUMNI_CRM_RECORDS) {
      const parsed = alumniCrmSchema.safeParse(row);
      if (parsed.success) validated.push(row);
      else {
        counts.rejected += 1;
        errors.push(`Alumni CRM record ${row.crm_record_id} rejected: ${parsed.error.issues[0]?.message ?? "invalid"}`);
      }
    }
    counts.validated = validated.length;

    const unique = dedupe(validated, (row) => row.crm_record_id);
    counts.cleaned = unique.removed;

    const centralIds = await this.centralStudentIds();
    const known = unique.kept.filter(
      (row) => centralIds.has(row.student_number) || env.db.enabled,
    );
    const unknown = unique.kept.filter(
      (row) => !centralIds.has(row.student_number) && !env.db.enabled,
    );
    counts.rejected += unknown.length;
    for (const row of unknown) {
      errors.push(`Alumni CRM record ${row.crm_record_id} could not be matched to central student master`);
    }
    counts.transformed = known.length;

    const alumniRows: etlRepository.AlumniRecordUpsertRow[] = known.map((row) => ({
      id: row.crm_record_id,
      student_id: row.student_number,
      name: row.full_name,
      graduation_year: row.graduation_year,
      program_code: row.program_code,
      employment_status: row.employment_status,
      current_company: row.current_company ?? null,
      location: row.location ?? null,
    }));

    const crmRows: etlRepository.IntegratedAlumniUpsertRow[] = known.map((row) => ({
      id: row.crm_record_id,
      student_id: row.student_number,
      full_name: row.full_name,
      program_code: row.program_code,
      program_name: row.program_name,
      department: row.department,
      batch: row.batch,
      graduation_date: row.graduation_date,
      status: "Alumni",
      source: "Alumni CRM",
      email: row.email ?? null,
      contact_number: row.contact_number ?? null,
      enrollment_year: row.enrollment_year ?? null,
    }));

    const eventRows: etlRepository.LifecycleEventRow[] = known.map((row) => ({
      id: `etl-alumni-${slug(row.crm_record_id)}`,
      student_id: row.student_number,
      stage: "ALUMNI",
      source_system: "ALUMNI_CRM",
      title: `Graduated ${row.program_code} (${row.graduation_year})`,
      description: `${row.employment_status}${row.current_company ? ` at ${row.current_company}` : ""} — recorded by Alumni CRM.`,
      occurred_at: new Date(`${row.graduation_year}-06-15T00:00:00Z`),
      metadata: {
        crm_record_id: row.crm_record_id,
        graduation_year: row.graduation_year,
        employment_status: row.employment_status,
      },
    }));

    if (env.db.enabled) {
      await etlRepository.upsertAlumniRecords(alumniRows);
      await etlRepository.upsertIntegratedAlumni(crmRows);
      await etlRepository.insertLifecycleEvents(eventRows);
      counts.loaded = alumniRows.length + crmRows.length;
    } else {
      counts.loaded = counts.transformed;
    }

    logLine(executionLog, startedMs, `Validated ${counts.validated}, cleaned ${counts.cleaned}, loaded ${counts.loaded} alumni rows (+${eventRows.length} lifecycle events)`);

    return {
      counts,
      errors,
      executionLog,
      status: "Completed",
      startedAt: new Date(startedMs),
      completedAt: new Date(),
    };
  }

  private async runLibrarySource(triggeredBy: string, startedMs: number): Promise<PerSourceOutcome> {
    const executionLog: string[] = [];
    logLine(executionLog, startedMs, `Triggered Library LMS ETL by [${triggeredBy}]; delegating to the Integrated Library System pipeline`);

    const libraryLog: LibraryETLLogModel = await libraryETLService.runPipelineSync(triggeredBy);

    const counts: SourceStageCounts = {
      extracted: libraryLog.recordsExtracted,
      validated: libraryLog.recordsValidated,
      cleaned: libraryLog.duplicatesCleaned,
      transformed: libraryLog.recordsValidated,
      loaded: libraryLog.recordsLoaded,
      rejected: 0,
    };

    logLine(executionLog, startedMs, `Library pipeline ${libraryLog.status}: extracted ${counts.extracted}, validated ${counts.validated}, cleaned ${counts.cleaned}, loaded ${counts.loaded}`);
    logLine(executionLog, startedMs, "Library loads are managed by the library pipeline (persisted via db:seed); run metrics recorded centrally.");

    return {
      counts,
      errors: libraryLog.errors ?? [],
      executionLog: [...executionLog, ...libraryLog.executionLog],
      status: libraryLog.status === "Completed" ? "Completed" : "Failed",
      startedAt: new Date(startedMs),
      completedAt: new Date(),
    };
  }

  /** Test hook: clears in-memory mock-mode run history. */
  __resetMockStateForTests(): void {
    this.mockRunHistory = [];
    this.mockLastSynced.clear();
  }
}

export const universityETLService = new UniversityETLService();

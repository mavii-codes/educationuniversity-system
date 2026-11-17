import { queryDb, withTransaction } from "../config/database";
import {
  ETL_SOURCE_DEFINITIONS,
  EtlSourceCode,
  RawAlumniCrmRecord,
  RawHrEmployment,
  RawLmsProgress,
  RawSisEnrollment,
  RawSisStudent,
} from "../etl/sources";

// ---------------------------------------------------------------------------
// Row types (snake_case mirrors of the PostgreSQL tables)
// ---------------------------------------------------------------------------

export type EtlSourceRow = {
  code: string;
  name: string;
  description: string | null;
  adapter: string;
  status: string;
  last_synced_at: Date | null;
};

export type EtlRunRow = {
  id: string;
  triggered_by: string;
  status: string;
  started_at: Date;
  completed_at: Date | null;
  duration_ms: number;
  total_extracted: number;
  total_validated: number;
  total_cleaned: number;
  total_transformed: number;
  total_loaded: number;
  total_rejected: number;
  source_codes: string[];
  errors: string[];
};

export type StudentUpsertRow = {
  id: string;
  name: string;
  email: string;
  program_code: string;
  year_level: string;
  status: string;
  performance_score: number;
  gpa: number;
  attendance_rate: number;
  risk_level: string;
  department: string | null;
  adviser: string | null;
  admission_year: number | null;
  expected_graduation: number | null;
  contact_number: string | null;
  address: string | null;
  current_semester: string | null;
  units_earned: number;
  units_required: number;
};

export type EnrollmentUpsertRow = {
  student_id: string;
  course_code: string;
  course_title: string;
  term: string;
  units: number;
  midterm_grade: number | null;
  final_grade: number | null;
  gpa_equivalent: number | null;
  instructor: string | null;
  status: string;
};

export type LmsProgressUpsertRow = {
  student_id: string;
  course_code: string;
  course_title: string;
  completion_rate: number;
  assignments_completed: number;
  assignments_total: number;
  last_active_at: Date | null;
};

export type HrEmploymentUpsertRow = {
  id: string;
  student_id: string;
  department: string;
  position_title: string;
  employment_status: string;
  hired_on: string | null;
  supervisor: string | null;
  weekly_hours: number;
};

export type AlumniRecordUpsertRow = {
  id: string;
  student_id: string;
  name: string;
  graduation_year: number;
  program_code: string;
  employment_status: string;
  current_company: string | null;
  location: string | null;
};

export type IntegratedAlumniUpsertRow = {
  id: string;
  student_id: string;
  full_name: string;
  program_code: string;
  program_name: string;
  department: string;
  batch: string;
  graduation_date: string;
  status: string;
  source: string;
  email: string | null;
  contact_number: string | null;
  enrollment_year: string | null;
};

export type LifecycleEventRow = {
  id: string;
  student_id: string;
  stage: string;
  source_system: string;
  title: string;
  description: string | null;
  occurred_at: Date;
  metadata: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export async function ensureDefaultSources(): Promise<void> {
  const sql = `INSERT INTO etl_sources (code, name, description, adapter, status)
    VALUES ($1, $2, $3, $4, 'Connected')
    ON CONFLICT (code) DO NOTHING`;

  await withTransaction(async (client) => {
    for (const definition of ETL_SOURCE_DEFINITIONS) {
      await client.query(sql, [
        definition.code,
        definition.name,
        definition.description,
        definition.adapter,
      ]);
    }
  });
}

export async function listSources(): Promise<EtlSourceRow[]> {
  const order: string[] = ETL_SOURCE_DEFINITIONS.map((d) => d.code);
  const result = await queryDb<EtlSourceRow>(
    `SELECT code, name, description, adapter, status, last_synced_at
     FROM etl_sources`,
  );
  return result.rows.sort(
    (a, b) => order.indexOf(a.code) - order.indexOf(b.code),
  );
}

export async function touchSource(
  code: EtlSourceCode,
  status: string,
  syncedAt: Date,
): Promise<void> {
  await queryDb(
    `UPDATE etl_sources
     SET status = $2, last_synced_at = $3
     WHERE code = $1`,
    [code, status, syncedAt],
  );
}

// ---------------------------------------------------------------------------
// Run history
// ---------------------------------------------------------------------------

export async function insertRun(
  run: {
    id: string;
    triggeredBy: string;
    status: string;
    startedAt: Date;
    completedAt: Date;
    durationMs: number;
    totals: {
      extracted: number;
      validated: number;
      cleaned: number;
      transformed: number;
      loaded: number;
      rejected: number;
    };
    sourceCodes: string[];
    errors: string[];
  },
): Promise<void> {
  await queryDb(
    `INSERT INTO etl_runs
       (id, triggered_by, status, started_at, completed_at, duration_ms,
        total_extracted, total_validated, total_cleaned, total_transformed,
        total_loaded, total_rejected, source_codes, errors)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb)`,
    [
      run.id,
      run.triggeredBy,
      run.status,
      run.startedAt,
      run.completedAt,
      run.durationMs,
      run.totals.extracted,
      run.totals.validated,
      run.totals.cleaned,
      run.totals.transformed,
      run.totals.loaded,
      run.totals.rejected,
      JSON.stringify(run.sourceCodes),
      JSON.stringify(run.errors),
    ],
  );
}

export async function insertRunSource(row: {
  id: string;
  runId: string;
  sourceCode: string;
  status: string;
  records: {
    extracted: number;
    validated: number;
    cleaned: number;
    transformed: number;
    loaded: number;
    rejected: number;
  };
  durationMs: number;
  errors: string[];
}): Promise<void> {
  await queryDb(
    `INSERT INTO etl_run_sources
       (id, run_id, source_code, status, records_extracted, records_validated,
        records_cleaned, records_transformed, records_loaded, records_rejected,
        duration_ms, errors)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)`,
    [
      row.id,
      row.runId,
      row.sourceCode,
      row.status,
      row.records.extracted,
      row.records.validated,
      row.records.cleaned,
      row.records.transformed,
      row.records.loaded,
      row.records.rejected,
      row.durationMs,
      JSON.stringify(row.errors),
    ],
  );
}

export async function listRuns(limit: number): Promise<EtlRunRow[]> {
  const result = await queryDb<EtlRunRow>(
    `SELECT id, triggered_by, status, started_at, completed_at, duration_ms,
            total_extracted, total_validated, total_cleaned, total_transformed,
            total_loaded, total_rejected,
            COALESCE(source_codes, '[]'::jsonb) AS source_codes,
            COALESCE(errors, '[]'::jsonb) AS errors
     FROM etl_runs
     ORDER BY started_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
}

// ---------------------------------------------------------------------------
// Extract-load helpers
// ---------------------------------------------------------------------------

export async function findExistingStudentIds(
  studentIds: string[],
): Promise<Set<string>> {
  if (studentIds.length === 0) return new Set();
  const result = await queryDb<{ id: string }>(
    `SELECT id FROM students WHERE id = ANY($1::text[])`,
    [studentIds],
  );
  return new Set(result.rows.map((row) => row.id));
}

export async function upsertStudents(rows: StudentUpsertRow[]): Promise<void> {
  if (rows.length === 0) return;
  const sql = `INSERT INTO students
      (id, name, email, program_code, year_level, status, performance_score,
       gpa, attendance_rate, risk_level, department, adviser, admission_year,
       expected_graduation, contact_number, address, current_semester,
       units_earned, units_required, last_synced_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      program_code = EXCLUDED.program_code,
      year_level = EXCLUDED.year_level,
      status = EXCLUDED.status,
      performance_score = EXCLUDED.performance_score,
      gpa = EXCLUDED.gpa,
      attendance_rate = EXCLUDED.attendance_rate,
      risk_level = EXCLUDED.risk_level,
      department = EXCLUDED.department,
      adviser = EXCLUDED.adviser,
      admission_year = EXCLUDED.admission_year,
      expected_graduation = EXCLUDED.expected_graduation,
      contact_number = EXCLUDED.contact_number,
      address = EXCLUDED.address,
      current_semester = EXCLUDED.current_semester,
      units_earned = EXCLUDED.units_earned,
      units_required = EXCLUDED.units_required,
      last_synced_at = NOW()`;

  await withTransaction(async (client) => {
    for (const row of rows) {
      await client.query(sql, [
        row.id,
        row.name,
        row.email,
        row.program_code,
        row.year_level,
        row.status,
        row.performance_score,
        row.gpa,
        row.attendance_rate,
        row.risk_level,
        row.department,
        row.adviser,
        row.admission_year,
        row.expected_graduation,
        row.contact_number,
        row.address,
        row.current_semester,
        row.units_earned,
        row.units_required,
      ]);
    }
  });
}

export async function upsertEnrollments(
  rows: EnrollmentUpsertRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const sql = `INSERT INTO enrollments
      (student_id, course_code, course_title, term, units, midterm_grade,
       final_grade, gpa_equivalent, instructor, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (student_id, course_code, term) DO UPDATE SET
      course_title = EXCLUDED.course_title,
      units = EXCLUDED.units,
      midterm_grade = EXCLUDED.midterm_grade,
      final_grade = EXCLUDED.final_grade,
      gpa_equivalent = EXCLUDED.gpa_equivalent,
      instructor = EXCLUDED.instructor,
      status = EXCLUDED.status`;

  await withTransaction(async (client) => {
    for (const row of rows) {
      await client.query(sql, [
        row.student_id,
        row.course_code,
        row.course_title,
        row.term,
        row.units,
        row.midterm_grade,
        row.final_grade,
        row.gpa_equivalent,
        row.instructor,
        row.status,
      ]);
    }
  });
}

export async function upsertLmsProgress(
  rows: LmsProgressUpsertRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const sql = `INSERT INTO lms_course_progress
      (student_id, course_code, course_title, completion_rate,
       assignments_completed, assignments_total, last_active_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (student_id, course_code) DO UPDATE SET
      course_title = EXCLUDED.course_title,
      completion_rate = EXCLUDED.completion_rate,
      assignments_completed = EXCLUDED.assignments_completed,
      assignments_total = EXCLUDED.assignments_total,
      last_active_at = EXCLUDED.last_active_at`;

  await withTransaction(async (client) => {
    for (const row of rows) {
      await client.query(sql, [
        row.student_id,
        row.course_code,
        row.course_title,
        row.completion_rate,
        row.assignments_completed,
        row.assignments_total,
        row.last_active_at,
      ]);
    }
  });
}

export async function upsertHrEmployment(
  rows: HrEmploymentUpsertRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const sql = `INSERT INTO hr_student_employment
      (id, student_id, department, position_title, employment_status,
       hired_on, supervisor, weekly_hours, synced_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    ON CONFLICT (id) DO UPDATE SET
      student_id = EXCLUDED.student_id,
      department = EXCLUDED.department,
      position_title = EXCLUDED.position_title,
      employment_status = EXCLUDED.employment_status,
      hired_on = EXCLUDED.hired_on,
      supervisor = EXCLUDED.supervisor,
      weekly_hours = EXCLUDED.weekly_hours,
      synced_at = NOW()`;

  await withTransaction(async (client) => {
    for (const row of rows) {
      await client.query(sql, [
        row.id,
        row.student_id,
        row.department,
        row.position_title,
        row.employment_status,
        row.hired_on,
        row.supervisor,
        row.weekly_hours,
      ]);
    }
  });
}

export async function upsertAlumniRecords(
  rows: AlumniRecordUpsertRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const sql = `INSERT INTO alumni_records
      (id, student_id, name, graduation_year, program_code, employment_status,
       current_company, location)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      student_id = EXCLUDED.student_id,
      name = EXCLUDED.name,
      graduation_year = EXCLUDED.graduation_year,
      program_code = EXCLUDED.program_code,
      employment_status = EXCLUDED.employment_status,
      current_company = EXCLUDED.current_company,
      location = EXCLUDED.location`;

  await withTransaction(async (client) => {
    for (const row of rows) {
      await client.query(sql, [
        row.id,
        row.student_id,
        row.name,
        row.graduation_year,
        row.program_code,
        row.employment_status,
        row.current_company,
        row.location,
      ]);
    }
  });
}

export async function upsertIntegratedAlumni(
  rows: IntegratedAlumniUpsertRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const sql = `INSERT INTO integrated_alumni_crm
      (id, student_id, full_name, program_code, program_name, department,
       batch, graduation_date, status, source, email, contact_number,
       enrollment_year, synced_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
    ON CONFLICT (id) DO UPDATE SET
      student_id = EXCLUDED.student_id,
      full_name = EXCLUDED.full_name,
      program_code = EXCLUDED.program_code,
      program_name = EXCLUDED.program_name,
      department = EXCLUDED.department,
      batch = EXCLUDED.batch,
      graduation_date = EXCLUDED.graduation_date,
      status = EXCLUDED.status,
      source = EXCLUDED.source,
      email = EXCLUDED.email,
      contact_number = EXCLUDED.contact_number,
      enrollment_year = EXCLUDED.enrollment_year,
      synced_at = NOW()`;

  await withTransaction(async (client) => {
    for (const row of rows) {
      await client.query(sql, [
        row.id,
        row.student_id,
        row.full_name,
        row.program_code,
        row.program_name,
        row.department,
        row.batch,
        row.graduation_date,
        row.status,
        row.source,
        row.email,
        row.contact_number,
        row.enrollment_year,
      ]);
    }
  });
}

export async function insertLifecycleEvents(
  rows: LifecycleEventRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const sql = `INSERT INTO student_lifecycle_events
      (id, student_id, stage, source_system, title, description, occurred_at, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    ON CONFLICT (id) DO NOTHING`;

  await withTransaction(async (client) => {
    for (const row of rows) {
      await client.query(sql, [
        row.id,
        row.student_id,
        row.stage,
        row.source_system,
        row.title,
        row.description,
        row.occurred_at,
        JSON.stringify(row.metadata),
      ]);
    }
  });
}

// Re-exports so the service can consume raw fixture types without leaking
// import paths into route/controller layers.
export type {
  RawAlumniCrmRecord,
  RawHrEmployment,
  RawLmsProgress,
  RawSisEnrollment,
  RawSisStudent,
};

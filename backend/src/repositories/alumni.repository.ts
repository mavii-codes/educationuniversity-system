import crypto from "node:crypto";
import { queryDb, withTransaction } from "../config/database";
import { AlumniModel, IntegratedAlumniModel } from "../models";
import { formatRelativeTime } from "../utils/format";

type AlumniRow = {
  id: string;
  name: string;
  graduation_year: number;
  program_code: string;
  program_name: string;
  employment_status: string;
  current_company: string | null;
  job_title: string | null;
  location: string | null;
  industry: string | null;
  aligned_with_degree: boolean;
};

type IntegratedAlumniRow = {
  id: string;
  student_id: string;
  full_name: string;
  program_code: string;
  program_name: string;
  department: string;
  batch: string;
  graduation_date: string;
  status: "Alumni";
  source: "Alumni CRM";
  email: string | null;
  contact_number: string | null;
  enrollment_year: string | null;
};

export async function findAlumniRecords(): Promise<AlumniModel[]> {
  const result = await queryDb<AlumniRow>(
    `SELECT a.id, a.name, a.graduation_year, a.program_code, p.name AS program_name,
            a.employment_status, a.current_company, a.job_title, a.location, a.industry,
            a.aligned_with_degree
       FROM alumni_records a
       JOIN programs p ON p.code = a.program_code
      ORDER BY a.graduation_year DESC, a.name`
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    graduationYear: row.graduation_year,
    programCode: row.program_code,
    programName: row.program_name,
    employmentStatus: row.employment_status,
    currentCompany: row.current_company ?? "",
    jobTitle: row.job_title ?? "",
    location: row.location ?? "",
    industry: row.industry ?? "",
    alignedWithDegree: row.aligned_with_degree,
  }));
}

export async function findIntegratedAlumni(): Promise<IntegratedAlumniModel[]> {
  const result = await queryDb<IntegratedAlumniRow>(
    `SELECT id, student_id, full_name, program_code, program_name, department,
            batch, graduation_date, status, source, email, contact_number, enrollment_year
       FROM integrated_alumni_crm
      ORDER BY batch DESC, full_name`
  );

  return result.rows.map((row) => ({
    id: row.id,
    studentId: row.student_id,
    fullName: row.full_name,
    programCode: row.program_code,
    program: row.program_name,
    department: row.department,
    batch: row.batch,
    graduationDate: row.graduation_date,
    status: row.status,
    source: row.source,
    email: row.email ?? undefined,
    contactNumber: row.contact_number ?? undefined,
    enrollmentYear: row.enrollment_year ?? "",
  }));
}

export async function getCrmLastSynchronization(): Promise<string> {
  const result = await queryDb<{ last_synced_at: Date | null }>(
    `SELECT last_synced_at FROM data_sources WHERE code = 'ALUMNI'`
  );
  return formatRelativeTime(result.rows[0]?.last_synced_at);
}

export async function touchCrmSync(): Promise<{
  lastSyncedAt: Date;
  lastSynchronization: string;
  recordsSynchronized: number;
  duration: string;
}> {
  const startedAt = Date.now();

  return withTransaction(async (client) => {
    const sourceResult = await client.query<{ id: string; code: string; name: string }>(
      `SELECT id, code, name FROM data_sources WHERE code = 'ALUMNI' FOR UPDATE`
    );
    const source = sourceResult.rows[0];
    if (!source) {
      throw new Error("Alumni CRM data source is not configured.");
    }

    const countResult = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM integrated_alumni_crm`
    );
    const records = Number(countResult.rows[0]?.count ?? 0);
    const now = new Date();
    const duration = `${Math.max(0.1, (Date.now() - startedAt) / 1000).toFixed(1)}s`;
    const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();

    await client.query(
      `UPDATE data_sources
          SET last_synced_at = $1, status = 'Connected', record_count = $2
        WHERE id = $3`,
      [now, records, source.id]
    );

    await client.query(
      `INSERT INTO integration_sync_logs
         (id, source_code, source_name, records_processed, duplicates_detected, failed_records,
          duration_label, date_label, timestamp_label, status, notes, executed_at)
       VALUES ($1, $2, $3, $4, 0, 0, $5, $6, 'Just now', 'Successful', $7, $8)`,
      [
        `SYN-${Date.now().toString(36).toUpperCase()}-${suffix}`.slice(0, 64),
        source.code,
        source.name,
        records,
        duration,
        now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        "Alumni CRM synchronization triggered manually.",
        now,
      ]
    );

    await client.query(
      `INSERT INTO sync_history
         (id, data_source, full_name, sync_mode, last_sync_label, records, duration, status, notes, started_at)
       VALUES ($1, $2, $3, 'Manual', 'Just now', $4, $5, 'Connected', $6, $7)`,
      [
        `SH-${Date.now().toString(36).toUpperCase()}-${suffix}`.slice(0, 32),
        source.code,
        source.name,
        records,
        duration,
        `Alumni CRM connector run completed with ${records} records.`,
        now,
      ]
    );

    return {
      lastSyncedAt: now,
      lastSynchronization: formatRelativeTime(now),
      recordsSynchronized: records,
      duration,
    };
  });
}

export async function getAlumniAnalytics<T = Record<string, any>>(): Promise<T | null> {
  const result = await queryDb<{ payload: T }>(
    `SELECT payload FROM analytics_snapshots WHERE key = 'alumni_analytics'`
  );
  return result.rows[0]?.payload ?? null;
}

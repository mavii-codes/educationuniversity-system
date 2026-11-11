import { queryDb } from "../config/database";

export type FerpaConsentType =
  | "RECORDS_RELEASE"
  | "DIRECTORY_INFO"
  | "THIRD_PARTY"
  | "RESEARCH_USE";

export type FerpaConsentStatus = "Granted" | "Revoked";

export interface FerpaConsentRecord {
  id: string;
  studentId: string;
  studentName: string;
  consentType: FerpaConsentType;
  status: FerpaConsentStatus;
  effectiveAt: string;
  expiresAt: string | null;
  recordedByName: string | null;
  note: string | null;
}

export interface FerpaDirectorySetting {
  studentId: string;
  studentName: string;
  directoryOptOut: boolean;
  updatedAt: string | null;
}

export interface FerpaAccessEvent {
  id: string;
  studentId: string;
  studentName: string;
  viewerId: string;
  viewerName: string;
  viewerRole: string;
  action: string;
  occurredAt: string;
}

export interface FerpaOverview {
  activeConsents: number;
  directoryOptOuts: number;
  accessEventsLast30Days: number;
  restrictedStudents: number;
}

export interface InsertConsentInput {
  id: string;
  studentId: string;
  consentType: FerpaConsentType;
  status: FerpaConsentStatus;
  effectiveAt: string;
  expiresAt: string | null;
  recordedBy: string | null;
  note: string | null;
}

export interface InsertAccessLogInput {
  id: string;
  studentId: string;
  viewerId: string;
  viewerName: string;
  viewerRole: string;
  action: string;
  occurredAt: string;
}

type ConsentRow = {
  id: string;
  student_id: string;
  student_name: string;
  consent_type: FerpaConsentType;
  status: FerpaConsentStatus;
  effective_at: Date | string;
  expires_at: Date | string | null;
  recorded_by_name: string | null;
  note: string | null;
};

type DirectorySettingRow = {
  student_id: string;
  student_name: string;
  directory_opt_out: boolean;
  updated_at: Date | string | null;
};

type AccessLogRow = {
  id: string;
  student_id: string;
  student_name: string;
  viewer_id: string;
  viewer_name: string | null;
  viewer_role: string;
  action: string;
  occurred_at: Date | string;
};

type OverviewRow = {
  active_consents: string | number;
  directory_opt_outs: string | number;
  access_events_last_30_days: string | number;
  restricted_students: string | number;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapConsent(row: ConsentRow): FerpaConsentRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    consentType: row.consent_type,
    status: row.status,
    effectiveAt: toIso(row.effective_at) ?? new Date(0).toISOString(),
    expiresAt: toIso(row.expires_at),
    recordedByName: row.recorded_by_name,
    note: row.note,
  };
}

const SELECT_CONSENTS = `
  SELECT c.id,
         c.student_id,
         s.name AS student_name,
         c.consent_type,
         c.status,
         c.effective_at,
         c.expires_at,
         u.name AS recorded_by_name,
         c.note
    FROM ferpa_consent_records c
    JOIN students s ON s.id = c.student_id
    LEFT JOIN users u ON u.id = c.recorded_by
`;

export async function findConsents(studentId?: string): Promise<FerpaConsentRecord[]> {
  const params: unknown[] = [];
  let where = "";
  if (studentId) {
    params.push(studentId);
    where = `WHERE c.student_id = $1`;
  }

  const result = await queryDb<ConsentRow>(
    `${SELECT_CONSENTS}
     ${where}
     ORDER BY c.effective_at DESC, c.id DESC`,
    params
  );
  return result.rows.map(mapConsent);
}

export async function insertConsent(input: InsertConsentInput): Promise<FerpaConsentRecord> {
  const result = await queryDb<ConsentRow>(
    `WITH inserted AS (
       INSERT INTO ferpa_consent_records
         (id, student_id, consent_type, status, effective_at, expires_at, recorded_by, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *
     )
     SELECT i.id,
            i.student_id,
            s.name AS student_name,
            i.consent_type,
            i.status,
            i.effective_at,
            i.expires_at,
            u.name AS recorded_by_name,
            i.note
       FROM inserted i
       JOIN students s ON s.id = i.student_id
       LEFT JOIN users u ON u.id = i.recorded_by`,
    [
      input.id,
      input.studentId,
      input.consentType,
      input.status,
      input.effectiveAt,
      input.expiresAt,
      input.recordedBy,
      input.note,
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to create FERPA consent record.");
  }
  return mapConsent(row);
}

export async function findDirectorySettings(): Promise<FerpaDirectorySetting[]> {
  const result = await queryDb<DirectorySettingRow>(
    `SELECT s.id AS student_id,
            s.name AS student_name,
            COALESCE(d.directory_opt_out, FALSE) AS directory_opt_out,
            d.updated_at
       FROM students s
       LEFT JOIN ferpa_directory_settings d ON d.student_id = s.id
      ORDER BY s.name`
  );

  return result.rows.map((row) => ({
    studentId: row.student_id,
    studentName: row.student_name,
    directoryOptOut: row.directory_opt_out,
    updatedAt: toIso(row.updated_at),
  }));
}

export async function upsertDirectorySetting(
  studentId: string,
  directoryOptOut: boolean,
  updatedBy: string | null
): Promise<FerpaDirectorySetting | null> {
  const result = await queryDb<DirectorySettingRow>(
    `WITH upserted AS (
       INSERT INTO ferpa_directory_settings (student_id, directory_opt_out, updated_by, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (student_id) DO UPDATE
         SET directory_opt_out = EXCLUDED.directory_opt_out,
             updated_by = EXCLUDED.updated_by,
             updated_at = NOW()
       RETURNING student_id, directory_opt_out, updated_at
     )
     SELECT u.student_id,
            s.name AS student_name,
            u.directory_opt_out,
            u.updated_at
       FROM upserted u
       JOIN students s ON s.id = u.student_id`,
    [studentId, directoryOptOut, updatedBy]
  );

  const row = result.rows[0];
  if (!row) return null;
  return {
    studentId: row.student_id,
    studentName: row.student_name,
    directoryOptOut: row.directory_opt_out,
    updatedAt: toIso(row.updated_at),
  };
}

export async function insertAccessLog(input: InsertAccessLogInput): Promise<void> {
  await queryDb(
    `INSERT INTO ferpa_access_log
       (id, student_id, viewer_id, viewer_name, viewer_role, action, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.id,
      input.studentId,
      input.viewerId,
      input.viewerName,
      input.viewerRole,
      input.action,
      input.occurredAt,
    ]
  );
}

export async function findAccessLog(limit = 100): Promise<FerpaAccessEvent[]> {
  const result = await queryDb<AccessLogRow>(
    `SELECT l.id,
            l.student_id,
            s.name AS student_name,
            l.viewer_id,
            l.viewer_name,
            l.viewer_role,
            l.action,
            l.occurred_at
       FROM ferpa_access_log l
       JOIN students s ON s.id = l.student_id
      ORDER BY l.occurred_at DESC, l.id DESC
      LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    viewerId: row.viewer_id,
    viewerName: row.viewer_name ?? "",
    viewerRole: row.viewer_role,
    action: row.action,
    occurredAt: toIso(row.occurred_at) ?? new Date(0).toISOString(),
  }));
}

export async function getOverview(): Promise<FerpaOverview> {
  const result = await queryDb<OverviewRow>(
    `SELECT
       (SELECT count(*) FROM ferpa_consent_records WHERE status = 'Granted') AS active_consents,
       (SELECT count(*) FROM ferpa_directory_settings WHERE directory_opt_out = TRUE) AS directory_opt_outs,
       (SELECT count(*) FROM ferpa_access_log
         WHERE occurred_at >= NOW() - INTERVAL '30 days') AS access_events_last_30_days,
       (SELECT count(DISTINCT student_id) FROM (
          SELECT student_id FROM ferpa_directory_settings WHERE directory_opt_out = TRUE
          UNION
          SELECT student_id FROM ferpa_consent_records WHERE status = 'Revoked'
        ) restricted) AS restricted_students`
  );

  const row = result.rows[0];
  return {
    activeConsents: Number(row?.active_consents ?? 0),
    directoryOptOuts: Number(row?.directory_opt_outs ?? 0),
    accessEventsLast30Days: Number(row?.access_events_last_30_days ?? 0),
    restrictedStudents: Number(row?.restricted_students ?? 0),
  };
}

export async function findDirectoryOptOutIds(studentIds: string[]): Promise<Set<string>> {
  if (studentIds.length === 0) return new Set();

  const result = await queryDb<{ student_id: string }>(
    `SELECT student_id
       FROM ferpa_directory_settings
      WHERE directory_opt_out = TRUE
        AND student_id = ANY($1::varchar[])`,
    [studentIds]
  );
  return new Set(result.rows.map((row) => row.student_id));
}

export async function studentExists(studentId: string): Promise<boolean> {
  const result = await queryDb<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM students WHERE id = $1) AS exists`,
    [studentId]
  );
  return result.rows[0]?.exists === true;
}

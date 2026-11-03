import { queryDb } from "../config/database";
import { AdminUserModel, DataSourceStatus, SyncHistoryModel } from "../models";
import { formatRelativeTime } from "../utils/format";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: AdminUserModel["status"];
  mfa_enabled: boolean;
  last_active_at: Date | null;
};

type SyncHistoryRow = {
  id: string;
  data_source: string;
  full_name: string;
  sync_mode: string;
  last_sync_label: string;
  records: number;
  duration: string;
  status: DataSourceStatus;
  notes: string | null;
};

export async function getDashboardOverview<T = Record<string, any>>(): Promise<T | null> {
  const result = await queryDb<{ payload: T }>(
    `SELECT payload FROM analytics_snapshots WHERE key = 'admin_dashboard_overview'`
  );
  return result.rows[0]?.payload ?? null;
}

export async function findUsers(): Promise<AdminUserModel[]> {
  const result = await queryDb<UserRow>(
    `SELECT id, name, email, role, department, status, mfa_enabled, last_active_at
       FROM users
      ORDER BY name`
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department,
    status: row.status,
    mfaEnabled: row.mfa_enabled,
    lastActive: formatRelativeTime(row.last_active_at),
  }));
}

export async function findSyncHistory(): Promise<SyncHistoryModel[]> {
  const result = await queryDb<SyncHistoryRow>(
    `SELECT id, data_source, full_name, sync_mode, last_sync_label, records, duration, status, notes
       FROM sync_history
      ORDER BY started_at DESC NULLS LAST, id DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    dataSource: row.data_source,
    fullName: row.full_name,
    syncMode: row.sync_mode,
    lastSync: row.last_sync_label,
    records: row.records,
    duration: row.duration,
    status: row.status,
    notes: row.notes ?? "",
  }));
}

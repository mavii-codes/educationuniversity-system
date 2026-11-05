import { queryDb, withTransaction } from "../config/database";
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

export interface AdminSettingsRecord {
  profile: {
    name: string;
    email: string;
    department: string;
  };
  library: {
    libraryName: string;
    officeLocation: string;
    dueDateReminders: boolean;
    fineNotifications: boolean;
  };
}

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
      WHERE role <> 'Student'
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

export async function createLibraryStaffUser(input: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  department: string;
}): Promise<AdminUserModel> {
  return withTransaction(async (client) => {
    const duplicate = await client.query(
      `SELECT 1 FROM users WHERE lower(email) = lower($1)
       UNION ALL
       SELECT 1 FROM students WHERE lower(email) = lower($1)
       LIMIT 1`,
      [input.email]
    );
    if (duplicate.rowCount) {
      const error = new Error("An account already exists for that email address.");
      error.name = "DuplicateUserAccountError";
      throw error;
    }

    const { rows } = await client.query<UserRow>(
      `INSERT INTO users
         (id, name, email, password_hash, role, department, status, mfa_enabled)
       VALUES ($1, $2, $3, $4, 'Library Staff', $5, 'Active', FALSE)
       RETURNING id, name, email, role, department, status, mfa_enabled, last_active_at`,
      [
        input.id,
        input.name,
        input.email,
        input.passwordHash,
        input.department,
      ]
    );
    const user = rows[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
      mfaEnabled: user.mfa_enabled,
      lastActive: "Never",
    };
  });
}

export async function updateUserStatus(
  userId: string,
  status: AdminUserModel["status"]
): Promise<AdminUserModel | null> {
  return withTransaction(async (client) => {
    const { rows } = await client.query<UserRow>(
      `UPDATE users
          SET status = $2, updated_at = NOW()
        WHERE id = $1 AND role <> 'Student'
        RETURNING id, name, email, role, department, status, mfa_enabled,
                  last_active_at`,
      [userId, status]
    );
    const user = rows[0];
    if (!user) return null;

    if (status === "Inactive") {
      await client.query(
        `UPDATE refresh_tokens SET revoked_at = NOW()
          WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId]
      );
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
      mfaEnabled: user.mfa_enabled,
      lastActive: formatRelativeTime(user.last_active_at),
    };
  });
}

export async function findAdminSettings(userId: string): Promise<AdminSettingsRecord | null> {
  const { rows } = await queryDb<{
    name: string;
    email: string;
    department: string;
    library_name: string;
    office_location: string;
    due_date_reminders: boolean;
    fine_notifications: boolean;
  }>(
    `SELECT u.name, u.email, u.department,
            s.library_name, s.office_location,
            s.due_date_reminders, s.fine_notifications
       FROM users AS u
       CROSS JOIN library_system_settings AS s
      WHERE u.id = $1 AND u.status = 'Active'`,
    [userId]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    profile: {
      name: row.name,
      email: row.email,
      department: row.department,
    },
    library: {
      libraryName: row.library_name,
      officeLocation: row.office_location,
      dueDateReminders: row.due_date_reminders,
      fineNotifications: row.fine_notifications,
    },
  };
}

export async function updateAdminSettings(
  userId: string,
  input: AdminSettingsRecord
): Promise<AdminSettingsRecord | null> {
  return withTransaction(async (client) => {
    const duplicateEmail = await client.query(
      `SELECT 1 FROM users
        WHERE lower(email) = lower($1) AND id <> $2
       UNION ALL
       SELECT 1 FROM students WHERE lower(email) = lower($1)
       LIMIT 1`,
      [input.profile.email, userId]
    );
    if (duplicateEmail.rowCount) {
      const error = new Error("That email address is already in use.");
      error.name = "DuplicateUserEmailError";
      throw error;
    }

    const { rows: users } = await client.query<{
      name: string;
      email: string;
      department: string;
    }>(
      `UPDATE users
          SET name = $2, email = $3, department = $4, updated_at = NOW()
        WHERE id = $1 AND status = 'Active'
        RETURNING name, email, department`,
      [
        userId,
        input.profile.name,
        input.profile.email,
        input.profile.department,
      ]
    );
    const user = users[0];
    if (!user) return null;

    await client.query(
      `UPDATE library_system_settings
          SET library_name = $1, office_location = $2,
              due_date_reminders = $3, fine_notifications = $4,
              updated_at = NOW()
        WHERE id = 1`,
      [
        input.library.libraryName,
        input.library.officeLocation,
        input.library.dueDateReminders,
        input.library.fineNotifications,
      ]
    );
    return input;
  });
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

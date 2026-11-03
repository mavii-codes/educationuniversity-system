import crypto from "node:crypto";
import { queryDb, withTransaction } from "../config/database";
import { DataSourceModel, IntegrationLogModel, NotificationModel } from "../models";
import { formatRelativeTime } from "../utils/format";

type DataSourceRow = {
  id: string;
  code: DataSourceModel["code"];
  name: string;
  short_name: string | null;
  description: string | null;
  status: DataSourceModel["status"];
  record_count: number;
  last_synced_at: Date | null;
  sync_frequency: string | null;
  endpoint_preview: string | null;
  health_score: string | number;
  entities_synced: string[] | null;
  maintainer_dept: string | null;
};

type SyncLogRow = {
  id: string;
  source_code: string;
  source_name: string;
  records_processed: number;
  duplicates_detected: number;
  failed_records: number;
  duration_label: string | null;
  status: IntegrationLogModel["status"];
  date_label: string | null;
  timestamp_label: string | null;
  notes: string | null;
  executed_at: Date;
};

type NotificationRow = {
  id: string;
  title: string;
  description: string;
  type: NotificationModel["type"];
  source: string;
  is_read: boolean;
  href: string | null;
  created_at: Date;
};

export async function findAllDataSources(): Promise<DataSourceModel[]> {
  const result = await queryDb<DataSourceRow>(
    `SELECT id, code, name, short_name, description, status, record_count, last_synced_at,
            sync_frequency, endpoint_preview, health_score, entities_synced, maintainer_dept
       FROM data_sources
      ORDER BY sort_order, code`
  );

  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    shortName: row.short_name ?? row.name,
    description: row.description ?? "",
    status: row.status,
    lastSynced: formatRelativeTime(row.last_synced_at),
    recordCount: row.record_count,
    syncFrequency: row.sync_frequency ?? "",
    endpointPreview: row.endpoint_preview ?? "",
    healthScore: Number(row.health_score),
    entitiesSynced: row.entities_synced ?? [],
    maintainerDept: row.maintainer_dept ?? "",
  }));
}

export interface SourceSyncResult {
  sourceId: string;
  status: DataSourceModel["status"];
  lastSynced: string;
  recordsProcessed: number;
  duration: string;
  syncHistoryId: string;
  logId: string;
}

/**
 * Simulates a connector run, then records it atomically in sync_history,
 * integration_sync_logs, and data_sources so admin views reflect real activity.
 */
export async function performDataSourceSync(id: string): Promise<SourceSyncResult | null> {
  const startedAt = Date.now();

  return withTransaction(async (client) => {
    const sourceResult = await client.query<{
      id: string;
      code: string;
      name: string;
      record_count: number;
    }>(
      `SELECT id, code, name, record_count FROM data_sources WHERE id = $1 FOR UPDATE`,
      [id]
    );

    const source = sourceResult.rows[0];
    if (!source) return null;

    const now = new Date();
    const duration = `${Math.max(0.1, (Date.now() - startedAt) / 1000).toFixed(1)}s`;
    const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
    const syncHistoryId = `SH-${Date.now().toString(36).toUpperCase()}-${suffix}`.slice(0, 32);
    const logId = `SYN-${Date.now().toString(36).toUpperCase()}-${suffix}`.slice(0, 64);
    const recordsProcessed = source.record_count;

    await client.query(
      `UPDATE data_sources
          SET last_synced_at = NOW(), status = 'Connected'
        WHERE id = $1`,
      [id]
    );

    await client.query(
      `INSERT INTO integration_sync_logs
         (id, source_code, source_name, records_processed, duplicates_detected, failed_records,
          duration_label, date_label, timestamp_label, status, notes, executed_at)
       VALUES ($1, $2, $3, $4, 0, 0, $5, $6, $7, 'Successful', $8, $9)`,
      [
        logId,
        source.code,
        source.name,
        recordsProcessed,
        duration,
        now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        "Just now",
        `Manual sync triggered from the integration console for ${source.name}.`,
        now,
      ]
    );

    await client.query(
      `INSERT INTO sync_history
         (id, data_source, full_name, sync_mode, last_sync_label, records, duration, status, notes, started_at)
       VALUES ($1, $2, $3, 'Manual', 'Just now', $4, $5, 'Connected', $6, $7)`,
      [
        syncHistoryId,
        source.code,
        source.name,
        recordsProcessed,
        duration,
        `Simulated connector run completed with ${recordsProcessed} records.`,
        now,
      ]
    );

    return {
      sourceId: id,
      status: "Connected" as const,
      lastSynced: formatRelativeTime(now),
      recordsProcessed,
      duration,
      syncHistoryId,
      logId,
    };
  });
}

export async function findSyncLogs(): Promise<IntegrationLogModel[]> {
  const result = await queryDb<SyncLogRow>(
    `SELECT id, source_code, source_name, records_processed, duplicates_detected,
            failed_records, duration_label, status, date_label, timestamp_label, notes, executed_at
       FROM integration_sync_logs
      ORDER BY executed_at DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    sourceCode: row.source_code,
    sourceName: row.source_name,
    recordsProcessed: row.records_processed,
    duplicatesDetected: row.duplicates_detected,
    failedRecords: row.failed_records,
    duration: row.duration_label ?? "0s",
    status: row.status,
    dateLabel: row.date_label ?? formatRelativeTime(row.executed_at),
    timestamp: row.timestamp_label ?? formatRelativeTime(row.executed_at),
    notes: row.notes ?? "",
  }));
}

export async function getIntegrationSummary<T = Record<string, any>>(): Promise<T | null> {
  const result = await queryDb<{ payload: T }>(
    `SELECT payload FROM analytics_snapshots WHERE key = 'integration_summary'`
  );
  return result.rows[0]?.payload ?? null;
}

export async function findNotifications(): Promise<NotificationModel[]> {
  const result = await queryDb<NotificationRow>(
    `SELECT id, title, description, type, source, is_read, href, created_at
       FROM notifications
      ORDER BY created_at DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    timestamp: formatRelativeTime(row.created_at),
    type: row.type,
    source: row.source,
    read: row.is_read,
    href: row.href ?? undefined,
  }));
}

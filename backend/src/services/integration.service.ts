import { env } from "../config/env";
import { seedDataset } from "../data/dataset";
import {
  DataSourceModel,
  IntegrationLogModel,
  NotificationModel,
} from "../models";
import * as integrationRepository from "../repositories/integration.repository";
import * as authRepository from "../repositories/auth.repository";

export class IntegrationService {
  private fallbackSources: DataSourceModel[] = seedDataset.dataSources.map((source) => ({
    ...source,
  }));

  async getDataSources(): Promise<DataSourceModel[]> {
    if (env.db.enabled) {
      return integrationRepository.findAllDataSources();
    }
    return this.fallbackSources.map((source) => ({ ...source }));
  }

  async syncDataSource(id: string, actorUserId?: string) {
    if (env.db.enabled) {
      const result = await integrationRepository.performDataSourceSync(id);
      if (result) {
        try {
          await authRepository.writeAudit({
            actorUserId,
            action: "integration.sync",
            entityType: "data_source",
            entityId: id,
            metadata: {
              recordsProcessed: result.recordsProcessed,
              duration: result.duration,
              syncHistoryId: result.syncHistoryId,
            },
          });
        } catch {
          // Audit logging must not fail the sync response.
        }
      }
      return result;
    }

    const target = this.fallbackSources.find((source) => source.id === id);
    if (!target) return null;
    target.lastSynced = "Just now";
    target.status = "Connected";
    const now = Date.now();
    return {
      sourceId: id,
      status: target.status,
      lastSynced: target.lastSynced,
      recordsProcessed: target.recordCount,
      duration: "0.1s",
      syncHistoryId: `SH-${now.toString(36).toUpperCase()}`,
      logId: `SYN-${now.toString(36).toUpperCase()}`,
    };
  }

  async getIntegrationStatus(): Promise<{
    summary: Record<string, any>;
    logs: IntegrationLogModel[];
  }> {
    if (env.db.enabled) {
      const [summary, logs] = await Promise.all([
        integrationRepository.getIntegrationSummary(),
        integrationRepository.findSyncLogs(),
      ]);
      return { summary: summary ?? {}, logs };
    }

    return {
      summary: seedDataset.integrationSummary,
      logs: seedDataset.integrationLogs,
    };
  }

  async getNotifications(): Promise<NotificationModel[]> {
    if (env.db.enabled) {
      return integrationRepository.findNotifications();
    }
    return seedDataset.notifications;
  }
}

export const integrationService = new IntegrationService();

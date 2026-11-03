import { env } from "../config/env";
import { seedDataset } from "../data/dataset";
import { AuthorizedRole, IntegratedAlumniModel } from "../models";
import * as alumniRepository from "../repositories/alumni.repository";
import * as analyticsRepository from "../repositories/analytics.repository";
import * as authRepository from "../repositories/auth.repository";

const ALUMNI_ANALYTICS_FALLBACK = seedDataset.alumniAnalytics;

export class AlumniService {
  private lastSynchronization = "Today, 10:42 AM";

  async getAlumniOverview() {
    if (env.db.enabled) {
      const [records, analytics, dashboard] = await Promise.all([
        alumniRepository.findAlumniRecords(),
        alumniRepository.getAlumniAnalytics(),
        analyticsRepository.getSnapshot<{ graduationTrends?: unknown }>("dashboard_analytics"),
      ]);

      return {
        records,
        analytics: analytics ?? ALUMNI_ANALYTICS_FALLBACK,
        graduationTrends: dashboard?.graduationTrends ?? [],
      };
    }

    return {
      records: seedDataset.alumniRecords,
      analytics: seedDataset.alumniAnalytics,
      graduationTrends: seedDataset.dashboardAnalytics.graduationTrends,
    };
  }

  async getIntegratedAlumni(role: AuthorizedRole) {
    const sourceRecords: IntegratedAlumniModel[] = env.db.enabled
      ? await alumniRepository.findIntegratedAlumni()
      : seedDataset.integratedAlumni;

    const lastSynchronization = env.db.enabled
      ? await alumniRepository.getCrmLastSynchronization()
      : this.lastSynchronization;

    const records = sourceRecords.map((record) => {
      if (role === "Registrar") {
        // Redact extended phone numbers for Registrar-scoped responses
        const { contactNumber: _redacted, ...registrarView } = record;
        return registrarView;
      }
      return record;
    });

    const sourceInfo = seedDataset.alumniCrmSourceInfo as {
      dataSource: "Alumni CRM";
      integrationMethod: "API / ETL / ELT";
      connectionStatus: "Connected";
      recordsSynchronized: number;
      graduationBatchesCount: number;
      programsRepresentedCount: number;
    };

    return {
      sourceInfo: {
        ...sourceInfo,
        connectionStatus: "Connected" as const,
        lastSynchronization,
      },
      records,
    };
  }

  async triggerCrmSync(actorUserId?: string) {
    if (env.db.enabled) {
      const result = await alumniRepository.touchCrmSync();
      this.lastSynchronization = result.lastSynchronization;
      try {
        await authRepository.writeAudit({
          actorUserId,
          action: "alumni.sync",
          entityType: "data_source",
          entityId: "src-alumni",
          metadata: {
            recordsSynchronized: result.recordsSynchronized,
            duration: result.duration,
          },
        });
      } catch {
        // Audit logging must not fail the sync response.
      }
      return { lastSynchronization: result.lastSynchronization };
    }

    this.lastSynchronization = "Just now";
    return {
      lastSynchronization: this.lastSynchronization,
    };
  }
}

export const alumniService = new AlumniService();

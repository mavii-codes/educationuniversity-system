import { DataSourceModel, IntegrationLogModel } from "../models";

const DATA_SOURCES: DataSourceModel[] = [
  {
    id: "src-library",
    code: "LIBRARY",
    name: "Library Management System",
    status: "Connected",
    lastSynced: "Just now",
    recordCount: 14850,
  },
];

const SYNC_LOGS: IntegrationLogModel[] = [
  {
    id: "sync-lib-1001",
    sourceCode: "LIBRARY",
    sourceName: "Library LMS",
    recordsProcessed: 14850,
    duplicatesDetected: 1,
    failedRecords: 0,
    status: "Successful",
    timestamp: "Today, 10:45 AM",
    notes: "Automated 9-stage ETL: catalog books, borrower accounts, and circulation loans synced.",
  },
  {
    id: "sync-lib-1002",
    sourceCode: "LIBRARY",
    sourceName: "Library LMS",
    recordsProcessed: 3420,
    duplicatesDetected: 0,
    failedRecords: 0,
    status: "Successful",
    timestamp: "Today, 10:15 AM",
    notes: "Student borrower records matched with central university student master identities.",
  },
];

export class IntegrationService {
  async getDataSources(): Promise<DataSourceModel[]> {
    return [...DATA_SOURCES];
  }

  async syncDataSource(id: string) {
    const target = DATA_SOURCES.find((d) => d.id === id);
    if (!target) return null;
    target.lastSynced = "Just now";
    target.status = "Connected";
    return {
      sourceId: id,
      status: target.status,
      lastSynced: target.lastSynced,
    };
  }

  async getIntegrationStatus() {
    return {
      summary: {
        totalRecordsProcessed: 14850,
        successfulRecords: 14849,
        failedRecords: 0,
        duplicateRecords: 1,
        lastIntegration: "Today, Just now",
        currentStatus: "Operational",
      },
      logs: SYNC_LOGS,
    };
  }

  async getNotifications() {
    return [
      {
        id: "notif-1",
        title: "Library LMS synchronization completed",
        timestamp: "Just now",
        type: "success",
      },
      {
        id: "notif-2",
        title: "Student borrower matching verified",
        timestamp: "32 minutes ago",
        type: "info",
      },
    ];
  }
}

export const integrationService = new IntegrationService();

import { DataSourceModel, IntegrationLogModel } from "../models";

const DATA_SOURCES: DataSourceModel[] = [
  {
    id: "src-sis",
    code: "SIS",
    name: "Student Information System",
    status: "Connected",
    lastSynced: "5 minutes ago",
    recordCount: 5240,
  },
  {
    id: "src-lms",
    code: "LMS",
    name: "Learning Management System",
    status: "Connected",
    lastSynced: "12 minutes ago",
    recordCount: 5100,
  },
  {
    id: "src-hr",
    code: "HR",
    name: "HR / Payroll",
    status: "Connected",
    lastSynced: "25 minutes ago",
    recordCount: 386,
  },
  {
    id: "src-library",
    code: "LIBRARY",
    name: "Library System",
    status: "Connected",
    lastSynced: "18 minutes ago",
    recordCount: 4850,
  },
  {
    id: "src-alumni",
    code: "ALUMNI",
    name: "Alumni CRM",
    status: "Connected",
    lastSynced: "42 minutes ago",
    recordCount: 8400,
  },
];

const SYNC_LOGS: IntegrationLogModel[] = [
  {
    id: "sync-1001",
    sourceCode: "SIS",
    sourceName: "SIS",
    recordsProcessed: 5240,
    duplicatesDetected: 0,
    failedRecords: 0,
    status: "Successful",
    timestamp: "Today, 10:45 AM",
    notes: "All active student profiles and midterm grade records verified.",
  },
  {
    id: "sync-1002",
    sourceCode: "LMS",
    sourceName: "LMS",
    recordsProcessed: 5100,
    duplicatesDetected: 4,
    failedRecords: 0,
    status: "Successful",
    timestamp: "Today, 10:38 AM",
    notes: "Course completion metrics and weekly engagement logs merged.",
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
        totalRecordsProcessed: 23976,
        successfulRecords: 23948,
        failedRecords: 4,
        duplicateRecords: 24,
        lastIntegration: "Today, 5 minutes ago",
        currentStatus: "Operational",
      },
      logs: SYNC_LOGS,
    };
  }

  async getNotifications() {
    return [
      {
        id: "notif-1",
        title: "SIS synchronization completed",
        timestamp: "5 minutes ago",
        type: "success",
      },
      {
        id: "notif-2",
        title: "LMS synchronization warning",
        timestamp: "15 minutes ago",
        type: "warning",
      },
    ];
  }
}

export const integrationService = new IntegrationService();


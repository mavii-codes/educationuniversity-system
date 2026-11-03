import rawDataset from "./seed-dataset.json";
import {
  AdminUserModel,
  AlumniModel,
  CourseModel,
  DataSourceModel,
  IntegratedAlumniModel,
  IntegrationLogModel,
  LifecycleStageModel,
  NotificationModel,
  ProgramModel,
  ReportModel,
  StudentModel,
  SyncHistoryModel,
  ActivityFeedModel,
} from "../models";

export interface SeedDataset {
  generatedAt: string;
  programs: ProgramModel[];
  students: StudentModel[];
  courses: CourseModel[];
  dataSources: DataSourceModel[];
  integrationSummary: Record<string, unknown>;
  integrationLogs: IntegrationLogModel[];
  alumniRecords: AlumniModel[];
  alumniAnalytics: Record<string, any>;
  alumniCrmSourceInfo: Record<string, unknown>;
  integratedAlumni: IntegratedAlumniModel[];
  reports: ReportModel[];
  notifications: NotificationModel[];
  activityFeed: ActivityFeedModel[];
  lifecycleOverviewStats: {
    label: string;
    value: number;
    change: string;
    description: string;
  }[];
  lifecycleStages: LifecycleStageModel[];
  dashboardAnalytics: Record<string, any>;
  adminDashboardOverview: Record<string, any>;
  adminUsers: AdminUserModel[];
  syncHistory: SyncHistoryModel[];
}

export const seedDataset = rawDataset as unknown as SeedDataset;

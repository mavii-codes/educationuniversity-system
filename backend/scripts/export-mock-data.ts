import fs from "node:fs";
import path from "node:path";
import * as mock from "../../frontend/data/mock-data";

const dataset = {
  generatedAt: new Date().toISOString(),
  programs: mock.PROGRAMS,
  students: mock.STUDENTS,
  courses: mock.COURSES,
  dataSources: mock.DATA_SOURCES,
  integrationSummary: mock.INTEGRATION_SUMMARY,
  integrationLogs: mock.INTEGRATION_LOGS,
  alumniRecords: mock.ALUMNI_RECORDS,
  alumniAnalytics: mock.ALUMNI_ANALYTICS,
  alumniCrmSourceInfo: mock.ALUMNI_CRM_SOURCE_INFO,
  integratedAlumni: mock.INTEGRATED_ALUMNI_RECORDS,
  reports: mock.REPORTS,
  notifications: mock.NOTIFICATIONS,
  activityFeed: mock.RECENT_ACTIVITY,
  lifecycleOverviewStats: mock.LIFECYCLE_OVERVIEW_STATS,
  lifecycleStages: mock.LIFECYCLE_STAGES,
  dashboardAnalytics: mock.DASHBOARD_ANALYTICS,
  adminDashboardOverview: mock.ADMIN_DASHBOARD_OVERVIEW,
  adminUsers: mock.ADMIN_USERS,
  syncHistory: mock.SYNC_HISTORY_RECORDS,
};

const outputPath = path.resolve(__dirname, "../src/data/seed-dataset.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");

console.log(`[export-mock-data] wrote ${outputPath}`);
console.log(
  `[export-mock-data] ${dataset.students.length} students, ${dataset.programs.length} programs, ` +
    `${dataset.courses.length} courses, ${dataset.alumniRecords.length} alumni, ` +
    `${dataset.adminUsers.length} users`
);

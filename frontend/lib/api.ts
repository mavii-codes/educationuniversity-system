import {
  ADMIN_DASHBOARD_OVERVIEW,
  ADMIN_USERS,
  ALUMNI_ANALYTICS,
  ALUMNI_CRM_SOURCE_INFO,
  ALUMNI_RECORDS,
  COURSES,
  DASHBOARD_ANALYTICS,
  DATA_SOURCES,
  INTEGRATED_ALUMNI_RECORDS,
  INTEGRATION_LOGS,
  INTEGRATION_SUMMARY,
  LIFECYCLE_OVERVIEW_STATS,
  LIFECYCLE_STAGES,
  NOTIFICATIONS,
  PROGRAMS,
  RECENT_ACTIVITY,
  REPORTS,
  STUDENTS,
  SYNC_HISTORY_RECORDS,
} from "@/data/mock-data";
import {
  ActivityFeedItem,
  AdminDashboardOverview,
  AdminUserRecord,
  AlumniCrmSourceInfo,
  AlumniRecord,
  CourseCatalogItem,
  DashboardAnalytics,
  DataSource,
  IntegratedAlumniRecord,
  IntegrationSummary,
  IntegrationSyncLog,
  LifecycleStage,
  NotificationItem,
  Program,
  ReportItem,
  Student,
  SyncHistoryRecord,
} from "@/types";

/**
 * REST API Client Configuration
 * Reads NEXT_PUBLIC_API_URL from environment variables.
 * Automatically falls back to frontend mock data when the backend is not yet deployed.
 */
export const API_CONFIG = {
  baseUrl: (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, ""),
  useLiveApi: process.env.NEXT_PUBLIC_USE_LIVE_API === "true",
};

async function simulateNetworkDelay(ms = 160): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${endpoint}`);
  }
  return res.json();
}

async function tryLiveOrFallback<T>(
  liveFetcher: () => Promise<T>,
  mockFallback: () => Promise<T>,
  validator?: (data: T) => boolean
): Promise<T> {
  if (!API_CONFIG.useLiveApi) {
    return mockFallback();
  }
  try {
    const liveData = await liveFetcher();
    if (validator && !validator(liveData)) {
      return mockFallback();
    }
    return liveData;
  } catch {
    return mockFallback();
  }
}

export interface StudentQueryFilters {
  search?: string;
  program?: string;
  yearLevel?: string;
  status?: string;
  riskLevel?: string;
}

// GET /api/students
export async function getStudents(filters?: StudentQueryFilters): Promise<Student[]> {
  return tryLiveOrFallback(
    () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.program && filters.program !== "All") params.set("program", filters.program);
      if (filters?.yearLevel && filters.yearLevel !== "All") params.set("yearLevel", filters.yearLevel);
      if (filters?.status && filters.status !== "All") params.set("status", filters.status);
      if (filters?.riskLevel && filters.riskLevel !== "All") params.set("riskLevel", filters.riskLevel);
      const query = params.toString();
      return fetchJson<Student[]>(`/students${query ? `?${query}` : ""}`);
    },
    async () => {
      await simulateNetworkDelay(160);
      let results = [...STUDENTS];

      if (filters) {
        if (filters.search) {
          const q = filters.search.toLowerCase().trim();
          results = results.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.id.toLowerCase().includes(q) ||
              s.programName.toLowerCase().includes(q) ||
              s.email.toLowerCase().includes(q)
          );
        }
        if (filters.program && filters.program !== "All") {
          results = results.filter((s) => s.programCode === filters.program);
        }
        if (filters.yearLevel && filters.yearLevel !== "All") {
          results = results.filter((s) => s.yearLevel === filters.yearLevel);
        }
        if (filters.status && filters.status !== "All") {
          results = results.filter((s) => s.status === filters.status);
        }
        if (filters.riskLevel && filters.riskLevel !== "All") {
          results = results.filter((s) => s.riskLevel === filters.riskLevel);
        }
      }

      return results;
    },
    (data) => Array.isArray(data) && (data.length === 0 || Boolean(data[0]?.academicRecords))
  );
}

// GET /api/students/:id
export async function getStudentById(id: string): Promise<Student | null> {
  return tryLiveOrFallback(
    async () => {
      const res = await fetch(`${API_CONFIG.baseUrl}/students/${encodeURIComponent(id)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load student profile");
      return res.json();
    },
    async () => {
      await simulateNetworkDelay(150);
      return STUDENTS.find((s) => s.id === id) ?? null;
    },
    (data) => data === null || Boolean(data?.academicRecords)
  );
}

// GET /api/programs
export async function getPrograms(): Promise<Program[]> {
  return tryLiveOrFallback(
    () => fetchJson<Program[]>("/programs"),
    async () => {
      await simulateNetworkDelay(130);
      return [...PROGRAMS];
    },
    (data) => Array.isArray(data)
  );
}

// GET /api/courses
export async function getCourses(): Promise<CourseCatalogItem[]> {
  return tryLiveOrFallback(
    () => fetchJson<CourseCatalogItem[]>("/courses"),
    async () => {
      await simulateNetworkDelay(130);
      return [...COURSES];
    },
    (data) => Array.isArray(data)
  );
}

// GET /api/analytics (Dashboard overview)
export async function getDashboardData(): Promise<{
  analytics: DashboardAnalytics;
  recentActivity: ActivityFeedItem[];
}> {
  return tryLiveOrFallback(
    () =>
      fetchJson<{
        analytics: DashboardAnalytics;
        recentActivity: ActivityFeedItem[];
      }>("/analytics/dashboard"),
    async () => {
      await simulateNetworkDelay(160);
      return {
        analytics: DASHBOARD_ANALYTICS,
        recentActivity: RECENT_ACTIVITY,
      };
    },
    (data) => Boolean(data?.analytics?.enrollmentTrends && Array.isArray(data?.recentActivity))
  );
}

// GET /api/analytics
export async function getAcademicAnalyticsData(): Promise<{
  programs: Program[];
  atRiskStudents: Student[];
  analytics: DashboardAnalytics;
}> {
  return tryLiveOrFallback(
    () =>
      fetchJson<{
        programs: Program[];
        atRiskStudents: Student[];
        analytics: DashboardAnalytics;
      }>("/analytics"),
    async () => {
      await simulateNetworkDelay(160);
      const atRiskStudents = STUDENTS.filter(
        (s) => s.riskLevel === "High" || s.riskLevel === "Medium"
      ).sort((a, b) => a.gpa - b.gpa);

      return {
        programs: PROGRAMS,
        atRiskStudents,
        analytics: DASHBOARD_ANALYTICS,
      };
    },
    (data) => Boolean(Array.isArray(data?.programs) && Array.isArray(data?.atRiskStudents))
  );
}

// GET /api/lifecycle
export async function getStudentLifecycleData(): Promise<{
  overviewStats: typeof LIFECYCLE_OVERVIEW_STATS;
  stages: LifecycleStage[];
}> {
  return tryLiveOrFallback(
    () =>
      fetchJson<{
        overviewStats: typeof LIFECYCLE_OVERVIEW_STATS;
        stages: LifecycleStage[];
      }>("/lifecycle"),
    async () => {
      await simulateNetworkDelay(150);
      return {
        overviewStats: LIFECYCLE_OVERVIEW_STATS,
        stages: LIFECYCLE_STAGES,
      };
    },
    (data) => Boolean(Array.isArray(data?.stages) && data.stages[0]?.insights)
  );
}

// GET /api/data-sources
export async function getDataSources(): Promise<DataSource[]> {
  return tryLiveOrFallback(
    () => fetchJson<DataSource[]>("/data-sources"),
    async () => {
      await simulateNetworkDelay(150);
      return DATA_SOURCES.map((d) => ({ ...d }));
    },
    (data) => Array.isArray(data) && (data.length === 0 || Boolean(data[0]?.entitiesSynced))
  );
}

// POST /api/data-sources/:id/sync
export async function syncDataSource(id: string): Promise<{ lastSynced: string }> {
  return tryLiveOrFallback(
    () =>
      fetchJson<{ lastSynced: string }>(`/data-sources/${id}/sync`, {
        method: "POST",
      }),
    async () => {
      await simulateNetworkDelay(850);
      return { lastSynced: "Just now" };
    }
  );
}

// GET /api/integrations
export async function getIntegrationsData(): Promise<{
  summary: IntegrationSummary;
  logs: IntegrationSyncLog[];
}> {
  return tryLiveOrFallback(
    () =>
      fetchJson<{
        summary: IntegrationSummary;
        logs: IntegrationSyncLog[];
      }>("/integrations"),
    async () => {
      await simulateNetworkDelay(160);
      return {
        summary: { ...INTEGRATION_SUMMARY },
        logs: INTEGRATION_LOGS.map((l) => ({ ...l })),
      };
    },
    (data) => Boolean(data?.summary && Array.isArray(data?.logs))
  );
}

// GET /api/alumni
export async function getAlumniData(): Promise<{
  records: AlumniRecord[];
  analytics: typeof ALUMNI_ANALYTICS;
  graduationTrends: DashboardAnalytics["graduationTrends"];
}> {
  return tryLiveOrFallback(
    () =>
      fetchJson<{
        records: AlumniRecord[];
        analytics: typeof ALUMNI_ANALYTICS;
        graduationTrends: DashboardAnalytics["graduationTrends"];
      }>("/alumni"),
    async () => {
      await simulateNetworkDelay(160);
      return {
        records: [...ALUMNI_RECORDS],
        analytics: ALUMNI_ANALYTICS,
        graduationTrends: DASHBOARD_ANALYTICS.graduationTrends,
      };
    },
    (data) => Boolean(Array.isArray(data?.records) && data?.analytics?.employmentTrends)
  );
}

// GET /api/reports
export async function getReportsData(): Promise<ReportItem[]> {
  return tryLiveOrFallback(
    () => fetchJson<ReportItem[]>("/reports"),
    async () => {
      await simulateNetworkDelay(140);
      return [...REPORTS];
    },
    (data) => Array.isArray(data) && (data.length === 0 || Boolean(data[0]?.highlights))
  );
}

// GET /api/notifications
export async function getNotifications(): Promise<NotificationItem[]> {
  return tryLiveOrFallback(
    () => fetchJson<NotificationItem[]>("/notifications"),
    async () => {
      await simulateNetworkDelay(130);
      return NOTIFICATIONS.map((n) => ({ ...n }));
    },
    (data) => Array.isArray(data) && (data.length === 0 || "description" in data[0])
  );
}


// GET /api/admin/dashboard
export async function getAdminDashboardOverview(): Promise<AdminDashboardOverview> {
  return tryLiveOrFallback(
    () => fetchJson<AdminDashboardOverview>("/admin/dashboard"),
    async () => {
      await simulateNetworkDelay(150);
      return {
        summary: { ...ADMIN_DASHBOARD_OVERVIEW.summary },
        dataSources: ADMIN_DASHBOARD_OVERVIEW.dataSources.map((s) => ({ ...s })),
        lifecycleOverview: ADMIN_DASHBOARD_OVERVIEW.lifecycleOverview.map((s) => ({
          ...s,
        })),
        recentSynchronization: ADMIN_DASHBOARD_OVERVIEW.recentSynchronization.map(
          (r) => ({ ...r })
        ),
        analyticsPreview: {
          enrollmentTrends: ADMIN_DASHBOARD_OVERVIEW.analyticsPreview.enrollmentTrends.map(
            (e) => ({ ...e })
          ),
          academicPerformance:
            ADMIN_DASHBOARD_OVERVIEW.analyticsPreview.academicPerformance.map((p) => ({
              ...p,
            })),
          graduationTrends: ADMIN_DASHBOARD_OVERVIEW.analyticsPreview.graduationTrends.map(
            (g) => ({ ...g })
          ),
          studentsAtRisk: ADMIN_DASHBOARD_OVERVIEW.analyticsPreview.studentsAtRisk.map(
            (r) => ({ ...r })
          ),
        },
      };
    },
    (data) => Boolean(data?.summary && Array.isArray(data?.dataSources))
  );
}

// GET /api/admin/users
export async function getAdminUsers(): Promise<AdminUserRecord[]> {
  return tryLiveOrFallback(
    () => fetchJson<AdminUserRecord[]>("/admin/users"),
    async () => {
      await simulateNetworkDelay(140);
      return ADMIN_USERS.map((u) => ({ ...u }));
    },
    (data) => Array.isArray(data)
  );
}

// GET /api/admin/sync-history
export async function getSyncHistory(): Promise<SyncHistoryRecord[]> {
  return tryLiveOrFallback(
    () => fetchJson<SyncHistoryRecord[]>("/admin/sync-history"),
    async () => {
      await simulateNetworkDelay(150);
      return SYNC_HISTORY_RECORDS.map((r) => ({ ...r }));
    },
    (data) => Array.isArray(data)
  );
}


// GET /api/alumni/integrated
export async function getIntegratedAlumni(): Promise<{
  sourceInfo: AlumniCrmSourceInfo;
  records: IntegratedAlumniRecord[];
}> {
  return tryLiveOrFallback(
    () =>
      fetchJson<{
        sourceInfo: AlumniCrmSourceInfo;
        records: IntegratedAlumniRecord[];
      }>("/alumni/integrated"),
    async () => {
      await simulateNetworkDelay(150);
      return {
        sourceInfo: { ...ALUMNI_CRM_SOURCE_INFO },
        records: INTEGRATED_ALUMNI_RECORDS.map((r) => ({ ...r })),
      };
    },
    (data) => Boolean(data?.sourceInfo && Array.isArray(data?.records))
  );
}

// POST /api/alumni/sync
export async function syncAlumniCrm(): Promise<{ lastSynchronization: string }> {
  return tryLiveOrFallback(
    () =>
      fetchJson<{ lastSynchronization: string }>("/alumni/sync", {
        method: "POST",
      }),
    async () => {
      await simulateNetworkDelay(800);
      return { lastSynchronization: "Just now" };
    }
  );
}

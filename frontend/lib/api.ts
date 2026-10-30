import {
  ALUMNI_ANALYTICS,
  ALUMNI_RECORDS,
  COURSES,
  DASHBOARD_ANALYTICS,
  DATA_SOURCES,
  INTEGRATION_LOGS,
  INTEGRATION_SUMMARY,
  LIFECYCLE_OVERVIEW_STATS,
  LIFECYCLE_STAGES,
  NOTIFICATIONS,
  PROGRAMS,
  RECENT_ACTIVITY,
  REPORTS,
  STUDENTS,
} from "@/data/mock-data";
import {
  ActivityFeedItem,
  AlumniRecord,
  CourseCatalogItem,
  DashboardAnalytics,
  DataSource,
  IntegrationSummary,
  IntegrationSyncLog,
  LifecycleStage,
  NotificationItem,
  Program,
  ReportItem,
  Student,
} from "@/types";

/**
 * REST API Client Configuration
 * Reads NEXT_PUBLIC_API_URL from /frontend/.env.local without hardcoding host URLs.
 */
export const API_CONFIG = {
  baseUrl: (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, ""),
  useLiveApi: process.env.NEXT_PUBLIC_USE_LIVE_API === "true",
};

async function simulateNetworkDelay(ms = 180): Promise<void> {
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

export interface StudentQueryFilters {
  search?: string;
  program?: string;
  yearLevel?: string;
  status?: string;
  riskLevel?: string;
}

// GET /api/students
export async function getStudents(filters?: StudentQueryFilters): Promise<Student[]> {
  if (API_CONFIG.useLiveApi) {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.program && filters.program !== "All") params.set("program", filters.program);
    if (filters?.yearLevel && filters.yearLevel !== "All") params.set("yearLevel", filters.yearLevel);
    if (filters?.status && filters.status !== "All") params.set("status", filters.status);
    if (filters?.riskLevel && filters.riskLevel !== "All") params.set("riskLevel", filters.riskLevel);
    const query = params.toString();
    return fetchJson<Student[]>(`/students${query ? `?${query}` : ""}`);
  }

  await simulateNetworkDelay(180);
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
}

// GET /api/students/:id
export async function getStudentById(id: string): Promise<Student | null> {
  if (API_CONFIG.useLiveApi) {
    const res = await fetch(`${API_CONFIG.baseUrl}/students/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to load student profile");
    return res.json();
  }

  await simulateNetworkDelay(160);
  return STUDENTS.find((s) => s.id === id) ?? null;
}

// GET /api/programs
export async function getPrograms(): Promise<Program[]> {
  if (API_CONFIG.useLiveApi) {
    return fetchJson<Program[]>("/programs");
  }

  await simulateNetworkDelay(140);
  return [...PROGRAMS];
}

// GET /api/courses
export async function getCourses(): Promise<CourseCatalogItem[]> {
  if (API_CONFIG.useLiveApi) {
    return fetchJson<CourseCatalogItem[]>("/courses");
  }

  await simulateNetworkDelay(140);
  return [...COURSES];
}

// GET /api/analytics (Dashboard overview)
export async function getDashboardData(): Promise<{
  analytics: DashboardAnalytics;
  recentActivity: ActivityFeedItem[];
}> {
  if (API_CONFIG.useLiveApi) {
    return fetchJson<{
      analytics: DashboardAnalytics;
      recentActivity: ActivityFeedItem[];
    }>("/analytics/dashboard");
  }

  await simulateNetworkDelay(180);
  return {
    analytics: DASHBOARD_ANALYTICS,
    recentActivity: RECENT_ACTIVITY,
  };
}

// GET /api/analytics
export async function getAcademicAnalyticsData(): Promise<{
  programs: Program[];
  atRiskStudents: Student[];
  analytics: DashboardAnalytics;
}> {
  if (API_CONFIG.useLiveApi) {
    return fetchJson<{
      programs: Program[];
      atRiskStudents: Student[];
      analytics: DashboardAnalytics;
    }>("/analytics");
  }

  await simulateNetworkDelay(180);
  const atRiskStudents = STUDENTS.filter(
    (s) => s.riskLevel === "High" || s.riskLevel === "Medium"
  ).sort((a, b) => a.gpa - b.gpa);

  return {
    programs: PROGRAMS,
    atRiskStudents,
    analytics: DASHBOARD_ANALYTICS,
  };
}

// GET /api/lifecycle
export async function getStudentLifecycleData(): Promise<{
  overviewStats: typeof LIFECYCLE_OVERVIEW_STATS;
  stages: LifecycleStage[];
}> {
  if (API_CONFIG.useLiveApi) {
    return fetchJson<{
      overviewStats: typeof LIFECYCLE_OVERVIEW_STATS;
      stages: LifecycleStage[];
    }>("/lifecycle");
  }

  await simulateNetworkDelay(160);
  return {
    overviewStats: LIFECYCLE_OVERVIEW_STATS,
    stages: LIFECYCLE_STAGES,
  };
}

// GET /api/data-sources
export async function getDataSources(): Promise<DataSource[]> {
  if (API_CONFIG.useLiveApi) {
    return fetchJson<DataSource[]>("/data-sources");
  }

  await simulateNetworkDelay(160);
  return DATA_SOURCES.map((d) => ({ ...d }));
}

// POST /api/data-sources/:id/sync
export async function syncDataSource(id: string): Promise<{ lastSynced: string }> {
  if (API_CONFIG.useLiveApi) {
    return fetchJson<{ lastSynced: string }>(`/data-sources/${id}/sync`, {
      method: "POST",
    });
  }

  await simulateNetworkDelay(900);
  return { lastSynced: "Just now" };
}

// GET /api/integrations
export async function getIntegrationsData(): Promise<{
  summary: IntegrationSummary;
  logs: IntegrationSyncLog[];
}> {
  if (API_CONFIG.useLiveApi) {
    return fetchJson<{
      summary: IntegrationSummary;
      logs: IntegrationSyncLog[];
    }>("/integrations");
  }

  await simulateNetworkDelay(180);
  return {
    summary: { ...INTEGRATION_SUMMARY },
    logs: INTEGRATION_LOGS.map((l) => ({ ...l })),
  };
}

// GET /api/alumni
export async function getAlumniData(): Promise<{
  records: AlumniRecord[];
  analytics: typeof ALUMNI_ANALYTICS;
  graduationTrends: DashboardAnalytics["graduationTrends"];
}> {
  if (API_CONFIG.useLiveApi) {
    return fetchJson<{
      records: AlumniRecord[];
      analytics: typeof ALUMNI_ANALYTICS;
      graduationTrends: DashboardAnalytics["graduationTrends"];
    }>("/alumni");
  }

  await simulateNetworkDelay(180);
  return {
    records: [...ALUMNI_RECORDS],
    analytics: ALUMNI_ANALYTICS,
    graduationTrends: DASHBOARD_ANALYTICS.graduationTrends,
  };
}

// GET /api/reports
export async function getReportsData(): Promise<ReportItem[]> {
  if (API_CONFIG.useLiveApi) {
    return fetchJson<ReportItem[]>("/reports");
  }

  await simulateNetworkDelay(150);
  return [...REPORTS];
}

// GET /api/notifications
export async function getNotifications(): Promise<NotificationItem[]> {
  if (API_CONFIG.useLiveApi) {
    return fetchJson<NotificationItem[]>("/notifications");
  }

  await simulateNetworkDelay(140);
  return NOTIFICATIONS.map((n) => ({ ...n }));
}


import {
  ADMIN_DASHBOARD_OVERVIEW,
  ADMIN_USERS,
  AUDIT_LOG_RECORDS,
  BOOK_CATEGORIES,
  BORROWING_TRANSACTIONS,
  COURSES,
  DASHBOARD_ANALYTICS,
  DATA_SOURCES,
  INTEGRATION_LOGS,
  INTEGRATION_SUMMARY,
  LIBRARY_BOOKS,
  LIBRARY_ETL_LOGS,
  LIBRARY_OVERVIEW,
  LIFECYCLE_OVERVIEW_STATS,
  LIFECYCLE_STAGES,
  NOTIFICATIONS,
  OVERDUE_FINES,
  PROGRAMS,
  RECENT_ACTIVITY,
  REPORTS,
  RESERVATIONS,
  STUDENT_BORROWERS,
  STUDENTS,
  SYNC_HISTORY_RECORDS,
} from "@/data/mock-data";
import {
  ActivityFeedItem,
  AdminDashboardOverview,
  AdminUserRecord,
  AuditLogRecord,
  BookCategory,
  BorrowingRequest,
  BorrowingTransaction,
  CourseCatalogItem,
  DashboardAnalytics,
  DataSource,
  IntegrationSummary,
  IntegrationSyncLog,
  LibraryBook,
  LibraryETLLog,
  LibraryOverview,
  LifecycleStage,
  NotificationItem,
  OverdueFineRecord,
  Program,
  ReportItem,
  ReservationRecord,
  Student,
  StudentBorrower,
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

const CSRF_COOKIE = "udis_csrf";

export function getCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${CSRF_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(CSRF_COOKIE.length + 1)) : undefined;
}

let refreshPromise: Promise<boolean> | null = null;

export async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const csrfToken = getCsrfToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

      const res = await fetch(`${API_CONFIG.baseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers,
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      setTimeout(() => {
        refreshPromise = null;
      }, 250);
    }
  })();

  return refreshPromise;
}

async function simulateNetworkDelay(ms = 160): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(
  endpoint: string,
  init?: RequestInit,
  allowRetry = true
): Promise<T> {
  const method = (init?.method || "GET").toUpperCase();
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
  }

  const res = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && allowRetry && !endpoint.startsWith("/auth/")) {
    if (await refreshSession()) {
      return fetchJson<T>(endpoint, init, false);
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status}) for ${endpoint}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // Ignore non-JSON error bodies.
    }
    throw new Error(message);
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


// =============================================================
// LIBRARY MANAGEMENT SYSTEM API & ETL PIPELINE SERVICES
// =============================================================

// GET /api/library/overview
export async function getLibraryOverview(): Promise<LibraryOverview> {
  return tryLiveOrFallback(
    async () => {
      const res = await fetchJson<{ success: boolean; data: LibraryOverview }>("/library/overview");
      return res.data;
    },
    async () => {
      await simulateNetworkDelay(120);
      return { ...LIBRARY_OVERVIEW };
    },
    (data) => Boolean(data?.kpis && Array.isArray(data?.categoryDistribution))
  );
}

// GET /api/library/books
export async function getLibraryBooks(filters?: {
  search?: string;
  category?: string;
  status?: string;
}): Promise<LibraryBook[]> {
  return tryLiveOrFallback(
    async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.category && filters.category !== "All") params.set("category", filters.category);
      if (filters?.status && filters.status !== "All") params.set("status", filters.status);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await fetchJson<{ success: boolean; data: LibraryBook[] }>(`/library/books${query}`);
      return res.data;
    },
    async () => {
      await simulateNetworkDelay(140);
      let list = LIBRARY_BOOKS.map((b) => ({ ...b }));
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.isbn.toLowerCase().includes(q) ||
            b.callNumber.toLowerCase().includes(q)
        );
      }
      if (filters?.category && filters.category !== "All") {
        list = list.filter((b) => b.category === filters.category);
      }
      if (filters?.status && filters.status !== "All") {
        list = list.filter((b) => b.status === filters.status);
      }
      return list;
    },
    (data) => Array.isArray(data)
  );
}

// GET /api/library/categories
export async function getBookCategories(): Promise<BookCategory[]> {
  return tryLiveOrFallback(
    async () => {
      const res = await fetchJson<{ success: boolean; data: BookCategory[] }>("/library/categories");
      return res.data;
    },
    async () => {
      await simulateNetworkDelay(80);
      return BOOK_CATEGORIES.map((c) => ({ ...c }));
    },
    (data) => Array.isArray(data)
  );
}

// GET /api/library/borrowers
export async function getLibraryBorrowers(filters?: {
  search?: string;
  program?: string;
  status?: string;
}): Promise<StudentBorrower[]> {
  return tryLiveOrFallback(
    async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.program && filters.program !== "All") params.set("program", filters.program);
      if (filters?.status && filters.status !== "All") params.set("status", filters.status);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await fetchJson<{ success: boolean; data: StudentBorrower[] }>(`/library/borrowers${query}`);
      return res.data;
    },
    async () => {
      await simulateNetworkDelay(120);
      let list = STUDENT_BORROWERS.map((brw) => ({ ...brw }));
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (brw) =>
            brw.studentName.toLowerCase().includes(q) ||
            brw.studentId.toLowerCase().includes(q) ||
            brw.borrowerId.toLowerCase().includes(q)
        );
      }
      if (filters?.program && filters.program !== "All") {
        list = list.filter((brw) => brw.programCode === filters.program);
      }
      if (filters?.status && filters.status !== "All") {
        list = list.filter((brw) => brw.status === filters.status);
      }
      return list;
    },
    (data) => Array.isArray(data)
  );
}

// GET /api/library/transactions
export async function getLibraryTransactions(filters?: {
  search?: string;
  status?: string;
}): Promise<BorrowingTransaction[]> {
  return tryLiveOrFallback(
    async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.status && filters.status !== "All") params.set("status", filters.status);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await fetchJson<{ success: boolean; data: BorrowingTransaction[] }>(`/library/transactions${query}`);
      return res.data;
    },
    async () => {
      await simulateNetworkDelay(130);
      let list = BORROWING_TRANSACTIONS.map((t) => ({ ...t }));
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (t) =>
            t.bookTitle.toLowerCase().includes(q) ||
            t.studentName.toLowerCase().includes(q) ||
            t.studentId.toLowerCase().includes(q) ||
            t.transactionCode.toLowerCase().includes(q)
        );
      }
      if (filters?.status && filters.status !== "All") {
        list = list.filter((t) => t.status === filters.status);
      }
      return list;
    },
    (data) => Array.isArray(data)
  );
}

// GET /api/library/reservations
export async function getLibraryReservations(filters?: {
  search?: string;
  status?: string;
}): Promise<ReservationRecord[]> {
  return tryLiveOrFallback(
    async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.status && filters.status !== "All") params.set("status", filters.status);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await fetchJson<{ success: boolean; data: ReservationRecord[] }>(`/library/reservations${query}`);
      return res.data;
    },
    async () => {
      await simulateNetworkDelay(110);
      let list = RESERVATIONS.map((r) => ({ ...r }));
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (r) =>
            r.bookTitle.toLowerCase().includes(q) ||
            r.studentName.toLowerCase().includes(q) ||
            r.studentId.toLowerCase().includes(q) ||
            r.reservationCode.toLowerCase().includes(q)
        );
      }
      if (filters?.status && filters.status !== "All") {
        list = list.filter((r) => r.status === filters.status);
      }
      return list;
    },
    (data) => Array.isArray(data)
  );
}

// GET /api/library/fines
export async function getLibraryFines(filters?: {
  search?: string;
  paymentStatus?: string;
}): Promise<OverdueFineRecord[]> {
  return tryLiveOrFallback(
    async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.paymentStatus && filters.paymentStatus !== "All") {
        params.set("paymentStatus", filters.paymentStatus);
      }
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await fetchJson<{ success: boolean; data: OverdueFineRecord[] }>(`/library/fines${query}`);
      return res.data;
    },
    async () => {
      await simulateNetworkDelay(100);
      let list = OVERDUE_FINES.map((f) => ({ ...f }));
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (f) =>
            f.bookTitle.toLowerCase().includes(q) ||
            f.studentName.toLowerCase().includes(q) ||
            f.studentId.toLowerCase().includes(q)
        );
      }
      if (filters?.paymentStatus && filters.paymentStatus !== "All") {
        list = list.filter((f) => f.paymentStatus === filters.paymentStatus);
      }
      return list;
    },
    (data) => Array.isArray(data)
  );
}

// POST /api/library/etl/sync
export async function runLibraryETL(triggeredBy = "Admin Console"): Promise<LibraryETLLog> {
  return tryLiveOrFallback(
    async () => {
      const res = await fetchJson<{ success: boolean; data: LibraryETLLog }>("/library/etl/sync", {
        method: "POST",
        body: JSON.stringify({ triggeredBy }),
      });
      return res.data;
    },
    async () => {
      await simulateNetworkDelay(900);
      const newLog: LibraryETLLog = {
        id: `etl-run-${Date.now()}`,
        jobName: "Library LMS API Ingestion & Student Identity Matching",
        status: "Completed",
        startedAt: new Date(Date.now() - 6200).toISOString(),
        completedAt: new Date().toISOString(),
        duration: "6.2s",
        recordsExtracted: 27,
        recordsValidated: 27,
        duplicatesCleaned: 1,
        studentsMatched: 6,
        recordsLoaded: 26,
        errors: [],
        executionLog: [
          "[00:00.000] Initialized connection to external Library LMS API (Adapter: Koha/Folio)",
          "[00:01.200] Extracted 11 raw catalog books, 6 borrower cards, 6 circulation transactions, 3 reservations",
          "[00:02.400] Validation: verified 11 ISBN-13 checksums and date ranges",
          "[00:03.100] Cleaning: detected and purged 1 duplicate book record (ISBN 978-0262033848)",
          "[00:04.300] Transformation: mapped Koha marc21 fields to University DataHub central schema",
          "[00:05.100] Identity Matching: resolved 6/6 student borrower IDs against student master records",
          "[00:05.800] Loaded 10 books, 6 borrowers, 6 transactions, 3 reservations into central database",
          "[00:06.200] ETL pipeline completed successfully with 0 errors",
        ],
      };
      LIBRARY_ETL_LOGS.unshift(newLog);
      return newLog;
    }
  );
}

// GET /api/library/etl/logs
export async function getLibraryETLLogs(): Promise<LibraryETLLog[]> {
  return tryLiveOrFallback(
    async () => {
      const res = await fetchJson<{ success: boolean; data: LibraryETLLog[] }>("/library/etl/logs");
      return res.data;
    },
    async () => {
      await simulateNetworkDelay(120);
      return LIBRARY_ETL_LOGS.map((l) => ({ ...l }));
    },
    (data) => Array.isArray(data)
  );
}

// GET /api/audit-logs
export async function getAuditLogs(): Promise<AuditLogRecord[]> {
  return tryLiveOrFallback(
    async () => {
      const res = await fetchJson<AuditLogRecord[]>("/audit-logs");
      return res;
    },
    async () => {
      await simulateNetworkDelay(120);
      return AUDIT_LOG_RECORDS.map((a) => ({ ...a }));
    },
    (data) => Array.isArray(data)
  );
}

// GET /api/library/requests
export async function getLibraryRequests(studentId?: string): Promise<BorrowingRequest[]> {
  return tryLiveOrFallback(
    async () => {
      const qs = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
      const res = await fetchJson<{ success: boolean; data: BorrowingRequest[] }>(`/library/requests${qs}`);
      return res.data;
    },
    async () => {
      await simulateNetworkDelay(100);
      try {
        if (typeof window !== "undefined") {
          const stored = window.localStorage.getItem("udis_library_requests");
          if (stored) {
            const list = JSON.parse(stored) as BorrowingRequest[];
            return studentId ? list.filter((r) => r.studentId === studentId) : list;
          }
        }
      } catch {}
      return [];
    },
    (data) => Array.isArray(data)
  );
}

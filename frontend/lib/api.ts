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
  FerpaAccessEvent,
  FerpaConsent,
  FerpaConsentInput,
  FerpaDirectorySetting,
  FerpaOverview,
  IntegrationSummary,
  IntegrationSyncLog,
  LibraryBook,
  LibraryBookInput,
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
  StudentLifecycle,
  StudentNotificationItem,
  SyncHistoryRecord,
} from "@/types";
import {
  buildMockStudentLifecycle,
  FERPA_ACCESS_EVENTS,
  FERPA_CONSENTS,
  FERPA_DIRECTORY_SETTINGS,
  FERPA_OVERVIEW,
} from "@/data/university-features-mock";

/**
 * REST API Client Configuration
 * Reads NEXT_PUBLIC_API_URL from environment variables.
 * Automatically falls back to frontend mock data when the backend is not yet deployed.
 */
export const API_CONFIG = {
  baseUrl: (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, ""),
  useLiveApi:
    Boolean(process.env.NEXT_PUBLIC_API_URL) &&
    process.env.NEXT_PUBLIC_USE_LIVE_API !== "false",
};

export interface AdminSettingsRecord {
  profile: {
    name: string;
    email: string;
    department: string;
  };
  library: {
    libraryName: string;
    officeLocation: string;
    dueDateReminders: boolean;
    fineNotifications: boolean;
  };
}

const CSRF_COOKIE = "udis_csrf";
const CLIENT_ID_KEY = "udis_realtime_client_id";

export function getRealtimeClientId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  let clientId = window.sessionStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) {
    clientId =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(CLIENT_ID_KEY, clientId);
  }
  return clientId;
}

export function getCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${CSRF_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(CSRF_COOKIE.length + 1)) : undefined;
}

let refreshPromise: Promise<boolean> | null = null;

type SessionExpiredHandler = () => void;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(
  handler: SessionExpiredHandler | null
): void {
  sessionExpiredHandler = handler;
}

/**
 * Notified whenever `/auth/refresh` returns a corrected user payload.
 * The auth provider registers this handler to replace stale cached roles.
 */
type SessionUserUpdateHandler = (user: unknown) => void;
let sessionUserUpdateHandler: SessionUserUpdateHandler | null = null;

export function setSessionUserUpdateHandler(
  handler: SessionUserUpdateHandler | null
): void {
  sessionUserUpdateHandler = handler;
}

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
      if (!res.ok) return false;

      // The backend refresh handler returns `{ user, csrfToken }`. Capture the
      // authoritative user so callers can replace a stale cached role.
      try {
        const body = (await res.json()) as { user?: unknown };
        if (body?.user && typeof body.user === "object") {
          sessionUserUpdateHandler?.(body.user);
        }
      } catch {
        // A successful refresh with an unreadable body still rotated cookies.
      }
      return true;
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

/** Error thrown for non-2xx responses, carrying the HTTP status code. */
export interface ApiRequestError extends Error {
  status: number;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  if (!(error instanceof Error)) return undefined;
  const status = (error as Partial<ApiRequestError>).status;
  return typeof status === "number" ? status : undefined;
}

export async function fetchJson<T>(
  endpoint: string,
  init?: RequestInit,
  allowRetry = true
): Promise<T> {
  const method = (init?.method || "GET").toUpperCase();
  const headers = new Headers(init?.headers);
  const clientId = getRealtimeClientId();
  if (clientId) headers.set("X-Client-Id", clientId);

  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (init?.body && !isFormData && !headers.has("Content-Type")) {
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
    sessionExpiredHandler?.();
  }

  if (!res.ok) {
    let message = `Request failed (${res.status}) for ${endpoint}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // Ignore non-JSON error bodies.
    }
    const error = new Error(message) as ApiRequestError;
    error.status = res.status;
    throw error;
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
      throw new Error("The live API returned data in an unexpected format.");
    }
    return liveData;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown API error";
    throw new Error(`Live API request failed; demo data was not used. ${detail}`);
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
      const headers = new Headers();
      const clientId = getRealtimeClientId();
      if (clientId) headers.set("X-Client-Id", clientId);
      const res = await fetch(
        `${API_CONFIG.baseUrl}/students/${encodeURIComponent(id)}`,
        { credentials: "include", headers }
      );
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

// POST /api/admin/users
export async function createAdminLibraryStaff(input: {
  name: string;
  email: string;
  password: string;
  department: string;
}): Promise<AdminUserRecord> {
  if (!API_CONFIG.useLiveApi) {
    throw new Error(
      "Creating staff accounts requires the live API and PostgreSQL database."
    );
  }
  return fetchJson<AdminUserRecord>("/admin/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// PATCH /api/admin/users/:id/status
export async function updateAdminUserStatus(
  userId: string,
  status: "Active" | "Inactive"
): Promise<AdminUserRecord> {
  if (!API_CONFIG.useLiveApi) {
    throw new Error(
      "Updating account status requires the live API and PostgreSQL database."
    );
  }
  return fetchJson<AdminUserRecord>(
    `/admin/users/${encodeURIComponent(userId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}

export async function getAdminSettings(): Promise<AdminSettingsRecord> {
  if (!API_CONFIG.useLiveApi) {
    throw new Error("Administrator settings require the live API.");
  }
  return fetchJson<AdminSettingsRecord>("/admin/settings");
}

export async function saveAdminSettings(
  settings: AdminSettingsRecord
): Promise<AdminSettingsRecord> {
  if (!API_CONFIG.useLiveApi) {
    throw new Error("Saving administrator settings requires the live API.");
  }
  return fetchJson<AdminSettingsRecord>("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export async function changeAccountPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  if (!API_CONFIG.useLiveApi) {
    throw new Error("Changing passwords requires the live API.");
  }
  await fetchJson("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
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
      return res.data.map((book) => ({
        ...book,
        cover_url: book.cover_url ?? null,
      }));
    },
    async () => {
      await simulateNetworkDelay(140);
      let list = LIBRARY_BOOKS.map((book) => {
        const isbn = book.isbn.replace(/[-\s]/g, "");
        return {
          ...book,
          cover_url:
            book.cover_url ??
            (isbn
              ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-M.jpg?default=false`
              : null),
        };
      });
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

export async function createLibraryBook(
  book: LibraryBookInput,
  coverFile?: File | null
): Promise<LibraryBook> {
  const body = createLibraryBookFormData(book, coverFile);
  const response = await fetchJson<{ success: boolean; data: LibraryBook }>(
    "/library/books",
    { method: "POST", body }
  );
  return response.data;
}

export async function updateLibraryBook(
  id: string,
  book: LibraryBookInput,
  coverFile?: File | null
): Promise<LibraryBook> {
  const body = createLibraryBookFormData(book, coverFile);
  const response = await fetchJson<{ success: boolean; data: LibraryBook }>(
    `/library/books/${encodeURIComponent(id)}`,
    { method: "PUT", body }
  );
  return response.data;
}

function createLibraryBookFormData(
  book: LibraryBookInput,
  coverFile?: File | null
): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(book)) {
    formData.append(key, value == null ? "" : String(value));
  }
  if (coverFile) formData.append("cover", coverFile);
  return formData;
}

export async function removeLibraryBookCover(id: string): Promise<LibraryBook> {
  const response = await fetchJson<{ success: boolean; data: LibraryBook }>(
    `/library/books/${encodeURIComponent(id)}/cover`,
    { method: "DELETE" }
  );
  return response.data;
}

export async function refreshLibraryBookCover(
  id: string
): Promise<LibraryBook> {
  const response = await fetchJson<{ success: boolean; data: LibraryBook }>(
    `/library/books/${encodeURIComponent(id)}/refresh-cover`,
    { method: "POST", body: JSON.stringify({}) }
  );
  return response.data;
}

export async function lookupLibraryBookCover(book: {
  isbn: string;
  title: string;
  author: string;
}): Promise<string | null> {
  if (!API_CONFIG.useLiveApi) {
    const isbn = book.isbn.replace(/[-\s]/g, "");
    return isbn
      ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-M.jpg?default=false`
      : null;
  }
  const response = await fetchJson<{
    success: boolean;
    data: { cover_url: string | null };
  }>("/library/books/cover-lookup", {
    method: "POST",
    body: JSON.stringify(book),
  });
  return response.data.cover_url;
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

// PUT /api/library/fines/:id/pay
export async function payLibraryFine(
  fineId: string
): Promise<{ success: boolean; message: string }> {
  if (!API_CONFIG.useLiveApi) {
    await simulateNetworkDelay(80);
    return { success: true, message: "Fine payment recorded successfully." };
  }
  return fetchJson<{ success: boolean; message: string }>(
    `/library/fines/${encodeURIComponent(fineId)}/pay`,
    { method: "PUT" }
  );
}

// POST /api/library/etl/sync
export async function runLibraryETL(triggeredBy = "Admin Console"): Promise<LibraryETLLog> {
  const res = await fetchJson<{ success: boolean; data: LibraryETLLog }>(
    "/library/etl/sync",
    {
      method: "POST",
      body: JSON.stringify({ triggeredBy }),
    }
  );
  return res.data;
}

// GET /api/library/etl/logs
export async function getLibraryETLLogs(): Promise<LibraryETLLog[]> {
  const res = await fetchJson<{ success: boolean; data: LibraryETLLog[] }>(
    "/library/etl/logs"
  );
  return res.data;
}

// GET /api/audit-logs
export async function getAuditLogs(): Promise<AuditLogRecord[]> {
  // Audit records must never silently fall back to mock data in live mode:
  // the page surfaces an explicit "endpoint unavailable" state instead.
  if (API_CONFIG.useLiveApi) {
    return fetchJson<AuditLogRecord[]>("/audit-logs");
  }
  await simulateNetworkDelay(120);
  return AUDIT_LOG_RECORDS.map((a) => ({ ...a }));
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

export async function createLibraryRequest(
  request: Pick<
    BorrowingRequest,
    "bookId" | "bookTitle" | "author" | "isbn" | "category" | "programCode"
  >
): Promise<BorrowingRequest> {
  const response = await fetchJson<{
    success: boolean;
    data: BorrowingRequest;
  }>("/library/requests", {
    method: "POST",
    body: JSON.stringify(request),
  });
  return response.data;
}

export async function cancelLibraryRequest(
  requestId: string
): Promise<{ success: boolean; message: string }> {
  return fetchJson(`/library/requests/${encodeURIComponent(requestId)}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function approveLibraryRequest(
  requestId: string
): Promise<{ success: boolean; message: string }> {
  return fetchJson(`/library/requests/${encodeURIComponent(requestId)}/approve`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function rejectLibraryRequest(
  requestId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  return fetchJson(`/library/requests/${encodeURIComponent(requestId)}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function createLibraryReservation(
  bookId: string
): Promise<ReservationRecord> {
  const response = await fetchJson<{ success: boolean; data: ReservationRecord }>(
    "/library/reservations",
    { method: "POST", body: JSON.stringify({ bookId }) }
  );
  return response.data;
}

export async function cancelLibraryReservation(
  reservationId: string
): Promise<{ success: boolean; message: string }> {
  return fetchJson(
    `/library/reservations/${encodeURIComponent(reservationId)}/cancel`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export async function returnLibraryTransaction(
  transactionId: string
): Promise<{ success: boolean; fineAccrued: number; message: string }> {
  return fetchJson(
    `/library/returns/${encodeURIComponent(transactionId)}`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export async function getLibraryNotifications(): Promise<StudentNotificationItem[]> {
  return fetchJson<StudentNotificationItem[]>("/library/notifications");
}

export async function markLibraryNotificationRead(
  notificationId: string
): Promise<void> {
  await fetchJson(
    `/library/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export async function markAllLibraryNotificationsRead(): Promise<void> {
  await fetchJson("/library/notifications/read-all", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

// =============================================================
// FERPA GOVERNANCE
// =============================================================

// GET /api/ferpa/overview
export async function getFerpaOverview(): Promise<FerpaOverview> {
  return tryLiveOrFallback(
    () => fetchJson<FerpaOverview>("/ferpa/overview"),
    async () => {
      await simulateNetworkDelay(110);
      return { ...FERPA_OVERVIEW };
    },
    (data) =>
      Boolean(data) &&
      typeof data.activeConsents === "number" &&
      typeof data.directoryOptOuts === "number"
  );
}

// GET /api/ferpa/consents
export async function getFerpaConsents(
  studentId?: string
): Promise<FerpaConsent[]> {
  return tryLiveOrFallback(
    async () => {
      const query = studentId
        ? `?studentId=${encodeURIComponent(studentId)}`
        : "";
      const response = await fetchJson<{ consents: FerpaConsent[] }>(
        `/ferpa/consents${query}`
      );
      return response.consents;
    },
    async () => {
      await simulateNetworkDelay(110);
      return FERPA_CONSENTS.filter(
        (consent) => !studentId || consent.studentId === studentId
      ).map((consent) => ({ ...consent }));
    },
    (data) => Array.isArray(data)
  );
}

// POST /api/ferpa/consents
export async function recordFerpaConsent(
  input: FerpaConsentInput
): Promise<FerpaConsent> {
  if (API_CONFIG.useLiveApi) {
    const response = await fetchJson<{ consent: FerpaConsent }>(
      "/ferpa/consents",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
    return response.consent;
  }

  await simulateNetworkDelay(220);
  const student = STUDENTS.find((candidate) => candidate.id === input.studentId);
  const consent: FerpaConsent = {
    id: `ferpa-consent-${Date.now()}`,
    studentId: input.studentId,
    studentName: student?.name ?? input.studentId,
    consentType: input.consentType,
    status: input.granted ? "Granted" : "Revoked",
    effectiveAt: new Date().toISOString(),
    expiresAt: null,
    recordedByName: "Administrator",
    note: input.note?.trim() ? input.note.trim() : null,
  };
  FERPA_CONSENTS.unshift(consent);
  FERPA_OVERVIEW.activeConsents = Math.max(
    0,
    FERPA_OVERVIEW.activeConsents + (input.granted ? 1 : -1)
  );
  return { ...consent };
}

// GET /api/ferpa/access-log
export async function getFerpaAccessLog(
  limit = 100
): Promise<FerpaAccessEvent[]> {
  return tryLiveOrFallback(
    async () => {
      const response = await fetchJson<{ events: FerpaAccessEvent[] }>(
        `/ferpa/access-log?limit=${encodeURIComponent(String(limit))}`
      );
      return response.events;
    },
    async () => {
      await simulateNetworkDelay(110);
      return FERPA_ACCESS_EVENTS.slice(0, limit).map((event) => ({ ...event }));
    },
    (data) => Array.isArray(data)
  );
}

// GET /api/ferpa/directory-settings
export async function getFerpaDirectorySettings(): Promise<
  FerpaDirectorySetting[]
> {
  return tryLiveOrFallback(
    async () => {
      const response = await fetchJson<{ settings: FerpaDirectorySetting[] }>(
        "/ferpa/directory-settings"
      );
      return response.settings;
    },
    async () => {
      await simulateNetworkDelay(110);
      return FERPA_DIRECTORY_SETTINGS.map((setting) => ({ ...setting }));
    },
    (data) => Array.isArray(data)
  );
}

// PATCH /api/ferpa/directory-settings/:studentId
export async function updateFerpaDirectorySetting(
  studentId: string,
  directoryOptOut: boolean
): Promise<FerpaDirectorySetting> {
  if (API_CONFIG.useLiveApi) {
    const response = await fetchJson<{ setting: FerpaDirectorySetting }>(
      `/ferpa/directory-settings/${encodeURIComponent(studentId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ directoryOptOut }),
      }
    );
    return response.setting;
  }

  await simulateNetworkDelay(180);
  const existing = FERPA_DIRECTORY_SETTINGS.find(
    (setting) => setting.studentId === studentId
  );
  if (!existing) {
    throw new Error(`No directory setting was found for student ${studentId}.`);
  }
  const previousOptOut = existing.directoryOptOut;
  existing.directoryOptOut = directoryOptOut;
  existing.updatedAt = new Date().toISOString();
  if (previousOptOut !== directoryOptOut) {
    FERPA_OVERVIEW.directoryOptOuts += directoryOptOut ? 1 : -1;
  }
  return { ...existing };
}

// =============================================================
// UNIFIED STUDENT LIFECYCLE (PER STUDENT)
// =============================================================

// GET /api/students/:id/lifecycle
export async function getStudentLifecycle(
  studentId: string
): Promise<StudentLifecycle> {
  return tryLiveOrFallback(
    () =>
      fetchJson<StudentLifecycle>(
        `/students/${encodeURIComponent(studentId)}/lifecycle`
      ),
    async () => {
      await simulateNetworkDelay(140);
      return buildMockStudentLifecycle(studentId);
    },
    (data) => Boolean(data?.stages && Array.isArray(data.stages) && data?.studentId)
  );
}

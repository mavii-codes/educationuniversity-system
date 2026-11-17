/**
 * Human-readable presentation helpers for the admin audit log.
 *
 * Everything in this module is derived at read time. Raw audit action codes,
 * entity types, and metadata written to `audit_log` are never altered.
 */

export type AuditCategory =
  | "Authentication"
  | "Library"
  | "FERPA & Privacy"
  | "Data Integration"
  | "Administration"
  | "Members"
  | "System";

type AuditMetadata = Record<string, unknown> | null | undefined;

const ACTION_LABELS: Record<string, string> = {
  "auth.login_succeeded": "Signed in",
  "auth.login_failed": "Sign-in failed",
  "auth.login_blocked": "Sign-in blocked",
  "auth.student_registered": "Student registered",
  "auth.password_changed": "Password changed",
  "auth.refresh_reuse_detected": "Token reuse detected",
  "auth.logout_succeeded": "Signed out",
  "auth.logout": "Signed out",
  "auth.token_refreshed": "Session refreshed",
  "integration.sync": "Data source synced",
  "integration.sync_failed": "Data source sync failed",
  view_profile: "Viewed student profile",
  view_lifecycle: "Viewed student lifecycle",
  view_directory: "Viewed student directory",
};

const METHOD_VERBS: Record<string, string> = {
  POST: "Created",
  PATCH: "Updated",
  PUT: "Updated",
  DELETE: "Removed",
  GET: "Viewed",
  HEAD: "Checked",
  OPTIONS: "Inspected",
};

const AUTH_PATH_LABELS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /^\/auth\/login(?:\/|$)/i, label: "Signed in" },
  { pattern: /^\/auth\/logout(?:\/|$)/i, label: "Signed out" },
  {
    pattern: /^\/auth\/refresh(?:\/|$)/i,
    label: "Refreshed authentication session",
  },
  {
    pattern: /^\/auth\/register(?:\/|$)/i,
    label: "Registered student account",
  },
  {
    pattern: /^\/auth\/change-password(?:\/|$)/i,
    label: "Changed password",
  },
  {
    pattern: /^\/auth\/forgot-password(?:\/|$)/i,
    label: "Requested password reset",
  },
  { pattern: /^\/auth\/reset-password(?:\/|$)/i, label: "Reset password" },
  {
    pattern: /^\/auth\/me(?:\/|$)/i,
    label: "Viewed authentication profile",
  },
];

type PathNounRule = {
  pattern: RegExp;
  noun: (id: string | null) => string;
};

/**
 * Ordered, most-specific-first mapping from request paths to friendly nouns.
 * The first capture group, when present, is the record id embedded in the path.
 */
const PATH_NOUN_RULES: PathNounRule[] = [
  // FERPA & privacy
  {
    pattern: /^\/ferpa\/directory-settings(?:\/([^/]+))?/i,
    noun: (id) =>
      id
        ? `FERPA directory setting — student ${id}`
        : "FERPA directory setting",
  },
  {
    pattern: /^\/ferpa\/consents(?:\/([^/]+))?/i,
    noun: (id) => (id ? `FERPA consent #${id}` : "FERPA consent"),
  },
  {
    pattern: /^\/ferpa\/access-log/i,
    noun: () => "FERPA access log",
  },
  {
    pattern: /^\/ferpa\/overview/i,
    noun: () => "FERPA overview",
  },
  {
    pattern: /^\/ferpa(?:\/|$)/i,
    noun: (id) => (id ? `FERPA record ${id}` : "FERPA record"),
  },
  // Library books and circulation
  {
    pattern: /^\/library\/books\/cover-lookup/i,
    noun: () => "book record",
  },
  {
    pattern: /^\/library\/books\/([^/]+)\/(?:refresh-)?cover/i,
    noun: (id) => (id ? `cover image for book #${id}` : "book cover"),
  },
  {
    pattern: /^\/library\/books\/([^/]+)/i,
    noun: (id) => (id ? `book #${id}` : "book record"),
  },
  {
    pattern: /^\/library\/books$/i,
    noun: () => "book record",
  },
  {
    pattern: /^\/library\/categories/i,
    noun: () => "book category",
  },
  {
    pattern: /^\/library\/borrowers/i,
    noun: () => "borrower record",
  },
  {
    pattern: /^\/library\/transactions/i,
    noun: () => "circulation transaction",
  },
  {
    pattern: /^\/library\/returns(?:\/([^/]+))?/i,
    noun: (id) => (id ? `book return #${id}` : "book return"),
  },
  {
    pattern: /^\/library\/reservations(?:\/([^/]+))?/i,
    noun: (id) => (id ? `reservation #${id}` : "reservation"),
  },
  {
    pattern: /^\/library\/requests(?:\/([^/]+))?/i,
    noun: (id) => (id ? `borrowing request #${id}` : "borrowing request"),
  },
  {
    pattern: /^\/library\/fines(?:\/([^/]+))?/i,
    noun: (id) => (id ? `library fine #${id}` : "library fine"),
  },
  {
    pattern: /^\/library\/notifications(?:\/([^/]+))?/i,
    noun: (id) =>
      id ? `library notification #${id}` : "library notification",
  },
  {
    pattern: /^\/library\/etl/i,
    noun: () => "library data sync",
  },
  {
    pattern: /^\/library\/overview/i,
    noun: () => "library overview",
  },
  {
    pattern: /^\/library(?:\/|$)/i,
    noun: () => "library record",
  },
  // Legacy /books aliases
  {
    pattern: /^\/books\/([^/]+)\/(?:refresh-)?cover/i,
    noun: (id) => (id ? `cover image for book #${id}` : "book cover"),
  },
  {
    pattern: /^\/books\/([^/]+)/i,
    noun: (id) => (id ? `book #${id}` : "book record"),
  },
  {
    pattern: /^\/books$/i,
    noun: () => "book record",
  },
  // Data integration
  {
    pattern: /^\/etl\/sync/i,
    noun: () => "data integration run",
  },
  {
    pattern: /^\/etl\/sources/i,
    noun: () => "data source",
  },
  {
    pattern: /^\/etl\/runs/i,
    noun: () => "data integration run",
  },
  {
    pattern: /^\/etl(?:\/|$)/i,
    noun: () => "data integration run",
  },
  {
    pattern: /^\/data-sources(?:\/([^/]+))?/i,
    noun: (id) => (id ? `data source ${id}` : "data source"),
  },
  {
    pattern: /^\/integrations(?:\/|$)/i,
    noun: () => "data integration",
  },
  // Administration and member records
  {
    pattern: /^\/admin\/users(?:\/([^/]+))?/i,
    noun: (id) => (id ? `user account #${id}` : "user account"),
  },
  {
    pattern: /^\/admin\/settings/i,
    noun: () => "administration settings",
  },
  {
    pattern: /^\/admin\/sync-history/i,
    noun: () => "sync history",
  },
  {
    pattern: /^\/admin\/dashboard/i,
    noun: () => "administration dashboard",
  },
  {
    pattern: /^\/admin\/audit-logs/i,
    noun: () => "audit log",
  },
  {
    pattern: /^\/admin(?:\/|$)/i,
    noun: () => "administration record",
  },
  {
    pattern: /^\/users(?:\/([^/]+))?/i,
    noun: (id) => (id ? `user account #${id}` : "user account"),
  },
  {
    pattern: /^\/students(?:\/([^/]+))?/i,
    noun: (id) => (id ? `student record ${id}` : "student record"),
  },
  {
    pattern: /^\/enrollments(?:\/([^/]+))?/i,
    noun: (id) => (id ? `enrollment #${id}` : "enrollment"),
  },
  {
    pattern: /^\/notifications(?:\/([^/]+))?/i,
    noun: (id) => (id ? `notification #${id}` : "notification"),
  },
  {
    pattern: /^\/settings(?:\/|$)/i,
    noun: () => "settings",
  },
  {
    pattern: /^\/auth(?:\/|$)/i,
    noun: () => "authentication service",
  },
];

const ENTITY_TYPE_LABELS: Record<string, string> = {
  auth: "Authentication service",
  data_source: "Data source",
  datasource: "Data source",
  integration: "Data integration",
  etl: "Data integration run",
  ferpa: "FERPA record",
  user: "User account",
  users: "User account",
  student: "Student record",
  students: "Student record",
  book: "Book record",
  books: "Book record",
  enrollment: "Enrollment",
  notification: "Notification",
  setting: "Settings",
  settings: "Settings",
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Tidy a raw code/path without losing any of its information. */
function tidyCode(value: string): string {
  const cleaned = value
    .replace(/^api\./i, "")
    .replace(/[._\-/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return capitalize(cleaned || "audit event");
}

function normalizePath(raw: string | null): string {
  if (!raw) return "";
  const withoutQuery = raw.split(/[?#]/, 1)[0] ?? "";
  const withoutApiPrefix = withoutQuery.replace(/^\/api(?=\/|$)/i, "");
  const withLeadingSlash = withoutApiPrefix.startsWith("/")
    ? withoutApiPrefix
    : `/${withoutApiPrefix}`;
  return withLeadingSlash.replace(/\/+$/, "") || "/";
}

function resolveApiContext(
  metadata: AuditMetadata,
  entityType: string | null
): { method: string | null; path: string } {
  const method = asString(metadata?.method)?.toUpperCase() ?? null;
  const metadataPath = asString(metadata?.path);
  const entityPath =
    entityType && entityType.trim().startsWith("/") ? entityType.trim() : null;
  return { method, path: normalizePath(metadataPath ?? entityPath) };
}

function findPathNoun(path: string): string | null {
  if (!path) return null;
  for (const rule of PATH_NOUN_RULES) {
    const match = rule.pattern.exec(path);
    if (match) return rule.noun(match[1] ?? null);
  }
  return null;
}

function findAuthPathLabel(path: string): string | null {
  for (const entry of AUTH_PATH_LABELS) {
    if (entry.pattern.test(path)) return entry.label;
  }
  if (/^\/auth(?:\/|$)/i.test(path)) return "Authentication request";
  return null;
}

function getApiActionLabel(method: string | null, path: string): string {
  const authLabel = findAuthPathLabel(path);
  if (authLabel) return authLabel;

  const verb = method ? METHOD_VERBS[method] : undefined;
  const noun = findPathNoun(path) ?? (path ? tidyCode(path) : null);

  if (noun) return `${verb ?? "Changed"} ${noun}`;
  return method ? `${method} request` : "API request";
}

/**
 * Human-readable action label. Raw codes are retained on the record itself;
 * this label is presentation-only.
 */
export function getAuditActionLabel(
  action: string,
  metadata?: AuditMetadata,
  entityType?: string | null
): string {
  const rawAction = action.trim();
  const known =
    ACTION_LABELS[rawAction] ?? ACTION_LABELS[rawAction.toLowerCase()];
  if (known) return known;

  if (/^api\./i.test(rawAction)) {
    const { method: metadataMethod, path } = resolveApiContext(
      metadata,
      entityType ?? null
    );
    const actionMethod = /^api\.([a-z]+)$/i.exec(rawAction)?.[1]?.toUpperCase();
    return getApiActionLabel(metadataMethod ?? actionMethod ?? null, path);
  }

  return tidyCode(rawAction);
}

/**
 * Human-readable resource label for the audited entity. Accepts either a
 * request path (e.g. `/ferpa/directory-settings/2025-074`) or a stored entity
 * type (e.g. `auth`, `data_source`).
 */
export function getAuditResourceLabel(
  entityType: string,
  entityId?: string | null,
  metadata?: AuditMetadata
): string {
  const id = asString(entityId);
  const rawType = asString(entityType) ?? asString(metadata?.path);

  if (!rawType) return id ? `Record ${id}` : "Audit record";

  if (rawType.startsWith("/")) {
    const path = normalizePath(rawType);
    const noun = findPathNoun(path);
    const label = capitalize(noun ?? tidyCode(path));
    if (id && !label.includes(id)) {
      if (/^\/ferpa\/directory-settings(?:\/|$)/i.test(path)) {
        return `FERPA directory setting — student ${id}`;
      }
      return `${label} (${id})`;
    }
    return label;
  }

  const key = rawType.toLowerCase();
  const label = ENTITY_TYPE_LABELS[key] ?? tidyCode(rawType);
  if (id && !label.includes(id)) return `${label} (${id})`;
  return label;
}

/** Category used for audit log filtering and badges. */
export function getAuditCategory(
  action: string,
  entityType: string
): AuditCategory {
  const rawAction = action.trim();
  const normalizedAction = rawAction.toLowerCase();
  const rawEntityType = entityType.trim();
  const path = rawEntityType.startsWith("/")
    ? normalizePath(rawEntityType)
    : "";
  const type = rawEntityType.toLowerCase();

  if (
    normalizedAction.startsWith("auth.") ||
    type === "auth" ||
    /^\/auth(?:\/|$)/i.test(path)
  ) {
    return "Authentication";
  }

  if (
    /^\/library(?:\/|$)/i.test(path) ||
    /^\/books(?:\/|$)/i.test(path) ||
    type === "book" ||
    type === "books"
  ) {
    return "Library";
  }

  if (
    normalizedAction.startsWith("ferpa.") ||
    /^view_(profile|lifecycle|directory)$/i.test(rawAction) ||
    type === "ferpa" ||
    /^\/ferpa(?:\/|$)/i.test(path)
  ) {
    return "FERPA & Privacy";
  }

  if (
    normalizedAction.startsWith("integration.") ||
    type === "data_source" ||
    type === "integration" ||
    /^\/etl(?:\/|$)/i.test(path) ||
    /^\/data-sources(?:\/|$)/i.test(path) ||
    /^\/integrations(?:\/|$)/i.test(path)
  ) {
    return "Data Integration";
  }

  if (
    normalizedAction.startsWith("admin.") ||
    /^\/admin(?:\/|$)/i.test(path) ||
    /^\/settings(?:\/|$)/i.test(path)
  ) {
    return "Administration";
  }

  if (
    /^\/users(?:\/|$)/i.test(path) ||
    /^\/students(?:\/|$)/i.test(path) ||
    /^\/enrollments(?:\/|$)/i.test(path) ||
    ["user", "users", "student", "students", "enrollment", "enrollments"].includes(
      type
    )
  ) {
    return "Members";
  }

  return "System";
}

/**
 * Extra context that is not already conveyed by the action/resource labels.
 * Returns an empty string when there is nothing non-duplicative to show.
 * Accepts an optional leading action for symmetry with the other helpers.
 */
export function getAuditDetailsExtra(
  metadata: Record<string, unknown> | null | undefined
): string;
export function getAuditDetailsExtra(
  action: string,
  metadata: Record<string, unknown> | null | undefined
): string;
export function getAuditDetailsExtra(
  actionOrMetadata: string | Record<string, unknown> | null | undefined,
  metadata?: Record<string, unknown> | null
): string {
  const resolved =
    typeof actionOrMetadata === "string"
      ? metadata ?? null
      : actionOrMetadata ?? null;
  const extras: string[] = [];

  if (
    typeof resolved?.statusCode === "number" &&
    resolved.statusCode >= 400
  ) {
    extras.push(`HTTP ${resolved.statusCode}`);
  }
  if (typeof resolved?.recordsProcessed === "number") {
    extras.push(`${resolved.recordsProcessed} records processed`);
  }
  if (
    typeof resolved?.duration === "string" &&
    resolved.duration.trim()
  ) {
    extras.push(`Duration ${resolved.duration.trim()}`);
  }

  return extras.join(" · ");
}

/** Legacy detail string, kept byte-for-byte for existing consumers/CSV export. */
export function getAuditDetails(
  action: string,
  metadata: Record<string, unknown> | null
): string {
  if (!metadata) return action.replace(/[._]/g, " ");
  if (typeof metadata.details === "string") return metadata.details;

  const details = [action.replace(/[._]/g, " ")];
  if (typeof metadata.path === "string") details.push(metadata.path);
  if (typeof metadata.statusCode === "number") {
    details.push(`HTTP ${metadata.statusCode}`);
  }
  if (typeof metadata.recordsProcessed === "number") {
    details.push(`${metadata.recordsProcessed} records processed`);
  }
  if (typeof metadata.duration === "string") {
    details.push(`Duration ${metadata.duration}`);
  }
  return details.join(" · ");
}

/** Legacy outcome mapping, kept stable for existing consumers. */
export function getAuditOutcome(
  action: string,
  metadata: Record<string, unknown> | null
): "Success" | "Warning" | "Failure" {
  if (metadata?.status === "Warning" || metadata?.status === "Failure") {
    return metadata.status;
  }
  if (/failed|blocked|reuse_detected/i.test(action)) return "Failure";
  return "Success";
}

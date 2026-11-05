import crypto from "node:crypto";
import path from "node:path";
import dotenv from "dotenv";
import { appRoot } from "./app-root";

dotenv.config({ path: path.join(appRoot, ".env") });

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const dbEnabled = process.env.DB_ENABLED === "true";
const databaseUrl = process.env.DATABASE_URL || "";
const dbHost = process.env.DB_HOST || "";

if (dbEnabled && !databaseUrl && !dbHost) {
  throw new Error(
    "DB_ENABLED=true but neither DATABASE_URL nor DB_HOST is configured. Check backend/.env."
  );
}

if (
  dbEnabled &&
  !databaseUrl &&
  (!process.env.DB_NAME || !process.env.DB_USER)
) {
  throw new Error(
    "DB_ENABLED=true and DB_HOST is set, but DB_NAME/DB_USER are missing. Check backend/.env."
  );
}

function resolveJwtSecret(name: string, configured: string | undefined): string {
  if (configured && configured.trim().length > 0) {
    return configured;
  }

  if (isProduction) {
    throw new Error(`${name} must be configured in the production environment.`);
  }

  // Never ship a hardcoded, forgeable secret. Development falls back to a
  // process-scoped random secret, which invalidates sessions on every restart.
  const ephemeral = crypto.randomBytes(32).toString("hex");
  console.warn(
    `[env] ${name} is not set. Generated an ephemeral development secret; ` +
      "all sessions will be invalidated whenever the server restarts. " +
      `Set ${name} in backend/.env to keep sessions stable.`
  );
  return ephemeral;
}

const jwtAccessSecret = resolveJwtSecret(
  "JWT_ACCESS_SECRET",
  process.env.JWT_ACCESS_SECRET
);
const jwtRefreshSecret = resolveJwtSecret(
  "JWT_REFRESH_SECRET",
  process.env.JWT_REFRESH_SECRET
);

const DEFAULT_DEV_CORS_ORIGIN = "http://localhost:3000";
const configuredCorsOrigin = (process.env.CORS_ORIGIN || "").trim();

if (isProduction && !configuredCorsOrigin) {
  throw new Error("CORS_ORIGIN must be configured in the production environment.");
}

// Comma-separated allowlist; credentials are never paired with a "*" origin.
const corsOrigins = (configuredCorsOrigin || DEFAULT_DEV_CORS_ORIGIN)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const sameSite = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();
const cookieSameSite: "lax" | "strict" | "none" =
  sameSite === "strict" || sameSite === "none" ? sameSite : "lax";

function parseDurationMs(value: string | undefined, fallbackMs: number): number {
  if (!value) return fallbackMs;
  const match = /^(\d+)\s*([smhd])?$/i.exec(value.trim());
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = (match[2] || "s").toLowerCase();
  const multiplier = unit === "d" ? 86400000 : unit === "h" ? 3600000 : unit === "m" ? 60000 : 1000;
  return amount * multiplier;
}

const accessTtl = process.env.JWT_ACCESS_TTL || "15m";

export const env = {
  nodeEnv,
  port: Number(process.env.PORT) || 5000,
  corsOrigin: corsOrigins,
  isProduction,
  db: {
    enabled: dbEnabled,
    connectionString: databaseUrl,
    host: dbHost,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "",
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    ssl: process.env.DB_SSL === "true",
  },
  auth: {
    accessSecret: jwtAccessSecret,
    refreshSecret: jwtRefreshSecret,
    accessTtl,
    accessTtlMs: parseDurationMs(accessTtl, 15 * 60 * 1000),
    refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS) || 7,
    refreshTtlDaysRemember: Number(process.env.JWT_REFRESH_TTL_DAYS_REMEMBER) || 30,
    cookieSecure: process.env.COOKIE_SECURE === "true",
    cookieDomain: process.env.COOKIE_DOMAIN || undefined,
    cookieSameSite,
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || "",
    resendFromEmail: process.env.RESEND_FROM_EMAIL || "",
    frontendUrl: process.env.FRONTEND_URL || "",
  },
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || "",
  seedLibraryStaffPassword:
    process.env.SEED_LIBRARY_STAFF_PASSWORD ||
    process.env.SEED_REGISTRAR_PASSWORD ||
    "",
};

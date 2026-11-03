import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

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

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || "";
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "";

if (!jwtAccessSecret || !jwtRefreshSecret) {
  throw new Error(
    "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in backend/.env."
  );
}

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
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  corsOrigin: process.env.CORS_ORIGIN || "*",
  isProduction: (process.env.NODE_ENV || "development") === "production",
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
  seedRegistrarPassword: process.env.SEED_REGISTRAR_PASSWORD || "",
};

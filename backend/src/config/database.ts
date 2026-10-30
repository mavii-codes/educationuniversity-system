import { Pool, QueryResult, QueryResultRow } from "pg";
import { env } from "./env";

let pool: Pool | null = null;

/**
 * Returns a lazy-initialized PostgreSQL connection pool when DB_ENABLED=true.
 * Keeps initial frontend/API development runnable without requiring a live PostgreSQL instance.
 */
export function getDbPool(): Pool | null {
  if (!env.db.enabled) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      host: env.db.host,
      port: env.db.port,
      database: env.db.database,
      user: env.db.user,
      password: env.db.password,
      ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }

  return pool;
}

export async function queryDb<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  const activePool = getDbPool();
  if (!activePool) {
    throw new Error(
      "PostgreSQL is currently disabled (DB_ENABLED=false). Enable DB_ENABLED in backend/.env when PostgreSQL is ready."
    );
  }
  return activePool.query<T>(sql, params);
}

export async function verifyDatabaseConnection(): Promise<string> {
  if (!env.db.enabled) {
    return "disabled (in-memory foundation mode)";
  }

  const activePool = getDbPool();
  if (!activePool) return "unavailable";

  await activePool.query("SELECT 1");
  return "connected";
}


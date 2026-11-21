import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from "pg";
import { env } from "./env";

let pool: Pool | null = null;

function buildPoolConfig(): PoolConfig {
  const base: PoolConfig = {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  };

  if (env.db.host) {
    return {
      ...base,
      host: env.db.host,
      port: env.db.port,
      database: env.db.database,
      user: env.db.user,
      password: env.db.password,
      // TLS certificate validation stays enabled. For a private CA, supply a
      // PEM bundle via DB_SSL_CA or NODE_EXTRA_CA_CERTS instead of disabling it.
      ssl: env.db.ssl ? { rejectUnauthorized: true } : false,
    };
  }

  return {
    ...base,
    connectionString: env.db.connectionString,
    ssl: env.db.ssl ? { rejectUnauthorized: true } : undefined,
  };
}

export function createPgPool(): Pool {
  const created = new Pool(buildPoolConfig());
  created.on("error", (error) => {
    console.error("[University Library Backend] Unexpected database client error:", error.message);
  });
  return created;
}

/**
 * Returns a lazy-initialized PostgreSQL connection pool when DB_ENABLED=true.
 * Keeps the API usable without a live PostgreSQL instance (in-memory fallback).
 */
export function getDbPool(): Pool | null {
  if (!env.db.enabled) {
    return null;
  }

  if (!pool) {
    pool = createPgPool();
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

export async function withTransaction<T>(
  run: (client: PoolClient) => Promise<T>
): Promise<T> {
  const activePool = getDbPool();
  if (!activePool) {
    throw new Error("PostgreSQL is currently disabled (DB_ENABLED=false).");
  }

  const client = await activePool.connect();
  try {
    await client.query("BEGIN");
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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

export function isDatabaseConnectionError(error: unknown): boolean {
  if (!(error instanceof Error) && typeof error !== "object") return false;

  const candidate = error as Error & { code?: unknown; message?: unknown };
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const message =
    typeof candidate.message === "string"
      ? candidate.message
      : error instanceof Error
        ? error.message
        : "";

  if (
    [
      "08000",
      "08001",
      "08006",
      "57P03",
      "28P01",
      "3D000",
      "53300",
      "ECONNREFUSED",
      "ECONNRESET",
      "ETIMEDOUT",
      "ENETUNREACH",
      "EHOSTUNREACH",
    ].includes(code)
  ) {
    return true;
  }

  return /connection terminated|connection timeout|timed out|timeout expired|could not connect|failed to connect|database (?:is )?unavailable|socket hang up/i.test(
    message
  );
}

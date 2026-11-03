import fs from "node:fs";
import path from "node:path";
import { createPgPool } from "../config/database";

function resolveMigrationsDir(): string {
  // Works from both src/db (tsx) and dist/db (compiled): both are two levels below backend/.
  const repoRelative = path.resolve(__dirname, "../../db/migrations");
  if (fs.existsSync(repoRelative)) return repoRelative;

  const fromCwd = path.resolve(process.cwd(), "db", "migrations");
  if (fs.existsSync(fromCwd)) return fromCwd;

  throw new Error(`Migrations directory not found (looked in "${repoRelative}")`);
}

async function main(): Promise<void> {
  const pool = createPgPool();
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const dir = resolveMigrationsDir();
    const files = fs
      .readdirSync(dir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    const { rows } = await client.query("SELECT version FROM schema_migrations");
    const applied = new Set(rows.map((row) => String(row.version)));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrate] skip ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(dir, file), "utf8");
      console.log(`[migrate] apply ${file}`);

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("[migrate] database is up to date");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[migrate] failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});

/**
 * University ETL / FERPA / Lifecycle verification + manual sync runner.
 *
 * Usage (from backend/):
 *   npm run etl:sync                 # run a full multi-source ETL sync
 *   npm run etl:sync -- SIS LMS      # sync only specific sources
 *
 * Requires DB_ENABLED=true (PostgreSQL). Exits non-zero on failure.
 */
import { getDbPool } from "../src/config/database";
import { universityETLService } from "../src/etl/university-etl.service";
import { ferpaService } from "../src/services/ferpa.service";
import { studentLifecycleService } from "../src/services/student-lifecycle.service";
import { queryDb } from "../src/config/database";

async function main(): Promise<void> {
  const requested = process.argv.slice(2);
  const sourceIds = requested.length > 0 ? requested : undefined;

  console.log("[etl:sync] Running university ETL sync...");
  const run = await universityETLService.runSync({
    sourceIds,
    triggeredBy: "etl:sync script",
  });
  console.log(
    JSON.stringify(
      {
        runId: run.runId,
        status: run.status,
        durationMs: run.durationMs,
        totals: run.totals,
        perSource: run.results.map((result) => ({
          sourceCode: result.sourceCode,
          status: result.status,
          extracted: result.recordsExtracted,
          validated: result.recordsValidated,
          cleaned: result.recordsCleaned,
          loaded: result.recordsLoaded,
          rejected: result.recordsRejected,
          errors: result.errors,
        })),
      },
      null,
      2,
    ),
  );

  const sources = await universityETLService.getSources();
  console.log("[etl:sync] Registered sources:", sources.map((source) => `${source.code}(${source.status}${source.lastSyncedAt ? ", " + source.lastSyncedAt : ""})`).join(", "));

  const counts = await queryDb<{ table_name: string; rows: string }>(
    `SELECT 'etl_runs' AS table_name, COUNT(*)::text AS rows FROM etl_runs
     UNION ALL SELECT 'etl_run_sources', COUNT(*)::text FROM etl_run_sources
     UNION ALL SELECT 'hr_student_employment', COUNT(*)::text FROM hr_student_employment
     UNION ALL SELECT 'student_lifecycle_events', COUNT(*)::text FROM student_lifecycle_events
     UNION ALL SELECT 'lms_course_progress', COUNT(*)::text FROM lms_course_progress
     UNION ALL SELECT 'alumni_records', COUNT(*)::text FROM alumni_records
     UNION ALL SELECT 'ferpa_consent_records', COUNT(*)::text FROM ferpa_consent_records
     UNION ALL SELECT 'ferpa_directory_settings', COUNT(*)::text FROM ferpa_directory_settings
     UNION ALL SELECT 'ferpa_access_log', COUNT(*)::text FROM ferpa_access_log`,
  );
  console.log("[etl:sync] Row counts:", counts.rows.map((row) => `${row.table_name}=${row.rows}`).join(", "));

  // FERPA governance smoke check (DB mode).
  const overview = await ferpaService.getOverview();
  console.log("[etl:sync] FERPA overview:", JSON.stringify(overview));

  // Unified lifecycle smoke check for the first known student.
  const studentRow = await queryDb<{ id: string }>(
    `SELECT id FROM students ORDER BY id LIMIT 1`,
  );
  if (studentRow.rows[0]) {
    const lifecycle = await studentLifecycleService.getStudentLifecycle(
      studentRow.rows[0].id,
      {
        id: "verification-script",
        name: "Verification Script",
        portalRole: "Administrator",
      },
    );
    console.log(
      `[etl:sync] Lifecycle for ${studentRow.rows[0].id}:`,
      lifecycle
        ? `currentStage=${lifecycle.currentStage}, stages=${lifecycle.stages.length}, timeline=${lifecycle.timeline.length}`
        : "not found",
    );
  }

  const failed = run.results.filter((result) => result.status === "Failed");
  if (failed.length > 0 || run.status === "Failed") {
    console.error("[etl:sync] FAILURES detected:", failed.map((result) => result.errors));
    process.exitCode = 1;
  } else {
    console.log("[etl:sync] University ETL sync completed successfully.");
  }
}

main()
  .catch((error) => {
    console.error("[etl:sync] Fatal error:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    getDbPool()?.end().catch(() => undefined);
  });

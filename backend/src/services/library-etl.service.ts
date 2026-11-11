import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { getDbPool, queryDb, withTransaction } from "../config/database";
import { LibraryETLLogModel } from "../models";

type CatalogRow = {
  id: string;
  isbn: string;
  title: string;
};

type TransactionRow = {
  id: string;
  student_id: string;
  book_title: string;
  borrow_date: Date;
  due_date: Date;
  return_date: Date | null;
  status: "Borrowed" | "Returned" | "Overdue";
  fines_accrued: number | string;
};

type ReservationRow = {
  id: string;
  student_id: string;
  book_title: string;
  reserved_date: Date;
  status: string;
};

type FineRow = {
  id: string;
  student_id: string;
  book_title: string;
  due_date: Date;
  fine_amount: number | string;
  payment_status: string;
};

type LifecycleEvent = {
  id: string;
  studentId: string;
  stage: "LIBRARY_ACTIVITY" | "FINANCIAL_STANDING";
  title: string;
  description: string;
  occurredAt: Date;
  metadata: {
    etlSource: "library";
    sourceTable: string;
    sourceRecordId: string;
  };
};

type EtlRunRow = {
  id: string;
  job_name: string;
  status: LibraryETLLogModel["status"];
  started_at: Date;
  completed_at: Date | null;
  duration_ms: number;
  records_extracted: number;
  records_validated: number;
  duplicates_cleaned: number;
  students_matched: number;
  records_loaded: number;
  errors: string[];
  execution_log: string[];
};

export class LibraryEtlUnavailableError extends Error {
  constructor() {
    super(
      "Live Library ETL requires PostgreSQL. Set DB_ENABLED=true and configure the backend database connection."
    );
    this.name = "LibraryEtlUnavailableError";
  }
}

function mapRun(row: EtlRunRow): LibraryETLLogModel {
  return {
    id: row.id,
    jobName: row.job_name,
    status: row.status,
    startedAt: row.started_at.toISOString(),
    completedAt: row.completed_at?.toISOString() ?? row.started_at.toISOString(),
    duration: `${(row.duration_ms / 1000).toFixed(1)}s`,
    recordsExtracted: row.records_extracted,
    recordsValidated: row.records_validated,
    duplicatesCleaned: row.duplicates_cleaned,
    studentsMatched: row.students_matched,
    recordsLoaded: row.records_loaded,
    errors: row.errors,
    executionLog: row.execution_log,
  };
}

function lifecycleEvent(
  sourceTable: string,
  sourceRecordId: string,
  studentId: string,
  stage: LifecycleEvent["stage"],
  title: string,
  description: string,
  occurredAt: Date
): LifecycleEvent {
  const hash = createHash("sha256")
    .update(`${sourceTable}:${sourceRecordId}`)
    .digest("hex")
    .slice(0, 40);

  return {
    id: `library-etl-${hash}`,
    studentId,
    stage,
    title,
    description,
    occurredAt,
    metadata: {
      etlSource: "library",
      sourceTable,
      sourceRecordId,
    },
  };
}

function isValidTitle(value: string): boolean {
  return value.trim().length > 0;
}

async function extractAndLoad(client: PoolClient): Promise<{
  recordsExtracted: number;
  recordsValidated: number;
  duplicatesCleaned: number;
  studentsMatched: number;
  recordsLoaded: number;
  errors: string[];
  executionLog: string[];
}> {
  await client.query("SELECT pg_advisory_xact_lock(hashtext('library-lifecycle-etl'))");

  const catalogResult = await client.query<CatalogRow>(
    `SELECT id, isbn, title
       FROM library_books
      ORDER BY id`
  );
  const transactionResult = await client.query<TransactionRow>(
    `SELECT id, student_id, book_title, borrow_date, due_date, return_date,
            status, fines_accrued
       FROM library_transactions
      ORDER BY borrow_date, id`
  );
  const reservationResult = await client.query<ReservationRow>(
    `SELECT id, student_id, book_title, reserved_date, status
       FROM library_reservations
      ORDER BY reserved_date, id`
  );
  const fineResult = await client.query<FineRow>(
    `SELECT id, student_id, book_title, due_date, fine_amount, payment_status
       FROM library_fines
      ORDER BY due_date, id`
  );

  const catalog = catalogResult.rows;
  const transactions = transactionResult.rows;
  const reservations = reservationResult.rows;
  const fines = fineResult.rows;
  const recordsExtracted =
    catalog.length + transactions.length + reservations.length + fines.length;
  const errors: string[] = [];
  const validCatalog = catalog.filter((book) => {
    const valid = isValidTitle(book.title);
    if (!valid && errors.length < 100) {
      errors.push(`Invalid library catalog record ${book.id}.`);
    }
    return valid;
  });
  const validTransactions = transactions.filter((record) => {
    const valid = Boolean(record.student_id) && isValidTitle(record.book_title);
    if (!valid && errors.length < 100) {
      errors.push(`Invalid library transaction ${record.id}.`);
    }
    return valid;
  });
  const validReservations = reservations.filter((record) => {
    const valid = Boolean(record.student_id) && isValidTitle(record.book_title);
    if (!valid && errors.length < 100) {
      errors.push(`Invalid library reservation ${record.id}.`);
    }
    return valid;
  });
  const validFines = fines.filter((record) => {
    const amount = Number(record.fine_amount);
    const valid =
      Boolean(record.student_id) &&
      isValidTitle(record.book_title) &&
      Number.isFinite(amount) &&
      amount >= 0;
    if (!valid && errors.length < 100) {
      errors.push(`Invalid library fine ${record.id}.`);
    }
    return valid;
  });

  const seenIsbns = new Set<string>();
  let duplicatesCleaned = 0;
  for (const book of validCatalog) {
    const isbn = book.isbn.trim().toUpperCase();
    if (!isbn) {
      continue;
    }
    if (seenIsbns.has(isbn)) {
      duplicatesCleaned += 1;
    } else {
      seenIsbns.add(isbn);
    }
  }

  const events: LifecycleEvent[] = [
    ...validTransactions.map((record) =>
      lifecycleEvent(
        "library_transactions",
        record.id,
        record.student_id,
        "LIBRARY_ACTIVITY",
        record.status === "Returned"
          ? "Library book returned"
          : record.status === "Overdue"
            ? "Library loan overdue"
            : "Library book borrowed",
        `${record.book_title.trim()} — ${record.status}; due ${record.due_date.toISOString().slice(0, 10)}.`,
        record.return_date ?? record.borrow_date
      )
    ),
    ...validReservations.map((record) =>
      lifecycleEvent(
        "library_reservations",
        record.id,
        record.student_id,
        "LIBRARY_ACTIVITY",
        `Library reservation ${record.status.toLowerCase()}`,
        `${record.book_title.trim()} — ${record.status}.`,
        record.reserved_date
      )
    ),
    ...validFines.map((record) =>
      lifecycleEvent(
        "library_fines",
        record.id,
        record.student_id,
        "FINANCIAL_STANDING",
        `Library fine ${record.payment_status.toLowerCase()}`,
        `${record.book_title.trim()} — PHP ${Number(record.fine_amount).toFixed(2)}; ${record.payment_status}.`,
        record.due_date
      )
    ),
  ];

  const studentIds = new Set(events.map((event) => event.studentId));
  const executionLog = [
    `Extracted ${catalog.length} catalog records, ${transactions.length} circulation records, ${reservations.length} reservations, and ${fines.length} fines from the live Library database.`,
    `Validated ${validCatalog.length + validTransactions.length + validReservations.length + validFines.length} source records; detected ${duplicatesCleaned} duplicate ISBNs without modifying source catalog data.`,
    `Matched Library records to ${studentIds.size} student identities using their database student IDs.`,
    `Transformed ${events.length} Library records into student lifecycle timeline events.`,
  ];

  for (const event of events) {
    await client.query(
      `INSERT INTO student_lifecycle_events
         (id, student_id, stage, source_system, title, description, occurred_at, metadata)
       VALUES ($1, $2, $3, 'LIBRARY', $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE
         SET student_id = EXCLUDED.student_id,
             stage = EXCLUDED.stage,
             source_system = EXCLUDED.source_system,
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             occurred_at = EXCLUDED.occurred_at,
             metadata = EXCLUDED.metadata`,
      [
        event.id,
        event.studentId,
        event.stage,
        event.title,
        event.description,
        event.occurredAt,
        JSON.stringify(event.metadata),
      ]
    );
  }

  const eventIds = events.map((event) => event.id);
  await client.query(
    `DELETE FROM student_lifecycle_events
      WHERE metadata->>'etlSource' = 'library'
        AND NOT (id = ANY($1::varchar[]))`,
    [eventIds]
  );

  executionLog.push(
    `Loaded ${events.length} lifecycle events from live Library records; the Library catalog and circulation source tables were not modified.`
  );

  return {
    recordsExtracted,
    recordsValidated:
      validCatalog.length +
      validTransactions.length +
      validReservations.length +
      validFines.length,
    duplicatesCleaned,
    studentsMatched: studentIds.size,
    recordsLoaded: events.length,
    errors,
    executionLog,
  };
}

export class LibraryEtlService {
  async runPipelineSync(triggeredBy = "Admin Console"): Promise<LibraryETLLogModel> {
    if (!getDbPool()) {
      throw new LibraryEtlUnavailableError();
    }

    const id = `library-etl-${randomUUID()}`;
    const jobName = "Live Library-to-Student-Lifecycle ETL";
    const startedAt = new Date();
    const executionLog = ["Started live Library ETL run."];

    await queryDb(
      `INSERT INTO library_etl_runs (id, job_name, triggered_by, status, execution_log)
       VALUES ($1, $2, $3, 'Running', $4)`,
      [id, jobName, triggeredBy.slice(0, 120), JSON.stringify(executionLog)]
    );

    try {
      return await withTransaction(async (client) => {
        const result = await extractAndLoad(client);
        const completedAt = new Date();
        const durationMs = Math.max(0, completedAt.getTime() - startedAt.getTime());

        await client.query(
          `UPDATE library_etl_runs
              SET status = 'Completed',
                  completed_at = $2,
                  duration_ms = $3,
                  records_extracted = $4,
                  records_validated = $5,
                  duplicates_cleaned = $6,
                  students_matched = $7,
                  records_loaded = $8,
                  errors = $9,
                  execution_log = $10
            WHERE id = $1`,
          [
            id,
            completedAt,
            durationMs,
            result.recordsExtracted,
            result.recordsValidated,
            result.duplicatesCleaned,
            result.studentsMatched,
            result.recordsLoaded,
            JSON.stringify(result.errors),
            JSON.stringify([...executionLog, ...result.executionLog]),
          ]
        );

        return {
          id,
          jobName,
          status: "Completed",
          startedAt: startedAt.toISOString(),
          completedAt: completedAt.toISOString(),
          duration: `${(durationMs / 1000).toFixed(1)}s`,
          recordsExtracted: result.recordsExtracted,
          recordsValidated: result.recordsValidated,
          duplicatesCleaned: result.duplicatesCleaned,
          studentsMatched: result.studentsMatched,
          recordsLoaded: result.recordsLoaded,
          errors: result.errors,
          executionLog: [...executionLog, ...result.executionLog],
        };
      });
    } catch (error) {
      const completedAt = new Date();
      const message =
        error instanceof Error ? error.message : "Unknown Library ETL failure.";
      try {
        await queryDb(
          `UPDATE library_etl_runs
              SET status = 'Failed',
                  completed_at = $2,
                  duration_ms = $3,
                  errors = $4,
                  execution_log = $5
            WHERE id = $1`,
          [
            id,
            completedAt,
            Math.max(0, completedAt.getTime() - startedAt.getTime()),
            JSON.stringify([message]),
            JSON.stringify([...executionLog, `ETL failed: ${message}`]),
          ]
        );
      } catch (loggingError) {
        console.error(
          "[library-etl] Failed to persist failed-run status:",
          loggingError instanceof Error ? loggingError.message : loggingError
        );
      }
      throw error;
    }
  }

  async getETLLogs(limit = 100): Promise<LibraryETLLogModel[]> {
    if (!getDbPool()) {
      throw new LibraryEtlUnavailableError();
    }

    const { rows } = await queryDb<EtlRunRow>(
      `SELECT id, job_name, status, started_at, completed_at, duration_ms,
              records_extracted, records_validated, duplicates_cleaned,
              students_matched, records_loaded, errors, execution_log
         FROM library_etl_runs
        ORDER BY started_at DESC, id DESC
        LIMIT $1`,
      [limit]
    );
    return rows.map(mapRun);
  }
}

export const libraryEtlService = new LibraryEtlService();

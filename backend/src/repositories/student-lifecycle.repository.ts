import { queryDb } from "../config/database";

export type LifecycleStageKey =
  | "MEMBERSHIP"
  | "REQUESTS"
  | "BORROWING"
  | "FINES"
  | "STANDING"
  | "ADMISSIONS"
  | "ENROLLMENT"
  | "LMS_ENGAGEMENT"
  | "LIBRARY_ACTIVITY"
  | "FINANCIAL_STANDING"
  | "ALUMNI";

export type LifecycleStageStatus = "Completed" | "Active" | "Upcoming" | "Alumni";

export interface LifecycleStageMetric {
  label: string;
  value: string;
}

export interface LifecycleStageDetail {
  key: LifecycleStageKey;
  label: string;
  status: LifecycleStageStatus;
  date: string | null;
  summary: string;
  metrics: LifecycleStageMetric[];
}

export interface StudentLifecycleProfile {
  studentId: string;
  studentName: string;
  programName: string;
  programCode: string;
  yearLevel: string;
  status: string;
  email?: string;
  contactNumber?: string;
  address?: string;
}

export interface LifecycleTimelineEvent {
  id: string;
  stage: LifecycleStageKey;
  sourceSystem: string;
  title: string;
  description: string | null;
  occurredAt: string;
}

export interface StudentLifecycle {
  profile: StudentLifecycleProfile;
  stages: LifecycleStageDetail[];
  currentStage: LifecycleStageKey | null;
  timeline: LifecycleTimelineEvent[];
}

export interface LifecycleStudentRow {
  id: string;
  name: string;
  email: string;
  program_code: string;
  program_name: string;
  year_level: string;
  status: string;
  contact_number: string | null;
  address: string | null;
  library_total_borrowed: number;
  library_current_borrowed: number;
  library_fines_balance: string | number;
  account_created_at: Date | null;
  account_status: string | null;
}

export interface LifecycleMembershipSummary {
  exists: boolean;
  createdAt: string | null;
  accountStatus: "Active" | "Suspended";
}

export interface LifecycleRequestSummary {
  submitted: number;
  approved: number;
  rejected: number;
  pending: number;
  reservations: number;
  latestActivityAt: string | null;
}

export interface LifecycleBorrowingSummary {
  totalBorrowed: number;
  currentBorrowed: number;
  overdueCount: number;
  firstBorrowedAt: string | null;
  lastBorrowedAt: string | null;
  topCategory: string | null;
}

export interface LifecycleFineSummary {
  unpaidCount: number;
  unpaidTotal: number;
  paidCount: number;
  paidTotal: number;
  balance: number;
  latestActivityAt: string | null;
}

export interface LifecycleData {
  student: LifecycleStudentRow;
  membership: LifecycleMembershipSummary;
  requests: LifecycleRequestSummary;
  borrowing: LifecycleBorrowingSummary;
  fines: LifecycleFineSummary;
  lastLibraryActivityAt: string | null;
}

type RequestSummaryRow = {
  submitted: number;
  approved: number;
  rejected: number;
  pending: number;
  latest_request_at: Date | null;
  reservations: number;
  latest_reservation_at: Date | null;
};

type LoanSummaryRow = {
  total_borrowed: number;
  current_borrowed: number;
  overdue_count: number;
  first_borrowed_at: Date | null;
  last_borrowed_at: Date | null;
  last_activity_at: Date | null;
};

type TopCategoryRow = {
  category: string | null;
  borrowed: number;
};

type FineSummaryRow = {
  unpaid_count: number;
  unpaid_total: string | number;
  paid_count: number;
  paid_total: string | number;
  latest_fine_at: Date | null;
  latest_paid_at: Date | null;
};

type LifecycleEventRow = {
  id: string;
  stage: string;
  source_system: string;
  title: string;
  description: string | null;
  occurred_at: Date;
};

// Live circulation lives in library_transactions. The legacy library_loans
// table is only folded in when a student has no transaction rows, so seeded or
// migrated history never double-counts the same loan.
const LOAN_HISTORY_CTE = `
  WITH loan_history AS (
    SELECT t.id,
           t.book_id,
           t.book_title,
           t.borrow_date::timestamptz AS borrowed_at,
           t.due_date::timestamptz AS due_at,
           t.return_date::timestamptz AS returned_at,
           t.status
      FROM library_transactions t
     WHERE t.student_id = $1
    UNION ALL
    SELECT 'legacy-loan-' || md5(
             l.student_id || ':' || l.book_id || ':' || COALESCE(l.borrowed_date::text, '')
           ),
           l.book_id,
           COALESCE(b.title, 'Library book'),
           l.borrowed_date::timestamptz,
           l.due_date::timestamptz,
           l.returned_date::timestamptz,
           l.status
      FROM library_loans l
      LEFT JOIN library_books b ON b.id = l.book_id
     WHERE l.student_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM library_transactions t WHERE t.student_id = $1
       )
  )
`;

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function toNumber(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function maxIso(...values: (string | null | undefined)[]): string | null {
  let latest: string | null = null;
  for (const value of values) {
    if (!value) continue;
    if (latest === null || value > latest) latest = value;
  }
  return latest;
}

export async function findStudentLifecycleData(
  studentId: string
): Promise<LifecycleData | null> {
  const [studentResult, requestResult, loanResult, categoryResult, fineResult] =
    await Promise.all([
      queryDb<LifecycleStudentRow>(
        `SELECT s.id,
                s.name,
                s.email,
                s.program_code,
                p.name AS program_name,
                s.year_level,
                s.status,
                s.contact_number,
                s.address,
                s.library_total_borrowed,
                s.library_current_borrowed,
                s.library_fines_balance,
                u.created_at AS account_created_at,
                u.status AS account_status
           FROM students s
           JOIN programs p ON p.code = s.program_code
           LEFT JOIN users u ON u.id = s.id AND u.role = 'Student'
          WHERE s.id = $1`,
        [studentId]
      ),
      queryDb<RequestSummaryRow>(
        `SELECT count(*)::int AS submitted,
                count(*) FILTER (WHERE status = 'Approved')::int AS approved,
                count(*) FILTER (WHERE status = 'Rejected')::int AS rejected,
                count(*) FILTER (WHERE status = 'Pending')::int AS pending,
                max(request_date) AS latest_request_at,
                (SELECT count(*)::int
                   FROM library_reservations r
                  WHERE r.student_id = $1) AS reservations,
                (SELECT max(r.reserved_date)
                   FROM library_reservations r
                  WHERE r.student_id = $1) AS latest_reservation_at
           FROM library_borrowing_requests
          WHERE student_id = $1`,
        [studentId]
      ),
      queryDb<LoanSummaryRow>(
        `${LOAN_HISTORY_CTE}
         SELECT count(*)::int AS total_borrowed,
                count(*) FILTER (WHERE returned_at IS NULL)::int AS current_borrowed,
                count(*) FILTER (
                  WHERE returned_at IS NULL
                    AND (status = 'Overdue' OR due_at < NOW())
                )::int AS overdue_count,
                min(borrowed_at) AS first_borrowed_at,
                max(borrowed_at) AS last_borrowed_at,
                greatest(max(borrowed_at), max(returned_at)) AS last_activity_at
           FROM loan_history`,
        [studentId]
      ),
      queryDb<TopCategoryRow>(
        `${LOAN_HISTORY_CTE}
         SELECT COALESCE(b.category, 'Uncategorized') AS category,
                count(*)::int AS borrowed
           FROM loan_history h
           LEFT JOIN library_books b ON b.id = h.book_id
          GROUP BY COALESCE(b.category, 'Uncategorized')
          ORDER BY borrowed DESC, category ASC
          LIMIT 1`,
        [studentId]
      ),
      queryDb<FineSummaryRow>(
        `SELECT count(*) FILTER (WHERE payment_status = 'Unpaid')::int AS unpaid_count,
                COALESCE(sum(fine_amount) FILTER (WHERE payment_status = 'Unpaid'), 0)::float
                  AS unpaid_total,
                (SELECT count(*)::int
                   FROM library_fine_payments p
                   JOIN library_fines pf ON pf.id = p.fine_id
                  WHERE pf.student_id = $1) AS paid_count,
                (SELECT COALESCE(sum(pf.fine_amount), 0)::float
                   FROM library_fine_payments p
                   JOIN library_fines pf ON pf.id = p.fine_id
                  WHERE pf.student_id = $1) AS paid_total,
                max(due_date) AS latest_fine_at,
                (SELECT max(p.paid_at)
                   FROM library_fine_payments p
                   JOIN library_fines pf ON pf.id = p.fine_id
                  WHERE pf.student_id = $1) AS latest_paid_at
           FROM library_fines
          WHERE student_id = $1`,
        [studentId]
      ),
    ]);

  const student = studentResult.rows[0];
  if (!student) return null;

  const requestRow = requestResult.rows[0];
  const loanRow = loanResult.rows[0];
  const fineRow = fineResult.rows[0];

  const submitted = toNumber(requestRow?.submitted);
  const approved = toNumber(requestRow?.approved);
  const rejected = toNumber(requestRow?.rejected);
  const pending = toNumber(requestRow?.pending);
  const reservations = toNumber(requestRow?.reservations);
  const latestRequestAt = toIso(requestRow?.latest_request_at);
  const latestReservationAt = toIso(requestRow?.latest_reservation_at);

  const summaryTotalBorrowed = toNumber(loanRow?.total_borrowed);
  const summaryCurrentBorrowed = toNumber(loanRow?.current_borrowed);
  const fallbackTotalBorrowed = toNumber(student.library_total_borrowed);
  const fallbackCurrentBorrowed = toNumber(student.library_current_borrowed);
  const totalBorrowed = summaryTotalBorrowed > 0 ? summaryTotalBorrowed : fallbackTotalBorrowed;
  const currentBorrowed =
    summaryCurrentBorrowed > 0 ? summaryCurrentBorrowed : fallbackCurrentBorrowed;

  const unpaidCount = toNumber(fineRow?.unpaid_count);
  const unpaidTotal = toNumber(fineRow?.unpaid_total);
  const paidCount = toNumber(fineRow?.paid_count);
  const paidTotal = toNumber(fineRow?.paid_total);
  const balance = Math.max(unpaidTotal, toNumber(student.library_fines_balance));

  const hasActivity =
    submitted > 0 ||
    reservations > 0 ||
    totalBorrowed > 0 ||
    unpaidCount > 0 ||
    paidCount > 0 ||
    balance > 0;
  const accountCreatedAt = toIso(student.account_created_at);
  const accountStatus =
    (student.account_status ?? (student.status === "Active" ? "Active" : "Inactive")) ===
    "Active"
      ? "Active"
      : "Suspended";

  const requests: LifecycleRequestSummary = {
    submitted,
    approved,
    rejected,
    pending,
    reservations,
    latestActivityAt: maxIso(latestRequestAt, latestReservationAt),
  };
  const borrowing: LifecycleBorrowingSummary = {
    totalBorrowed,
    currentBorrowed,
    overdueCount: toNumber(loanRow?.overdue_count),
    firstBorrowedAt: toIso(loanRow?.first_borrowed_at),
    lastBorrowedAt: toIso(loanRow?.last_borrowed_at),
    topCategory: categoryResult.rows[0]?.category ?? null,
  };
  const fines: LifecycleFineSummary = {
    unpaidCount,
    unpaidTotal,
    paidCount,
    paidTotal,
    balance,
    latestActivityAt: maxIso(toIso(fineRow?.latest_fine_at), toIso(fineRow?.latest_paid_at)),
  };

  return {
    student,
    membership: {
      exists: accountCreatedAt !== null || hasActivity,
      createdAt: accountCreatedAt,
      accountStatus,
    },
    requests,
    borrowing,
    fines,
    lastLibraryActivityAt: maxIso(
      requests.latestActivityAt,
      toIso(loanRow?.last_activity_at),
      borrowing.lastBorrowedAt,
      fines.latestActivityAt
    ),
  };
}

export async function findLifecycleEvents(
  studentId: string,
  limit = 100
): Promise<LifecycleTimelineEvent[]> {
  const result = await queryDb<LifecycleEventRow>(
    `${LOAN_HISTORY_CTE},
     timeline AS (
       SELECT 'loan-borrow-' || h.id AS id,
              'BORROWING'::text AS stage,
              'LIBRARY'::text AS source_system,
              'Library book borrowed'::text AS title,
              h.book_title || ' — due ' || to_char(h.due_at, 'YYYY-MM-DD') AS description,
              h.borrowed_at AS occurred_at
         FROM loan_history h
        WHERE h.borrowed_at IS NOT NULL
       UNION ALL
       SELECT 'loan-return-' || h.id,
              'BORROWING',
              'LIBRARY',
              'Library book returned',
              h.book_title,
              h.returned_at
         FROM loan_history h
        WHERE h.returned_at IS NOT NULL
       UNION ALL
       SELECT 'loan-overdue-' || h.id,
              'BORROWING',
              'LIBRARY',
              'Library loan overdue',
              h.book_title || ' — due ' || to_char(h.due_at, 'YYYY-MM-DD'),
              h.due_at
         FROM loan_history h
        WHERE h.returned_at IS NULL AND h.status = 'Overdue'
       UNION ALL
       SELECT 'request-submitted-' || r.id,
              'REQUESTS',
              'LIBRARY',
              'Borrowing request submitted',
              r.book_title || ' — ' || r.status,
              r.request_date
         FROM library_borrowing_requests r
        WHERE r.student_id = $1
       UNION ALL
       SELECT 'request-approved-' || r.id,
              'REQUESTS',
              'LIBRARY',
              'Borrowing request approved',
              r.book_title,
              COALESCE(r.reviewed_date, r.request_date)
         FROM library_borrowing_requests r
        WHERE r.student_id = $1 AND r.status IN ('Approved', 'Completed')
       UNION ALL
       SELECT 'request-rejected-' || r.id,
              'REQUESTS',
              'LIBRARY',
              'Borrowing request rejected',
              r.book_title || COALESCE(' — ' || r.rejection_reason, ''),
              COALESCE(r.reviewed_date, r.request_date)
         FROM library_borrowing_requests r
        WHERE r.student_id = $1 AND r.status = 'Rejected'
       UNION ALL
       SELECT 'reservation-' || r.id,
              'REQUESTS',
              'LIBRARY',
              'Library reservation ' || lower(r.status),
              r.book_title,
              r.reserved_date
         FROM library_reservations r
        WHERE r.student_id = $1
       UNION ALL
       SELECT 'fine-assessed-' || f.id,
              'FINES',
              'LIBRARY',
              'Library fine assessed',
              f.book_title || ' — PHP ' || to_char(f.fine_amount, 'FM999999990.00') ||
                ' (' || f.payment_status || ')',
              f.due_date
         FROM library_fines f
        WHERE f.student_id = $1
       UNION ALL
       SELECT 'fine-paid-' || p.fine_id,
              'FINES',
              'LIBRARY',
              'Library fine paid',
              f.book_title || ' — PHP ' || to_char(f.fine_amount, 'FM999999990.00'),
              p.paid_at
         FROM library_fine_payments p
         JOIN library_fines f ON f.id = p.fine_id
        WHERE f.student_id = $1
       UNION ALL
       SELECT e.id,
              'BORROWING',
              'LIBRARY',
              e.title,
              e.description,
              e.occurred_at
         FROM student_lifecycle_events e
        WHERE e.student_id = $1
          AND (e.stage = 'LIBRARY_ACTIVITY' OR e.source_system = 'LIBRARY')
     )
     SELECT id, stage, source_system, title, description, occurred_at
       FROM timeline
      ORDER BY occurred_at DESC, id DESC
      LIMIT $2`,
    [studentId, limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    stage: row.stage as LifecycleStageKey,
    sourceSystem: row.source_system,
    title: row.title,
    description: row.description,
    occurredAt: row.occurred_at.toISOString(),
  }));
}

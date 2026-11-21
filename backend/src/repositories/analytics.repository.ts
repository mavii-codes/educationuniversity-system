import { queryDb } from "../config/database";
import {
  ActivityFeedModel,
  CourseModel,
  LifecycleStageModel,
  ProgramModel,
  ReportModel,
} from "../models";
import { formatRelativeTime } from "../utils/format";

type ProgramRow = {
  id: string;
  code: string;
  name: string;
  department: string;
  enrolled_count: number;
  average_gpa: string | number;
  graduation_rate: string | number;
  withdrawal_rate: string | number;
  attendance_rate: string | number;
};

type CourseRow = {
  code: string;
  title: string;
  program_code: string;
  units: number;
  instructor: string;
  enrolled_students: number;
  lms_active_rate: string | number;
};

type ActivityRow = {
  id: string;
  title: string;
  detail: string;
  source: ActivityFeedModel["source"];
  status: ActivityFeedModel["status"];
  created_at: Date;
};

type ReportRow = {
  id: string;
  title: string;
  category: string;
  description: string;
  last_generated_label: string;
  frequency: string;
  source_systems: string[];
  file_size: string;
  highlights: ReportModel["highlights"];
  preview_headers: ReportModel["previewHeaders"];
  preview_rows: ReportModel["previewRows"];
};

function toProgram(row: ProgramRow): ProgramModel {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    department: row.department,
    enrolledCount: row.enrolled_count,
    averageGpa: Number(row.average_gpa),
    graduationRate: Number(row.graduation_rate),
    withdrawalRate: Number(row.withdrawal_rate),
    attendanceRate: Number(row.attendance_rate),
  };
}

export async function findPrograms(): Promise<ProgramModel[]> {
  const result = await queryDb<ProgramRow>(
    `SELECT id, code, name, department, enrolled_count, average_gpa,
            graduation_rate, withdrawal_rate, attendance_rate
       FROM programs
      ORDER BY sort_order, code`
  );
  return result.rows.map(toProgram);
}

export async function findCourses(): Promise<CourseModel[]> {
  const result = await queryDb<CourseRow>(
    `SELECT code, title, program_code, units, instructor, enrolled_students, lms_active_rate
       FROM courses
      ORDER BY code`
  );
  return result.rows.map((row) => ({
    code: row.code,
    title: row.title,
    programCode: row.program_code,
    units: row.units,
    enrolledStudents: row.enrolled_students,
    lmsActiveRate: Number(row.lms_active_rate),
    instructor: row.instructor,
  }));
}

export async function getSnapshot<T = Record<string, any>>(key: string): Promise<T | null> {
  const result = await queryDb<{ payload: T }>(
    `SELECT payload FROM analytics_snapshots WHERE key = $1`,
    [key]
  );
  return result.rows[0]?.payload ?? null;
}

export async function findRecentActivity(): Promise<ActivityFeedModel[]> {
  const result = await queryDb<ActivityRow>(
    `SELECT id, title, detail, source, status, created_at
       FROM activity_feed
      ORDER BY created_at DESC
      LIMIT 20`
  );
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    detail: row.detail,
    source: row.source,
    timestamp: formatRelativeTime(row.created_at),
    status: row.status,
  }));
}

type LifecycleOverviewRow = {
  registered_members: number;
  active_borrowers: number;
  items_currently_borrowed: number;
  lifetime_loans: number;
  unpaid_fine_count: number;
  outstanding_fines_total: string | number;
  overdue_items: number;
};

type LifecycleCohortRow = {
  total_members: number;
  no_activity: number;
  requests_pending: number;
  active_borrowers: number;
  outstanding_fines: number;
  restricted: number;
  items_currently_borrowed: number;
  lifetime_loans: number;
  overdue_items: number;
  outstanding_fines_total: string | number;
};

function percentOfMembers(count: number, total: number): string {
  if (total <= 0) return "No registered members";
  return `${((count / total) * 100).toFixed(1)}% of members`;
}

function pluralizeCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export async function findLifecycleOverviewStats(): Promise<
  { label: string; value: number; change: string; description: string }[]
> {
  const result = await queryDb<LifecycleOverviewRow>(
    `WITH member_accounts AS (
       SELECT s.id,
              (EXISTS (SELECT 1 FROM users u WHERE u.id = s.id AND u.role = 'Student')
               OR s.library_total_borrowed > 0
               OR EXISTS (SELECT 1 FROM library_transactions t WHERE t.student_id = s.id)
               OR EXISTS (SELECT 1 FROM library_borrowing_requests r WHERE r.student_id = s.id)
               OR EXISTS (SELECT 1 FROM library_reservations r WHERE r.student_id = s.id)
               OR EXISTS (SELECT 1 FROM library_fines f WHERE f.student_id = s.id)
              ) AS is_member
         FROM students s
     ),
     circulation AS (
       SELECT count(*) FILTER (WHERE return_date IS NULL)::int AS current_loans,
              count(*)::int AS lifetime_loans,
              count(*) FILTER (
                WHERE return_date IS NULL AND due_date < NOW()
              )::int AS overdue_loans
         FROM library_transactions
     ),
     fine_totals AS (
       SELECT count(*) FILTER (WHERE payment_status = 'Unpaid')::int AS unpaid_count,
              COALESCE(sum(fine_amount) FILTER (WHERE payment_status = 'Unpaid'), 0)::numeric
                AS unpaid_total
         FROM library_fines
     )
     SELECT (SELECT count(*) FROM member_accounts WHERE is_member)::int
              AS registered_members,
            (SELECT count(DISTINCT t.student_id)
               FROM library_transactions t
               JOIN member_accounts m ON m.id = t.student_id
              WHERE t.return_date IS NULL)::int AS active_borrowers,
            (SELECT current_loans FROM circulation) AS items_currently_borrowed,
            (SELECT lifetime_loans FROM circulation) AS lifetime_loans,
            (SELECT unpaid_count FROM fine_totals) AS unpaid_fine_count,
            (SELECT unpaid_total FROM fine_totals) AS outstanding_fines_total,
            (SELECT overdue_loans FROM circulation) AS overdue_items`
  );

  const row = result.rows[0];
  const registeredMembers = Number(row?.registered_members ?? 0);
  const activeBorrowers = Number(row?.active_borrowers ?? 0);
  const itemsCurrentlyBorrowed = Number(row?.items_currently_borrowed ?? 0);
  const unpaidFineCount = Number(row?.unpaid_fine_count ?? 0);
  const outstandingFines = Number(row?.outstanding_fines_total ?? 0);
  const overdueItems = Number(row?.overdue_items ?? 0);

  return [
    {
      label: "Registered Members",
      value: registeredMembers,
      change: pluralizeCount(activeBorrowers, "active borrower"),
      description: "Students with a library borrower account or circulation history",
    },
    {
      label: "Active Borrowers",
      value: activeBorrowers,
      change: `${itemsCurrentlyBorrowed} items currently on loan`,
      description: "Students currently holding one or more library items",
    },
    {
      label: "Outstanding Fines (PHP)",
      value: Math.round(outstandingFines),
      change: pluralizeCount(unpaidFineCount, "unpaid fine"),
      description: "Total unpaid library fine balance",
    },
    {
      label: "Overdue Items",
      value: overdueItems,
      change: "Loans past their due date",
      description: "Active library loans awaiting return",
    },
  ];
}

export async function findLifecycleStages(): Promise<LifecycleStageModel[]> {
  const result = await queryDb<LifecycleCohortRow>(
    `WITH student_flags AS (
       SELECT s.id,
              (EXISTS (SELECT 1 FROM users u WHERE u.id = s.id AND u.role = 'Student')
               OR s.library_total_borrowed > 0
               OR EXISTS (SELECT 1 FROM library_transactions t WHERE t.student_id = s.id)
               OR EXISTS (SELECT 1 FROM library_borrowing_requests r WHERE r.student_id = s.id)
               OR EXISTS (SELECT 1 FROM library_reservations r WHERE r.student_id = s.id)
               OR EXISTS (SELECT 1 FROM library_fines f WHERE f.student_id = s.id)
              ) AS is_member,
              (s.library_total_borrowed > 0
               OR EXISTS (SELECT 1 FROM library_transactions t WHERE t.student_id = s.id)
               OR EXISTS (SELECT 1 FROM library_borrowing_requests r WHERE r.student_id = s.id)
               OR EXISTS (SELECT 1 FROM library_reservations r WHERE r.student_id = s.id)
               OR EXISTS (SELECT 1 FROM library_fines f WHERE f.student_id = s.id)
              ) AS has_activity,
              EXISTS (SELECT 1 FROM library_borrowing_requests r
                       WHERE r.student_id = s.id AND r.status = 'Pending') AS has_pending_request,
              EXISTS (SELECT 1 FROM library_reservations r
                       WHERE r.student_id = s.id AND r.status IN ('Pending', 'Ready for Pickup'))
                AS has_active_reservation,
              EXISTS (SELECT 1 FROM library_transactions t
                       WHERE t.student_id = s.id AND t.return_date IS NULL) AS has_active_loan,
              EXISTS (SELECT 1 FROM library_transactions t
                       WHERE t.student_id = s.id AND t.return_date IS NULL
                         AND t.due_date < NOW()) AS has_overdue,
              (s.library_fines_balance > 0
               OR EXISTS (SELECT 1 FROM library_fines f
                           WHERE f.student_id = s.id AND f.payment_status = 'Unpaid'))
                AS has_unpaid_fines
         FROM students s
     ),
     circulation AS (
       SELECT count(*) FILTER (WHERE return_date IS NULL)::int AS items_currently_borrowed,
              count(*)::int AS lifetime_loans,
              count(*) FILTER (
                WHERE return_date IS NULL AND due_date < NOW()
              )::int AS overdue_items
         FROM library_transactions
     ),
     fine_totals AS (
       SELECT COALESCE(sum(fine_amount) FILTER (WHERE payment_status = 'Unpaid'), 0)::numeric
                AS outstanding_fines_total
         FROM library_fines
     )
     SELECT count(*) FILTER (WHERE is_member)::int AS total_members,
            count(*) FILTER (WHERE is_member AND NOT has_activity)::int AS no_activity,
            count(*) FILTER (
              WHERE has_pending_request OR has_active_reservation
            )::int AS requests_pending,
            count(*) FILTER (WHERE has_active_loan)::int AS active_borrowers,
            count(*) FILTER (WHERE has_unpaid_fines)::int AS outstanding_fines,
            count(*) FILTER (WHERE has_unpaid_fines OR has_overdue)::int AS restricted,
            (SELECT items_currently_borrowed FROM circulation) AS items_currently_borrowed,
            (SELECT lifetime_loans FROM circulation) AS lifetime_loans,
            (SELECT overdue_items FROM circulation) AS overdue_items,
            (SELECT outstanding_fines_total FROM fine_totals) AS outstanding_fines_total
       FROM student_flags`
  );

  const row = result.rows[0];
  const totalMembers = Number(row?.total_members ?? 0);
  const noActivity = Number(row?.no_activity ?? 0);
  const requestsPending = Number(row?.requests_pending ?? 0);
  const activeBorrowers = Number(row?.active_borrowers ?? 0);
  const outstandingFines = Number(row?.outstanding_fines ?? 0);
  const restricted = Number(row?.restricted ?? 0);
  const itemsCurrentlyBorrowed = Number(row?.items_currently_borrowed ?? 0);
  const lifetimeLoans = Number(row?.lifetime_loans ?? 0);
  const overdueItems = Number(row?.overdue_items ?? 0);
  const outstandingFinesTotal = Number(row?.outstanding_fines_total ?? 0);

  return [
    {
      key: "no-activity",
      title: "No Activity Yet",
      subtitle: "Library accounts without circulation, requests, reservations or fines",
      status: "upcoming",
      metricLabel: "Students Without Activity",
      metricCount: noActivity,
      conversionRate: percentOfMembers(noActivity, totalMembers),
      description:
        "Registered library accounts that have not borrowed, requested, reserved, or accrued fines.",
      sourceSystems: ["Library System"],
      keyMilestones: [
        "Borrower account provisioned from student records",
        "Library orientation and borrowing privileges enabled",
        "First catalog search, request, or reservation",
        "First circulation transaction recorded",
      ],
      insights: [
        { label: "Registered Members", value: String(totalMembers) },
        { label: "Awaiting First Activity", value: `${noActivity} Students` },
        { label: "Activation Policy", value: "Automatic" },
      ],
    },
    {
      key: "requests-pending",
      title: "Requests Pending",
      subtitle: "Borrowing requests and reservations awaiting library staff action",
      status: "current",
      metricLabel: "Students Awaiting Action",
      metricCount: requestsPending,
      conversionRate: percentOfMembers(requestsPending, totalMembers),
      description:
        "Students with pending borrowing requests or active reservations in the library queue.",
      sourceSystems: ["Library Circulation"],
      keyMilestones: [
        "Borrowing request submitted from the catalog",
        "Request validated against borrowing limits and availability",
        "Staff approval or rejection with review notes",
        "Reservation pickup window scheduled",
      ],
      insights: [
        { label: "Pending Queue", value: String(requestsPending) },
        { label: "Share of Members", value: percentOfMembers(requestsPending, totalMembers) },
        { label: "Target Turnaround", value: "2 Business Days" },
      ],
    },
    {
      key: "active-borrowers",
      title: "Active Borrowers",
      subtitle: "Students currently holding one or more library items",
      status: "current",
      metricLabel: "Active Borrowers",
      metricCount: activeBorrowers,
      conversionRate: percentOfMembers(activeBorrowers, totalMembers),
      description:
        "Students with open loans, including items borrowed within the current circulation window.",
      sourceSystems: ["Library Circulation"],
      keyMilestones: [
        "Approved request converted into a circulation loan",
        "Due date assigned and borrower notified",
        "Renewal or return processed at the circulation desk",
        "Loan closed with returned or overdue status",
      ],
      insights: [
        { label: "Items on Loan", value: String(itemsCurrentlyBorrowed) },
        { label: "Active Borrowers", value: String(activeBorrowers) },
      ],
    },
    {
      key: "outstanding-fines",
      title: "Outstanding Fines",
      subtitle: "Unpaid library fines and unsettled borrower balances",
      status: "current",
      metricLabel: "Students With Unpaid Fines",
      metricCount: outstandingFines,
      conversionRate: `PHP ${outstandingFinesTotal.toFixed(2)} outstanding`,
      description:
        "Students carrying an unpaid library fine balance from overdue or damaged items.",
      sourceSystems: ["Library Fines"],
      keyMilestones: [
        "Fine assessed automatically when an item becomes overdue",
        "Borrower notified of the outstanding balance",
        "Payment recorded against the fine at the circulation desk",
        "Account cleared and borrowing privileges restored",
      ],
      insights: [
        { label: "Unpaid Students", value: String(outstandingFines) },
        { label: "Outstanding Balance", value: `PHP ${outstandingFinesTotal.toFixed(2)}` },
        { label: "Overdue Items", value: String(overdueItems) },
      ],
    },
    {
      key: "restricted",
      title: "Restricted",
      subtitle: "Borrowers blocked by unpaid fines or overdue library items",
      status: "current",
      metricLabel: "Restricted Students",
      metricCount: restricted,
      conversionRate: percentOfMembers(restricted, totalMembers),
      description:
        "Students whose borrowing privileges are limited until fines are settled or overdue items are returned.",
      sourceSystems: ["Library Circulation", "Library Fines"],
      keyMilestones: [
        "Restriction triggered by unpaid fines or overdue loans",
        "Borrowing and reservation privileges suspended",
        "Clearance completed after payment or item return",
        "Borrowing privileges reinstated automatically",
      ],
      insights: [
        { label: "Restricted Students", value: String(restricted) },
        { label: "Overdue Items", value: String(overdueItems) },
        { label: "Unpaid Balance", value: `PHP ${outstandingFinesTotal.toFixed(2)}` },
      ],
    },
  ];
}

export async function findReports(): Promise<ReportModel[]> {
  const result = await queryDb<ReportRow>(
    `SELECT id, title, category, description, last_generated_label, frequency,
            source_systems, file_size, highlights, preview_headers, preview_rows
       FROM reports
      ORDER BY id`
  );
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    lastGenerated: row.last_generated_label,
    frequency: row.frequency,
    sourceSystems: row.source_systems,
    fileSize: row.file_size,
    highlights: row.highlights,
    previewHeaders: row.preview_headers,
    previewRows: row.preview_rows,
  }));
}

import { queryDb } from "../config/database";

export type LifecycleStageKey =
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
  admission_year: number | null;
  expected_graduation: number | null;
  contact_number: string | null;
  address: string | null;
  library_total_borrowed: number;
  library_current_borrowed: number;
  library_fines_balance: string | number;
}

export interface LifecycleEnrollmentSummary {
  courseCount: number;
  totalUnits: number;
  termCount: number;
  latestTerm: string | null;
}

export interface LifecycleLmsSummary {
  courseCount: number;
  averageCompletion: number;
  lastActiveAt: string | null;
}

export interface LifecycleAlumniMatch {
  graduationYear: number | null;
  graduationLabel: string | null;
}

export interface LifecycleData {
  student: LifecycleStudentRow;
  enrollment: LifecycleEnrollmentSummary;
  lms: LifecycleLmsSummary;
  loanCount: number;
  unpaidFineCount: number;
  unpaidFineTotal: number;
  alumni: LifecycleAlumniMatch | null;
}

type EnrollmentRow = {
  course_count: number;
  total_units: number;
  term_count: number;
  latest_term: string | null;
};

type LmsRow = {
  course_count: number;
  average_completion: number;
  last_active_at: Date | null;
};

type CountRow = {
  count: number;
};

type FineRow = {
  unpaid_count: number;
  unpaid_total: number;
};

type IntegratedAlumniRow = {
  student_id: string;
  full_name: string;
  batch: string;
  graduation_date: string | null;
};

type AlumniRecordRow = {
  student_id: string;
  name: string;
  graduation_year: number;
};

type LifecycleEventRow = {
  id: string;
  stage: LifecycleStageKey;
  source_system: string;
  title: string;
  description: string | null;
  occurred_at: Date;
};

export async function findStudentLifecycleData(
  studentId: string
): Promise<LifecycleData | null> {
  const [studentResult, enrollmentResult, lmsResult, loanResult, fineResult, integratedResult, alumniResult] =
    await Promise.all([
      queryDb<LifecycleStudentRow>(
        `SELECT s.id,
                s.name,
                s.email,
                s.program_code,
                p.name AS program_name,
                s.year_level,
                s.status,
                s.admission_year,
                s.expected_graduation,
                s.contact_number,
                s.address,
                s.library_total_borrowed,
                s.library_current_borrowed,
                s.library_fines_balance
           FROM students s
           JOIN programs p ON p.code = s.program_code
          WHERE s.id = $1`,
        [studentId]
      ),
      queryDb<EnrollmentRow>(
        `SELECT count(*)::int AS course_count,
                COALESCE(sum(units), 0)::int AS total_units,
                count(DISTINCT term)::int AS term_count,
                max(term) AS latest_term
           FROM enrollments
          WHERE student_id = $1`,
        [studentId]
      ),
      queryDb<LmsRow>(
        `SELECT count(*)::int AS course_count,
                COALESCE(avg(completion_rate), 0)::float AS average_completion,
                max(last_active_at) AS last_active_at
           FROM lms_course_progress
          WHERE student_id = $1`,
        [studentId]
      ),
      queryDb<CountRow>(
        `SELECT count(*)::int AS count
           FROM library_loans
          WHERE student_id = $1`,
        [studentId]
      ),
      queryDb<FineRow>(
        `SELECT count(*)::int AS unpaid_count,
                COALESCE(sum(fine_amount), 0)::float AS unpaid_total
           FROM library_fines
          WHERE student_id = $1
            AND payment_status = 'Unpaid'`,
        [studentId]
      ),
      queryDb<IntegratedAlumniRow>(
        `SELECT student_id, full_name, batch, graduation_date
           FROM integrated_alumni_crm
          WHERE student_id = $1
          ORDER BY batch DESC
          LIMIT 1`,
        [studentId]
      ),
      queryDb<AlumniRecordRow>(
        `SELECT student_id, name, graduation_year
           FROM alumni_records
          WHERE student_id = $1
          ORDER BY graduation_year DESC
          LIMIT 1`,
        [studentId]
      ),
    ]);

  const student = studentResult.rows[0];
  if (!student) return null;

  const enrollmentRow = enrollmentResult.rows[0];
  const lmsRow = lmsResult.rows[0];
  const fineRow = fineResult.rows[0];

  let alumni: LifecycleAlumniMatch | null = null;
  const integrated = integratedResult.rows[0];
  const record = alumniResult.rows[0];

  if (integrated) {
    const parsedYear = Number.parseInt(integrated.batch, 10);
    alumni = {
      graduationYear: Number.isFinite(parsedYear) ? parsedYear : null,
      graduationLabel: integrated.graduation_date,
    };
  } else if (record) {
    alumni = {
      graduationYear: record.graduation_year,
      graduationLabel: `Class of ${record.graduation_year}`,
    };
  }

  return {
    student,
    enrollment: {
      courseCount: Number(enrollmentRow?.course_count ?? 0),
      totalUnits: Number(enrollmentRow?.total_units ?? 0),
      termCount: Number(enrollmentRow?.term_count ?? 0),
      latestTerm: enrollmentRow?.latest_term ?? null,
    },
    lms: {
      courseCount: Number(lmsRow?.course_count ?? 0),
      averageCompletion: Number(lmsRow?.average_completion ?? 0),
      lastActiveAt: lmsRow?.last_active_at ? lmsRow.last_active_at.toISOString() : null,
    },
    loanCount: Number(loanResult.rows[0]?.count ?? 0),
    unpaidFineCount: Number(fineRow?.unpaid_count ?? 0),
    unpaidFineTotal: Number(fineRow?.unpaid_total ?? 0),
    alumni,
  };
}

export async function findLifecycleEvents(
  studentId: string,
  limit = 100
): Promise<LifecycleTimelineEvent[]> {
  const result = await queryDb<LifecycleEventRow>(
    `SELECT id, stage, source_system, title, description, occurred_at
       FROM student_lifecycle_events
      WHERE student_id = $1
      ORDER BY occurred_at DESC, id DESC
      LIMIT $2`,
    [studentId, limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    stage: row.stage,
    sourceSystem: row.source_system,
    title: row.title,
    description: row.description,
    occurredAt: row.occurred_at.toISOString(),
  }));
}

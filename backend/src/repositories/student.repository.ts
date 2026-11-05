import { queryDb } from "../config/database";
import {
  AttendanceMonthRecord,
  LibraryBookRecord,
  LmsCourseProgress,
  SemesterGpaHistory,
  StudentModel,
  StudentQuery,
  SubjectRecord,
} from "../models";
import { formatRelativeTime } from "../utils/format";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  program_code: string;
  program_name: string;
  department: string | null;
  year_level: string;
  status: StudentModel["status"];
  performance_score: string | number;
  gpa: string | number;
  attendance_rate: string | number;
  risk_level: StudentModel["riskLevel"];
  adviser: string | null;
  scholarship: string | null;
  admission_year: number | null;
  expected_graduation: number | null;
  contact_number: string | null;
  address: string | null;
  current_semester: string | null;
  units_earned: number;
  units_required: number;
  last_synced_at: Date | null;
  absences_count: number;
  excused_absences: number;
  late_count: number;
  lms_weekly_logins: number;
  lms_total_hours: string | number;
  lms_assignments_submitted: number;
  lms_assignments_total: number;
  lms_completion_rate: string | number;
  library_total_borrowed: number;
  library_returned_count: number;
  library_current_borrowed: number;
  library_fines_balance: string | number;
};

type SubjectRow = {
  student_id: string;
  course_code: string;
  course_title: string;
  units: number;
  midterm_grade: string | number | null;
  final_grade: string | number | null;
  gpa_equivalent: string | number | null;
  instructor: string | null;
  status: SubjectRecord["status"];
};

type HistoryRow = {
  student_id: string;
  semester: string;
  gpa: string | number;
  units_completed: number;
  standing: string;
};

type AttendanceRow = {
  student_id: string;
  month: string;
  rate: string | number;
  present_days: number;
  absent_days: number;
  late_days: number;
};

type LmsCourseRow = {
  student_id: string;
  course_code: string;
  course_title: string;
  completion_rate: string | number;
  assignments_completed: number;
  assignments_total: number;
  last_active_at: Date | null;
};

type WeeklyRow = {
  student_id: string;
  week_label: string;
  logins: number;
  submissions: number;
};

type LoanRow = {
  student_id: string;
  book_id: string;
  cover_url: string | null;
  title: string;
  author: string;
  category: string;
  borrowed_date: Date | null;
  due_date: Date | null;
  returned_date: Date | null;
  status: LibraryBookRecord["status"];
};

type SourceRow = {
  student_id: string;
  source_code: string;
};

const SELECT_STUDENTS = `
  SELECT
    s.id,
    s.name,
    s.email,
    s.program_code,
    p.name AS program_name,
    COALESCE(s.department, p.department) AS department,
    s.year_level,
    s.status,
    s.performance_score,
    s.gpa,
    s.attendance_rate,
    s.risk_level,
    s.adviser,
    s.scholarship,
    s.admission_year,
    s.expected_graduation,
    s.contact_number,
    s.address,
    s.current_semester,
    s.units_earned,
    s.units_required,
    s.last_synced_at,
    s.absences_count,
    s.excused_absences,
    s.late_count,
    s.lms_weekly_logins,
    s.lms_total_hours,
    s.lms_assignments_submitted,
    s.lms_assignments_total,
    s.lms_completion_rate,
    s.library_total_borrowed,
    s.library_returned_count,
    s.library_current_borrowed,
    s.library_fines_balance
  FROM students s
  JOIN programs p ON p.code = s.program_code
`;

function formatDateLabel(value: Date | null): string | undefined {
  if (!value) return undefined;
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function groupBy<T extends { student_id: string }>(rows: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const list = grouped.get(row.student_id);
    if (list) {
      list.push(row);
    } else {
      grouped.set(row.student_id, [row]);
    }
  }
  return grouped;
}

async function loadNested(ids: string[]): Promise<{
  subjects: Map<string, SubjectRecord[]>;
  history: Map<string, SemesterGpaHistory[]>;
  attendance: Map<string, AttendanceMonthRecord[]>;
  lmsCourses: Map<string, LmsCourseProgress[]>;
  weekly: Map<string, { week: string; logins: number; submissions: number }[]>;
  loans: Map<string, LibraryBookRecord[]>;
  sources: Map<string, string[]>;
}> {
  if (ids.length === 0) {
    return {
      subjects: new Map(),
      history: new Map(),
      attendance: new Map(),
      lmsCourses: new Map(),
      weekly: new Map(),
      loans: new Map(),
      sources: new Map(),
    };
  }

  const [subjectsResult, historyResult, attendanceResult, lmsResult, weeklyResult, loansResult, sourcesResult] =
    await Promise.all([
      queryDb<SubjectRow>(
        `SELECT student_id, course_code, course_title, units, midterm_grade, final_grade,
                gpa_equivalent, instructor, status
           FROM enrollments
          WHERE student_id = ANY($1::varchar[])
          ORDER BY course_code`,
        [ids]
      ),
      queryDb<HistoryRow>(
        `SELECT student_id, semester, gpa, units_completed, standing
           FROM semester_gpa_history
          WHERE student_id = ANY($1::varchar[])
          ORDER BY sort_order, semester`,
        [ids]
      ),
      queryDb<AttendanceRow>(
        `SELECT student_id, month, rate, present_days, absent_days, late_days
           FROM attendance_monthly
          WHERE student_id = ANY($1::varchar[])
          ORDER BY sort_order, month`,
        [ids]
      ),
      queryDb<LmsCourseRow>(
        `SELECT student_id, course_code, course_title, completion_rate,
                assignments_completed, assignments_total, last_active_at
           FROM lms_course_progress
          WHERE student_id = ANY($1::varchar[])
          ORDER BY course_code`,
        [ids]
      ),
      queryDb<WeeklyRow>(
        `SELECT student_id, week_label, logins, submissions
           FROM lms_weekly_engagement
          WHERE student_id = ANY($1::varchar[])
          ORDER BY week_label`,
        [ids]
      ),
      queryDb<LoanRow>(
        `SELECT l.student_id, l.book_id, b.cover_url, b.title, b.author, b.category,
                l.borrowed_date, l.due_date, l.returned_date, l.status
           FROM library_loans l
           JOIN library_books b ON b.id = l.book_id
          WHERE l.student_id = ANY($1::varchar[])
          ORDER BY l.borrowed_date DESC`,
        [ids]
      ),
      queryDb<SourceRow>(
        `SELECT student_id, source_code
           FROM student_source_sync
          WHERE student_id = ANY($1::varchar[])
          ORDER BY source_code`,
        [ids]
      ),
    ]);

  const subjects = new Map<string, SubjectRecord[]>();
  for (const row of subjectsResult.rows) {
    const list = subjects.get(row.student_id) ?? [];
    list.push({
      code: row.course_code,
      title: row.course_title,
      units: row.units,
      midtermGrade: Number(row.midterm_grade ?? 0),
      finalGrade: Number(row.final_grade ?? 0),
      gpaEquivalent: Number(row.gpa_equivalent ?? 0),
      instructor: row.instructor ?? "",
      status: row.status,
    });
    subjects.set(row.student_id, list);
  }

  const history = new Map<string, SemesterGpaHistory[]>();
  for (const row of historyResult.rows) {
    const list = history.get(row.student_id) ?? [];
    list.push({
      semester: row.semester,
      gpa: Number(row.gpa),
      unitsCompleted: row.units_completed,
      standing: row.standing,
    });
    history.set(row.student_id, list);
  }

  const attendance = new Map<string, AttendanceMonthRecord[]>();
  for (const row of attendanceResult.rows) {
    const list = attendance.get(row.student_id) ?? [];
    list.push({
      month: row.month,
      rate: Number(row.rate),
      presentDays: row.present_days,
      absentDays: row.absent_days,
      lateDays: row.late_days,
    });
    attendance.set(row.student_id, list);
  }

  const lmsCourses = new Map<string, LmsCourseProgress[]>();
  for (const row of lmsResult.rows) {
    const list = lmsCourses.get(row.student_id) ?? [];
    list.push({
      courseCode: row.course_code,
      courseTitle: row.course_title,
      completionRate: Number(row.completion_rate),
      assignmentsCompleted: row.assignments_completed,
      assignmentsTotal: row.assignments_total,
      lastActive: formatRelativeTime(row.last_active_at),
    });
    lmsCourses.set(row.student_id, list);
  }

  const weekly = new Map<string, { week: string; logins: number; submissions: number }[]>();
  for (const row of weeklyResult.rows) {
    const list = weekly.get(row.student_id) ?? [];
    list.push({ week: row.week_label, logins: row.logins, submissions: row.submissions });
    weekly.set(row.student_id, list);
  }

  const loans = new Map<string, LibraryBookRecord[]>();
  for (const row of loansResult.rows) {
    const list = loans.get(row.student_id) ?? [];
    list.push({
      id: row.book_id,
      cover_url: row.cover_url,
      title: row.title,
      author: row.author,
      category: row.category,
      borrowedDate: formatDateLabel(row.borrowed_date) ?? "",
      dueDate: formatDateLabel(row.due_date) ?? "",
      returnedDate: formatDateLabel(row.returned_date),
      status: row.status,
    });
    loans.set(row.student_id, list);
  }

  const sources = new Map<string, string[]>();
  for (const row of sourcesResult.rows) {
    const list = sources.get(row.student_id) ?? [];
    list.push(row.source_code);
    sources.set(row.student_id, list);
  }

  return { subjects, history, attendance, lmsCourses, weekly, loans, sources };
}

async function hydrate(rows: StudentRow[]): Promise<StudentModel[]> {
  const ids = rows.map((row) => row.id);
  const nested = await loadNested(ids);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    programCode: row.program_code,
    programName: row.program_name,
    department: row.department ?? "",
    yearLevel: row.year_level,
    status: row.status,
    performanceScore: Number(row.performance_score),
    gpa: Number(row.gpa),
    attendanceRate: Number(row.attendance_rate),
    riskLevel: row.risk_level,
    adviser: row.adviser ?? "",
    scholarship: row.scholarship ?? undefined,
    admissionYear: row.admission_year ?? 0,
    expectedGraduation: row.expected_graduation ?? 0,
    contactNumber: row.contact_number ?? "",
    address: row.address ?? "",
    syncedSystems: nested.sources.get(row.id) ?? [],
    lastSyncedAt: formatRelativeTime(row.last_synced_at),
    academicRecords: {
      currentSemester: row.current_semester ?? "",
      totalUnitsEarned: row.units_earned,
      totalUnitsRequired: row.units_required,
      subjects: nested.subjects.get(row.id) ?? [],
      history: nested.history.get(row.id) ?? [],
    },
    attendance: {
      overallPercentage: Number(row.attendance_rate),
      absencesCount: row.absences_count,
      excusedAbsences: row.excused_absences,
      lateCount: row.late_count,
      monthlyTrend: nested.attendance.get(row.id) ?? [],
    },
    lmsActivity: {
      weeklyLogins: row.lms_weekly_logins,
      totalHoursThisMonth: Number(row.lms_total_hours),
      assignmentsSubmitted: row.lms_assignments_submitted,
      assignmentsTotal: row.lms_assignments_total,
      overallCompletionRate: Number(row.lms_completion_rate),
      weeklyEngagement: nested.weekly.get(row.id) ?? [],
      courses: nested.lmsCourses.get(row.id) ?? [],
    },
    library: {
      totalBorrowedAllTime: row.library_total_borrowed,
      returnedBooksCount: row.library_returned_count,
      currentBorrowedCount: row.library_current_borrowed,
      finesBalance: Number(row.library_fines_balance),
      books: nested.loans.get(row.id) ?? [],
    },
  }));
}

export async function findAll(query: StudentQuery = {}): Promise<StudentModel[]> {
  const params: unknown[] = [];
  const where: string[] = [];

  if (query.search) {
    params.push(`%${query.search.trim()}%`);
    const placeholder = `$${params.length}`;
    where.push(
      `(s.name ILIKE ${placeholder} OR s.id ILIKE ${placeholder} OR p.name ILIKE ${placeholder})`
    );
  }
  if (query.program && query.program !== "All") {
    params.push(query.program);
    where.push(`s.program_code = $${params.length}`);
  }
  if (query.yearLevel && query.yearLevel !== "All") {
    params.push(query.yearLevel);
    where.push(`s.year_level = $${params.length}`);
  }
  if (query.status && query.status !== "All") {
    params.push(query.status);
    where.push(`s.status = $${params.length}`);
  }
  if (query.riskLevel && query.riskLevel !== "All") {
    params.push(query.riskLevel);
    where.push(`s.risk_level = $${params.length}`);
  }

  const result = await queryDb<StudentRow>(
    `${SELECT_STUDENTS}
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY s.name`,
    params
  );
  return hydrate(result.rows);
}

export async function findById(id: string): Promise<StudentModel | null> {
  const result = await queryDb<StudentRow>(`${SELECT_STUDENTS} WHERE s.id = $1`, [id]);
  const students = await hydrate(result.rows);
  return students[0] ?? null;
}

export async function findAtRisk(): Promise<StudentModel[]> {
  const result = await queryDb<StudentRow>(
    `${SELECT_STUDENTS}
      WHERE s.risk_level IN ('High', 'Medium')
      ORDER BY s.gpa ASC`
  );
  return hydrate(result.rows);
}

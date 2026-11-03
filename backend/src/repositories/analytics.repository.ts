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

type LifecycleStageRow = {
  key: string;
  title: string;
  subtitle: string;
  status: LifecycleStageModel["status"];
  metric_label: string;
  metric_count: number;
  conversion_rate: string;
  description: string;
  source_systems: string[];
  key_milestones: string[];
  insights: LifecycleStageModel["insights"];
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

export async function findLifecycleOverviewStats(): Promise<
  { label: string; value: number; change: string; description: string }[]
> {
  const result = await queryDb<{
    label: string;
    value: number;
    change: string;
    description: string;
  }>(
    `SELECT label, value, change, description
       FROM lifecycle_overview_stats
      ORDER BY sort_order, label`
  );
  return result.rows.map((row) => ({
    label: row.label,
    value: row.value,
    change: row.change,
    description: row.description,
  }));
}

export async function findLifecycleStages(): Promise<LifecycleStageModel[]> {
  const result = await queryDb<LifecycleStageRow>(
    `SELECT key, title, subtitle, status, metric_label, metric_count, conversion_rate,
            description, source_systems, key_milestones, insights
       FROM lifecycle_stages
      ORDER BY sort_order, key`
  );
  return result.rows.map((row) => ({
    key: row.key,
    title: row.title,
    subtitle: row.subtitle,
    status: row.status,
    metricLabel: row.metric_label,
    metricCount: row.metric_count,
    conversionRate: row.conversion_rate,
    description: row.description,
    sourceSystems: row.source_systems,
    keyMilestones: row.key_milestones,
    insights: row.insights,
  }));
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

import { env } from "../config/env";
import { seedDataset } from "../data/dataset";
import { StudentModel } from "../models";
import {
  LifecycleFineSummary,
  LifecycleMembershipSummary,
  LifecycleRequestSummary,
  LifecycleBorrowingSummary,
  LifecycleStageDetail,
  LifecycleStageKey,
  LifecycleTimelineEvent,
  StudentLifecycle,
  StudentLifecycleProfile,
  findLifecycleEvents,
  findStudentLifecycleData,
} from "../repositories/student-lifecycle.repository";
import { FerpaViewer, getMaskedStudent, isDirectoryOptOut } from "./ferpa.service";

const STAGE_LABELS: Record<
  Extract<
    LifecycleStageKey,
    | "ADMISSIONS"
    | "ENROLLMENT"
    | "LMS_ENGAGEMENT"
    | "LIBRARY_ACTIVITY"
    | "FINANCIAL_STANDING"
    | "ALUMNI"
  >,
  string
> = {
  ADMISSIONS: "Admissions",
  ENROLLMENT: "Enrollment",
  LMS_ENGAGEMENT: "LMS Engagement",
  LIBRARY_ACTIVITY: "Library Activity",
  FINANCIAL_STANDING: "Financial Standing",
  ALUMNI: "Alumni",
};

export interface LifecycleStageFacts {
  membership: LifecycleMembershipSummary;
  requests: LifecycleRequestSummary;
  borrowing: LifecycleBorrowingSummary;
  fines: LifecycleFineSummary;
  lastLibraryActivityAt: string | null;
}

function formatMoney(value: number): string {
  return `PHP ${value.toFixed(2)}`;
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function dateOnly(value: string | null | undefined): string | null {
  return value ? value.slice(0, 10) : null;
}

function displayDate(value: string | null): string {
  return dateOnly(value) ?? "—";
}

function getStudentAdmissionDate(student: StudentModel): string {
  return `${student.admissionYear}-06-01`;
}

function buildUniversityStages(student: StudentModel): LifecycleStageDetail[] {
  const subjects = student.academicRecords.subjects ?? [];
  const totalUnits = subjects.reduce((sum, subject) => sum + subject.units, 0);
  const admissionDate = getStudentAdmissionDate(student);
  const graduationDate = `${student.expectedGraduation}-06-01`;
  const enrollmentStatus: LifecycleStageDetail["status"] =
    student.status === "Active" || student.status === "On Leave"
      ? "Active"
      : student.status === "Graduated"
        ? "Completed"
        : "Upcoming";
  const alumniStatus: LifecycleStageDetail["status"] =
    student.status === "Graduated" ? "Alumni" : "Upcoming";

  return [
    {
      key: "ADMISSIONS",
      label: STAGE_LABELS.ADMISSIONS,
      status: student.admissionYear > 0 ? "Completed" : "Upcoming",
      date: admissionDate,
      summary: `Admissions recorded for ${student.programName} in ${student.admissionYear}.`,
      metrics: [
        { label: "Admission Year", value: String(student.admissionYear) },
        { label: "Program", value: student.programCode },
      ],
    },
    {
      key: "ENROLLMENT",
      label: STAGE_LABELS.ENROLLMENT,
      status: enrollmentStatus,
      date: student.status === "Graduated" ? graduationDate : admissionDate,
      summary:
        student.status === "Graduated"
          ? `Completed enrollment history for ${student.programCode}; student graduated in ${student.expectedGraduation}.`
          : `${subjects.length} current courses across ${totalUnits} units this term.`,
      metrics: [
        { label: "Courses", value: String(subjects.length) },
        { label: "Units", value: String(totalUnits) },
      ],
    },
    {
      key: "LMS_ENGAGEMENT",
      label: STAGE_LABELS.LMS_ENGAGEMENT,
      status: student.status === "Graduated" ? "Completed" : "Active",
      date: student.lmsActivity.courses[0]?.lastActive
        ? student.lmsActivity.courses[0].lastActive
        : admissionDate,
      summary: `${student.lmsActivity.overallCompletionRate}% LMS completion across ${student.lmsActivity.courses.length} active course records.`,
      metrics: [
        { label: "Completion", value: `${student.lmsActivity.overallCompletionRate}%` },
        { label: "Weekly Logins", value: String(student.lmsActivity.weeklyLogins) },
      ],
    },
    {
      key: "LIBRARY_ACTIVITY",
      label: STAGE_LABELS.LIBRARY_ACTIVITY,
      status: student.library.totalBorrowedAllTime > 0 || student.library.currentBorrowedCount > 0 ? "Completed" : "Upcoming",
      date: student.library.books.at(-1)?.borrowedDate
        ? `${student.library.books.at(-1)!.borrowedDate} 00:00:00 UTC`
        : admissionDate,
      summary:
        student.library.totalBorrowedAllTime > 0
          ? `${student.library.totalBorrowedAllTime} lifetime library loans recorded; ${student.library.currentBorrowedCount} currently active.`
          : "No library activity recorded yet.",
      metrics: [
        { label: "Lifetime Loans", value: String(student.library.totalBorrowedAllTime) },
        { label: "Currently Borrowed", value: String(student.library.currentBorrowedCount) },
        { label: "Fines", value: formatMoney(student.library.finesBalance) },
      ],
    },
    {
      key: "FINANCIAL_STANDING",
      label: STAGE_LABELS.FINANCIAL_STANDING,
      status: student.library.finesBalance > 0 ? "Active" : "Completed",
      date: admissionDate,
      summary:
        student.library.finesBalance > 0
          ? `Outstanding balance ${formatMoney(student.library.finesBalance)} requires settlement.`
          : "Financial standing is clear with no outstanding library balance.",
      metrics: [
        { label: "Outstanding Balance", value: formatMoney(student.library.finesBalance) },
        { label: "Risk Level", value: student.riskLevel },
      ],
    },
    {
      key: "ALUMNI",
      label: STAGE_LABELS.ALUMNI,
      status: alumniStatus,
      date: graduationDate,
      summary:
        student.status === "Graduated"
          ? `Graduated in ${student.expectedGraduation}; alumni record matched to the graduate list.`
          : `Expected graduation year ${student.expectedGraduation}; alumni stage remains upcoming.`,
      metrics: [
        { label: "Graduation Year", value: String(student.expectedGraduation) },
        { label: "Status", value: student.status === "Graduated" ? "Alumni" : "Expected" },
      ],
    },
  ];
}

export function buildStages(
  input: LifecycleStageFacts | StudentModel
): LifecycleStageDetail[] {
  if ("id" in input && "programName" in input && "academicRecords" in input) {
    return buildUniversityStages(input as StudentModel);
  }

  const facts = input as LifecycleStageFacts;
  const { membership, requests, borrowing, fines, lastLibraryActivityAt } = facts;

  const hasRequests = requests.submitted > 0 || requests.reservations > 0;
  const hasLoans = borrowing.totalBorrowed > 0 || borrowing.currentBorrowed > 0;
  const finesOutstanding =
    fines.unpaidCount > 0 || fines.unpaidTotal > 0 || fines.balance > 0;
  const hasOverdue = borrowing.overdueCount > 0;
  const hasFineHistory =
    finesOutstanding || fines.paidCount > 0 || fines.paidTotal > 0;
  const hasActivity =
    hasRequests ||
    hasLoans ||
    hasFineHistory ||
    lastLibraryActivityAt !== null;
  const restricted = finesOutstanding || hasOverdue;
  const membershipExists = membership.exists || membership.createdAt !== null;

  return [
    {
      key: "MEMBERSHIP",
      label: "Library Membership",
      status: membershipExists ? "Completed" : "Upcoming",
      date: dateOnly(membership.createdAt),
      summary: membershipExists
        ? `Borrower account created${
            membership.createdAt ? ` on ${displayDate(membership.createdAt)}` : ""
          }; account status ${membership.accountStatus}.`
        : "No library borrower account on file.",
      metrics: [
        {
          label: "Account Status",
          value: membershipExists ? membership.accountStatus : "—",
        },
        { label: "Member Since", value: displayDate(membership.createdAt) },
      ],
    },
    {
      key: "REQUESTS",
      label: "Borrowing Requests",
      status: requests.pending > 0 ? "Active" : hasRequests ? "Completed" : "Upcoming",
      date: dateOnly(requests.latestActivityAt),
      summary: hasRequests
        ? `${pluralize(requests.submitted, "borrowing request")} (${requests.pending} pending, ${requests.approved} approved, ${requests.rejected} rejected); ${pluralize(requests.reservations, "reservation")}.`
        : "No borrowing requests or reservations yet.",
      metrics: [
        { label: "Requests", value: String(requests.submitted) },
        { label: "Pending", value: String(requests.pending) },
        { label: "Approved", value: String(requests.approved) },
        { label: "Rejected", value: String(requests.rejected) },
        { label: "Reservations", value: String(requests.reservations) },
      ],
    },
    {
      key: "BORROWING",
      label: "Borrowing Activity",
      status: borrowing.currentBorrowed > 0 ? "Active" : hasLoans ? "Completed" : "Upcoming",
      date: dateOnly(borrowing.lastBorrowedAt),
      summary: hasLoans
        ? `${pluralize(borrowing.totalBorrowed, "lifetime loan")}; ${borrowing.currentBorrowed} currently borrowed${borrowing.overdueCount > 0 ? `, ${pluralize(borrowing.overdueCount, "overdue item")}` : ""}.`
        : "No library loans recorded.",
      metrics: [
        { label: "Lifetime Loans", value: String(borrowing.totalBorrowed) },
        { label: "Currently Borrowed", value: String(borrowing.currentBorrowed) },
        { label: "Overdue Items", value: String(borrowing.overdueCount) },
        { label: "First Borrow", value: displayDate(borrowing.firstBorrowedAt) },
        { label: "Last Borrow", value: displayDate(borrowing.lastBorrowedAt) },
        { label: "Top Category", value: borrowing.topCategory ?? "—" },
      ],
    },
    {
      key: "FINES",
      label: "Fines & Payments",
      status: finesOutstanding || hasOverdue ? "Active" : hasFineHistory ? "Completed" : "Upcoming",
      date: dateOnly(fines.latestActivityAt),
      summary: finesOutstanding
        ? `Alert: ${formatMoney(Math.max(fines.unpaidTotal, fines.balance))} outstanding in unpaid library fines (${pluralize(fines.unpaidCount, "fine")}).`
        : hasOverdue
          ? `Restricted: ${pluralize(borrowing.overdueCount, "overdue item")} awaiting return; no unpaid fines.`
          : hasFineHistory
            ? `No outstanding fines; ${formatMoney(fines.paidTotal)} settled across ${pluralize(fines.paidCount, "payment")}.`
            : "No library fines on record.",
      metrics: [
        {
          label: "Outstanding Balance",
          value: formatMoney(Math.max(fines.unpaidTotal, fines.balance)),
        },
        { label: "Unpaid Fines", value: String(fines.unpaidCount) },
        { label: "Paid Fines", value: String(fines.paidCount) },
        { label: "Paid Total", value: formatMoney(fines.paidTotal) },
      ],
    },
    {
      key: "STANDING",
      label: "Current Standing",
      status: !hasActivity ? "Upcoming" : restricted ? "Active" : "Completed",
      date: dateOnly(lastLibraryActivityAt),
      summary: restricted
        ? `Restricted — ${formatMoney(Math.max(fines.unpaidTotal, fines.balance))} in unpaid fines and ${pluralize(borrowing.overdueCount, "overdue item")}.`
        : hasActivity
          ? `Good Standing — no outstanding fines or overdue items; last library activity ${displayDate(lastLibraryActivityAt)}.`
          : "No library activity recorded yet.",
      metrics: [
        {
          label: "Standing",
          value: !hasActivity ? "Not Started" : restricted ? "Restricted" : "Good Standing",
        },
        { label: "Last Library Activity", value: displayDate(lastLibraryActivityAt) },
        { label: "Overdue Items", value: String(borrowing.overdueCount) },
        {
          label: "Outstanding Balance",
          value: formatMoney(Math.max(fines.unpaidTotal, fines.balance)),
        },
      ],
    },
  ] as LifecycleStageDetail[];
}

export function resolveCurrentStage(
  stages: LifecycleStageDetail[]
): LifecycleStageKey | null {
  const byKey = (key: LifecycleStageKey) => stages.find((stage) => stage.key === key);

  if (byKey("ALUMNI")?.status === "Alumni") return "ALUMNI";
  if (byKey("ENROLLMENT")?.status === "Active") return "ENROLLMENT";
  if (byKey("LMS_ENGAGEMENT")?.status === "Active") return "LMS_ENGAGEMENT";
  if (byKey("LIBRARY_ACTIVITY")?.status === "Completed") return "LIBRARY_ACTIVITY";
  if (byKey("FINANCIAL_STANDING")?.status === "Active") return "FINANCIAL_STANDING";
  if (byKey("ADMISSIONS")?.status === "Completed") return "ADMISSIONS";
  return null;
}

function parseSeedDate(value: string | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(`${value} 00:00:00 UTC`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseLooseDate(value: string | undefined): string | null {
  if (!value) return null;
  const cleaned = value.replace(/^(Completed|Updated|Active|Due|Borrowed|Returned|Graduated)\s+/i, "").trim();
  const parsed = Date.parse(cleaned);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function latestIso(...values: (string | null | undefined)[]): string | null {
  let latest: string | null = null;
  for (const value of values) {
    if (!value) continue;
    if (latest === null || value > latest) latest = value;
  }
  return latest;
}

function addDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * 24 * 60 * 60 * 1000).toISOString();
}

function topCategoryOf(student: StudentModel): string | null {
  const counts = new Map<string, number>();
  for (const book of student.library.books) {
    if (!book.category) continue;
    counts.set(book.category, (counts.get(book.category) ?? 0) + 1);
  }

  let top: string | null = null;
  let topCount = 0;
  for (const [category, count] of counts) {
    if (count > topCount || (count === topCount && top !== null && category < top)) {
      top = category;
      topCount = count;
    }
  }
  return top;
}

export function buildMockFacts(student: StudentModel): LifecycleStageFacts {
  const balance = student.library.finesBalance;
  return {
    membership: {
      exists: true,
      createdAt: `${student.admissionYear}-06-01T00:00:00.000Z`,
      accountStatus: student.status === "Active" || student.status === "On Leave" ? "Active" : "Suspended",
    },
    requests: {
      submitted: student.library.totalBorrowedAllTime,
      approved: student.library.totalBorrowedAllTime,
      rejected: 0,
      pending: 0,
      reservations: 0,
      latestActivityAt: `${student.admissionYear}-06-01T00:00:00.000Z`,
    },
    borrowing: {
      totalBorrowed: student.library.totalBorrowedAllTime,
      currentBorrowed: student.library.currentBorrowedCount,
      overdueCount: student.library.books.filter((book) => book.status === "Borrowed").length,
      firstBorrowedAt: student.library.books[0]?.borrowedDate ? parseSeedDate(student.library.books[0].borrowedDate) : null,
      lastBorrowedAt: student.library.books.at(-1)?.borrowedDate ? parseSeedDate(student.library.books.at(-1)!.borrowedDate) : null,
      topCategory: topCategoryOf(student),
    },
    fines: {
      unpaidCount: balance > 0 ? 1 : 0,
      unpaidTotal: balance,
      paidCount: 0,
      paidTotal: 0,
      balance,
      latestActivityAt: student.library.books[0]?.dueDate ? parseSeedDate(student.library.books[0].dueDate) : null,
    },
    lastLibraryActivityAt: `${student.expectedGraduation}-06-01T00:00:00.000Z`,
  };
}

export function buildMockTimeline(student: StudentModel): LifecycleTimelineEvent[] {
  const admissionsAt = `${student.admissionYear}-06-01T00:00:00.000Z`;
  const enrollmentAt = `${student.admissionYear + 1}-08-15T00:00:00.000Z`;
  const lmsAt =
    student.lmsActivity.courses[0]?.lastActive
      ? parseLooseDate(student.lmsActivity.courses[0].lastActive) ?? enrollmentAt
      : enrollmentAt;
  const libraryAt =
    student.library.books.at(-1)?.borrowedDate
      ? parseSeedDate(student.library.books.at(-1)!.borrowedDate) ?? admissionsAt
      : admissionsAt;
  const financialAt = student.library.finesBalance > 0 ? libraryAt : admissionsAt;
  const graduationAt = `${student.expectedGraduation}-06-01T00:00:00.000Z`;

  const events: LifecycleTimelineEvent[] = [
    {
      id: `${student.id}-timeline-admissions`,
      stage: "ADMISSIONS",
      sourceSystem: "SIS",
      title: "Admission recorded",
      description: `${student.name} admitted to ${student.programName}.`,
      occurredAt: admissionsAt,
    },
    {
      id: `${student.id}-timeline-enrollment`,
      stage: "ENROLLMENT",
      sourceSystem: "SIS",
      title: "Enrollment confirmed",
      description: `${student.academicRecords.subjects.length} active courses in progress.`,
      occurredAt: enrollmentAt,
    },
    {
      id: `${student.id}-timeline-lms`,
      stage: "LMS_ENGAGEMENT",
      sourceSystem: "LMS",
      title: "LMS engagement synced",
      description: `${student.lmsActivity.overallCompletionRate}% completion across ${student.lmsActivity.courses.length} course records.`,
      occurredAt: lmsAt,
    },
    {
      id: `${student.id}-timeline-library`,
      stage: "LIBRARY_ACTIVITY",
      sourceSystem: "LIBRARY",
      title: "Library activity synced",
      description: `${student.library.totalBorrowedAllTime} lifetime library entries matched to the student record.`,
      occurredAt: libraryAt,
    },
    {
      id: `${student.id}-timeline-financial`,
      stage: "FINANCIAL_STANDING",
      sourceSystem: "SIS",
      title: "Financial standing updated",
      description:
        student.library.finesBalance > 0
          ? `Outstanding balance ${formatMoney(student.library.finesBalance)}.`
          : "No outstanding balance recorded.",
      occurredAt: financialAt,
    },
    {
      id: `${student.id}-timeline-alumni`,
      stage: "ALUMNI",
      sourceSystem: "ALUMNI",
      title:
        student.status === "Graduated" ? "Graduation recorded" : "Expected graduation",
      description:
        student.status === "Graduated"
          ? `${student.name} was recorded as a graduate in ${student.expectedGraduation}.`
          : `Expected graduation year is ${student.expectedGraduation}.`,
      occurredAt: graduationAt,
    },
  ];

  return events.sort(
    (a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id)
  );
}

function maskProfile(
  profile: StudentLifecycleProfile,
  viewer: FerpaViewer,
  directoryOptOut: boolean
): StudentLifecycleProfile {
  return getMaskedStudent(profile, { ...viewer, directoryOptOut });
}

export class StudentLifecycleService {
  async getStudentLifecycle(
    studentId: string,
    viewer: FerpaViewer
  ): Promise<StudentLifecycle | null> {
    if (env.db.enabled) {
      const data = await findStudentLifecycleData(studentId);
      if (!data) return null;

      const [timeline, directoryOptOut] = await Promise.all([
        findLifecycleEvents(studentId, 100),
        isDirectoryOptOut(studentId),
      ]);

      const stages = buildStages({
        membership: data.membership,
        requests: data.requests,
        borrowing: data.borrowing,
        fines: data.fines,
        lastLibraryActivityAt: data.lastLibraryActivityAt,
      });

      const profile: StudentLifecycleProfile = {
        studentId: data.student.id,
        studentName: data.student.name,
        programName: data.student.program_name,
        programCode: data.student.program_code,
        yearLevel: data.student.year_level,
        status: data.student.status,
        email: data.student.email,
        contactNumber: data.student.contact_number ?? "",
        address: data.student.address ?? "",
      };

      return {
        profile: maskProfile(profile, viewer, directoryOptOut),
        stages,
        currentStage: resolveCurrentStage(stages),
        timeline,
      };
    }

    const student = seedDataset.students.find((item) => item.id === studentId);
    if (!student) return null;

    const stages = buildStages(student);

    const profile: StudentLifecycleProfile = {
      studentId: student.id,
      studentName: student.name,
      programName: student.programName,
      programCode: student.programCode,
      yearLevel: student.yearLevel,
      status: student.status,
      email: student.email,
      contactNumber: student.contactNumber,
      address: student.address,
    };

    const directoryOptOut = await isDirectoryOptOut(studentId);

    return {
      profile: maskProfile(profile, viewer, directoryOptOut),
      stages,
      currentStage: resolveCurrentStage(stages),
      timeline: buildMockTimeline(student),
    };
  }
}

export const studentLifecycleService = new StudentLifecycleService();

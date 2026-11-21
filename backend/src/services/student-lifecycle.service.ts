import { env } from "../config/env";
import { seedDataset } from "../data/dataset";
import { StudentModel } from "../models";
import {
  LifecycleBorrowingSummary,
  LifecycleFineSummary,
  LifecycleMembershipSummary,
  LifecycleRequestSummary,
  LifecycleStageDetail,
  LifecycleStageKey,
  LifecycleTimelineEvent,
  StudentLifecycle,
  StudentLifecycleProfile,
  findLifecycleEvents,
  findStudentLifecycleData,
} from "../repositories/student-lifecycle.repository";
import { FerpaViewer, getMaskedStudent, isDirectoryOptOut } from "./ferpa.service";

const STAGE_LABELS: Record<LifecycleStageKey, string> = {
  MEMBERSHIP: "Library Membership",
  REQUESTS: "Borrowing Requests",
  BORROWING: "Borrowing Activity",
  FINES: "Fines & Payments",
  STANDING: "Current Standing",
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

export function buildStages(facts: LifecycleStageFacts): LifecycleStageDetail[] {
  const { membership, requests, borrowing, fines, lastLibraryActivityAt } = facts;

  const hasRequests = requests.submitted > 0 || requests.reservations > 0;
  const hasLoans = borrowing.totalBorrowed > 0 || borrowing.currentBorrowed > 0;
  const finesOutstanding =
    fines.unpaidCount > 0 || fines.unpaidTotal > 0 || fines.balance > 0;
  const hasOverdue = borrowing.overdueCount > 0;
  const hasFineHistory =
    finesOutstanding || fines.paidCount > 0 || fines.paidTotal > 0;
  const hasActivity =
    hasRequests || hasLoans || hasFineHistory || lastLibraryActivityAt !== null;
  const restricted = finesOutstanding || hasOverdue;
  const membershipExists = membership.exists || membership.createdAt !== null;

  const stages: LifecycleStageDetail[] = [
    {
      key: "MEMBERSHIP",
      label: STAGE_LABELS.MEMBERSHIP,
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
      label: STAGE_LABELS.REQUESTS,
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
      label: STAGE_LABELS.BORROWING,
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
      label: STAGE_LABELS.FINES,
      status:
        finesOutstanding || hasOverdue
          ? "Active"
          : hasFineHistory
            ? "Completed"
            : "Upcoming",
      date: dateOnly(fines.latestActivityAt),
      summary: finesOutstanding
        ? `Alert: ${formatMoney(
            Math.max(fines.unpaidTotal, fines.balance)
          )} outstanding in unpaid library fines (${pluralize(fines.unpaidCount, "fine")}).`
        : hasOverdue
          ? `Restricted: ${pluralize(
              borrowing.overdueCount,
              "overdue item"
            )} awaiting return; no unpaid fines.`
          : hasFineHistory
            ? `No outstanding fines; ${formatMoney(
                fines.paidTotal
              )} settled across ${pluralize(fines.paidCount, "payment")}.`
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
      label: STAGE_LABELS.STANDING,
      status: !hasActivity ? "Upcoming" : restricted ? "Active" : "Completed",
      date: dateOnly(lastLibraryActivityAt),
      summary: restricted
        ? `Restricted — ${formatMoney(
            Math.max(fines.unpaidTotal, fines.balance)
          )} in unpaid fines and ${pluralize(borrowing.overdueCount, "overdue item")}.`
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
  ];

  return stages.filter((stage) => stage.key !== "BORROWING");
}

export function resolveCurrentStage(
  stages: LifecycleStageDetail[]
): LifecycleStageKey | null {
  const byKey = (key: LifecycleStageKey) => stages.find((stage) => stage.key === key);

  if (byKey("FINES")?.status === "Active") return "FINES";
  if (byKey("BORROWING")?.status === "Active") return "BORROWING";
  if (byKey("REQUESTS")?.status === "Active") return "REQUESTS";

  const standing = byKey("STANDING");
  if (standing && standing.status !== "Upcoming") return "STANDING";

  if (byKey("MEMBERSHIP")?.status === "Completed") return "MEMBERSHIP";
  return null;
}

function parseSeedDate(value: string | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(`${value} 00:00:00 UTC`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
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
  const books = student.library.books;
  const borrowedDates = books
    .map((book) => parseSeedDate(book.borrowedDate))
    .filter((value): value is string => value !== null)
    .sort();
  const returnedDates = books
    .map((book) => parseSeedDate(book.returnedDate))
    .filter((value): value is string => value !== null)
    .sort();

  const membershipCreatedAt =
    student.admissionYear > 0
      ? `${student.admissionYear}-06-01T08:00:00.000Z`
      : null;
  const totalBorrowed = student.library.totalBorrowedAllTime;
  const currentBorrowed = student.library.currentBorrowedCount;
  const balance = student.library.finesBalance;
  const overdueCount = books.filter(
    (book) => (book.status as string) === "Overdue"
  ).length;

  const lastBorrowedAt = borrowedDates.at(-1) ?? null;
  const latestBookActivity = latestIso(...borrowedDates, ...returnedDates);
  const finesLatestAt =
    balance > 0
      ? latestIso(...books.map((book) => parseSeedDate(book.dueDate)))
      : null;

  return {
    membership: {
      exists:
        membershipCreatedAt !== null ||
        totalBorrowed > 0 ||
        books.length > 0 ||
        balance > 0,
      createdAt: membershipCreatedAt,
      accountStatus:
        student.status === "Active" || student.status === "On Leave"
          ? "Active"
          : "Suspended",
    },
    requests: {
      submitted: totalBorrowed,
      approved: totalBorrowed,
      rejected: 0,
      pending: 0,
      reservations: 0,
      latestActivityAt: latestBookActivity,
    },
    borrowing: {
      totalBorrowed,
      currentBorrowed,
      overdueCount,
      firstBorrowedAt: borrowedDates[0] ?? null,
      lastBorrowedAt,
      topCategory: topCategoryOf(student),
    },
    fines: {
      unpaidCount: balance > 0 ? 1 : 0,
      unpaidTotal: balance,
      paidCount: 0,
      paidTotal: 0,
      balance,
      latestActivityAt: finesLatestAt,
    },
    lastLibraryActivityAt: latestIso(latestBookActivity, finesLatestAt),
  };
}

export function buildMockTimeline(student: StudentModel): LifecycleTimelineEvent[] {
  const facts = buildMockFacts(student);
  const membershipAt =
    facts.membership.createdAt ??
    `${student.admissionYear > 0 ? student.admissionYear : 2024}-06-01T08:00:00.000Z`;
  const books = student.library.books;

  const events: LifecycleTimelineEvent[] = [
    {
      id: `${student.id}-timeline-membership`,
      stage: "MEMBERSHIP",
      sourceSystem: "LIBRARY",
      title: "Library membership activated",
      description: `Borrower account created; account status ${facts.membership.accountStatus}.`,
      occurredAt: membershipAt,
    },
  ];

  for (const book of books) {
    const borrowedAt = parseSeedDate(book.borrowedDate) ?? membershipAt;
    events.push({
      id: `${student.id}-timeline-request-${book.id}`,
      stage: "REQUESTS",
      sourceSystem: "LIBRARY",
      title: "Borrowing request approved",
      description: `${book.title} — ${book.category}.`,
      occurredAt: addDays(borrowedAt, -3),
    });
    events.push({
      id: `${student.id}-timeline-borrow-${book.id}`,
      stage: "BORROWING",
      sourceSystem: "LIBRARY",
      title: "Library book borrowed",
      description: `${book.title} — due ${book.dueDate}.`,
      occurredAt: borrowedAt,
    });

    const returnedAt = parseSeedDate(book.returnedDate);
    if (returnedAt) {
      events.push({
        id: `${student.id}-timeline-return-${book.id}`,
        stage: "BORROWING",
        sourceSystem: "LIBRARY",
        title: "Library book returned",
        description: `${book.title} — returned to circulation.`,
        occurredAt: returnedAt,
      });
    }
  }

  if (books.length === 0) {
    events.push({
      id: `${student.id}-timeline-request-verified`,
      stage: "REQUESTS",
      sourceSystem: "LIBRARY",
      title: "Borrowing privileges verified",
      description: "Library account cleared for borrowing requests and reservations.",
      occurredAt: addDays(membershipAt, 7),
    });
    events.push({
      id: `${student.id}-timeline-borrowing-sync`,
      stage: "BORROWING",
      sourceSystem: "LIBRARY",
      title: "Borrowing history synced",
      description: `${pluralize(
        facts.borrowing.totalBorrowed,
        "lifetime loan"
      )}; ${pluralize(student.library.returnedBooksCount, "returned item")} recorded.`,
      occurredAt: addDays(membershipAt, 30),
    });
  }

  if (facts.fines.balance > 0) {
    events.push({
      id: `${student.id}-timeline-fine`,
      stage: "FINES",
      sourceSystem: "LIBRARY",
      title: "Library fine assessed",
      description: `Outstanding balance ${formatMoney(facts.fines.balance)}.`,
      occurredAt:
        latestIso(...books.map((book) => parseSeedDate(book.dueDate))) ??
        membershipAt,
    });
  }

  const latestEventAt =
    latestIso(...events.map((event) => event.occurredAt)) ?? membershipAt;
  events.push({
    id: `${student.id}-timeline-standing`,
    stage: "STANDING",
    sourceSystem: "LIBRARY",
    title: "Library standing reviewed",
    description:
      facts.fines.balance > 0 || facts.borrowing.overdueCount > 0
        ? `Restricted — ${formatMoney(
            facts.fines.balance
          )} in unpaid fines and ${pluralize(
            facts.borrowing.overdueCount,
            "overdue item"
          )}.`
        : "Good Standing — no outstanding fines or overdue items.",
    occurredAt: latestEventAt,
  });

  return events
    .sort(
      (a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id)
    )
    .slice(0, 6);
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

    const stages = buildStages(buildMockFacts(student));

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

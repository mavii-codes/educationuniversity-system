import { env } from "../config/env";
import { seedDataset } from "../data/dataset";
import { StudentModel } from "../models";
import {
  LifecycleAlumniMatch,
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
  ADMISSIONS: "Admissions",
  ENROLLMENT: "Enrollment",
  LMS_ENGAGEMENT: "LMS Engagement",
  LIBRARY_ACTIVITY: "Library Activity",
  FINANCIAL_STANDING: "Financial Standing",
  ALUMNI: "Alumni",
};

interface StageFacts {
  admissionYear: number;
  expectedGraduation: number;
  studentStatus: string;
  programCode: string;
  enrollment: {
    courseCount: number;
    totalUnits: number;
    termCount: number;
    latestTerm: string | null;
  };
  lms: {
    courseCount: number;
    averageCompletion: number;
    lastActiveAt: string | null;
    lastActiveLabel?: string;
  };
  library: {
    totalBorrowed: number;
    currentBorrowed: number;
    loanCount: number;
  };
  fines: {
    unpaidCount: number;
    unpaidTotal: number;
    balance: number;
  };
  alumni: LifecycleAlumniMatch | null;
}

function yearDate(year: number): string | null {
  return year > 0 ? `${year}-06-01` : null;
}

function formatMoney(value: number): string {
  return `PHP ${value.toFixed(2)}`;
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function buildStages(facts: StageFacts): LifecycleStageDetail[] {
  const {
    admissionYear,
    expectedGraduation,
    studentStatus,
    programCode,
    enrollment,
    lms,
    library,
    fines,
    alumni,
  } = facts;

  const hasEnrollment = enrollment.courseCount > 0;
  const hasLms = lms.courseCount > 0;
  const hasLibrary = library.totalBorrowed > 0 || library.loanCount > 0;
  const outstandingFines =
    fines.unpaidCount > 0 || fines.unpaidTotal > 0 || fines.balance > 0;

  return [
    {
      key: "ADMISSIONS",
      label: STAGE_LABELS.ADMISSIONS,
      status: admissionYear > 0 ? "Completed" : "Upcoming",
      date: yearDate(admissionYear),
      summary:
        admissionYear > 0
          ? `Admitted to ${programCode} for AY ${admissionYear}-${admissionYear + 1}.`
          : "No admission record on file.",
      metrics: [
        { label: "Admission Year", value: admissionYear > 0 ? String(admissionYear) : "—" },
        { label: "Program", value: programCode },
      ],
    },
    {
      key: "ENROLLMENT",
      label: STAGE_LABELS.ENROLLMENT,
      status: !hasEnrollment
        ? "Upcoming"
        : studentStatus === "Active" || studentStatus === "On Leave"
          ? "Active"
          : "Completed",
      date: null,
      summary: hasEnrollment
        ? `${pluralize(enrollment.courseCount, "course enrollment")} across ${pluralize(
            enrollment.termCount,
            "term"
          )}; latest term ${enrollment.latestTerm ?? "—"}.`
        : "No enrollment records yet.",
      metrics: [
        { label: "Courses", value: String(enrollment.courseCount) },
        { label: "Units", value: String(enrollment.totalUnits) },
        { label: "Latest Term", value: enrollment.latestTerm ?? "—" },
      ],
    },
    {
      key: "LMS_ENGAGEMENT",
      label: STAGE_LABELS.LMS_ENGAGEMENT,
      status: !hasLms ? "Upcoming" : studentStatus === "Graduated" ? "Completed" : "Active",
      date: lms.lastActiveAt,
      summary: hasLms
        ? `Average course completion ${Math.round(lms.averageCompletion)}% across ${pluralize(
            lms.courseCount,
            "course"
          )}.`
        : "No LMS activity recorded.",
      metrics: [
        { label: "Avg Completion", value: `${Math.round(lms.averageCompletion)}%` },
        { label: "Courses", value: String(lms.courseCount) },
        {
          label: "Last Active",
          value: lms.lastActiveLabel ?? lms.lastActiveAt?.slice(0, 10) ?? "—",
        },
      ],
    },
    {
      key: "LIBRARY_ACTIVITY",
      label: STAGE_LABELS.LIBRARY_ACTIVITY,
      status: !hasLibrary
        ? "Upcoming"
        : library.currentBorrowed > 0
          ? "Active"
          : "Completed",
      date: null,
      summary: hasLibrary
        ? `${pluralize(library.totalBorrowed, "lifetime loan")}; ${library.currentBorrowed} currently borrowed.`
        : "No library activity recorded.",
      metrics: [
        { label: "Total Borrowed", value: String(library.totalBorrowed) },
        { label: "Currently Borrowed", value: String(library.currentBorrowed) },
        { label: "Loan Records", value: String(library.loanCount) },
      ],
    },
    {
      key: "FINANCIAL_STANDING",
      label: STAGE_LABELS.FINANCIAL_STANDING,
      status: outstandingFines ? "Upcoming" : "Completed",
      date: null,
      summary: outstandingFines
        ? `Alert: ${formatMoney(Math.max(fines.unpaidTotal, fines.balance))} outstanding in unpaid library fines (${pluralize(
            fines.unpaidCount,
            "fine"
          )}).`
        : "No outstanding fines; library account in good standing.",
      metrics: [
        {
          label: "Outstanding Fines",
          value: formatMoney(Math.max(fines.unpaidTotal, fines.balance)),
        },
        { label: "Unpaid Fines", value: String(fines.unpaidCount) },
        { label: "Library Balance", value: formatMoney(fines.balance) },
      ],
    },
    {
      key: "ALUMNI",
      label: STAGE_LABELS.ALUMNI,
      status: alumni ? "Alumni" : "Upcoming",
      date: alumni
        ? yearDate(alumni.graduationYear ?? 0)
        : yearDate(expectedGraduation),
      summary: alumni
        ? `Alumni${alumni.graduationLabel ? ` — ${alumni.graduationLabel}` : ""}${
            alumni.graduationYear ? `, Class of ${alumni.graduationYear}` : ""
          }.`
        : expectedGraduation > 0
          ? `Expected graduation AY ${expectedGraduation}-${expectedGraduation + 1}.`
          : "Graduation not yet scheduled.",
      metrics: [
        {
          label: "Graduation Year",
          value:
            alumni?.graduationYear?.toString() ??
            (expectedGraduation > 0 ? String(expectedGraduation) : "—"),
        },
        { label: "Status", value: alumni ? "Alumni" : "Expected" },
      ],
    },
  ];
}

function resolveCurrentStage(stages: LifecycleStageDetail[]): LifecycleStageKey | null {
  const alumniStage = stages.find((stage) => stage.key === "ALUMNI");
  if (alumniStage?.status === "Alumni") return "ALUMNI";

  const nextStage = stages.find((stage) => stage.status !== "Completed");
  return nextStage?.key ?? null;
}

function findMockAlumni(student: StudentModel): LifecycleAlumniMatch | null {
  const integrated =
    seedDataset.integratedAlumni.find((alumni) => alumni.studentId === student.id) ??
    seedDataset.integratedAlumni.find((alumni) => alumni.fullName === student.name);
  if (integrated) {
    const year = Number.parseInt(integrated.batch, 10);
    return {
      graduationYear: Number.isFinite(year) ? year : null,
      graduationLabel: integrated.graduationDate,
    };
  }

  const record =
    seedDataset.alumniRecords.find(
      (alumni) => alumni.name === student.name && alumni.programCode === student.programCode
    ) ?? seedDataset.alumniRecords.find((alumni) => alumni.name === student.name);
  if (record) {
    return {
      graduationYear: record.graduationYear,
      graduationLabel: `Class of ${record.graduationYear}`,
    };
  }

  if (student.status === "Graduated") {
    return {
      graduationYear: student.expectedGraduation || null,
      graduationLabel: student.expectedGraduation
        ? `Class of ${student.expectedGraduation}`
        : null,
    };
  }

  return null;
}

function buildMockTimeline(
  student: StudentModel,
  alumni: LifecycleAlumniMatch | null
): LifecycleTimelineEvent[] {
  const admissionYear = student.admissionYear > 0 ? student.admissionYear : 2024;
  const finesBalance = student.library.finesBalance;
  const lastActive =
    student.lmsActivity.courses[0]?.lastActive ??
    (student.lmsActivity.weeklyLogins > 0 ? "recently" : "no recent activity");

  const events: LifecycleTimelineEvent[] = [
    {
      id: `${student.id}-timeline-admissions`,
      stage: "ADMISSIONS",
      sourceSystem: "STUDENT_RECORDS",
      title: "Application accepted",
      description: `Admitted to ${student.programName} for AY ${admissionYear}-${admissionYear + 1}.`,
      occurredAt: `${admissionYear}-06-15T09:00:00.000Z`,
    },
    {
      id: `${student.id}-timeline-enrollment`,
      stage: "ENROLLMENT",
      sourceSystem: "STUDENT_RECORDS",
      title: "Enrolled for the first semester",
      description: `${student.academicRecords.subjects.length} course(s) enrolled for ${student.academicRecords.currentSemester}.`,
      occurredAt: `${admissionYear}-08-05T08:00:00.000Z`,
    },
    {
      id: `${student.id}-timeline-lms`,
      stage: "LMS_ENGAGEMENT",
      sourceSystem: "ACADEMIC_RECORDS",
      title: "Academic activity recorded",
      description: `Overall completion ${student.lmsActivity.overallCompletionRate}%; last active ${lastActive}.`,
      occurredAt: `${admissionYear}-09-12T10:30:00.000Z`,
    },
    {
      id: `${student.id}-timeline-library`,
      stage: "LIBRARY_ACTIVITY",
      sourceSystem: "LIBRARY",
      title: "Library circulation synced",
      description: `${student.library.totalBorrowedAllTime} lifetime loan(s); ${student.library.currentBorrowedCount} currently borrowed.`,
      occurredAt: `${admissionYear}-10-03T14:00:00.000Z`,
    },
    {
      id: `${student.id}-timeline-financial`,
      stage: "FINANCIAL_STANDING",
      sourceSystem: "LIBRARY",
      title: "Financial standing evaluated",
      description:
        finesBalance > 0
          ? `Outstanding library fines of ${formatMoney(finesBalance)}.`
          : "No outstanding library fines; account in good standing.",
      occurredAt: `${admissionYear}-11-01T09:15:00.000Z`,
    },
  ];

  if (alumni) {
    events.push({
      id: `${student.id}-timeline-alumni`,
      stage: "ALUMNI",
      sourceSystem: "ALUMNI_RECORDS",
      title: "Alumni status recorded",
      description: `${student.name} graduated${
        alumni.graduationYear ? ` with the Class of ${alumni.graduationYear}` : ""
      }.`,
      occurredAt: `${alumni.graduationYear ?? admissionYear + 4}-06-20T12:00:00.000Z`,
    });
  }

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
        admissionYear: data.student.admission_year ?? 0,
        expectedGraduation: data.student.expected_graduation ?? 0,
        studentStatus: data.student.status,
        programCode: data.student.program_code,
        enrollment: data.enrollment,
        lms: {
          courseCount: data.lms.courseCount,
          averageCompletion: data.lms.averageCompletion,
          lastActiveAt: data.lms.lastActiveAt,
        },
        library: {
          totalBorrowed: Number(data.student.library_total_borrowed),
          currentBorrowed: Number(data.student.library_current_borrowed),
          loanCount: data.loanCount,
        },
        fines: {
          unpaidCount: data.unpaidFineCount,
          unpaidTotal: data.unpaidFineTotal,
          balance: Number(data.student.library_fines_balance),
        },
        alumni: data.alumni,
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

    const alumni = findMockAlumni(student);
    const stages = buildStages({
      admissionYear: student.admissionYear,
      expectedGraduation: student.expectedGraduation,
      studentStatus: student.status,
      programCode: student.programCode,
      enrollment: {
        courseCount: student.academicRecords.subjects.length,
        totalUnits: student.academicRecords.subjects.reduce(
          (total, subject) => total + subject.units,
          0
        ),
        termCount: student.academicRecords.history.length,
        latestTerm: student.academicRecords.currentSemester,
      },
      lms: {
        courseCount: student.lmsActivity.courses.length,
        averageCompletion: student.lmsActivity.overallCompletionRate,
        lastActiveAt: null,
        lastActiveLabel: student.lmsActivity.courses[0]?.lastActive ?? "—",
      },
      library: {
        totalBorrowed: student.library.totalBorrowedAllTime,
        currentBorrowed: student.library.currentBorrowedCount,
        loanCount: student.library.books.length,
      },
      fines: {
        unpaidCount: student.library.finesBalance > 0 ? 1 : 0,
        unpaidTotal: student.library.finesBalance,
        balance: student.library.finesBalance,
      },
      alumni,
    });

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
      timeline: buildMockTimeline(student, alumni),
    };
  }
}

export const studentLifecycleService = new StudentLifecycleService();

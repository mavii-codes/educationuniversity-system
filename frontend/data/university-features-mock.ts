import { STUDENTS } from "@/data/mock-data";
import {
  FerpaAccessEvent,
  FerpaConsent,
  FerpaDirectorySetting,
  FerpaOverview,
  LifecycleStageDetail,
  LifecycleTimelineEvent,
  Student,
  StudentLifecycle,
} from "@/types";

export const FERPA_OVERVIEW: FerpaOverview = {
  activeConsents: 1284,
  directoryOptOuts: 37,
  accessEventsLast30Days: 2861,
  restrictedStudents: 12,
};

export const FERPA_CONSENTS: FerpaConsent[] = [
  {
    id: "ferpa-consent-1001",
    studentId: "2024-042",
    studentName: "Marco Villanueva",
    consentType: "RECORDS_RELEASE",
    status: "Granted",
    effectiveAt: "2026-08-14T09:20:00Z",
    expiresAt: "2027-08-14T09:20:00Z",
    recordedByName: "Dr. Elena Reyes",
    note: "Release of academic records to the scholarship office.",
  },
  {
    id: "ferpa-consent-1002",
    studentId: "2023-109",
    studentName: "Angela Mae Bautista",
    consentType: "DIRECTORY_INFO",
    status: "Revoked",
    effectiveAt: "2026-02-03T13:10:00Z",
    expiresAt: null,
    recordedByName: "Registrar's Office",
    note: "Student requested that directory information not be published.",
  },
  {
    id: "ferpa-consent-1003",
    studentId: "2024-089",
    studentName: "Sofia Isabel Ramos",
    consentType: "RESEARCH_USE",
    status: "Granted",
    effectiveAt: "2026-09-01T08:00:00Z",
    expiresAt: "2027-06-30T23:59:00Z",
    recordedByName: "Institutional Research Office",
    note: "Aggregate research participation approved for AY 2026-2027.",
  },
  {
    id: "ferpa-consent-1004",
    studentId: "2025-074",
    studentName: "Carlo Miguel Mendoza",
    consentType: "THIRD_PARTY",
    status: "Granted",
    effectiveAt: "2026-06-18T10:45:00Z",
    expiresAt: "2027-06-18T10:45:00Z",
    recordedByName: "Dr. Alicia Gomez",
    note: "Clinical placement partner verification.",
  },
  {
    id: "ferpa-consent-1005",
    studentId: "2024-136",
    studentName: "Rafael Antonio Rivera",
    consentType: "DIRECTORY_INFO",
    status: "Revoked",
    effectiveAt: "2025-11-22T15:30:00Z",
    expiresAt: null,
    recordedByName: "Registrar's Office",
    note: "Opt-out requested during leave of absence processing.",
  },
  {
    id: "ferpa-consent-1006",
    studentId: "2022-031",
    studentName: "Patricia Anne Lim",
    consentType: "RECORDS_RELEASE",
    status: "Granted",
    effectiveAt: "2026-07-05T11:15:00Z",
    expiresAt: "2031-07-05T11:15:00Z",
    recordedByName: "Alumni Relations Office",
    note: "Consent for employment verification and transcript release.",
  },
];

export const FERPA_ACCESS_EVENTS: FerpaAccessEvent[] = [
  {
    id: "ferpa-access-9001",
    studentId: "2024-042",
    studentName: "Marco Villanueva",
    viewerId: "usr-faculty-014",
    viewerName: "Prof. Hannah Tan",
    viewerRole: "Faculty",
    action: "VIEW_ACADEMIC_RECORD",
    occurredAt: "2026-11-11T08:12:00Z",
  },
  {
    id: "ferpa-access-9002",
    studentId: "2023-109",
    studentName: "Angela Mae Bautista",
    viewerId: "usr-admin-001",
    viewerName: "Dr. Victor Soriano",
    viewerRole: "Administrator",
    action: "EXPORT_TRANSCRIPT",
    occurredAt: "2026-11-11T07:45:00Z",
  },
  {
    id: "ferpa-access-9003",
    studentId: "2024-089",
    studentName: "Sofia Isabel Ramos",
    viewerId: "usr-registrar-003",
    viewerName: "Maria Santos",
    viewerRole: "Registrar",
    action: "VIEW_ENROLLMENT_HISTORY",
    occurredAt: "2026-11-10T16:22:00Z",
  },
  {
    id: "ferpa-access-9004",
    studentId: "2025-074",
    studentName: "Carlo Miguel Mendoza",
    viewerId: "usr-library-007",
    viewerName: "Josefina Cruz",
    viewerRole: "Librarian",
    action: "VIEW_LIBRARY_ACCOUNT",
    occurredAt: "2026-11-10T15:40:00Z",
  },
  {
    id: "ferpa-access-9005",
    studentId: "2024-136",
    studentName: "Rafael Antonio Rivera",
    viewerId: "usr-admin-001",
    viewerName: "Dr. Victor Soriano",
    viewerRole: "Administrator",
    action: "UPDATE_DIRECTORY_SETTING",
    occurredAt: "2026-11-10T11:05:00Z",
  },
  {
    id: "ferpa-access-9006",
    studentId: "2022-031",
    studentName: "Patricia Anne Lim",
    viewerId: "usr-alumni-002",
    viewerName: "Camille Delgado",
    viewerRole: "Alumni Relations",
    action: "VIEW_ALUMNI_RECORD",
    occurredAt: "2026-11-09T14:18:00Z",
  },
  {
    id: "ferpa-access-9007",
    studentId: "2025-258",
    studentName: "Katrina Mae De Leon",
    viewerId: "usr-registrar-003",
    viewerName: "Maria Santos",
    viewerRole: "Registrar",
    action: "VIEW_TRANSFER_RECORD",
    occurredAt: "2026-11-08T09:32:00Z",
  },
  {
    id: "ferpa-access-9008",
    studentId: "2024-042",
    studentName: "Marco Villanueva",
    viewerId: "usr-steward-005",
    viewerName: "Paolo Reyes",
    viewerRole: "Institutional Data Steward",
    action: "VIEW_ACCESS_AUDIT",
    occurredAt: "2026-11-07T13:50:00Z",
  },
];

export const FERPA_DIRECTORY_SETTINGS: FerpaDirectorySetting[] = [
  {
    studentId: "2024-042",
    studentName: "Marco Villanueva",
    directoryOptOut: false,
    updatedAt: "2026-08-14T09:20:00Z",
  },
  {
    studentId: "2023-109",
    studentName: "Angela Mae Bautista",
    directoryOptOut: true,
    updatedAt: "2026-02-03T13:10:00Z",
  },
  {
    studentId: "2025-074",
    studentName: "Carlo Miguel Mendoza",
    directoryOptOut: false,
    updatedAt: "2026-06-18T10:45:00Z",
  },
  {
    studentId: "2024-089",
    studentName: "Sofia Isabel Ramos",
    directoryOptOut: true,
    updatedAt: "2026-09-01T08:00:00Z",
  },
  {
    studentId: "2024-136",
    studentName: "Rafael Antonio Rivera",
    directoryOptOut: true,
    updatedAt: "2025-11-22T15:30:00Z",
  },
  {
    studentId: "2022-031",
    studentName: "Patricia Anne Lim",
    directoryOptOut: false,
    updatedAt: "2026-07-05T11:15:00Z",
  },
  {
    studentId: "2025-204",
    studentName: "Jerome Patrick Ocampo",
    directoryOptOut: false,
    updatedAt: "2026-06-30T09:00:00Z",
  },
  {
    studentId: "2025-258",
    studentName: "Katrina Mae De Leon",
    directoryOptOut: true,
    updatedAt: "2026-08-21T10:10:00Z",
  },
];

/**
 * Preset library lifecycles for the seed students. All numbers are derived
 * from each student's `library` profile in mock-data (totalBorrowedAllTime,
 * currentBorrowedCount, finesBalance, and their checked-out titles).
 */
const STUDENT_LIFECYCLES: Record<string, StudentLifecycle> = {
  "2024-042": {
    studentId: "2024-042",
    studentName: "Marco Villanueva",
    programName: "BS Information Technology",
    programCode: "BSIT",
    yearLevel: "2nd Year",
    status: "Active",
    currentStage: "BORROWING",
    stages: [
      {
        key: "MEMBERSHIP",
        label: "Library Membership",
        status: "Completed",
        date: "2025-08-05T09:15:00Z",
        summary:
          "Library membership activated with the student ID; borrowing privileges enabled for BSIT.",
        metrics: [
          { label: "Member Since", value: "2025" },
          { label: "Status", value: "Active" },
        ],
      },
      {
        key: "REQUESTS",
        label: "Borrowing Requests",
        status: "Completed",
        date: "2026-10-08T14:05:00Z",
        summary:
          "4 borrowing requests submitted; every request was approved and fulfilled at the circulation desk.",
        metrics: [
          { label: "Requests Submitted", value: "4" },
          { label: "Approved", value: "4" },
        ],
      },
      {
        key: "FINES",
        label: "Fines & Payments",
        status: "Upcoming",
        date: null,
        summary:
          "No fines on record — the fine ledger activates only when a loan goes overdue.",
        metrics: [{ label: "Outstanding", value: "₱0.00" }],
      },
      {
        key: "STANDING",
        label: "Current Standing",
        status: "Active",
        date: "2026-11-05T16:40:00Z",
        summary:
          "Good standing at the last semester audit — full borrowing privileges, no restrictions.",
        metrics: [
          { label: "Privileges", value: "Full" },
          { label: "Restrictions", value: "None" },
        ],
      },
    ],
    timeline: [
      {
        id: "life-2024-042-01",
        stage: "MEMBERSHIP",
        sourceSystem: "LIBRARY",
        title: "Library membership activated",
        description:
          "Student ID 2024-042 registered at the circulation desk; borrowing privileges enabled.",
        occurredAt: "2025-08-05T09:15:00Z",
      },
      {
        id: "life-2024-042-02",
        stage: "REQUESTS",
        sourceSystem: "LIBRARY",
        title: "Request approved",
        description:
          "'Data Structures and Algorithms in Java' approved for pickup at the circulation desk.",
        occurredAt: "2026-10-08T14:05:00Z",
      },
      {
        id: "life-2024-042-03",
        stage: "BORROWING",
        sourceSystem: "LIBRARY",
        title: "Borrowed 'Data Structures and Algorithms in Java'",
        description:
          "3-week loan issued for IT 201 readings; due Oct 31, 2026.",
        occurredAt: "2026-10-10T10:20:00Z",
      },
      {
        id: "life-2024-042-04",
        stage: "STANDING",
        sourceSystem: "LIBRARY",
        title: "Standing verified at semester audit",
        description:
          "Account in good standing with full borrowing privileges and a zero fine balance.",
        occurredAt: "2026-11-05T16:40:00Z",
      },
    ],
  },
  "2023-109": {
    studentId: "2023-109",
    studentName: "Angela Mae Bautista",
    programName: "BS Business Administration",
    programCode: "BSBA",
    yearLevel: "4th Year",
    status: "Active",
    currentStage: "BORROWING",
    stages: [
      {
        key: "MEMBERSHIP",
        label: "Library Membership",
        status: "Completed",
        date: "2023-08-07T09:30:00Z",
        summary:
          "Library membership activated during first-year enrollment and renewed each term since.",
        metrics: [
          { label: "Member Since", value: "2023" },
          { label: "Status", value: "Active" },
        ],
      },
      {
        key: "REQUESTS",
        label: "Borrowing Requests",
        status: "Completed",
        date: "2026-10-14T13:10:00Z",
        summary:
          "15 borrowing requests submitted over four years; 14 approved and 1 declined for an in-repair copy.",
        metrics: [
          { label: "Requests Submitted", value: "15" },
          { label: "Approved", value: "14" },
        ],
      },
      {
        key: "FINES",
        label: "Fines & Payments",
        status: "Active",
        date: "2026-09-12T10:15:00Z",
        summary:
          "One ₱45.00 fine from a 3-day overdue return was paid in full; the ledger is clear again.",
        metrics: [
          { label: "Outstanding", value: "₱0.00" },
          { label: "Paid to Date", value: "₱45.00" },
        ],
      },
      {
        key: "STANDING",
        label: "Current Standing",
        status: "Active",
        date: "2026-11-05T16:40:00Z",
        summary:
          "Good standing — the settled fine did not affect borrowing privileges.",
        metrics: [
          { label: "Privileges", value: "Full" },
          { label: "Restrictions", value: "None" },
        ],
      },
    ],
    timeline: [
      {
        id: "life-2023-109-01",
        stage: "MEMBERSHIP",
        sourceSystem: "LIBRARY",
        title: "Library membership activated",
        description:
          "Student ID 2023-109 registered at the circulation desk; borrowing privileges enabled.",
        occurredAt: "2023-08-07T09:30:00Z",
      },
      {
        id: "life-2023-109-02",
        stage: "BORROWING",
        sourceSystem: "LIBRARY",
        title: "Returned 3 days overdue",
        description:
          "'Principles of Marketing' came back 3 days past due; a ₱45.00 fine was posted to the ledger.",
        occurredAt: "2026-09-09T15:45:00Z",
      },
      {
        id: "life-2023-109-03",
        stage: "FINES",
        sourceSystem: "LIBRARY",
        title: "Fine paid ₱45.00",
        description:
          "Settled in cash at the circulation desk; the ledger balance returned to zero.",
        occurredAt: "2026-09-12T10:15:00Z",
      },
      {
        id: "life-2023-109-04",
        stage: "BORROWING",
        sourceSystem: "LIBRARY",
        title: "Borrowed 'Competitive Strategy: Techniques for Analyzing Industries'",
        description:
          "Two-week capstone research loan; due Nov 6, 2026.",
        occurredAt: "2026-10-16T11:30:00Z",
      },
      {
        id: "life-2023-109-05",
        stage: "STANDING",
        sourceSystem: "LIBRARY",
        title: "Standing verified at semester audit",
        description:
          "Account in good standing with full borrowing privileges and a zero fine balance.",
        occurredAt: "2026-11-05T16:40:00Z",
      },
    ],
  },
  "2022-031": {
    studentId: "2022-031",
    studentName: "Patricia Anne Lim",
    programName: "BS Information Technology",
    programCode: "BSIT",
    yearLevel: "4th Year",
    status: "Graduated",
    currentStage: "STANDING",
    stages: [
      {
        key: "MEMBERSHIP",
        label: "Library Membership",
        status: "Completed",
        date: "2022-08-08T09:30:00Z",
        summary:
          "Library membership activated in first year and archived after graduation clearance in 2026.",
        metrics: [
          { label: "Member", value: "2022–2026" },
          { label: "Status", value: "Archived" },
        ],
      },
      {
        key: "REQUESTS",
        label: "Borrowing Requests",
        status: "Completed",
        date: "2026-03-05T10:20:00Z",
        summary:
          "33 borrowing requests over four years; 31 approved and fulfilled, 2 declined.",
        metrics: [
          { label: "Requests Submitted", value: "33" },
          { label: "Approved", value: "31" },
        ],
      },
      {
        key: "FINES",
        label: "Fines & Payments",
        status: "Completed",
        date: "2026-03-29T10:05:00Z",
        summary:
          "₱120.00 in overdue fines settled across four years; the ledger closed at zero.",
        metrics: [
          { label: "Outstanding", value: "₱0.00" },
          { label: "Paid to Date", value: "₱120.00" },
        ],
      },
      {
        key: "STANDING",
        label: "Current Standing",
        status: "Completed",
        date: "2026-06-04T09:00:00Z",
        summary:
          "Library clearance completed with zero outstanding loans or fines before commencement.",
        metrics: [
          { label: "Privileges", value: "Cleared" },
          { label: "Restrictions", value: "None" },
        ],
      },
    ],
    timeline: [
      {
        id: "life-2022-031-01",
        stage: "MEMBERSHIP",
        sourceSystem: "LIBRARY",
        title: "Library membership activated",
        description:
          "Student ID 2022-031 registered at the circulation desk; borrowing privileges enabled.",
        occurredAt: "2022-08-08T09:30:00Z",
      },
      {
        id: "life-2022-031-02",
        stage: "BORROWING",
        sourceSystem: "LIBRARY",
        title: "Borrowed 'Clean Architecture: A Craftsman's Guide'",
        description:
          "Three-week loan for capstone reading; due Mar 31, 2026.",
        occurredAt: "2026-03-10T13:20:00Z",
      },
      {
        id: "life-2022-031-03",
        stage: "BORROWING",
        sourceSystem: "LIBRARY",
        title: "Returned 2 days early",
        description:
          "'Clean Architecture: A Craftsman's Guide' returned ahead of the due date; ledger stayed clear.",
        occurredAt: "2026-03-29T10:05:00Z",
      },
      {
        id: "life-2022-031-04",
        stage: "STANDING",
        sourceSystem: "LIBRARY",
        title: "Library clearance completed",
        description:
          "Zero outstanding loans and fines verified before commencement.",
        occurredAt: "2026-06-04T09:00:00Z",
      },
    ],
  },
};

/**
 * Builds a library-only lifecycle for any student without a preset, using the
 * numbers from their `library` profile (lifetime loans, active loans, fines).
 */
function buildFallbackLifecycle(student: Student): StudentLifecycle {
  const isGraduated = student.status === "Graduated";
  const totalLoans = student.library.totalBorrowedAllTime;
  const activeLoans = student.library.currentBorrowedCount;
  const outstanding = student.library.finesBalance;
  const hasActivity = totalLoans > 0 || activeLoans > 0;
  const firstBook = student.library.books[0];
  const currentBook = firstBook && firstBook.status !== "Returned" ? firstBook : null;

  const membershipDate = `${student.admissionYear}-08-05T09:15:00Z`;
  const standingAuditDate = isGraduated
    ? `${student.expectedGraduation}-06-04T09:00:00Z`
    : "2026-11-05T16:40:00Z";

  const stages: LifecycleStageDetail[] = [
    {
      key: "MEMBERSHIP",
      label: "Library Membership",
      status: "Completed",
      date: membershipDate,
      summary: `Library membership activated with student ID ${student.id}; borrowing privileges enabled for ${student.programCode}.`,
      metrics: [
        { label: "Member Since", value: String(student.admissionYear) },
        { label: "Status", value: isGraduated ? "Archived" : "Active" },
      ],
    },
    {
      key: "REQUESTS",
      label: "Borrowing Requests",
      status: hasActivity ? "Completed" : "Upcoming",
      date: hasActivity ? "2026-10-08T14:05:00Z" : null,
      summary: hasActivity
        ? `${totalLoans} borrowing requests submitted and approved into circulation loans.`
        : "No borrowing requests yet — the request desk is open once membership is active.",
      metrics: [
        { label: "Requests Submitted", value: String(totalLoans) },
        {
          label: "Approved",
          value: String(
            Math.min(totalLoans, student.library.returnedBooksCount + activeLoans)
          ),
        },
      ],
    },
    {
      key: "FINES",
      label: "Fines & Payments",
      status: outstanding > 0 ? "Active" : hasActivity ? "Completed" : "Upcoming",
      date: outstanding > 0 ? "2026-10-14T10:15:00Z" : hasActivity ? "2026-05-20T10:05:00Z" : null,
      summary:
        outstanding > 0
          ? `₱${outstanding.toFixed(2)} accrued from overdue returns; settling the balance restores full privileges.`
          : hasActivity
            ? "No outstanding fines — the ledger settled at ₱0.00."
            : "No fines on record — the ledger activates only when a loan goes overdue.",
      metrics: [
        { label: "Outstanding", value: `₱${outstanding.toFixed(2)}` },
        { label: "Ledger", value: outstanding > 0 ? "With Balance" : "Clear" },
      ],
    },
    {
      key: "STANDING",
      label: "Current Standing",
      status: isGraduated ? "Completed" : "Active",
      date: standingAuditDate,
      summary: isGraduated
        ? "Library clearance completed with zero outstanding loans or fines before commencement."
        : outstanding > 0
          ? "Borrowing privileges suspended until the fine balance is settled."
          : "Account in good standing with full borrowing privileges.",
      metrics: [
        {
          label: "Privileges",
          value: isGraduated ? "Cleared" : outstanding > 0 ? "Suspended" : "Full",
        },
        { label: "Fine Balance", value: `₱${outstanding.toFixed(2)}` },
      ],
    },
  ];

  const timeline: LifecycleTimelineEvent[] = [
    {
      id: `life-${student.id}-01`,
      stage: "MEMBERSHIP",
      sourceSystem: "LIBRARY",
      title: "Library membership activated",
      description: `Student ID ${student.id} registered at the circulation desk.`,
      occurredAt: membershipDate,
    },
  ];

  if (currentBook) {
    timeline.push({
      id: `life-${student.id}-02`,
      stage: "BORROWING",
      sourceSystem: "LIBRARY",
      title: `Borrowed '${currentBook.title}'`,
      description: `Checked out from the ${currentBook.category} collection; due ${currentBook.dueDate}.`,
      occurredAt: "2026-10-10T10:20:00Z",
    });
  } else if (firstBook) {
    timeline.push({
      id: `life-${student.id}-02`,
      stage: "BORROWING",
      sourceSystem: "LIBRARY",
      title: `Returned '${firstBook.title}'`,
      description: `Came back from the ${firstBook.category} collection on ${firstBook.returnedDate ?? firstBook.dueDate}.`,
      occurredAt: "2026-05-20T10:05:00Z",
    });
  } else if (hasActivity) {
    timeline.push({
      id: `life-${student.id}-02`,
      stage: "BORROWING",
      sourceSystem: "LIBRARY",
      title: "Circulation activity recorded",
      description: `${totalLoans} lifetime loans recorded in the circulation system.`,
      occurredAt: "2026-05-20T10:05:00Z",
    });
  }

  if (outstanding > 0) {
    timeline.push({
      id: `life-${student.id}-03`,
      stage: "FINES",
      sourceSystem: "LIBRARY",
      title: "Fine posted to the ledger",
      description: `₱${outstanding.toFixed(2)} accrued on overdue loans; borrowing pauses until settled.`,
      occurredAt: "2026-10-14T10:15:00Z",
    });
  }

  timeline.push({
    id: `life-${student.id}-04`,
    stage: "STANDING",
    sourceSystem: "LIBRARY",
    title: isGraduated ? "Library clearance completed" : "Standing verified at semester audit",
    description: isGraduated
      ? "Zero outstanding loans and fines verified before commencement."
      : outstanding > 0
        ? "Privileges suspended pending fine settlement."
        : "Account in good standing with full borrowing privileges.",
    occurredAt: standingAuditDate,
  });

  const currentStage = outstanding > 0
    ? "FINES"
    : activeLoans > 0
      ? "BORROWING"
      : isGraduated
        ? "STANDING"
        : hasActivity
          ? "STANDING"
          : "MEMBERSHIP";

  return {
    studentId: student.id,
    studentName: student.name,
    programName: student.programName,
    programCode: student.programCode,
    yearLevel: student.yearLevel,
    status: student.status,
    currentStage,
    stages,
    timeline,
  };
}

export function buildMockStudentLifecycle(studentId: string): StudentLifecycle {
  const student = STUDENTS.find((candidate) => candidate.id === studentId);
  if (!student) {
    throw new Error(`No mock lifecycle data is available for student ${studentId}.`);
  }

  const preset = STUDENT_LIFECYCLES[studentId];
  if (preset) {
    return JSON.parse(JSON.stringify(preset)) as StudentLifecycle;
  }

  return buildFallbackLifecycle(student);
}

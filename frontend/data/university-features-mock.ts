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

const STUDENT_LIFECYCLES: Record<string, StudentLifecycle> = {
  "2024-042": {
    studentId: "2024-042",
    studentName: "Marco Villanueva",
    programName: "BS Information Technology",
    programCode: "BSIT",
    yearLevel: "2nd Year",
    status: "Active",
    currentStage: "LMS_ENGAGEMENT",
    stages: [
      {
        key: "ADMISSIONS",
        label: "Admissions",
        status: "Completed",
        date: "2025-06-12T09:00:00Z",
        summary: "Admitted to BS Information Technology after entrance assessment.",
        metrics: [
          { label: "Entrance Score", value: "84 / 100" },
          { label: "Admission Year", value: "2025" },
        ],
      },
      {
        key: "ENROLLMENT",
        label: "Enrollment",
        status: "Completed",
        date: "2025-08-05T09:00:00Z",
        summary: "Officially enrolled with a 21-unit first semester study load.",
        metrics: [
          { label: "Year Level", value: "2nd Year" },
          { label: "Study Load", value: "21 units" },
        ],
      },
      {
        key: "LMS_ENGAGEMENT",
        label: "LMS Engagement",
        status: "Active",
        date: "2026-08-18T09:00:00Z",
        summary: "Active in 3 course shells with a 61% assignment completion rate.",
        metrics: [
          { label: "Completion", value: "61%" },
          { label: "Weekly Logins", value: "5" },
        ],
      },
      {
        key: "LIBRARY_ACTIVITY",
        label: "Library Activity",
        status: "Active",
        date: "2026-10-10T09:00:00Z",
        summary: "1 active loan and 4 lifetime borrowings recorded by the library.",
        metrics: [
          { label: "Current Loans", value: "1" },
          { label: "Lifetime Loans", value: "4" },
        ],
      },
      {
        key: "FINANCIAL_STANDING",
        label: "Financial Standing",
        status: "Upcoming",
        date: null,
        summary: "Semestral tuition assessment is pending for the next billing cycle.",
        metrics: [{ label: "Balance", value: "₱0.00" }],
      },
      {
        key: "ALUMNI",
        label: "Alumni",
        status: "Upcoming",
        date: null,
        summary: "Alumni transition begins after degree conferral.",
        metrics: [{ label: "Expected Graduation", value: "2029" }],
      },
    ],
    timeline: [
      {
        id: "life-2024-042-01",
        stage: "ADMISSIONS",
        sourceSystem: "SIS",
        title: "Admission application submitted",
        description: "Application and senior high school credentials received.",
        occurredAt: "2025-05-02T08:30:00Z",
      },
      {
        id: "life-2024-042-02",
        stage: "ADMISSIONS",
        sourceSystem: "SIS",
        title: "Notice of admission issued",
        description: "Accepted into the BSIT program for AY 2025-2026.",
        occurredAt: "2025-06-12T09:00:00Z",
      },
      {
        id: "life-2024-042-03",
        stage: "ENROLLMENT",
        sourceSystem: "SIS",
        title: "Enrolled in 21 units",
        description: "Registrar confirmed enrollment and activated the student ID.",
        occurredAt: "2025-08-05T09:00:00Z",
      },
      {
        id: "life-2024-042-04",
        stage: "LMS_ENGAGEMENT",
        sourceSystem: "LMS",
        title: "LMS course shells provisioned",
        description: "IT 201, IT 203, and IT 205 course shells activated.",
        occurredAt: "2025-08-08T07:45:00Z",
      },
      {
        id: "life-2024-042-05",
        stage: "LIBRARY_ACTIVITY",
        sourceSystem: "LIBRARY",
        title: "First library loan recorded",
        description: "Data Structures and Algorithms in Java borrowed.",
        occurredAt: "2026-10-10T10:20:00Z",
      },
      {
        id: "life-2024-042-06",
        stage: "LMS_ENGAGEMENT",
        sourceSystem: "LMS",
        title: "Assignment submission flagged at risk",
        description: "Two missing submissions triggered an academic advising alert.",
        occurredAt: "2026-11-02T16:10:00Z",
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
    currentStage: "FINANCIAL_STANDING",
    stages: [
      {
        key: "ADMISSIONS",
        label: "Admissions",
        status: "Completed",
        date: "2023-06-09T09:00:00Z",
        summary: "Admitted with merit recognition to BS Business Administration.",
        metrics: [
          { label: "Entrance Score", value: "93 / 100" },
          { label: "Admission Year", value: "2023" },
        ],
      },
      {
        key: "ENROLLMENT",
        label: "Enrollment",
        status: "Completed",
        date: "2023-08-07T09:00:00Z",
        summary: "Officially enrolled as a first-year BSBA student.",
        metrics: [
          { label: "Year Level", value: "4th Year" },
          { label: "Study Load", value: "21 units" },
        ],
      },
      {
        key: "LMS_ENGAGEMENT",
        label: "LMS Engagement",
        status: "Completed",
        date: "2026-10-28T09:00:00Z",
        summary: "94% assignment completion and 34 study hours recorded this month.",
        metrics: [
          { label: "Completion", value: "94%" },
          { label: "Study Hours", value: "34" },
        ],
      },
      {
        key: "LIBRARY_ACTIVITY",
        label: "Library Activity",
        status: "Completed",
        date: "2026-10-16T09:00:00Z",
        summary: "14 lifetime borrowings with zero outstanding library fines.",
        metrics: [
          { label: "Lifetime Loans", value: "14" },
          { label: "Fines", value: "₱0.00" },
        ],
      },
      {
        key: "FINANCIAL_STANDING",
        label: "Financial Standing",
        status: "Active",
        date: "2026-11-04T09:00:00Z",
        summary: "Graduation clearance audit in progress for the Class of 2027.",
        metrics: [
          { label: "Balance", value: "₱0.00" },
          { label: "Clearance", value: "In Review" },
        ],
      },
      {
        key: "ALUMNI",
        label: "Alumni",
        status: "Upcoming",
        date: null,
        summary: "Alumni CRM profile will be created after degree conferral.",
        metrics: [{ label: "Expected Graduation", value: "2027" }],
      },
    ],
    timeline: [
      {
        id: "life-2023-109-01",
        stage: "ADMISSIONS",
        sourceSystem: "SIS",
        title: "Merit admission granted",
        description: "Admitted to BSBA with Dean's List eligibility screening.",
        occurredAt: "2023-06-09T09:00:00Z",
      },
      {
        id: "life-2023-109-02",
        stage: "ENROLLMENT",
        sourceSystem: "SIS",
        title: "First-year enrollment completed",
        description: "Registrar activated the student record and library privileges.",
        occurredAt: "2023-08-07T09:00:00Z",
      },
      {
        id: "life-2023-109-03",
        stage: "LMS_ENGAGEMENT",
        sourceSystem: "LMS",
        title: "Dean's Lister standing posted",
        description: "Term GPA of 3.42 verified in the LMS gradebook sync.",
        occurredAt: "2025-01-15T10:00:00Z",
      },
      {
        id: "life-2023-109-04",
        stage: "LIBRARY_ACTIVITY",
        sourceSystem: "LIBRARY",
        title: "Capstone research books borrowed",
        description: "Three strategy titles checked out for capstone research.",
        occurredAt: "2026-10-16T11:30:00Z",
      },
      {
        id: "life-2023-109-05",
        stage: "FINANCIAL_STANDING",
        sourceSystem: "FINANCE",
        title: "Graduation clearance initiated",
        description: "Tuition and library clearance audit opened by the registrar.",
        occurredAt: "2026-11-04T09:00:00Z",
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
    currentStage: "ALUMNI",
    stages: [
      {
        key: "ADMISSIONS",
        label: "Admissions",
        status: "Completed",
        date: "2022-06-10T09:00:00Z",
        summary: "Admitted to BS Information Technology as an entrance scholar.",
        metrics: [
          { label: "Entrance Score", value: "96 / 100" },
          { label: "Admission Year", value: "2022" },
        ],
      },
      {
        key: "ENROLLMENT",
        label: "Enrollment",
        status: "Completed",
        date: "2022-08-08T09:00:00Z",
        summary: "Enrolled with a full 21-unit first semester load.",
        metrics: [
          { label: "Year Level", value: "4th Year" },
          { label: "Units Earned", value: "148" },
        ],
      },
      {
        key: "LMS_ENGAGEMENT",
        label: "LMS Engagement",
        status: "Completed",
        date: "2026-05-22T09:00:00Z",
        summary: "Completed all capstone and practicum course requirements.",
        metrics: [
          { label: "Completion", value: "100%" },
          { label: "Final GPA", value: "3.75" },
        ],
      },
      {
        key: "LIBRARY_ACTIVITY",
        label: "Library Activity",
        status: "Completed",
        date: "2026-05-30T09:00:00Z",
        summary: "Library clearance verified with zero outstanding loans or fines.",
        metrics: [
          { label: "Lifetime Loans", value: "22" },
          { label: "Fines", value: "₱0.00" },
        ],
      },
      {
        key: "FINANCIAL_STANDING",
        label: "Financial Standing",
        status: "Completed",
        date: "2026-06-04T09:00:00Z",
        summary: "All tuition obligations settled before commencement.",
        metrics: [
          { label: "Balance", value: "₱0.00" },
          { label: "Scholarship", value: "Cum Laude" },
        ],
      },
      {
        key: "ALUMNI",
        label: "Alumni",
        status: "Alumni",
        date: "2026-06-18T09:00:00Z",
        summary: "Degree conferred and alumni profile created in the CRM.",
        metrics: [
          { label: "Conferred", value: "Class of 2026" },
          { label: "CRM Status", value: "Verified" },
        ],
      },
    ],
    timeline: [
      {
        id: "life-2022-031-01",
        stage: "ADMISSIONS",
        sourceSystem: "SIS",
        title: "Entrance scholarship awarded",
        description: "Full academic scholarship granted on admission.",
        occurredAt: "2022-06-10T09:00:00Z",
      },
      {
        id: "life-2022-031-02",
        stage: "ENROLLMENT",
        sourceSystem: "SIS",
        title: "First-year enrollment completed",
        description: "BSIT study plan and adviser assignment confirmed.",
        occurredAt: "2022-08-08T09:00:00Z",
      },
      {
        id: "life-2022-031-03",
        stage: "LMS_ENGAGEMENT",
        sourceSystem: "LMS",
        title: "Capstone defense passed",
        description: "Final capstone project evaluated with distinction.",
        occurredAt: "2026-05-22T14:00:00Z",
      },
      {
        id: "life-2022-031-04",
        stage: "FINANCIAL_STANDING",
        sourceSystem: "FINANCE",
        title: "Financial clearance completed",
        description: "Registrar confirmed zero tuition and library liability.",
        occurredAt: "2026-06-04T09:00:00Z",
      },
      {
        id: "life-2022-031-05",
        stage: "ALUMNI",
        sourceSystem: "ALUMNI_CRM",
        title: "Alumni CRM profile created",
        description: "Graduate record synced with conferral and employment data.",
        occurredAt: "2026-06-18T09:00:00Z",
      },
    ],
  },
};

function buildFallbackLifecycle(student: Student): StudentLifecycle {
  const admissionDate = `${student.admissionYear}-06-12T09:00:00Z`;
  const enrollmentDate = `${student.admissionYear}-08-05T09:00:00Z`;
  const graduationYear = student.expectedGraduation;
  const isGraduated = student.status === "Graduated";

  const stages: LifecycleStageDetail[] = [
    {
      key: "ADMISSIONS",
      label: "Admissions",
      status: "Completed",
      date: admissionDate,
      summary: `Admitted to ${student.programName}.`,
      metrics: [
        { label: "Admission Year", value: String(student.admissionYear) },
        { label: "Program", value: student.programCode },
      ],
    },
    {
      key: "ENROLLMENT",
      label: "Enrollment",
      status: "Completed",
      date: enrollmentDate,
      summary: `Officially enrolled as a ${student.yearLevel.toLowerCase()} student.`,
      metrics: [
        { label: "Year Level", value: student.yearLevel },
        {
          label: "Units Earned",
          value: String(student.academicRecords.totalUnitsEarned),
        },
      ],
    },
    {
      key: "LMS_ENGAGEMENT",
      label: "LMS Engagement",
      status: isGraduated ? "Completed" : "Active",
      date: isGraduated
        ? `${graduationYear}-05-20T09:00:00Z`
        : `${graduationYear - 1}-08-18T09:00:00Z`,
      summary: `${student.lmsActivity.overallCompletionRate}% assignment completion across ${student.lmsActivity.courses.length} active course shells.`,
      metrics: [
        {
          label: "Completion",
          value: `${student.lmsActivity.overallCompletionRate}%`,
        },
        { label: "Weekly Logins", value: String(student.lmsActivity.weeklyLogins) },
      ],
    },
    {
      key: "LIBRARY_ACTIVITY",
      label: "Library Activity",
      status: isGraduated ? "Completed" : "Active",
      date: isGraduated
        ? `${graduationYear}-05-30T09:00:00Z`
        : `${graduationYear - 1}-10-10T09:00:00Z`,
      summary: `${student.library.totalBorrowedAllTime} lifetime borrowings with ${student.library.currentBorrowedCount} active loans.`,
      metrics: [
        { label: "Current Loans", value: String(student.library.currentBorrowedCount) },
        { label: "Fines", value: `₱${student.library.finesBalance.toFixed(2)}` },
      ],
    },
    {
      key: "FINANCIAL_STANDING",
      label: "Financial Standing",
      status: isGraduated ? "Completed" : "Upcoming",
      date: isGraduated ? `${graduationYear}-06-04T09:00:00Z` : null,
      summary: isGraduated
        ? "All tuition obligations settled before graduation."
        : "Semestral tuition assessment is pending for the next billing cycle.",
      metrics: [{ label: "Balance", value: "₱0.00" }],
    },
    {
      key: "ALUMNI",
      label: "Alumni",
      status: isGraduated ? "Alumni" : "Upcoming",
      date: isGraduated ? `${graduationYear}-06-18T09:00:00Z` : null,
      summary: isGraduated
        ? "Degree conferred and alumni profile created in the CRM."
        : "Alumni transition begins after degree conferral.",
      metrics: [{ label: "Expected Graduation", value: String(graduationYear) }],
    },
  ];

  const timeline: LifecycleTimelineEvent[] = [
    {
      id: `life-${student.id}-01`,
      stage: "ADMISSIONS",
      sourceSystem: "SIS",
      title: "Admission application completed",
      description: `Application received for ${student.programName}.`,
      occurredAt: `${student.admissionYear}-05-02T08:30:00Z`,
    },
    {
      id: `life-${student.id}-02`,
      stage: "ENROLLMENT",
      sourceSystem: "SIS",
      title: "Enrollment confirmed by registrar",
      description: "Student record activated and portal access provisioned.",
      occurredAt: enrollmentDate,
    },
    {
      id: `life-${student.id}-03`,
      stage: "LMS_ENGAGEMENT",
      sourceSystem: "LMS",
      title: "LMS activity synchronized",
      description: `${student.lmsActivity.overallCompletionRate}% assignment completion recorded.`,
      occurredAt: `${graduationYear - 1}-08-18T09:00:00Z`,
    },
    {
      id: `life-${student.id}-04`,
      stage: "LIBRARY_ACTIVITY",
      sourceSystem: "LIBRARY",
      title: "Library circulation activity synced",
      description: `${student.library.totalBorrowedAllTime} lifetime loans recorded.`,
      occurredAt: `${graduationYear - 1}-10-10T09:00:00Z`,
    },
  ];

  if (isGraduated) {
    timeline.push({
      id: `life-${student.id}-05`,
      stage: "ALUMNI",
      sourceSystem: "ALUMNI_CRM",
      title: "Alumni profile created",
      description: "Graduate record synchronized with conferral data.",
      occurredAt: `${graduationYear}-06-18T09:00:00Z`,
    });
  }

  return {
    studentId: student.id,
    studentName: student.name,
    programName: student.programName,
    programCode: student.programCode,
    yearLevel: student.yearLevel,
    status: student.status,
    currentStage: isGraduated ? "ALUMNI" : "LMS_ENGAGEMENT",
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

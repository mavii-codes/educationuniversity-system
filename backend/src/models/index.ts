export type StudentStatus = "Active" | "Graduated" | "On Leave" | "Withdrawn";
export type RiskLevel = "Low" | "Medium" | "High";
export type DataSourceStatus = "Connected" | "Syncing" | "Warning" | "Disconnected";

export interface StudentQuery {
  search?: string;
  program?: string;
  yearLevel?: string;
  status?: string;
  riskLevel?: string;
}

export interface StudentSummaryModel {
  id: string;
  name: string;
  email: string;
  programCode: string;
  programName: string;
  yearLevel: string;
  status: StudentStatus;
  performanceScore: number;
  gpa: number;
  attendanceRate: number;
  riskLevel: RiskLevel;
}

export interface ProgramModel {
  id: string;
  code: string;
  name: string;
  department: string;
  enrolledCount: number;
  averageGpa: number;
  graduationRate: number;
  withdrawalRate: number;
  attendanceRate: number;
}

export interface DataSourceModel {
  id: string;
  code: "SIS" | "LMS" | "HR" | "LIBRARY" | "ALUMNI";
  name: string;
  shortName: string;
  description: string;
  status: DataSourceStatus;
  lastSynced: string;
  recordCount: number;
  syncFrequency: string;
  endpointPreview: string;
  healthScore: number;
  entitiesSynced: string[];
  maintainerDept: string;
}

export interface IntegrationLogModel {
  id: string;
  sourceCode: string;
  sourceName: string;
  recordsProcessed: number;
  duplicatesDetected: number;
  failedRecords: number;
  duration: string;
  status: "Successful" | "Warning" | "Failed";
  dateLabel: string;
  timestamp: string;
  notes: string;
}

export interface AlumniModel {
  id: string;
  name: string;
  graduationYear: number;
  programCode: string;
  programName: string;
  employmentStatus: string;
  currentCompany: string;
  jobTitle: string;
  location: string;
  industry: string;
  alignedWithDegree: boolean;
}

export interface SubjectRecord {
  code: string;
  title: string;
  units: number;
  midtermGrade: number;
  finalGrade: number;
  gpaEquivalent: number;
  instructor: string;
  status: "Passed" | "In Progress" | "At Risk";
}

export interface SemesterGpaHistory {
  semester: string;
  gpa: number;
  unitsCompleted: number;
  standing: string;
}

export interface AttendanceMonthRecord {
  month: string;
  rate: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
}

export interface LmsCourseProgress {
  courseCode: string;
  courseTitle: string;
  completionRate: number;
  assignmentsCompleted: number;
  assignmentsTotal: number;
  lastActive: string;
}

export interface LibraryBookRecord {
  id: string;
  title: string;
  author: string;
  category: string;
  borrowedDate: string;
  dueDate: string;
  returnedDate?: string;
  status: "Borrowed" | "Returned" | "Due Soon";
}

export interface StudentModel extends StudentSummaryModel {
  department: string;
  adviser: string;
  scholarship?: string;
  admissionYear: number;
  expectedGraduation: number;
  contactNumber: string;
  address: string;
  syncedSystems: string[];
  lastSyncedAt: string;
  academicRecords: {
    currentSemester: string;
    totalUnitsEarned: number;
    totalUnitsRequired: number;
    subjects: SubjectRecord[];
    history: SemesterGpaHistory[];
  };
  attendance: {
    overallPercentage: number;
    absencesCount: number;
    excusedAbsences: number;
    lateCount: number;
    monthlyTrend: AttendanceMonthRecord[];
  };
  lmsActivity: {
    weeklyLogins: number;
    totalHoursThisMonth: number;
    assignmentsSubmitted: number;
    assignmentsTotal: number;
    overallCompletionRate: number;
    weeklyEngagement: { week: string; logins: number; submissions: number }[];
    courses: LmsCourseProgress[];
  };
  library: {
    totalBorrowedAllTime: number;
    returnedBooksCount: number;
    currentBorrowedCount: number;
    finesBalance: number;
    books: LibraryBookRecord[];
  };
}

export interface CourseModel {
  code: string;
  title: string;
  programCode: string;
  units: number;
  enrolledStudents: number;
  lmsActiveRate: number;
  instructor: string;
}

export interface ReportModel {
  id: string;
  title: string;
  category: string;
  description: string;
  lastGenerated: string;
  frequency: string;
  sourceSystems: string[];
  fileSize: string;
  highlights: { label: string; value: string }[];
  previewRows: { col1: string; col2: string; col3: string; col4: string }[];
  previewHeaders: [string, string, string, string];
}

export interface NotificationModel {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "success" | "warning" | "info" | "alert";
  source: string;
  read: boolean;
  href?: string;
}

export interface ActivityFeedModel {
  id: string;
  title: string;
  detail: string;
  source: "SIS" | "LMS" | "Library" | "Alumni" | "HR";
  timestamp: string;
  status: "success" | "warning" | "info";
}

export interface LifecycleStageModel {
  key: string;
  title: string;
  subtitle: string;
  status: "completed" | "current" | "upcoming";
  metricLabel: string;
  metricCount: number;
  conversionRate: string;
  description: string;
  sourceSystems: string[];
  keyMilestones: string[];
  insights: { label: string; value: string }[];
}

export interface AdminUserModel {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "Active" | "Inactive" | "Invited";
  mfaEnabled: boolean;
  lastActive: string;
}

export interface SyncHistoryModel {
  id: string;
  dataSource: string;
  fullName: string;
  syncMode: string;
  lastSync: string;
  records: number;
  duration: string;
  status: DataSourceStatus;
  notes: string;
}


export type AuthorizedRole = "Administrator" | "Registrar";

export interface IntegratedAlumniModel {
  id: string;
  studentId: string;
  fullName: string;
  programCode: string;
  program: string;
  department: string;
  batch: string;
  graduationDate: string;
  status: "Alumni";
  source: "Alumni CRM";
  email?: string;
  contactNumber?: string;
  enrollmentYear: string;
}

export type StudentStatus = "Active" | "Graduated" | "On Leave" | "Withdrawn";
export type RiskLevel = "Low" | "Medium" | "High";
export type DataSourceStatus = "Connected" | "Syncing" | "Warning" | "Disconnected";
export type SyncLogStatus = "Successful" | "Warning" | "Failed";
export type LifecycleStageKey =
  | "admission"
  | "enrollment"
  | "academic-progress"
  | "graduation"
  | "alumni";

export interface Program {
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

export interface CourseCatalogItem {
  code: string;
  title: string;
  programCode: string;
  units: number;
  enrolledStudents: number;
  lmsActiveRate: number;
  instructor: string;
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

export interface Student {
  id: string;
  name: string;
  email: string;
  programCode: string;
  programName: string;
  department: string;
  yearLevel: "1st Year" | "2nd Year" | "3rd Year" | "4th Year";
  status: StudentStatus;
  performanceScore: number;
  gpa: number;
  riskLevel: RiskLevel;
  attendanceRate: number;
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

export interface LifecycleStage {
  key: LifecycleStageKey;
  title: string;
  subtitle: string;
  status: "completed" | "current" | "upcoming";
  metricLabel: string;
  metricCount: number;
  conversionRate: string;
  description: string;
  sourceSystems: string[];
  keyMilestones: string[];
  insights: {
    label: string;
    value: string;
  }[];
}

export interface DataSource {
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

export interface IntegrationSyncLog {
  id: string;
  sourceCode: string;
  sourceName: string;
  recordsProcessed: number;
  duplicatesDetected: number;
  failedRecords: number;
  duration: string;
  status: SyncLogStatus;
  dateLabel: string;
  timestamp: string;
  notes: string;
}

export interface IntegrationSummary {
  totalRecordsProcessed: number;
  successfulRecords: number;
  failedRecords: number;
  duplicateRecords: number;
  lastIntegration: string;
  currentStatus: "Operational" | "Syncing" | "Degraded";
  uptimePercentage: number;
}

export interface AlumniRecord {
  id: string;
  name: string;
  graduationYear: number;
  programCode: string;
  programName: string;
  employmentStatus:
    | "Employed"
    | "Self-Employed"
    | "Postgraduate Studies"
    | "Seeking Opportunities";
  currentCompany: string;
  jobTitle: string;
  location: string;
  industry: string;
  alignedWithDegree: boolean;
}

export interface ReportItem {
  id: string;
  title: string;
  category:
    | "Enrollment"
    | "Academic"
    | "Attendance"
    | "Retention"
    | "Graduation"
    | "Alumni"
    | "Integration";
  description: string;
  lastGenerated: string;
  frequency: string;
  sourceSystems: string[];
  fileSize: string;
  highlights: { label: string; value: string }[];
  previewRows: { col1: string; col2: string; col3: string; col4: string }[];
  previewHeaders: [string, string, string, string];
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "success" | "warning" | "info" | "alert";
  source: string;
  read: boolean;
  href?: string;
}

export interface ActivityFeedItem {
  id: string;
  title: string;
  detail: string;
  source: "SIS" | "LMS" | "Library" | "Alumni" | "HR";
  timestamp: string;
  status: "success" | "warning" | "info";
}

export interface DashboardAnalytics {
  summary: {
    totalStudents: number;
    totalStudentsTrend: string;
    activeStudents: number;
    activeStudentsSubtext: string;
    atRiskStudents: number;
    atRiskTrend: string;
    facultyStaff: number;
    facultySubtext: string;
    graduates: number;
    graduatesSubtext: string;
    alumni: number;
    alumniSubtext: string;
  };
  enrollmentTrends: {
    semester: string;
    students: number;
    newEnrollees: number;
  }[];
  performanceTrends: {
    semester: string;
    avgScore: number;
    avgGpa: number;
  }[];
  attendanceTrends: {
    month: string;
    attendance: number;
    target: number;
  }[];
  riskDistribution: {
    level: string;
    students: number;
    percentage: number;
    color: string;
  }[];
  enrollmentByProgram: {
    program: string;
    fullName: string;
    students: number;
  }[];
  graduationTrends: {
    year: string;
    graduates: number;
    employmentRate: number;
  }[];
}


export type AdminUserRole =
  | "System Administrator"
  | "University Registrar Admin"
  | "Data Integration Engineer"
  | "Institutional Data Steward";

export type AdminUserStatus = "Active" | "Inactive" | "Invited";

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  department: string;
  status: AdminUserStatus;
  mfaEnabled: boolean;
  lastActive: string;
}

export interface AdminDataSourceOverviewItem {
  id: string;
  code: string;
  name: string;
  shortLabel: string;
  status: DataSourceStatus;
  lastSync: string;
  records: number;
  description: string;
}

export interface AdminLifecycleStageStat {
  stage: "Enrollment" | "Learning" | "Graduation" | "Alumni";
  count: number;
  subtitle: string;
  sourceLabel: string;
}

export interface RecentSyncRow {
  id: string;
  dataSource: string;
  fullName: string;
  lastSync: string;
  records: number;
  status: DataSourceStatus;
}

export interface SyncHistoryRecord {
  id: string;
  dataSource: string;
  fullName: string;
  syncMode: "Scheduled Incremental" | "Manual Full Sync" | "Schema Verification";
  lastSync: string;
  records: number;
  duration: string;
  status: DataSourceStatus;
  notes: string;
}

export interface AdminDashboardOverview {
  summary: {
    totalStudents: number;
    totalStudentsSubtext: string;
    activeStudents: number;
    activeStudentsSubtext: string;
    graduatingStudents: number;
    graduatingStudentsSubtext: string;
    alumni: number;
    alumniSubtext: string;
    connectedDataSources: string;
    connectedDataSourcesSubtext: string;
    lastSuccessfulSync: string;
    lastSuccessfulSyncSubtext: string;
  };
  dataSources: AdminDataSourceOverviewItem[];
  lifecycleOverview: AdminLifecycleStageStat[];
  recentSynchronization: RecentSyncRow[];
  analyticsPreview: {
    enrollmentTrends: { term: string; enrolled: number; newIntake: number }[];
    academicPerformance: { term: string; avgScore: number; avgGpa: number }[];
    graduationTrends: { year: string; graduates: number; employedRate: number }[];
    studentsAtRisk: { category: string; students: number; percentage: number; color: string }[];
  };
}

export type PortalAuthorizedRole = "Administrator" | "Registrar";

export interface IntegratedAlumniRecord {
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

export interface AlumniCrmSourceInfo {
  dataSource: "Alumni CRM";
  integrationMethod: "API / ETL / ELT";
  connectionStatus: DataSourceStatus;
  lastSynchronization: string;
  recordsSynchronized: number;
   graduationBatchesCount: number;
  programsRepresentedCount: number;
}

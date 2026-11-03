export type StudentStatus = "Active" | "Graduated" | "On Leave" | "Withdrawn";
export type RiskLevel = "Low" | "Medium" | "High";
export type DataSourceStatus = "Connected" | "Syncing" | "Warning" | "Disconnected" | "Planned";
export type SyncLogStatus = "Successful" | "Warning" | "Failed";
export type LifecycleStageKey =
  | "admission"
  | "enrollment"
  | "academic-progress"
  | "graduation";

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
  code: "LIBRARY";
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
  isPlanned?: boolean;
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

export interface ReportItem {
  id: string;
  title: string;
  category:
    | "Enrollment"
    | "Academic"
    | "Attendance"
    | "Retention"
    | "Graduation"
    | "Library"
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
  source: string;
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
  | "Head Administrator"
  | "System Administrator"
  | "Library Staff"
  | "Librarian"
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
  isPlanned?: boolean;
}

export interface AdminLifecycleStageStat {
  stage: "Admission" | "Enrollment" | "Learning" | "Graduation";
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
    connectedDataSources: string;
    connectedDataSourcesSubtext: string;
    lastSuccessfulSync: string;
    lastSuccessfulSyncSubtext: string;
    // Dedicated Library Integration KPIs
    totalIntegratedBooks?: number;
    totalIntegratedBooksSubtext?: string;
    totalStudentBorrowers?: number;
    totalStudentBorrowersSubtext?: string;
    totalBorrowingTransactions?: number;
    totalBorrowingTransactionsSubtext?: string;
    availableBooks?: number;
    borrowedBooks?: number;
    overdueTransactions?: number;
    overdueTransactionsSubtext?: string;
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

export type PortalAuthorizedRole = "Administrator" | "Librarian" | "Student" | "Registrar";

// -------------------------------------------------------------
// Library Integration Models & ETL Types
// -------------------------------------------------------------

export interface LibraryBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: number;
  category: string;
  callNumber: string;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  location: string;
  status: "Available" | "Partially Available" | "Checked Out";
  lastSyncedAt: string;
}

export interface BookCategory {
  id: string;
  code: string;
  name: string;
  totalTitles: number;
  totalCopies: number;
  borrowedCount: number;
}

export interface StudentBorrower {
  id: string;
  borrowerId: string;
  studentId: string;
  studentName: string;
  email: string;
  programCode: string;
  programName: string;
  yearLevel: string;
  activeLoansCount: number;
  totalLoansHistory: number;
  finesBalance: number;
  status: "Active" | "Restricted" | "Cleared";
  lastActive: string;
}

export interface BorrowingTransaction {
  id: string;
  transactionCode: string;
  bookId: string;
  bookTitle: string;
  isbn: string;
  studentId: string;
  studentName: string;
  programCode: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: "Borrowed" | "Returned" | "Overdue";
  finesAccrued: number;
  sourceSystem: string;
}

export interface ReservationRecord {
  id: string;
  reservationCode: string;
  bookId: string;
  bookTitle: string;
  isbn: string;
  studentId: string;
  studentName: string;
  programCode: string;
  reservedDate: string;
  expiryDate: string;
  status: "Pending" | "Ready for Pickup" | "Fulfilled" | "Cancelled" | "Expired";
}

export interface OverdueFineRecord {
  id: string;
  transactionId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  programCode: string;
  dueDate: string;
  daysOverdue: number;
  fineAmount: number;
  paymentStatus: "Unpaid" | "Waived" | "Paid";
}

export interface LibraryETLLog {
  id: string;
  jobName: string;
  status: "Completed" | "Running" | "Failed";
  startedAt: string;
  completedAt: string;
  duration: string;
  recordsExtracted: number;
  recordsValidated: number;
  duplicatesCleaned: number;
  studentsMatched: number;
  recordsLoaded: number;
  errors: string[];
  executionLog: string[];
}

export interface LibraryOverview {
  kpis: {
    totalIntegratedBooks: number;
    totalStudentBorrowers: number;
    totalBorrowingTransactions: number;
    availableBooks: number;
    borrowedBooks: number;
    overdueTransactions: number;
    totalFinesRecorded: number;
    lastSyncTimestamp: string;
    connectionStatus: "Connected" | "Syncing" | "Error";
    apiEndpoint: string;
    adapterType: string;
  };
  categoryDistribution: {
    category: string;
    count: number;
    borrowed: number;
  }[];
  programBorrowingStats: {
    program: string;
    programName: string;
    activeBorrowers: number;
    activeLoans: number;
    totalBorrows: number;
  }[];
  monthlyTrend: {
    month: string;
    borrowed: number;
    returned: number;
    overdue: number;
  }[];
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  resource: string;
  status: "Success" | "Warning" | "Failure";
  ipAddress: string;
  details: string;
}

// -------------------------------------------------------------
// Student Portal Specific Types
// -------------------------------------------------------------

export type BorrowingRequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled"
  | "Completed";

export interface BorrowingRequest {
  id: string;
  requestCode: string;
  bookId: string;
  bookTitle: string;
  author: string;
  isbn: string;
  category: string;
  studentId: string;
  studentName: string;
  programCode: string;
  requestDate: string;
  status: BorrowingRequestStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  pickupDueDate?: string;
}

export type StudentReservationStatus =
  | "Pending"
  | "Ready for Pickup"
  | "Fulfilled"
  | "Cancelled"
  | "Expired";

export interface StudentNotificationItem {
  id: string;
  studentId: string;
  title: string;
  message: string;
  type: "BorrowRequest" | "DueDate" | "Reservation" | "Fine" | "General";
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface StudentLibraryDashboardSummary {
  availableBooksCount: number;
  currentBorrowedCount: number;
  pendingRequestsCount: number;
  activeReservationsCount: number;
  overdueBooksCount: number;
  outstandingFinesTotal: number;
  unreadNotificationsCount: number;
}

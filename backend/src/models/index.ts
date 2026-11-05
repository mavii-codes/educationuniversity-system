export type StudentStatus = "Active" | "Graduated" | "On Leave" | "Withdrawn";
export type RiskLevel = "Low" | "Medium" | "High";
export type DataSourceStatus = "Connected" | "Syncing" | "Warning" | "Disconnected" | "Planned";

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
  syncFrequency?: string;
  endpointPreview?: string;
  healthScore?: number;
  entitiesSynced?: string[];
  maintainerDept?: string;
  isPlanned?: boolean;
}

export interface IntegrationLogModel {
  id: string;
  sourceCode: string;
  sourceName: string;
  recordsProcessed: number;
  duplicatesDetected: number;
  failedRecords: number;
  duration?: string;
  status: "Successful" | "Warning" | "Failed";
  dateLabel?: string;
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
  cover_url?: string | null;
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

export type AuthorizedRole = "Administrator" | "Librarian" | "Student";

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

// -------------------------------------------------------------
// Library Management System & ETL Pipeline Models (Sole Data Source)
// -------------------------------------------------------------

export interface LibraryBookModel {
  id: string;
  isbn: string;
  cover_url?: string | null;
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

export interface LibraryBookWriteModel {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: number;
  category: string;
  callNumber: string;
  totalCopies: number;
  availableCopies: number;
  location: string;
  cover_url: string | null;
}

export interface BookCategoryModel {
  id: string;
  code: string;
  name: string;
  totalTitles: number;
  totalCopies: number;
  borrowedCount: number;
}

export interface StudentBorrowerModel {
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

export interface BorrowingTransactionModel {
  id: string;
  transactionCode: string;
  bookId: string;
  bookTitle: string;
  isbn: string;
  cover_url?: string | null;
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

export interface ReservationModel {
  id: string;
  reservationCode: string;
  bookId: string;
  bookTitle: string;
  isbn: string;
  cover_url?: string | null;
  studentId: string;
  studentName: string;
  programCode: string;
  reservedDate: string;
  expiryDate: string;
  status: "Pending" | "Ready for Pickup" | "Fulfilled" | "Cancelled" | "Expired";
}

export interface OverdueFineModel {
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

export interface LibraryETLLogModel {
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

export interface LibraryOverviewModel {
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

export interface AuditLogModel {
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

export type BorrowingRequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled"
  | "Completed";

export interface BorrowingRequestModel {
  id: string;
  requestCode: string;
  bookId: string;
  bookTitle: string;
  author: string;
  isbn: string;
  cover_url?: string | null;
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

export interface StudentNotificationModel {
  id: string;
  studentId: string;
  title: string;
  message: string;
  type: "BorrowRequest" | "DueDate" | "Reservation" | "Fine" | "General";
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

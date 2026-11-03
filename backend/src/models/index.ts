export type StudentStatus = "Active" | "Graduated" | "On Leave" | "Withdrawn";
export type RiskLevel = "Low" | "Medium" | "High";
export type DataSourceStatus = "Connected" | "Syncing" | "Warning" | "Disconnected" | "Planned";

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
  code: "LIBRARY";
  name: string;
  status: DataSourceStatus;
  lastSynced: string;
  recordCount: number;
  isPlanned?: boolean;
}

export interface IntegrationLogModel {
  id: string;
  sourceCode: string;
  sourceName: string;
  recordsProcessed: number;
  duplicatesDetected: number;
  failedRecords: number;
  status: "Successful" | "Warning" | "Failed";
  timestamp: string;
  notes: string;
}

export type AuthorizedRole = "Administrator" | "Registrar" | "Student";

// -------------------------------------------------------------
// Library Management System & ETL Pipeline Models (Sole Data Source)
// -------------------------------------------------------------

export interface LibraryBookModel {
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

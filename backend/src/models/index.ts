export type StudentStatus = "Active" | "Graduated" | "On Leave" | "Withdrawn";
export type RiskLevel = "Low" | "Medium" | "High";
export type DataSourceStatus = "Connected" | "Syncing" | "Warning" | "Disconnected";

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
  status: DataSourceStatus;
  lastSynced: string;
  recordCount: number;
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

export interface AlumniModel {
  id: string;
  name: string;
  graduationYear: number;
  programCode: string;
  programName: string;
  employmentStatus: string;
  currentCompany: string;
  location: string;
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

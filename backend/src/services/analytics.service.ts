import { ProgramModel } from "../models";

const SEED_PROGRAMS: ProgramModel[] = [
  {
    id: "prog-bsit",
    code: "BSIT",
    name: "BS Information Technology",
    department: "College of Computing & Information Sciences",
    enrolledCount: 1420,
    averageGpa: 3.31,
    graduationRate: 91.4,
    withdrawalRate: 3.2,
    attendanceRate: 92.8,
  },
  {
    id: "prog-bscs",
    code: "BSCS",
    name: "BS Computer Science",
    department: "College of Computing & Information Sciences",
    enrolledCount: 980,
    averageGpa: 3.38,
    graduationRate: 90.2,
    withdrawalRate: 3.8,
    attendanceRate: 93.4,
  },
  {
    id: "prog-bsba",
    code: "BSBA",
    name: "BS Business Administration",
    department: "College of Business & Management",
    enrolledCount: 1150,
    averageGpa: 3.22,
    graduationRate: 93.1,
    withdrawalRate: 2.9,
    attendanceRate: 91.2,
  },
];

export class AnalyticsService {
  async getDashboardMetrics() {
    return {
      summary: {
        totalStudents: 5240,
        activeStudents: 4820,
        atRiskStudents: 142,
        facultyStaff: 386,
        graduates: 850,
        alumni: 8400,
      },
      campusAverageGpa: 3.31,
      passingRate: 94.2,
      failingRate: 5.8,
      attendanceRate: 92.4,
    };
  }

  async getPrograms(): Promise<ProgramModel[]> {
    return [...SEED_PROGRAMS];
  }

  async getReportsCatalog() {
    return [
      { id: "rep-enrollment", title: "Student Enrollment Report", category: "Enrollment" },
      { id: "rep-performance", title: "Academic Performance Report", category: "Academic" },
      { id: "rep-attendance", title: "Attendance Report", category: "Attendance" },
      { id: "rep-risk", title: "At-Risk Student Report", category: "Retention" },
      { id: "rep-graduation", title: "Graduation Report", category: "Graduation" },
      { id: "rep-alumni", title: "Alumni Employment Report", category: "Alumni" },
      { id: "rep-integration", title: "Data Integration Report", category: "Integration" },
    ];
  }
}

export const analyticsService = new AnalyticsService();


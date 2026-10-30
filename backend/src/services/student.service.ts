import { StudentSummaryModel } from "../models";

const SEED_STUDENTS: StudentSummaryModel[] = [
  {
    id: "2024-042",
    name: "Marco Villanueva",
    email: "marco.villanueva@university.edu.ph",
    programCode: "BSIT",
    programName: "BS Information Technology",
    yearLevel: "2nd Year",
    status: "Active",
    performanceScore: 71,
    gpa: 2.1,
    attendanceRate: 78,
    riskLevel: "High",
  },
  {
    id: "2023-109",
    name: "Angela Mae Bautista",
    email: "angela.bautista@university.edu.ph",
    programCode: "BSBA",
    programName: "BS Business Administration",
    yearLevel: "4th Year",
    status: "Active",
    performanceScore: 86,
    gpa: 3.4,
    attendanceRate: 93,
    riskLevel: "Low",
  },
  {
    id: "2024-089",
    name: "Sofia Isabel Ramos",
    email: "sofia.ramos@university.edu.ph",
    programCode: "BSN",
    programName: "BS Nursing",
    yearLevel: "3rd Year",
    status: "Active",
    performanceScore: 91,
    gpa: 3.68,
    attendanceRate: 96,
    riskLevel: "Low",
  },
];

export interface StudentQuery {
  search?: string;
  program?: string;
  yearLevel?: string;
  status?: string;
  riskLevel?: string;
}

export class StudentService {
  async findAll(query: StudentQuery): Promise<StudentSummaryModel[]> {
    let items = [...SEED_STUDENTS];

    if (query.search) {
      const q = query.search.toLowerCase();
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.programName.toLowerCase().includes(q)
      );
    }
    if (query.program && query.program !== "All") {
      items = items.filter((s) => s.programCode === query.program);
    }
    if (query.yearLevel && query.yearLevel !== "All") {
      items = items.filter((s) => s.yearLevel === query.yearLevel);
    }
    if (query.status && query.status !== "All") {
      items = items.filter((s) => s.status === query.status);
    }
    if (query.riskLevel && query.riskLevel !== "All") {
      items = items.filter((s) => s.riskLevel === query.riskLevel);
    }

    return items;
  }

  async findById(id: string): Promise<StudentSummaryModel | null> {
    return SEED_STUDENTS.find((s) => s.id === id) || null;
  }

  async getLifecycleSummary() {
    return {
      overviewStats: [
        { label: "Applicants", value: 6200 },
        { label: "Enrolled", value: 5240 },
        { label: "Active", value: 4820 },
        { label: "Graduated", value: 850 },
        { label: "Alumni", value: 8400 },
      ],
      stages: [
        "Admission",
        "Enrollment",
        "Academic Progress",
        "Graduation",
        "Alumni",
      ],
    };
  }
}

export const studentService = new StudentService();


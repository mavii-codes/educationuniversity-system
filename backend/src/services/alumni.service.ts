import {
  AlumniModel,
  AuthorizedRole,
  IntegratedAlumniModel,
} from "../models";

const SEED_ALUMNI: AlumniModel[] = [
  {
    id: "ALU-2026-014",
    name: "Patricia Anne Lim",
    graduationYear: 2026,
    programCode: "BSIT",
    programName: "BS Information Technology",
    employmentStatus: "Employed",
    currentCompany: "Accenture Philippines",
    location: "Taguig City, PH",
  },
  {
    id: "ALU-2025-082",
    name: "Miguel Lorenzo Tan",
    graduationYear: 2025,
    programCode: "BSCS",
    programName: "BS Computer Science",
    employmentStatus: "Employed",
    currentCompany: "GCash (Mynt)",
    location: "Taguig City, PH",
  },
];

const INTEGRATED_ALUMNI_SEED: IntegratedAlumniModel[] = [
  {
    id: "ALM-001",
    studentId: "2022-00142",
    fullName: "Patricia Anne Lim",
    programCode: "BSIT",
    program: "BS Information Technology",
    department: "College of Computing & Information Sciences",
    batch: "2026",
    graduationDate: "May 2026",
    status: "Alumni",
    source: "Alumni CRM",
    email: "patricia.lim@alumni.university.edu",
    contactNumber: "+63 917 482 1104",
    enrollmentYear: "2022",
  },
  {
    id: "ALM-002",
    studentId: "2021-00418",
    fullName: "Camille Rose Villanueva",
    programCode: "BSBA",
    program: "BS Business Administration",
    department: "College of Business & Management",
    batch: "2025",
    graduationDate: "June 2025",
    status: "Alumni",
    source: "Alumni CRM",
    email: "camille.villanueva@alumni.university.edu",
    contactNumber: "+63 918 309 7741",
    enrollmentYear: "2021",
  },
  {
    id: "ALM-003",
    studentId: "2021-00289",
    fullName: "Miguel Lorenzo Tan",
    programCode: "BSCS",
    program: "BS Computer Science",
    department: "College of Computing & Information Sciences",
    batch: "2025",
    graduationDate: "June 2025",
    status: "Alumni",
    source: "Alumni CRM",
    email: "miguel.tan@alumni.university.edu",
    contactNumber: "+63 917 654 2290",
    enrollmentYear: "2021",
  },
];

export class AlumniService {
  private lastSynchronization = "Today, 10:42 AM";

  async getAlumniOverview() {
    return {
      records: SEED_ALUMNI,
      analytics: {
        employmentRate: 89.4,
        employedInFieldRate: 78.2,
        trackedAlumni: 18560,
      },
    };
  }

  async getIntegratedAlumni(role: AuthorizedRole) {
    const records = INTEGRATED_ALUMNI_SEED.map((record) => {
      if (role === "Registrar") {
        // Redact extended phone numbers for Registrar-scoped responses
        const { contactNumber: _redacted, ...registrarView } = record;
        return registrarView;
      }
      return record;
    });

    return {
      sourceInfo: {
        dataSource: "Alumni CRM" as const,
        integrationMethod: "API / ETL / ELT" as const,
        connectionStatus: "Connected" as const,
        lastSynchronization: this.lastSynchronization,
        recordsSynchronized: 18560,
        graduationBatchesCount: 5,
        programsRepresentedCount: 6,
      },
      records,
    };
  }

  async triggerCrmSync() {
    this.lastSynchronization = "Just now";
    return {
      lastSynchronization: this.lastSynchronization,
    };
  }
}

export const alumniService = new AlumniService();

import { AlumniModel } from "../models";

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

export class AlumniService {
  async getAlumniOverview() {
    return {
      records: SEED_ALUMNI,
      analytics: {
        employmentRate: 89.4,
        employedInFieldRate: 78.2,
        trackedAlumni: 8400,
      },
    };
  }
}

export const alumniService = new AlumniService();


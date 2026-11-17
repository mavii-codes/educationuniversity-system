/**
 * External-system extract fixtures for the University ETL/ELT pipeline.
 *
 * These rows emulate raw payloads pulled from the campus SIS, LMS, HR system
 * and Alumni CRM. Student numbers and program codes intentionally reuse the
 * seed dataset so foreign keys resolve in PostgreSQL.
 *
 * Every source also carries deliberately invalid/duplicate rows so the
 * Validate and Clean stages produce real rejects and dedupe counts.
 */

export type EtlSourceCode = "SIS" | "LMS" | "HR" | "ALUMNI_CRM" | "LIBRARY";
export type EtlSourceStatus = "Connected" | "Degraded" | "Disabled";
export type EtlRunStatus = "Completed" | "Partial" | "Failed";

export const SEED_PROGRAM_CODES = [
  "BSIT",
  "BSCS",
  "BSBA",
  "BSN",
  "BSCE",
  "BSED",
] as const;

export type SeedProgramCode = (typeof SEED_PROGRAM_CODES)[number];

export interface EtlSourceDefinition {
  code: EtlSourceCode;
  name: string;
  description: string;
  adapter: string;
}

export const ETL_SOURCE_DEFINITIONS: readonly EtlSourceDefinition[] = [
  {
    code: "SIS",
    name: "Student Information System",
    description:
      "Authoritative registrar extract for student identity, program placement and term enrollments.",
    adapter: "REST/JSON · Oracle SIS Registrar Extract",
  },
  {
    code: "LMS",
    name: "Learning Management System",
    description:
      "Canvas learning activity, assignment completion and course progress for enrolled students.",
    adapter: "LTI 1.3 / REST · Canvas LMS",
  },
  {
    code: "HR",
    name: "Human Resources Information System",
    description:
      "Student assistantship and work-study employment records for the HR master file.",
    adapter: "SOAP/XML · Campus HRIS",
  },
  {
    code: "ALUMNI_CRM",
    name: "Alumni Relations CRM",
    description:
      "Alumni contact profiles, graduation batches and employment outcomes from the alumni CRM.",
    adapter: "REST/JSON · Salesforce Alumni CRM",
  },
  {
    code: "LIBRARY",
    name: "Integrated Library System",
    description:
      "Catalog, borrower, circulation, reservation and fine records from the library LMS.",
    adapter: "REST/JSON · Koha/Folio Library API",
  },
];

export const ALL_ETL_SOURCE_CODES: readonly EtlSourceCode[] =
  ETL_SOURCE_DEFINITIONS.map((definition) => definition.code);

// ---------------------------------------------------------------------------
// SIS — students + enrollments
// ---------------------------------------------------------------------------

export interface RawSisStudent {
  student_number: string;
  full_name: string;
  campus_email: string;
  program_code: string;
  year_level: string;
  enrollment_status: "Active" | "Graduated" | "On Leave" | "Withdrawn";
  performance_score: number;
  cumulative_gpa: number;
  attendance_rate: number;
  risk_level: "Low" | "Medium" | "High";
  department?: string;
  adviser?: string;
  admission_year?: number;
  expected_graduation?: number;
  contact_number?: string;
  address?: string;
  current_semester?: string;
  units_earned?: number;
  units_required?: number;
}

export interface RawSisEnrollment {
  student_number: string;
  course_code: string;
  course_title: string;
  term: string;
  units: number;
  midterm_grade?: number | null;
  final_grade?: number | null;
  gpa_equivalent?: number | null;
  instructor?: string;
  status: "Passed" | "In Progress" | "At Risk";
}

export const RAW_SIS_STUDENTS: readonly RawSisStudent[] = [
  {
    student_number: "2024-042",
    full_name: "Marco Villanueva",
    campus_email: "marco.villanueva@university.edu.ph",
    program_code: "BSIT",
    year_level: "2nd Year",
    enrollment_status: "Active",
    performance_score: 71,
    cumulative_gpa: 2.1,
    attendance_rate: 78,
    risk_level: "High",
    department: "College of Computing & Information Sciences",
    adviser: "Prof. Elena Reyes, MIT",
    admission_year: 2025,
    expected_graduation: 2029,
    contact_number: "+63 918 332 7811",
    address: "Pasig City, Metro Manila",
    current_semester: "1st Semester, AY 2026-2027",
    units_earned: 42,
    units_required: 148,
  },
  {
    student_number: "2023-109",
    full_name: "Angela Mae Bautista",
    campus_email: "angela.bautista@university.edu.ph",
    program_code: "BSBA",
    year_level: "4th Year",
    enrollment_status: "Active",
    performance_score: 86,
    cumulative_gpa: 3.4,
    attendance_rate: 93,
    risk_level: "Low",
    department: "College of Business & Management",
    adviser: "Dr. Victor Soriano",
    admission_year: 2023,
    expected_graduation: 2027,
    contact_number: "+63 917 605 4492",
    address: "Mandaluyong City, Metro Manila",
    current_semester: "1st Semester, AY 2026-2027",
    units_earned: 126,
    units_required: 144,
  },
  {
    student_number: "2025-074",
    full_name: "Carlo Miguel Mendoza",
    campus_email: "carlo.mendoza@university.edu.ph",
    program_code: "BSCS",
    year_level: "2nd Year",
    enrollment_status: "Active",
    performance_score: 73,
    cumulative_gpa: 2.15,
    attendance_rate: 76,
    risk_level: "High",
    department: "College of Computing & Information Sciences",
    adviser: "Dr. Alicia Gomez",
    admission_year: 2025,
    expected_graduation: 2029,
    contact_number: "+63 919 204 8831",
    address: "Taguig City, Metro Manila",
    current_semester: "1st Semester, AY 2026-2027",
    units_earned: 40,
    units_required: 150,
  },
  {
    student_number: "2024-089",
    full_name: "Sofia Isabel Ramos",
    campus_email: "sofia.ramos@university.edu.ph",
    program_code: "BSN",
    year_level: "3rd Year",
    enrollment_status: "Active",
    performance_score: 91,
    cumulative_gpa: 3.68,
    attendance_rate: 96,
    risk_level: "Low",
    department: "College of Allied Health Sciences",
    adviser: "Dr. Teresa Navarro, RN",
    admission_year: 2024,
    expected_graduation: 2028,
    contact_number: "+63 917 512 9084",
    address: "Manila City, Metro Manila",
    current_semester: "1st Semester, AY 2026-2027",
    units_earned: 102,
    units_required: 162,
  },
  {
    student_number: "2025-112",
    full_name: "Gabriel Luis Torres",
    campus_email: "gabriel.torres@university.edu.ph",
    program_code: "BSCE",
    year_level: "2nd Year",
    enrollment_status: "Active",
    performance_score: 79,
    cumulative_gpa: 2.58,
    attendance_rate: 84,
    risk_level: "Medium",
    department: "College of Engineering & Architecture",
    adviser: "Engr. Roberto Aquino",
    admission_year: 2025,
    expected_graduation: 2029,
    contact_number: "+63 917 771 3920",
    address: "Marikina City, Metro Manila",
    current_semester: "1st Semester, AY 2026-2027",
    units_earned: 46,
    units_required: 160,
  },
  {
    student_number: "2026-015",
    full_name: "Daniela Joy Pascual",
    campus_email: "daniela.pascual@university.edu.ph",
    program_code: "BSED",
    year_level: "1st Year",
    enrollment_status: "Active",
    performance_score: 89,
    cumulative_gpa: 3.56,
    attendance_rate: 95,
    risk_level: "Low",
    department: "College of Education & Liberal Arts",
    adviser: "Dr. Lorna Castillo",
    admission_year: 2026,
    expected_graduation: 2030,
    contact_number: "+63 917 692 5531",
    address: "Caloocan City, Metro Manila",
    current_semester: "1st Semester, AY 2026-2027",
    units_earned: 21,
    units_required: 152,
  },
  {
    student_number: "2025-204",
    full_name: "Jerome Patrick Ocampo",
    campus_email: "jerome.ocampo@university.edu.ph",
    program_code: "BSCE",
    year_level: "2nd Year",
    enrollment_status: "Active",
    performance_score: 70,
    cumulative_gpa: 1.98,
    attendance_rate: 74,
    risk_level: "High",
    department: "College of Engineering & Architecture",
    adviser: "Engr. Roberto Aquino",
    admission_year: 2025,
    expected_graduation: 2029,
    contact_number: "+63 919 843 2219",
    address: "Antipolo, Rizal",
    current_semester: "1st Semester, AY 2026-2027",
    units_earned: 39,
    units_required: 160,
  },
  // Intentional duplicate (same natural key as 2024-042) — removed by Clean.
  {
    student_number: "2024-042",
    full_name: "Marco Villanueva",
    campus_email: "marco.villanueva@university.edu.ph",
    program_code: "BSIT",
    year_level: "2nd Year",
    enrollment_status: "Active",
    performance_score: 71,
    cumulative_gpa: 2.1,
    attendance_rate: 78,
    risk_level: "High",
    department: "College of Computing & Information Sciences",
    adviser: "Prof. Elena Reyes, MIT",
    admission_year: 2025,
    expected_graduation: 2029,
    contact_number: "+63 918 332 7811",
    address: "Pasig City, Metro Manila",
    current_semester: "1st Semester, AY 2026-2027",
    units_earned: 42,
    units_required: 148,
  },
  // Intentional invalid row — malformed email.
  {
    student_number: "2024-136",
    full_name: "Rafael Antonio Rivera",
    campus_email: "rafael.rivera[at]university.edu.ph",
    program_code: "BSBA",
    year_level: "3rd Year",
    enrollment_status: "On Leave",
    performance_score: 80,
    cumulative_gpa: 2.75,
    attendance_rate: 85,
    risk_level: "Medium",
    department: "College of Business & Management",
    adviser: "Dr. Victor Soriano",
    admission_year: 2024,
    expected_graduation: 2028,
    contact_number: "+63 918 550 6129",
    address: "Paranaque City, Metro Manila",
    current_semester: "Approved Leave of Absence - 1st Sem AY 2026-2027",
    units_earned: 78,
    units_required: 144,
  },
  // Intentional invalid row — missing required name.
  {
    student_number: "2025-258",
    full_name: "",
    campus_email: "katrina.deleon@university.edu.ph",
    program_code: "BSBA",
    year_level: "2nd Year",
    enrollment_status: "Withdrawn",
    performance_score: 76,
    cumulative_gpa: 2.4,
    attendance_rate: 81,
    risk_level: "Medium",
    department: "College of Business & Management",
    adviser: "Prof. Clarissa Chua",
    admission_year: 2025,
    expected_graduation: 2029,
    contact_number: "+63 917 309 8412",
    address: "Las Pinas City, Metro Manila",
    current_semester: "Honorable Dismissal / Transfer - Aug 2026",
    units_earned: 38,
    units_required: 144,
  },
];

const ACTIVE_TERM = "1st Semester, AY 2026-2027";

export const RAW_SIS_ENROLLMENTS: readonly RawSisEnrollment[] = [
  {
    student_number: "2024-042",
    course_code: "IT 201",
    course_title: "Data Structures and Algorithms",
    term: ACTIVE_TERM,
    units: 3,
    midterm_grade: 70,
    final_grade: 71,
    gpa_equivalent: 2.1,
    instructor: "Prof. Elena Reyes, MIT",
    status: "At Risk",
  },
  {
    student_number: "2024-042",
    course_code: "IT 203",
    course_title: "Object-Oriented Programming",
    term: ACTIVE_TERM,
    units: 3,
    midterm_grade: 72,
    final_grade: 73,
    gpa_equivalent: 2.2,
    instructor: "Prof. Elena Reyes, MIT",
    status: "At Risk",
  },
  {
    student_number: "2023-109",
    course_code: "BA 401",
    course_title: "Strategic Management",
    term: ACTIVE_TERM,
    units: 3,
    midterm_grade: 87,
    final_grade: 88,
    gpa_equivalent: 3.45,
    instructor: "Dr. Victor Soriano",
    status: "In Progress",
  },
  {
    student_number: "2023-109",
    course_code: "BA 405",
    course_title: "Business Analytics and Decision Making",
    term: ACTIVE_TERM,
    units: 3,
    midterm_grade: 85,
    final_grade: 86,
    gpa_equivalent: 3.35,
    instructor: "Prof. Clarissa Chua",
    status: "In Progress",
  },
  {
    student_number: "2025-074",
    course_code: "CS 201",
    course_title: "Discrete Mathematics",
    term: ACTIVE_TERM,
    units: 3,
    midterm_grade: 73,
    final_grade: 74,
    gpa_equivalent: 2.2,
    instructor: "Dr. Alicia Gomez",
    status: "At Risk",
  },
  {
    student_number: "2024-089",
    course_code: "NURS 301",
    course_title: "Medical-Surgical Nursing",
    term: ACTIVE_TERM,
    units: 5,
    midterm_grade: 91,
    final_grade: 92,
    gpa_equivalent: 3.7,
    instructor: "Dr. Teresa Navarro, RN",
    status: "In Progress",
  },
  {
    student_number: "2025-112",
    course_code: "CE 202",
    course_title: "Mechanics of Deformable Bodies",
    term: ACTIVE_TERM,
    units: 4,
    midterm_grade: 77,
    final_grade: 78,
    gpa_equivalent: 2.45,
    instructor: "Engr. Roberto Aquino",
    status: "In Progress",
  },
  {
    student_number: "2026-015",
    course_code: "EDUC 101",
    course_title: "Child & Adolescent Learners and Learning Principles",
    term: ACTIVE_TERM,
    units: 3,
    midterm_grade: 90,
    final_grade: 91,
    gpa_equivalent: 3.65,
    instructor: "Dr. Lorna Castillo",
    status: "In Progress",
  },
  {
    student_number: "2025-204",
    course_code: "CE 201",
    course_title: "Statics of Rigid Bodies",
    term: ACTIVE_TERM,
    units: 3,
    midterm_grade: 68,
    final_grade: 70,
    gpa_equivalent: 1.85,
    instructor: "Engr. Roberto Aquino",
    status: "At Risk",
  },
  // Intentional duplicate enrollment natural key — removed by Clean.
  {
    student_number: "2024-042",
    course_code: "IT 201",
    course_title: "Data Structures and Algorithms",
    term: ACTIVE_TERM,
    units: 3,
    midterm_grade: 70,
    final_grade: 71,
    gpa_equivalent: 2.1,
    instructor: "Prof. Elena Reyes, MIT",
    status: "At Risk",
  },
  // Intentional invalid row — negative units.
  {
    student_number: "2026-015",
    course_code: "GE 101",
    course_title: "Purposive Communication",
    term: ACTIVE_TERM,
    units: -3,
    midterm_grade: 88,
    final_grade: 89,
    gpa_equivalent: 3.5,
    instructor: "Prof. Ramon Cruz",
    status: "In Progress",
  },
];

// ---------------------------------------------------------------------------
// LMS — course progress
// ---------------------------------------------------------------------------

export interface RawLmsProgress {
  student_number: string;
  course_code: string;
  course_title: string;
  completion_pct: number;
  assignments_completed: number;
  assignments_total: number;
  last_active_at: string;
}

export const RAW_LMS_PROGRESS: readonly RawLmsProgress[] = [
  {
    student_number: "2024-042",
    course_code: "IT 201",
    course_title: "Data Structures and Algorithms",
    completion_pct: 55,
    assignments_completed: 3,
    assignments_total: 6,
    last_active_at: "2026-11-10T08:30:00Z",
  },
  {
    student_number: "2024-042",
    course_code: "IT 203",
    course_title: "Object-Oriented Programming",
    completion_pct: 64,
    assignments_completed: 4,
    assignments_total: 6,
    last_active_at: "2026-11-09T14:15:00Z",
  },
  {
    student_number: "2023-109",
    course_code: "BA 401",
    course_title: "Strategic Management",
    completion_pct: 95,
    assignments_completed: 9,
    assignments_total: 9,
    last_active_at: "2026-11-11T02:05:00Z",
  },
  {
    student_number: "2025-074",
    course_code: "CS 201",
    course_title: "Discrete Mathematics",
    completion_pct: 58,
    assignments_completed: 4,
    assignments_total: 8,
    last_active_at: "2026-11-08T11:45:00Z",
  },
  {
    student_number: "2024-089",
    course_code: "NURS 301",
    course_title: "Medical-Surgical Nursing",
    completion_pct: 100,
    assignments_completed: 10,
    assignments_total: 10,
    last_active_at: "2026-11-11T06:20:00Z",
  },
  {
    student_number: "2025-112",
    course_code: "CE 202",
    course_title: "Mechanics of Deformable Bodies",
    completion_pct: 78,
    assignments_completed: 7,
    assignments_total: 9,
    last_active_at: "2026-11-10T16:40:00Z",
  },
  {
    student_number: "2026-015",
    course_code: "EDUC 101",
    course_title: "Child & Adolescent Learners and Learning Principles",
    completion_pct: 100,
    assignments_completed: 8,
    assignments_total: 8,
    last_active_at: "2026-11-11T01:10:00Z",
  },
  {
    student_number: "2025-204",
    course_code: "CE 201",
    course_title: "Statics of Rigid Bodies",
    completion_pct: 50,
    assignments_completed: 4,
    assignments_total: 8,
    last_active_at: "2026-11-07T09:00:00Z",
  },
  // Intentional duplicate natural key — removed by Clean.
  {
    student_number: "2024-042",
    course_code: "IT 201",
    course_title: "Data Structures and Algorithms",
    completion_pct: 55,
    assignments_completed: 3,
    assignments_total: 6,
    last_active_at: "2026-11-10T08:30:00Z",
  },
  // Intentional invalid row — completion above 100%.
  {
    student_number: "2023-109",
    course_code: "BA 405",
    course_title: "Business Analytics and Decision Making",
    completion_pct: 145,
    assignments_completed: 7,
    assignments_total: 8,
    last_active_at: "2026-11-09T10:25:00Z",
  },
  // Intentional invalid row — missing required course code.
  {
    student_number: "2025-074",
    course_code: "",
    course_title: "Operating Systems",
    completion_pct: 62,
    assignments_completed: 5,
    assignments_total: 8,
    last_active_at: "2026-11-06T13:30:00Z",
  },
];

// ---------------------------------------------------------------------------
// HR — student employment
// ---------------------------------------------------------------------------

export interface RawHrEmployment {
  employment_id: string;
  student_number: string;
  department: string;
  position_title: string;
  employment_status: "Active" | "Ended" | "On Leave";
  hired_on: string;
  supervisor?: string;
  weekly_hours: number;
}

export const RAW_HR_EMPLOYMENT: readonly RawHrEmployment[] = [
  {
    employment_id: "HR-1001",
    student_number: "2024-042",
    department: "College of Computing & Information Sciences",
    position_title: "Student Assistant - IT Helpdesk",
    employment_status: "Active",
    hired_on: "2026-06-15",
    supervisor: "Engr. Paolo Cruz",
    weekly_hours: 12.5,
  },
  {
    employment_id: "HR-1002",
    student_number: "2025-074",
    department: "College of Computing & Information Sciences",
    position_title: "LMS Peer Tutor",
    employment_status: "Active",
    hired_on: "2026-07-01",
    supervisor: "Dr. Alicia Gomez",
    weekly_hours: 10,
  },
  {
    employment_id: "HR-1003",
    student_number: "2024-089",
    department: "College of Allied Health Sciences",
    position_title: "Nursing Laboratory Assistant",
    employment_status: "Active",
    hired_on: "2026-06-20",
    supervisor: "Dr. Teresa Navarro, RN",
    weekly_hours: 8,
  },
  {
    employment_id: "HR-1004",
    student_number: "2022-031",
    department: "College of Computing & Information Sciences",
    position_title: "Alumni Relations Assistant",
    employment_status: "Ended",
    hired_on: "2025-08-01",
    supervisor: "Prof. Elena Reyes, MIT",
    weekly_hours: 15,
  },
  {
    employment_id: "HR-1005",
    student_number: "2026-015",
    department: "University Library",
    position_title: "Library Student Assistant",
    employment_status: "On Leave",
    hired_on: "2026-08-15",
    supervisor: "Ms. Carmela Dizon",
    weekly_hours: 6,
  },
  {
    employment_id: "HR-1006",
    student_number: "2025-204",
    department: "College of Engineering & Architecture",
    position_title: "Engineering Laboratory Aide",
    employment_status: "Active",
    hired_on: "2026-06-10",
    supervisor: "Engr. Roberto Aquino",
    weekly_hours: 12,
  },
  // Intentional duplicate natural key — removed by Clean.
  {
    employment_id: "HR-1001",
    student_number: "2024-042",
    department: "College of Computing & Information Sciences",
    position_title: "Student Assistant - IT Helpdesk",
    employment_status: "Active",
    hired_on: "2026-06-15",
    supervisor: "Engr. Paolo Cruz",
    weekly_hours: 12.5,
  },
  // Intentional invalid row — negative weekly hours.
  {
    employment_id: "HR-1007",
    student_number: "2025-112",
    department: "College of Engineering & Architecture",
    position_title: "Survey Field Assistant",
    employment_status: "Active",
    hired_on: "2026-09-01",
    supervisor: "Engr. Roberto Aquino",
    weekly_hours: -4,
  },
  // Intentional invalid row — missing required department.
  {
    employment_id: "HR-1008",
    student_number: "2023-109",
    department: "",
    position_title: "Business Office Assistant",
    employment_status: "Active",
    hired_on: "2026-07-15",
    supervisor: "Prof. Clarissa Chua",
    weekly_hours: 9,
  },
];

// ---------------------------------------------------------------------------
// Alumni CRM — alumni records
// ---------------------------------------------------------------------------

export interface RawAlumniCrmRecord {
  crm_record_id: string;
  student_number: string;
  full_name: string;
  graduation_year: number;
  program_code: string;
  program_name: string;
  department: string;
  batch: string;
  graduation_date: string;
  enrollment_year: string;
  employment_status: string;
  current_company?: string;
  job_title?: string;
  industry?: string;
  location?: string;
  email?: string;
  contact_number?: string;
  aligned_with_degree: boolean;
}

export const RAW_ALUMNI_CRM_RECORDS: readonly RawAlumniCrmRecord[] = [
  {
    crm_record_id: "CRM-2026-001",
    student_number: "2022-031",
    full_name: "Patricia Anne Lim",
    graduation_year: 2026,
    program_code: "BSIT",
    program_name: "BS Information Technology",
    department: "College of Computing & Information Sciences",
    batch: "2026",
    graduation_date: "May 2026",
    enrollment_year: "2022",
    employment_status: "Employed",
    current_company: "Accenture Philippines",
    job_title: "Cloud Data Engineer",
    industry: "IT & Consulting",
    location: "Taguig City, PH",
    email: "patricia.lim@alumni.university.edu",
    contact_number: "+63 917 482 1104",
    aligned_with_degree: true,
  },
  {
    crm_record_id: "CRM-2025-014",
    student_number: "2023-109",
    full_name: "Angela Mae Bautista",
    graduation_year: 2025,
    program_code: "BSBA",
    program_name: "BS Business Administration",
    department: "College of Business & Management",
    batch: "2025",
    graduation_date: "June 2025",
    enrollment_year: "2021",
    employment_status: "Employed",
    current_company: "Ayala Land, Inc.",
    job_title: "Corporate Planning Analyst",
    industry: "Real Estate & Finance",
    location: "Makati City, PH",
    email: "angela.bautista@alumni.university.edu",
    contact_number: "+63 918 309 7741",
    aligned_with_degree: true,
  },
  {
    crm_record_id: "CRM-2025-027",
    student_number: "2024-089",
    full_name: "Sofia Isabel Ramos",
    graduation_year: 2025,
    program_code: "BSN",
    program_name: "BS Nursing",
    department: "College of Allied Health Sciences",
    batch: "2025",
    graduation_date: "June 2025",
    enrollment_year: "2021",
    employment_status: "Employed",
    current_company: "St. Luke's Medical Center",
    job_title: "Critical Care Registered Nurse",
    industry: "Healthcare",
    location: "Quezon City, PH",
    email: "sofia.ramos@alumni.university.edu",
    contact_number: "+63 919 842 5531",
    aligned_with_degree: true,
  },
  {
    crm_record_id: "CRM-2024-045",
    student_number: "2025-112",
    full_name: "Gabriel Luis Torres",
    graduation_year: 2024,
    program_code: "BSCE",
    program_name: "BS Civil Engineering",
    department: "College of Engineering & Architecture",
    batch: "2024",
    graduation_date: "May 2024",
    enrollment_year: "2020",
    employment_status: "Employed",
    current_company: "DMCI Homes",
    job_title: "Structural Project Engineer",
    industry: "Construction & Engineering",
    location: "Makati City, PH",
    email: "gabriel.torres@alumni.university.edu",
    contact_number: "+63 917 654 2290",
    aligned_with_degree: true,
  },
  {
    crm_record_id: "CRM-2024-045-DUP",
    student_number: "2025-112",
    full_name: "Gabriel Luis Torres",
    graduation_year: 2024,
    program_code: "BSCE",
    program_name: "BS Civil Engineering",
    department: "College of Engineering & Architecture",
    batch: "2024",
    graduation_date: "May 2024",
    enrollment_year: "2020",
    employment_status: "Employed",
    current_company: "DMCI Homes",
    location: "Makati City, PH",
    aligned_with_degree: true,
  },
  {
    crm_record_id: "CRM-2024-063",
    student_number: "2024-136",
    full_name: "Rafael Antonio Rivera",
    graduation_year: 2024,
    program_code: "BSBA",
    program_name: "BS Business Administration",
    department: "College of Business & Management",
    batch: "2024",
    graduation_date: "May 2024",
    enrollment_year: "2020",
    employment_status: "Postgraduate Studies",
    current_company: "University Graduate School",
    job_title: "MBA Fellow",
    industry: "Higher Education",
    location: "Manila, PH",
    email: "rafael.rivera@alumni.university.edu",
    contact_number: "+63 918 550 6129",
    aligned_with_degree: true,
  },
  {
    crm_record_id: "CRM-2024-091",
    student_number: "2025-258",
    full_name: "Katrina Mae De Leon",
    graduation_year: 2024,
    program_code: "BSED",
    program_name: "BS Secondary Education",
    department: "College of Education & Liberal Arts",
    batch: "2024",
    graduation_date: "May 2024",
    enrollment_year: "2020",
    employment_status: "Employed",
    current_company: "DepEd NCR",
    job_title: "Junior High School Teacher",
    industry: "Basic Education",
    location: "Caloocan City, PH",
    email: "katrina.deleon@alumni.university.edu",
    contact_number: "+63 917 309 8412",
    aligned_with_degree: true,
  },
  // Intentional duplicate natural key — removed by Clean.
  {
    crm_record_id: "CRM-2026-001",
    student_number: "2022-031",
    full_name: "Patricia Anne Lim",
    graduation_year: 2026,
    program_code: "BSIT",
    program_name: "BS Information Technology",
    department: "College of Computing & Information Sciences",
    batch: "2026",
    graduation_date: "May 2026",
    enrollment_year: "2022",
    employment_status: "Employed",
    current_company: "Accenture Philippines",
    job_title: "Cloud Data Engineer",
    industry: "IT & Consulting",
    location: "Taguig City, PH",
    email: "patricia.lim@alumni.university.edu",
    contact_number: "+63 917 482 1104",
    aligned_with_degree: true,
  },
  // Intentional invalid row — graduation year outside valid range.
  {
    crm_record_id: "CRM-2026-099",
    student_number: "2025-074",
    full_name: "Carlo Miguel Mendoza",
    graduation_year: 1800,
    program_code: "BSCS",
    program_name: "BS Computer Science",
    department: "College of Computing & Information Sciences",
    batch: "2026",
    graduation_date: "May 2026",
    enrollment_year: "2022",
    employment_status: "Employed",
    current_company: "GCash (Mynt)",
    job_title: "Backend Software Engineer",
    industry: "Financial Technology",
    location: "Taguig City, PH",
    email: "carlo.mendoza@alumni.university.edu",
    contact_number: "+63 919 204 8831",
    aligned_with_degree: true,
  },
  // Intentional invalid row — malformed email.
  {
    crm_record_id: "CRM-2026-098",
    student_number: "2026-015",
    full_name: "Daniela Joy Pascual",
    graduation_year: 2026,
    program_code: "BSED",
    program_name: "BS Secondary Education",
    department: "College of Education & Liberal Arts",
    batch: "2026",
    graduation_date: "May 2026",
    enrollment_year: "2022",
    employment_status: "Unemployed",
    location: "Caloocan City, PH",
    email: "not-an-email",
    contact_number: "+63 917 692 5531",
    aligned_with_degree: false,
  },
];

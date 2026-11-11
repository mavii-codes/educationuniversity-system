import { env } from "../config/env";
import { seedDataset } from "../data/dataset";
import { StudentModel, StudentQuery } from "../models";
import * as studentRepository from "../repositories/student.repository";
import { FerpaViewer, ferpaService } from "./ferpa.service";

function filterSeedStudents(query: StudentQuery): StudentModel[] {
  let items = seedDataset.students.map((student) => ({ ...student }));

  if (query.search) {
    const q = query.search.toLowerCase();
    items = items.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.programName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
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

export class StudentService {
  async findAll(
    query: StudentQuery = {},
    viewer?: FerpaViewer
  ): Promise<StudentModel[]> {
    const students = env.db.enabled
      ? await studentRepository.findAll(query)
      : filterSeedStudents(query);

    if (!viewer || viewer.portalRole === "Student") {
      return students;
    }

    let visibleStudents = students;
    if (viewer.portalRole === "Librarian" && students.length > 0) {
      // One batch lookup for the whole page — never query opt-outs per row.
      const optOutIds = await ferpaService.getDirectoryOptOutIds(
        students.map((student) => student.id)
      );
      visibleStudents = students.map((student) =>
        ferpaService.getMaskedStudent(student, {
          ...viewer,
          directoryOptOut: optOutIds.has(student.id),
        })
      );
    }

    // Directory reads are logged once per request in DB mode. The access log
    // requires a concrete student row, so the first returned record anchors it.
    if (env.db.enabled && students.length > 0) {
      await ferpaService.logStudentAccess({
        studentId: students[0].id,
        viewer,
        action: "VIEW_DIRECTORY",
      });
    }

    return visibleStudents;
  }

  async findById(id: string): Promise<StudentModel | null> {
    if (env.db.enabled) {
      return studentRepository.findById(id);
    }
    return seedDataset.students.find((student) => student.id === id) ?? null;
  }
}

export const studentService = new StudentService();

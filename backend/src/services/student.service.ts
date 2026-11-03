import { env } from "../config/env";
import { seedDataset } from "../data/dataset";
import { StudentModel, StudentQuery } from "../models";
import * as studentRepository from "../repositories/student.repository";

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
  async findAll(query: StudentQuery = {}): Promise<StudentModel[]> {
    if (env.db.enabled) {
      return studentRepository.findAll(query);
    }
    return filterSeedStudents(query);
  }

  async findById(id: string): Promise<StudentModel | null> {
    if (env.db.enabled) {
      return studentRepository.findById(id);
    }
    return seedDataset.students.find((student) => student.id === id) ?? null;
  }
}

export const studentService = new StudentService();

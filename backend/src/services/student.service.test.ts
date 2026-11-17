import { afterEach, describe, expect, it } from "vitest";
import { env } from "../config/env";
import { seedDataset } from "../data/dataset";
import { FERPA_RESTRICTED_VALUE, FerpaViewer } from "./ferpa.service";
import { studentService } from "./student.service";

const librarian: FerpaViewer = {
  id: "usr-librarian-001",
  name: "Library Staff",
  portalRole: "Librarian",
};

const studentIds = (students: { id: string }[]) => students.map((student) => student.id);

afterEach(() => {
  env.db.enabled = false;
});

describe("studentService.findPaged (mock mode)", () => {
  it("slices the seed roster and reports the unpaginated total", async () => {
    const firstPage = await studentService.findPaged({}, 1, 4);

    expect(firstPage.total).toBe(seedDataset.students.length);
    expect(firstPage.items).toHaveLength(4);
    expect(studentIds(firstPage.items)).toEqual(
      studentIds(seedDataset.students.slice(0, 4))
    );

    const lastPage = await studentService.findPaged({}, 3, 4);
    expect(lastPage.total).toBe(seedDataset.students.length);
    expect(lastPage.items).toHaveLength(2);
    expect(studentIds(lastPage.items)).toEqual(
      studentIds(seedDataset.students.slice(8, 10))
    );
  });

  it("applies filters before slicing and keeps the filtered total", async () => {
    const firstPage = await studentService.findPaged({ program: "BSIT" }, 1, 1);

    expect(firstPage.total).toBe(2);
    expect(studentIds(firstPage.items)).toEqual(["2024-042"]);

    const secondPage = await studentService.findPaged({ program: "BSIT" }, 2, 1);
    expect(secondPage.total).toBe(2);
    expect(studentIds(secondPage.items)).toEqual(["2022-031"]);
  });

  it("combines search, year level, and status filters before paginating", async () => {
    const result = await studentService.findPaged(
      { search: "bs", yearLevel: "2nd Year", status: "Active" },
      1,
      10
    );

    expect(result.total).toBeGreaterThan(0);
    expect(
      result.items.every(
        (student) =>
          student.yearLevel === "2nd Year" && student.status === "Active"
      )
    ).toBe(true);
  });

  it("returns an empty page with the total intact when the page is out of range", async () => {
    const result = await studentService.findPaged({}, 999, 10);

    expect(result.items).toEqual([]);
    expect(result.total).toBe(seedDataset.students.length);
  });

  it("keeps the unpaginated findAll response unchanged", async () => {
    const students = await studentService.findAll();

    expect(students).toHaveLength(seedDataset.students.length);
    expect(studentIds(students)).toEqual(studentIds(seedDataset.students));
  });

  it("applies FERPA directory masking to librarian page reads", async () => {
    const result = await studentService.findPaged({}, 1, 10, librarian);
    const optedOut = result.items.find((student) => student.id === "2024-042");

    expect(optedOut?.email).toBe(FERPA_RESTRICTED_VALUE);
  });
});

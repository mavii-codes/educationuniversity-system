import { describe, expect, it } from "vitest";
import { FerpaViewer } from "./ferpa.service";
import { studentLifecycleService } from "./student-lifecycle.service";

const administrator: FerpaViewer = {
  id: "usr-admin-001",
  name: "System Administrator",
  portalRole: "Administrator",
};

const librarian: FerpaViewer = {
  id: "usr-librarian-001",
  name: "Library Staff",
  portalRole: "Librarian",
};

const STAGE_ORDER = [
  "ADMISSIONS",
  "ENROLLMENT",
  "LMS_ENGAGEMENT",
  "LIBRARY_ACTIVITY",
  "FINANCIAL_STANDING",
  "ALUMNI",
];

describe("studentLifecycleService.getStudentLifecycle", () => {
  it("builds the fixed stage order and deterministic statuses from a seed student", async () => {
    const lifecycle = await studentLifecycleService.getStudentLifecycle(
      "2024-042",
      administrator
    );

    expect(lifecycle).not.toBeNull();
    expect(lifecycle?.profile).toMatchObject({
      studentId: "2024-042",
      studentName: "Marco Villanueva",
      programName: "BS Information Technology",
      programCode: "BSIT",
      yearLevel: "2nd Year",
      status: "Active",
    });

    expect(lifecycle?.stages.map((stage) => stage.key)).toEqual(STAGE_ORDER);

    const admissions = lifecycle?.stages.find((stage) => stage.key === "ADMISSIONS");
    expect(admissions?.status).toBe("Completed");
    expect(admissions?.date).toBe("2025-06-01");

    const enrollment = lifecycle?.stages.find((stage) => stage.key === "ENROLLMENT");
    expect(enrollment?.status).toBe("Active");
    expect(enrollment?.metrics).toEqual(
      expect.arrayContaining([
        { label: "Courses", value: "3" },
        { label: "Units", value: "9" },
      ])
    );

    const financial = lifecycle?.stages.find(
      (stage) => stage.key === "FINANCIAL_STANDING"
    );
    expect(financial?.status).toBe("Completed");

    const alumni = lifecycle?.stages.find((stage) => stage.key === "ALUMNI");
    expect(alumni?.status).toBe("Upcoming");
    expect(alumni?.date).toBe("2029-06-01");

    expect(lifecycle?.currentStage).toBe("ENROLLMENT");
  });

  it("marks matched alumni as ALUMNI and makes that the current stage", async () => {
    const lifecycle = await studentLifecycleService.getStudentLifecycle(
      "2022-031",
      administrator
    );

    const alumni = lifecycle?.stages.find((stage) => stage.key === "ALUMNI");
    expect(alumni?.status).toBe("Alumni");
    expect(alumni?.date).toBe("2026-06-01");
    expect(alumni?.metrics).toEqual(
      expect.arrayContaining([{ label: "Graduation Year", value: "2026" }])
    );
    expect(lifecycle?.currentStage).toBe("ALUMNI");
  });

  it("masks lifecycle profile contact fields for Librarian viewers of opt-out students", async () => {
    const lifecycle = await studentLifecycleService.getStudentLifecycle(
      "2024-042",
      librarian
    );

    expect(lifecycle?.profile.email).toBe("[FERPA Restricted]");
    expect(lifecycle?.profile.contactNumber).toBe("[FERPA Restricted]");
    expect(lifecycle?.profile.address).toBe("[FERPA Restricted]");
  });

  it("does not mask the same lifecycle for an Administrator", async () => {
    const lifecycle = await studentLifecycleService.getStudentLifecycle(
      "2024-042",
      administrator
    );

    expect(lifecycle?.profile.email).toBe(
      "marco.villanueva@university.edu.ph"
    );
    expect(lifecycle?.profile.contactNumber).toBe("+63 918 332 7811");
  });

  it("returns null for an unknown student", async () => {
    const lifecycle = await studentLifecycleService.getStudentLifecycle(
      "9999-999",
      administrator
    );
    expect(lifecycle).toBeNull();
  });

  it("returns timeline events in descending occurredAt order", async () => {
    const lifecycle = await studentLifecycleService.getStudentLifecycle(
      "2022-031",
      administrator
    );

    const timeline = lifecycle?.timeline ?? [];
    expect(timeline.length).toBeGreaterThanOrEqual(5);
    for (let index = 1; index < timeline.length; index += 1) {
      expect(
        timeline[index - 1].occurredAt >= timeline[index].occurredAt
      ).toBe(true);
    }
    expect(timeline[0].stage).toBe("ALUMNI");
    expect(timeline.every((event) => Boolean(event.id && event.title))).toBe(true);
  });
});

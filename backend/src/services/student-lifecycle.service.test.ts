import { describe, expect, it } from "vitest";
import { seedDataset } from "../data/dataset";
import { FerpaViewer } from "./ferpa.service";
import {
  LifecycleStageFacts,
  buildMockTimeline,
  buildStages,
  resolveCurrentStage,
  studentLifecycleService,
} from "./student-lifecycle.service";

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

const STAGE_ORDER = ["MEMBERSHIP", "REQUESTS", "FINES", "STANDING"];
const LIBRARY_STAGE_KEYS = new Set([
  "MEMBERSHIP",
  "REQUESTS",
  "BORROWING",
  "FINES",
  "STANDING",
]);

function facts(overrides: Partial<LifecycleStageFacts> = {}): LifecycleStageFacts {
  return {
    membership: { exists: true, createdAt: "2025-06-01T08:00:00.000Z", accountStatus: "Active" },
    requests: {
      submitted: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
      reservations: 0,
      latestActivityAt: null,
    },
    borrowing: {
      totalBorrowed: 0,
      currentBorrowed: 0,
      overdueCount: 0,
      firstBorrowedAt: null,
      lastBorrowedAt: null,
      topCategory: null,
    },
    fines: {
      unpaidCount: 0,
      unpaidTotal: 0,
      paidCount: 0,
      paidTotal: 0,
      balance: 0,
      latestActivityAt: null,
    },
    lastLibraryActivityAt: null,
    ...overrides,
  };
}

describe("studentLifecycleService.getStudentLifecycle", () => {
  it("builds the library-only stage order and semantics from a seed student", async () => {
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

    expect(Object.keys(lifecycle ?? {}).sort()).toEqual([
      "currentStage",
      "profile",
      "stages",
      "timeline",
    ]);
    expect(lifecycle?.stages.map((stage) => stage.key)).toEqual(STAGE_ORDER);
    expect(lifecycle?.stages.map((stage) => stage.label)).toEqual([
      "Library Membership",
      "Borrowing Requests",
      "Fines & Payments",
      "Current Standing",
    ]);

    const membership = lifecycle?.stages.find((stage) => stage.key === "MEMBERSHIP");
    expect(membership?.status).toBe("Completed");
    expect(membership?.date).toBe("2025-06-01");
    expect(membership?.metrics).toEqual(
      expect.arrayContaining([
        { label: "Account Status", value: "Active" },
        { label: "Member Since", value: "2025-06-01" },
      ])
    );

    const requests = lifecycle?.stages.find((stage) => stage.key === "REQUESTS");
    expect(requests?.status).toBe("Completed");
    expect(requests?.metrics).toEqual(
      expect.arrayContaining([
        { label: "Requests", value: "4" },
        { label: "Pending", value: "0" },
        { label: "Approved", value: "4" },
        { label: "Reservations", value: "0" },
      ])
    );

    expect(lifecycle?.stages.some((stage) => stage.key === "BORROWING")).toBe(false);

    const fines = lifecycle?.stages.find((stage) => stage.key === "FINES");
    expect(fines?.status).toBe("Upcoming");
    expect(fines?.metrics).toEqual(
      expect.arrayContaining([
        { label: "Outstanding Balance", value: "PHP 0.00" },
        { label: "Unpaid Fines", value: "0" },
      ])
    );

    const standing = lifecycle?.stages.find((stage) => stage.key === "STANDING");
    expect(standing?.status).toBe("Completed");
    expect(standing?.metrics).toEqual(
      expect.arrayContaining([{ label: "Standing", value: "Good Standing" }])
    );

    expect(lifecycle?.currentStage).toBe("STANDING");
  });

  it("resolves STANDING for a graduated student with historical library activity", async () => {
    const lifecycle = await studentLifecycleService.getStudentLifecycle(
      "2022-031",
      administrator
    );

    expect(lifecycle?.stages.some((stage) => stage.key === "BORROWING")).toBe(false);

    const membership = lifecycle?.stages.find((stage) => stage.key === "MEMBERSHIP");
    expect(membership?.status).toBe("Completed");
    expect(membership?.metrics).toEqual(
      expect.arrayContaining([{ label: "Account Status", value: "Suspended" }])
    );

    expect(lifecycle?.currentStage).toBe("STANDING");
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

  it("builds 4-6 library-only timeline events per student in descending order", async () => {
    const checkedIds = ["2024-042", "2024-089", "2024-136", "2022-031"];

    for (const studentId of checkedIds) {
      const lifecycle = await studentLifecycleService.getStudentLifecycle(
        studentId,
        administrator
      );
      const timeline = lifecycle?.timeline ?? [];

      expect(timeline.length).toBeGreaterThanOrEqual(4);
      expect(timeline.length).toBeLessThanOrEqual(6);

      for (const event of timeline) {
        expect(LIBRARY_STAGE_KEYS.has(event.stage)).toBe(true);
        expect(event.sourceSystem).toBe("LIBRARY");
        expect(Boolean(event.id && event.title && event.occurredAt)).toBe(true);
      }

      const stagesSeen = new Set(timeline.map((event) => event.stage));
      expect(stagesSeen.has("MEMBERSHIP")).toBe(true);
      expect(stagesSeen.has("STANDING")).toBe(true);

      for (let index = 1; index < timeline.length; index += 1) {
        expect(
          timeline[index - 1].occurredAt >= timeline[index].occurredAt
        ).toBe(true);
      }
    }
  });

  it("mocks a library timeline from the seed student's library object", () => {
    const student = seedDataset.students.find((item) => item.id === "2024-089");
    expect(student).toBeDefined();

    const timeline = buildMockTimeline(student!);
    expect(timeline.length).toBeGreaterThanOrEqual(4);
    expect(timeline.length).toBeLessThanOrEqual(6);

    const borrowEvents = timeline.filter((event) => event.title === "Library book borrowed");
    expect(borrowEvents).toHaveLength(student!.library.books.length);
    expect(new Set(timeline.map((event) => event.sourceSystem))).toEqual(
      new Set(["LIBRARY"])
    );
  });
});

describe("buildStages and resolveCurrentStage", () => {
  it("marks an empty library account as membership-only", () => {
    const stages = buildStages(facts());
    expect(stages.map((stage) => stage.key)).toEqual(STAGE_ORDER);
    expect(stages.map((stage) => stage.status)).toEqual([
      "Completed",
      "Upcoming",
      "Upcoming",
      "Upcoming",
    ]);
    expect(resolveCurrentStage(stages)).toBe("MEMBERSHIP");
  });

  it("returns no current stage when neither account nor activity exists", () => {
    const stages = buildStages(
      facts({
        membership: { exists: false, createdAt: null, accountStatus: "Suspended" },
      })
    );
    expect(stages[0].status).toBe("Upcoming");
    expect(stages[3].status).toBe("Upcoming");
    expect(resolveCurrentStage(stages)).toBeNull();
  });

  it("prioritizes outstanding fines over loans and requests", () => {
    const stages = buildStages(
      facts({
        requests: {
          submitted: 2,
          approved: 1,
          rejected: 0,
          pending: 1,
          reservations: 0,
          latestActivityAt: "2026-10-01T00:00:00.000Z",
        },
        borrowing: {
          totalBorrowed: 5,
          currentBorrowed: 1,
          overdueCount: 0,
          firstBorrowedAt: "2025-08-01T00:00:00.000Z",
          lastBorrowedAt: "2026-10-01T00:00:00.000Z",
          topCategory: "Programming",
        },
        fines: {
          unpaidCount: 1,
          unpaidTotal: 50,
          paidCount: 0,
          paidTotal: 0,
          balance: 50,
          latestActivityAt: "2026-09-01T00:00:00.000Z",
        },
        lastLibraryActivityAt: "2026-10-01T00:00:00.000Z",
      })
    );

    const fines = stages.find((stage) => stage.key === "FINES");
    expect(fines?.status).toBe("Active");
    expect(fines?.summary).toContain("Alert");
    expect(resolveCurrentStage(stages)).toBe("FINES");
  });

  it("treats overdue items as a restricted FINES stage", () => {
    const stages = buildStages(
      facts({
        borrowing: {
          totalBorrowed: 3,
          currentBorrowed: 1,
          overdueCount: 1,
          firstBorrowedAt: "2026-01-01T00:00:00.000Z",
          lastBorrowedAt: "2026-09-01T00:00:00.000Z",
          topCategory: "Engineering",
        },
        lastLibraryActivityAt: "2026-09-01T00:00:00.000Z",
      })
    );

    expect(stages.find((stage) => stage.key === "FINES")?.status).toBe("Active");
    expect(stages.find((stage) => stage.key === "STANDING")?.status).toBe("Active");
    expect(resolveCurrentStage(stages)).toBe("FINES");
  });

  it("resolves STANDING for current loans without fines or overdue items", () => {
    const stages = buildStages(
      facts({
        borrowing: {
          totalBorrowed: 2,
          currentBorrowed: 1,
          overdueCount: 0,
          firstBorrowedAt: "2026-01-01T00:00:00.000Z",
          lastBorrowedAt: "2026-09-01T00:00:00.000Z",
          topCategory: "Nursing",
        },
        lastLibraryActivityAt: "2026-09-01T00:00:00.000Z",
      })
    );
    expect(resolveCurrentStage(stages)).toBe("STANDING");
  });

  it("resolves REQUESTS when only pending requests remain", () => {
    const stages = buildStages(
      facts({
        requests: {
          submitted: 1,
          approved: 0,
          rejected: 0,
          pending: 1,
          reservations: 0,
          latestActivityAt: "2026-10-05T00:00:00.000Z",
        },
        lastLibraryActivityAt: "2026-10-05T00:00:00.000Z",
      })
    );
    expect(stages.find((stage) => stage.key === "REQUESTS")?.status).toBe("Active");
    expect(resolveCurrentStage(stages)).toBe("REQUESTS");
  });

  it("resolves STANDING for historical activity with clear fines", () => {
    const stages = buildStages(
      facts({
        borrowing: {
          totalBorrowed: 8,
          currentBorrowed: 0,
          overdueCount: 0,
          firstBorrowedAt: "2024-01-01T00:00:00.000Z",
          lastBorrowedAt: "2026-03-01T00:00:00.000Z",
          topCategory: "Business",
        },
        fines: {
          unpaidCount: 0,
          unpaidTotal: 0,
          paidCount: 2,
          paidTotal: 40,
          balance: 0,
          latestActivityAt: "2026-03-05T00:00:00.000Z",
        },
        lastLibraryActivityAt: "2026-03-05T00:00:00.000Z",
      })
    );
    expect(stages.find((stage) => stage.key === "FINES")?.status).toBe("Completed");
    expect(stages.find((stage) => stage.key === "STANDING")?.status).toBe("Completed");
    expect(resolveCurrentStage(stages)).toBe("STANDING");
  });
});

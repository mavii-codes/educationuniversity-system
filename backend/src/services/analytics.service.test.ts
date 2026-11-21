import { describe, expect, it } from "vitest";
import { seedDataset } from "../data/dataset";
import { analyticsService } from "./analytics.service";

describe("analyticsService.getLifecycle (library aggregate)", () => {
  it("serves library metrics and cohort counts consistent with the seed dataset", async () => {
    const lifecycle = await analyticsService.getLifecycle();
    const students = seedDataset.students;

    const registeredMembers = students.filter(
      (student) =>
        student.library.totalBorrowedAllTime > 0 ||
        student.library.books.length > 0 ||
        student.library.currentBorrowedCount > 0 ||
        student.library.finesBalance > 0
    );
    const activeBorrowers = students.filter(
      (student) => student.library.currentBorrowedCount > 0
    );
    const itemsCurrentlyBorrowed = students.reduce(
      (sum, student) => sum + student.library.currentBorrowedCount,
      0
    );
    const noActivity = registeredMembers.filter(
      (student) =>
        student.library.totalBorrowedAllTime === 0 &&
        student.library.books.length === 0 &&
        student.library.finesBalance === 0
    ).length;
    const outstandingFines = students.filter(
      (student) => student.library.finesBalance > 0
    ).length;
    const restricted = students.filter(
      (student) =>
        student.library.finesBalance > 0 ||
        student.library.books.some(
          (book) => (book.status as string) === "Overdue"
        )
    ).length;

    expect(lifecycle.overviewStats.map((stat) => stat.label)).toEqual([
      "Registered Members",
      "Active Borrowers",
      "Outstanding Fines (PHP)",
      "Overdue Items",
    ]);
    expect(lifecycle.overviewStats.map((stat) => stat.value)).toEqual([
      registeredMembers.length,
      activeBorrowers.length,
      Math.round(
        students.reduce((sum, student) => sum + student.library.finesBalance, 0)
      ),
      0,
    ]);
    expect(itemsCurrentlyBorrowed).toBe(6);
    expect(lifecycle.overviewStats[1].change).toContain(
      String(itemsCurrentlyBorrowed)
    );

    for (const stat of lifecycle.overviewStats) {
      expect(Object.keys(stat).sort()).toEqual([
        "change",
        "description",
        "label",
        "value",
      ]);
      expect(typeof stat.value).toBe("number");
    }

    expect(lifecycle.stages.map((stage) => stage.key)).toEqual([
      "no-activity",
      "requests-pending",
      "active-borrowers",
      "outstanding-fines",
      "restricted",
    ]);
    expect(lifecycle.stages.map((stage) => stage.title)).toEqual([
      "No Activity Yet",
      "Requests Pending",
      "Active Borrowers",
      "Outstanding Fines",
      "Restricted",
    ]);
    expect(lifecycle.stages.map((stage) => stage.metricCount)).toEqual([
      noActivity,
      0,
      activeBorrowers.length,
      outstandingFines,
      restricted,
    ]);
    expect(lifecycle.stages[2].metricCount).toBe(5);
    expect(lifecycle.stages[2].insights).toEqual(
      expect.arrayContaining([
        { label: "Items on Loan", value: String(itemsCurrentlyBorrowed) },
      ])
    );

    for (const stage of lifecycle.stages) {
      expect(Object.keys(stage).sort()).toEqual([
        "conversionRate",
        "description",
        "insights",
        "key",
        "keyMilestones",
        "metricCount",
        "metricLabel",
        "sourceSystems",
        "status",
        "subtitle",
        "title",
      ]);
      expect(["completed", "current", "upcoming"]).toContain(stage.status);
      expect(Array.isArray(stage.keyMilestones)).toBe(true);
      expect(Array.isArray(stage.insights)).toBe(true);
    }
  });
});

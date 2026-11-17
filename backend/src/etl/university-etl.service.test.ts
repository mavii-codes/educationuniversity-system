import { describe, expect, it } from "vitest";
import {
  RAW_ALUMNI_CRM_RECORDS,
  RAW_HR_EMPLOYMENT,
  RAW_LMS_PROGRESS,
  RAW_SIS_ENROLLMENTS,
  RAW_SIS_STUDENTS,
} from "./sources";
import {
  EtlRunResult,
  universityETLService,
} from "./university-etl.service";

const VALID_STAGES = new Set([
  "ADMISSIONS",
  "ENROLLMENT",
  "LMS_ENGAGEMENT",
  "LIBRARY_ACTIVITY",
  "FINANCIAL_STANDING",
  "ALUMNI",
]);

function totalsFromResults(results: EtlRunResult[]) {
  return results.reduce(
    (totals, result) => ({
      extracted: totals.extracted + result.recordsExtracted,
      validated: totals.validated + result.recordsValidated,
      cleaned: totals.cleaned + result.recordsCleaned,
      transformed: totals.transformed + result.recordsTransformed,
      loaded: totals.loaded + result.recordsLoaded,
      rejected: totals.rejected + result.recordsRejected,
    }),
    { extracted: 0, validated: 0, cleaned: 0, transformed: 0, loaded: 0, rejected: 0 },
  );
}

describe("UniversityETLService (mock mode)", () => {
  it("runs the SIS source with real validation, dedupe and identity-matching counts", async () => {
    universityETLService.__resetMockStateForTests();

    const response = await universityETLService.runSync({
      sourceIds: ["SIS"],
      triggeredBy: "Unit Test",
    });

    expect(response.status).toBe("Completed");
    expect(response.results).toHaveLength(1);
    const sis = response.results[0];
    expect(sis.sourceCode).toBe("SIS");
    expect(sis.recordsExtracted).toBe(
      RAW_SIS_STUDENTS.length + RAW_SIS_ENROLLMENTS.length,
    );
    // Two deliberately invalid SIS students + one invalid enrollment.
    expect(sis.recordsRejected).toBe(3);
    // One duplicate student row + one duplicate enrollment row.
    expect(sis.recordsCleaned).toBe(2);
    expect(sis.recordsLoaded).toBe(sis.recordsTransformed);
    expect(sis.executionLog.length).toBeGreaterThan(3);
    expect(sis.errors.some((message) => message.includes("SIS student 2024-136"))).toBe(true);
  });

  it("runs the LMS, HR and Alumni CRM sources with validation and dedupe", async () => {
    const response = await universityETLService.runSync({
      sourceIds: ["LMS", "HR", "ALUMNI_CRM"],
      triggeredBy: "Unit Test",
    });

    expect(response.status).toBe("Completed");
    const byCode = new Map(response.results.map((result) => [result.sourceCode, result]));

    const lms = byCode.get("LMS");
    expect(lms).toBeDefined();
    expect(lms!.recordsExtracted).toBe(RAW_LMS_PROGRESS.length);
    // One completion > 100% + one missing course code.
    expect(lms!.recordsRejected).toBe(2);
    expect(lms!.recordsCleaned).toBe(1);

    const hr = byCode.get("HR");
    expect(hr).toBeDefined();
    expect(hr!.recordsExtracted).toBe(RAW_HR_EMPLOYMENT.length);
    // Negative weekly hours + missing department.
    expect(hr!.recordsRejected).toBe(2);
    expect(hr!.recordsCleaned).toBe(1);

    const alumni = byCode.get("ALUMNI_CRM");
    expect(alumni).toBeDefined();
    expect(alumni!.recordsExtracted).toBe(RAW_ALUMNI_CRM_RECORDS.length);
    // Graduation year 1800 + malformed email.
    expect(alumni!.recordsRejected).toBe(2);
    expect(alumni!.recordsCleaned).toBe(1);
  });

  it("delegates the LIBRARY source to the existing library pipeline", async () => {
    const response = await universityETLService.runSync({
      sourceIds: ["LIBRARY"],
      triggeredBy: "Unit Test",
    });

    expect(response.status).toBe("Completed");
    const library = response.results[0];
    expect(library.sourceCode).toBe("LIBRARY");
    expect(library.recordsExtracted).toBeGreaterThan(0);
    expect(library.executionLog.length).toBeGreaterThan(0);
  });

  it("computes run totals as the sum of per-source results", async () => {
    const response = await universityETLService.runSync({
      triggeredBy: "Unit Test",
    });

    expect(response.results).toHaveLength(5);
    expect(response.totals).toEqual(totalsFromResults(response.results));
    expect(response.status).toBe("Completed");
    expect(response.runId).toMatch(/^etl-run-/);
    for (const result of response.results) {
      expect(result.startedAt).toBeTruthy();
      expect(result.completedAt).toBeTruthy();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("records mock-mode run history readable via getRuns", async () => {
    universityETLService.__resetMockStateForTests();
    await universityETLService.runSync({ triggeredBy: "History Test" });

    const runs = await universityETLService.getRuns(10);
    expect(runs.length).toBeGreaterThanOrEqual(1);
    const latest = runs[0];
    expect(latest.triggeredBy).toBe("History Test");
    expect(latest.status).toBe("Completed");
    expect(latest.sourceCodes).toHaveLength(5);
    expect(latest.totals.extracted).toBeGreaterThan(0);
  });

  it("exposes the five registered sources in canonical order", async () => {
    universityETLService.__resetMockStateForTests();
    const sources = await universityETLService.getSources();
    expect(sources.map((source) => source.code)).toEqual([
      "SIS",
      "LMS",
      "HR",
      "ALUMNI_CRM",
      "LIBRARY",
    ]);
    for (const source of sources) {
      expect(source.name.length).toBeGreaterThan(0);
      expect(source.adapter.length).toBeGreaterThan(0);
    }
  });
});

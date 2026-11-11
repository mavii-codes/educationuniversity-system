import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../repositories/ferpa.repository", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../repositories/ferpa.repository")>();
  return {
    ...actual,
    insertAccessLog: vi.fn().mockRejectedValue(new Error("database unavailable")),
  };
});

import { env } from "../config/env";
import * as ferpaRepository from "../repositories/ferpa.repository";
import {
  FERPA_RESTRICTED_VALUE,
  FerpaViewer,
  ferpaService,
  getMaskedStudent,
  logStudentAccess,
} from "./ferpa.service";

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

const student = {
  id: "2024-042",
  name: "Marco Villanueva",
  email: "marco.villanueva@university.edu.ph",
  contactNumber: "+63 918 332 7811",
  address: "Pasig City, Metro Manila",
};

afterEach(() => {
  vi.restoreAllMocks();
  env.db.enabled = false;
});

describe("getMaskedStudent", () => {
  it("masks directory contact fields for a Librarian viewing an opt-out student", () => {
    const masked = getMaskedStudent(student, { ...librarian, directoryOptOut: true });

    expect(masked.email).toBe(FERPA_RESTRICTED_VALUE);
    expect(masked.contactNumber).toBe(FERPA_RESTRICTED_VALUE);
    expect(masked.address).toBe(FERPA_RESTRICTED_VALUE);
    expect(masked.name).toBe(student.name);
  });

  it("never masks Administrator views, even when the student opted out", () => {
    const visible = getMaskedStudent(student, {
      ...administrator,
      directoryOptOut: true,
    });

    expect(visible.email).toBe(student.email);
    expect(visible.contactNumber).toBe(student.contactNumber);
    expect(visible.address).toBe(student.address);
  });

  it("does not mask a Librarian view when the student has not opted out", () => {
    const visible = getMaskedStudent(student, {
      ...librarian,
      directoryOptOut: false,
    });

    expect(visible.email).toBe(student.email);
    expect(visible.contactNumber).toBe(student.contactNumber);
    expect(visible.address).toBe(student.address);
  });

  it("skips fields the student model does not expose", () => {
    const minimal: { id: string; name: string; email?: string | null } = {
      id: "2024-042",
      name: "Marco Villanueva",
    };
    const masked = getMaskedStudent(minimal, { ...librarian, directoryOptOut: true });

    expect(masked).toEqual(minimal);
    expect("email" in masked).toBe(false);
  });
});

describe("logStudentAccess", () => {
  it("resolves even when the repository write throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    env.db.enabled = true;

    await expect(
      logStudentAccess({
        studentId: "2024-042",
        viewer: librarian,
        action: "VIEW_PROFILE",
      })
    ).resolves.toBeUndefined();

    expect(ferpaRepository.insertAccessLog).toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
  });

  it("records access events in mock mode", async () => {
    await logStudentAccess({
      studentId: "2024-042",
      viewer: librarian,
      action: "VIEW_LIFECYCLE",
    });

    const events = await ferpaService.listAccessLog(500);
    expect(
      events.some(
        (event) =>
          event.studentId === "2024-042" &&
          event.action === "VIEW_LIFECYCLE" &&
          event.viewerRole === "Librarian"
      )
    ).toBe(true);
  });
});

describe("createConsent", () => {
  it("creates a granted consent with the pinned response shape", async () => {
    const consent = await ferpaService.createConsent({
      studentId: "2024-042",
      consentType: "RECORDS_RELEASE",
      granted: true,
      note: "Release to graduate school",
      expiresAt: "2027-01-01T00:00:00.000Z",
      viewer: administrator,
    });

    expect(consent).not.toBeNull();
    expect(consent).toMatchObject({
      studentId: "2024-042",
      studentName: "Marco Villanueva",
      consentType: "RECORDS_RELEASE",
      status: "Granted",
      expiresAt: "2027-01-01T00:00:00.000Z",
      recordedByName: "System Administrator",
      note: "Release to graduate school",
    });
    expect(consent?.id).toMatch(/^ferpa-consent-/);
    expect(consent?.effectiveAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("maps granted=false to a Revoked consent", async () => {
    const consent = await ferpaService.createConsent({
      studentId: "2023-109",
      consentType: "DIRECTORY_INFO",
      granted: false,
      viewer: administrator,
    });

    expect(consent?.status).toBe("Revoked");
    expect(consent?.expiresAt).toBeNull();
    expect(consent?.note).toBeNull();
  });

  it("returns null for an unknown student", async () => {
    const consent = await ferpaService.createConsent({
      studentId: "9999-999",
      consentType: "THIRD_PARTY",
      granted: true,
      viewer: administrator,
    });

    expect(consent).toBeNull();
  });
});

describe("directory settings and overview", () => {
  it("seeds opt-outs from real seed students and exposes them in settings", async () => {
    const settings = await ferpaService.listDirectorySettings();
    const optOutIds = settings
      .filter((setting) => setting.directoryOptOut)
      .map((setting) => setting.studentId);

    expect(optOutIds).toContain("2024-042");
    expect(optOutIds).toContain("2025-112");
    expect(settings).toHaveLength(10);
  });

  it("updates a directory setting and reflects it in the overview", async () => {
    const before = await ferpaService.getOverview();

    const updated = await ferpaService.updateDirectorySetting(
      "2023-109",
      true,
      administrator
    );

    expect(updated).toMatchObject({
      studentId: "2023-109",
      directoryOptOut: true,
    });
    expect(updated?.updatedAt).toBeTruthy();

    const after = await ferpaService.getOverview();
    expect(after.directoryOptOuts).toBe(before.directoryOptOuts + 1);
  });

  it("returns null when updating an unknown student", async () => {
    const updated = await ferpaService.updateDirectorySetting(
      "9999-999",
      true,
      administrator
    );
    expect(updated).toBeNull();
  });
});

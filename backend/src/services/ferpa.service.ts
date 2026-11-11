import { randomUUID } from "node:crypto";
import { env } from "../config/env";
import { seedDataset } from "../data/dataset";
import { AuthorizedRole } from "../models";
import * as ferpaRepository from "../repositories/ferpa.repository";
import {
  FerpaAccessEvent,
  FerpaConsentRecord,
  FerpaConsentType,
  FerpaDirectorySetting,
  FerpaOverview,
} from "../repositories/ferpa.repository";

export type {
  FerpaAccessEvent,
  FerpaConsentRecord,
  FerpaConsentType,
  FerpaConsentStatus,
  FerpaDirectorySetting,
  FerpaOverview,
} from "../repositories/ferpa.repository";

export const FERPA_RESTRICTED_VALUE = "[FERPA Restricted]";

export interface FerpaViewer {
  id: string;
  name?: string;
  portalRole: AuthorizedRole;
  accessRole?: string;
  email?: string;
  /** Resolved directory-information opt-out for the student being viewed. */
  directoryOptOut?: boolean;
}

export interface MaskableStudent {
  email?: string | null;
  contactNumber?: string | null;
  address?: string | null;
}

export interface CreateConsentInput {
  studentId: string;
  consentType: FerpaConsentType;
  granted: boolean;
  note?: string | null;
  expiresAt?: string | null;
  viewer: FerpaViewer;
}

export interface LogAccessInput {
  studentId: string;
  viewer: FerpaViewer;
  action: string;
}

interface MockDirectorySetting {
  directoryOptOut: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

interface MockState {
  consents: FerpaConsentRecord[];
  directory: Map<string, MockDirectorySetting>;
  accessLog: FerpaAccessEvent[];
  seeded: boolean;
}

const mockState: MockState = {
  consents: [],
  directory: new Map(),
  accessLog: [],
  seeded: false,
};

const studentNameById = new Map(seedDataset.students.map((student) => [student.id, student.name]));

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function seedMockState(): void {
  if (mockState.seeded) return;
  mockState.seeded = true;

  // Two real seed students have opted out of directory-information release.
  mockState.directory.set("2024-042", {
    directoryOptOut: true,
    updatedAt: isoDaysAgo(18),
    updatedBy: "usr-registrar-001",
  });
  mockState.directory.set("2025-112", {
    directoryOptOut: true,
    updatedAt: isoDaysAgo(9),
    updatedBy: "usr-registrar-001",
  });

  mockState.consents.push(
    {
      id: "ferpa-mock-consent-001",
      studentId: "2023-109",
      studentName: studentNameById.get("2023-109") ?? "2023-109",
      consentType: "RECORDS_RELEASE",
      status: "Granted",
      effectiveAt: "2026-01-15T08:00:00.000Z",
      expiresAt: "2027-01-15T08:00:00.000Z",
      recordedByName: "System Administrator",
      note: "Consent for graduate-school application packet.",
    },
    {
      id: "ferpa-mock-consent-002",
      studentId: "2024-089",
      studentName: studentNameById.get("2024-089") ?? "2024-089",
      consentType: "DIRECTORY_INFO",
      status: "Revoked",
      effectiveAt: "2026-02-20T08:00:00.000Z",
      expiresAt: null,
      recordedByName: "System Administrator",
      note: "Student withdrew directory-information consent.",
    },
    {
      id: "ferpa-mock-consent-003",
      studentId: "2026-015",
      studentName: studentNameById.get("2026-015") ?? "2026-015",
      consentType: "THIRD_PARTY",
      status: "Granted",
      effectiveAt: "2026-03-05T08:00:00.000Z",
      expiresAt: null,
      recordedByName: "System Administrator",
      note: "Scholarship sponsor verification.",
    }
  );

  mockState.accessLog.push(
    {
      id: "ferpa-mock-access-001",
      studentId: "2024-042",
      studentName: studentNameById.get("2024-042") ?? "2024-042",
      viewerId: "usr-librarian-001",
      viewerName: "Library Staff",
      viewerRole: "Librarian",
      action: "VIEW_PROFILE",
      occurredAt: isoDaysAgo(1),
    },
    {
      id: "ferpa-mock-access-002",
      studentId: "2023-109",
      studentName: studentNameById.get("2023-109") ?? "2023-109",
      viewerId: "usr-admin-001",
      viewerName: "System Administrator",
      viewerRole: "Administrator",
      action: "VIEW_LIFECYCLE",
      occurredAt: isoDaysAgo(2),
    },
    {
      id: "ferpa-mock-access-003",
      studentId: "2025-112",
      studentName: studentNameById.get("2025-112") ?? "2025-112",
      viewerId: "usr-librarian-001",
      viewerName: "Library Staff",
      viewerRole: "Librarian",
      action: "VIEW_DIRECTORY",
      occurredAt: isoDaysAgo(4),
    },
    {
      id: "ferpa-mock-access-004",
      studentId: "2024-089",
      studentName: studentNameById.get("2024-089") ?? "2024-089",
      viewerId: "usr-registrar-001",
      viewerName: "University Registrar Admin",
      viewerRole: "Librarian",
      action: "VIEW_PROFILE",
      occurredAt: isoDaysAgo(7),
    },
    {
      id: "ferpa-mock-access-005",
      studentId: "2022-031",
      studentName: studentNameById.get("2022-031") ?? "2022-031",
      viewerId: "usr-admin-001",
      viewerName: "System Administrator",
      viewerRole: "Administrator",
      action: "VIEW_LIFECYCLE",
      occurredAt: isoDaysAgo(12),
    }
  );
}

function ensureMockState(): void {
  seedMockState();
}

function resolveDirectoryOptOut(
  student: MaskableStudent,
  viewer: FerpaViewer
): boolean {
  if (typeof viewer.directoryOptOut === "boolean") {
    return viewer.directoryOptOut;
  }

  // Convenience fallback for callers that did not resolve the opt-out first.
  // Database-backed callers must resolve it asynchronously before masking.
  const studentId = (student as { id?: string }).id;
  if (!env.db.enabled && studentId) {
    ensureMockState();
    return mockState.directory.get(studentId)?.directoryOptOut === true;
  }

  return false;
}

/**
 * Returns a FERPA-masked copy of a student record for Librarian viewers when
 * the student has opted out of directory-information release. Administrators
 * and student self-views are never masked.
 */
export function getMaskedStudent<T extends MaskableStudent>(
  student: T,
  viewer: FerpaViewer
): T {
  if (viewer.portalRole !== "Librarian" || !resolveDirectoryOptOut(student, viewer)) {
    return student;
  }

  const masked = { ...student };
  if ("email" in student) masked.email = FERPA_RESTRICTED_VALUE;
  if ("contactNumber" in student) masked.contactNumber = FERPA_RESTRICTED_VALUE;
  if ("address" in student) masked.address = FERPA_RESTRICTED_VALUE;
  return masked as T;
}

/**
 * Best-effort access logging. A failure to persist the audit row must never
 * break the read path that triggered it.
 */
export async function logStudentAccess(input: LogAccessInput): Promise<void> {
  try {
    const viewerName = input.viewer.name ?? input.viewer.id;

    if (env.db.enabled) {
      await ferpaRepository.insertAccessLog({
        id: `ferpa-access-${randomUUID()}`,
        studentId: input.studentId,
        viewerId: input.viewer.id,
        viewerName,
        viewerRole: input.viewer.portalRole,
        action: input.action,
        occurredAt: new Date().toISOString(),
      });
      return;
    }

    ensureMockState();
    mockState.accessLog.unshift({
      id: `ferpa-access-${randomUUID()}`,
      studentId: input.studentId,
      studentName: studentNameById.get(input.studentId) ?? input.studentId,
      viewerId: input.viewer.id,
      viewerName,
      viewerRole: input.viewer.portalRole,
      action: input.action,
      occurredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[ferpa] Failed to record student access:",
      error instanceof Error ? error.message : error
    );
  }
}

export async function listConsents(studentId?: string): Promise<FerpaConsentRecord[]> {
  if (env.db.enabled) {
    return ferpaRepository.findConsents(studentId);
  }

  ensureMockState();
  return mockState.consents
    .filter((consent) => !studentId || consent.studentId === studentId)
    .slice()
    .sort(
      (a, b) =>
        b.effectiveAt.localeCompare(a.effectiveAt) || b.id.localeCompare(a.id)
    );
}

export async function createConsent(
  input: CreateConsentInput
): Promise<FerpaConsentRecord | null> {
  const exists = env.db.enabled
    ? await ferpaRepository.studentExists(input.studentId)
    : seedDataset.students.some((student) => student.id === input.studentId);
  if (!exists) return null;

  const effectiveAt = new Date().toISOString();
  const expiresAt = input.expiresAt ?? null;
  const note = input.note ?? null;

  if (env.db.enabled) {
    return ferpaRepository.insertConsent({
      id: `ferpa-consent-${randomUUID()}`,
      studentId: input.studentId,
      consentType: input.consentType,
      status: input.granted ? "Granted" : "Revoked",
      effectiveAt,
      expiresAt,
      recordedBy: input.viewer.id,
      note,
    });
  }

  ensureMockState();
  const consent: FerpaConsentRecord = {
    id: `ferpa-consent-${randomUUID()}`,
    studentId: input.studentId,
    studentName: studentNameById.get(input.studentId) ?? input.studentId,
    consentType: input.consentType,
    status: input.granted ? "Granted" : "Revoked",
    effectiveAt,
    expiresAt,
    recordedByName: input.viewer.name ?? null,
    note,
  };
  mockState.consents.unshift(consent);
  return consent;
}

export async function listDirectorySettings(): Promise<FerpaDirectorySetting[]> {
  if (env.db.enabled) {
    return ferpaRepository.findDirectorySettings();
  }

  ensureMockState();
  return seedDataset.students
    .map((student) => {
      const setting = mockState.directory.get(student.id);
      return {
        studentId: student.id,
        studentName: student.name,
        directoryOptOut: setting?.directoryOptOut ?? false,
        updatedAt: setting?.updatedAt ?? null,
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName));
}

export async function updateDirectorySetting(
  studentId: string,
  directoryOptOut: boolean,
  viewer: FerpaViewer
): Promise<FerpaDirectorySetting | null> {
  if (env.db.enabled) {
    const exists = await ferpaRepository.studentExists(studentId);
    if (!exists) return null;
    return ferpaRepository.upsertDirectorySetting(studentId, directoryOptOut, viewer.id);
  }

  const student = seedDataset.students.find((item) => item.id === studentId);
  if (!student) return null;

  ensureMockState();
  const updatedAt = new Date().toISOString();
  mockState.directory.set(studentId, {
    directoryOptOut,
    updatedAt,
    updatedBy: viewer.id,
  });
  return {
    studentId,
    studentName: student.name,
    directoryOptOut,
    updatedAt,
  };
}

export async function listAccessLog(limit = 100): Promise<FerpaAccessEvent[]> {
  if (env.db.enabled) {
    return ferpaRepository.findAccessLog(limit);
  }

  ensureMockState();
  return mockState.accessLog
    .slice()
    .sort(
      (a, b) =>
        b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id)
    )
    .slice(0, limit);
}

export async function getOverview(): Promise<FerpaOverview> {
  if (env.db.enabled) {
    return ferpaRepository.getOverview();
  }

  ensureMockState();
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const optedOutIds = [...mockState.directory.entries()]
    .filter(([, setting]) => setting.directoryOptOut)
    .map(([studentId]) => studentId);
  const restricted = new Set(optedOutIds);
  for (const consent of mockState.consents) {
    if (consent.status === "Revoked") restricted.add(consent.studentId);
  }

  return {
    activeConsents: mockState.consents.filter((consent) => consent.status === "Granted")
      .length,
    directoryOptOuts: optedOutIds.length,
    accessEventsLast30Days: mockState.accessLog.filter(
      (event) => Date.parse(event.occurredAt) >= cutoff
    ).length,
    restrictedStudents: restricted.size,
  };
}

/** Batch lookup used to mask student lists without an N+1 query per row. */
export async function getDirectoryOptOutIds(studentIds: string[]): Promise<Set<string>> {
  if (env.db.enabled) {
    return ferpaRepository.findDirectoryOptOutIds(studentIds);
  }

  ensureMockState();
  const wanted = new Set(studentIds);
  return new Set(
    [...mockState.directory.entries()]
      .filter(([studentId, setting]) => setting.directoryOptOut && wanted.has(studentId))
      .map(([studentId]) => studentId)
  );
}

export async function isDirectoryOptOut(studentId: string): Promise<boolean> {
  const ids = await getDirectoryOptOutIds([studentId]);
  return ids.has(studentId);
}

export const ferpaService = {
  getMaskedStudent,
  logStudentAccess,
  listConsents,
  createConsent,
  listDirectorySettings,
  updateDirectorySetting,
  listAccessLog,
  getOverview,
  getDirectoryOptOutIds,
  isDirectoryOptOut,
};

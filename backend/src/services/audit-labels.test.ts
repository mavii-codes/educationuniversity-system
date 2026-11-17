import { describe, expect, it } from "vitest";
import {
  getAuditActionLabel,
  getAuditCategory,
  getAuditDetailsExtra,
  getAuditResourceLabel,
} from "./audit-labels";

describe("getAuditActionLabel", () => {
  it("derives mutation labels from the HTTP method and path", () => {
    expect(
      getAuditActionLabel("api.post", {
        method: "POST",
        path: "/api/library/books",
      })
    ).toBe("Created book record");
    expect(
      getAuditActionLabel("api.patch", {
        method: "PATCH",
        path: "/api/library/books/42",
      })
    ).toBe("Updated book #42");
    expect(
      getAuditActionLabel("api.delete", {
        method: "DELETE",
        path: "/api/library/books/42",
      })
    ).toBe("Removed book #42");
  });

  it("falls back to the entity type when metadata has no path", () => {
    expect(getAuditActionLabel("api.post", null, "/library/books")).toBe(
      "Created book record"
    );
    expect(getAuditActionLabel("api.patch", {}, "/ferpa/directory-settings/2025-074")).toBe(
      "Updated FERPA directory setting — student 2025-074"
    );
  });

  it("maps library circulation paths to matching nouns", () => {
    expect(
      getAuditActionLabel("api.post", {
        method: "POST",
        path: "/api/library/requests/req-1/approve",
      })
    ).toBe("Created borrowing request #req-1");
    expect(
      getAuditActionLabel("api.post", {
        method: "POST",
        path: "/api/library/returns/loan-7",
      })
    ).toBe("Created book return #loan-7");
    expect(
      getAuditActionLabel("api.put", {
        method: "PUT",
        path: "/api/library/fines/fine-3/pay",
      })
    ).toBe("Updated library fine #fine-3");
  });

  it("maps known auth domain codes to readable English", () => {
    const cases: Array<[string, string]> = [
      ["auth.login_succeeded", "Signed in"],
      ["auth.login_failed", "Sign-in failed"],
      ["auth.login_blocked", "Sign-in blocked"],
      ["auth.student_registered", "Student registered"],
      ["auth.password_changed", "Password changed"],
      ["auth.refresh_reuse_detected", "Token reuse detected"],
    ];

    for (const [action, label] of cases) {
      expect(getAuditActionLabel(action)).toBe(label);
    }
  });

  it("labels auth API paths when they are audited", () => {
    expect(
      getAuditActionLabel("api.post", {
        method: "POST",
        path: "/api/auth/login",
      })
    ).toBe("Signed in");
    expect(
      getAuditActionLabel("api.post", {
        method: "POST",
        path: "/api/auth/change-password",
      })
    ).toBe("Changed password");
  });

  it("tidies unknown codes without losing information", () => {
    expect(getAuditActionLabel("custom.some_event")).toBe("Custom some event");
    expect(getAuditActionLabel("mystery_action")).toBe("Mystery action");
  });
});

describe("getAuditResourceLabel", () => {
  it("humanizes FERPA paths and keeps the embedded student id", () => {
    expect(
      getAuditResourceLabel("/ferpa/directory-settings/2025-074")
    ).toBe("FERPA directory setting — student 2025-074");
    expect(getAuditResourceLabel("/ferpa/consents")).toBe("FERPA consent");
  });

  it("humanizes library paths with and without ids", () => {
    expect(getAuditResourceLabel("/library/books")).toBe("Book record");
    expect(getAuditResourceLabel("/api/library/books/42")).toBe("Book #42");
    expect(getAuditResourceLabel("/library/books", "42")).toBe("Book record (42)");
    expect(getAuditResourceLabel("/ferpa/directory-settings", "2025-074")).toBe(
      "FERPA directory setting — student 2025-074"
    );
  });

  it("humanizes stored entity types", () => {
    expect(getAuditResourceLabel("auth")).toBe("Authentication service");
    expect(getAuditResourceLabel("data_source", "src-1")).toBe(
      "Data source (src-1)"
    );
  });

  it("falls back to the metadata path and tidies unknown values", () => {
    expect(
      getAuditResourceLabel("", null, { path: "/api/students/2025-074" })
    ).toBe("Student record 2025-074");
    expect(getAuditResourceLabel("custom_entity")).toBe("Custom entity");
  });
});

describe("getAuditCategory", () => {
  it("buckets actions by domain", () => {
    expect(getAuditCategory("auth.login_succeeded", "auth")).toBe(
      "Authentication"
    );
    expect(getAuditCategory("api.post", "/library/books")).toBe("Library");
    expect(
      getAuditCategory("api.patch", "/ferpa/directory-settings/2025-074")
    ).toBe("FERPA & Privacy");
    expect(getAuditCategory("integration.sync", "data_source")).toBe(
      "Data Integration"
    );
    expect(getAuditCategory("api.put", "/admin/settings")).toBe(
      "Administration"
    );
    expect(getAuditCategory("api.patch", "/students/2025-074")).toBe("Members");
    expect(getAuditCategory("custom.event", "something_else")).toBe("System");
  });
});

describe("getAuditDetailsExtra", () => {
  it("omits successful HTTP statuses", () => {
    expect(getAuditDetailsExtra({ statusCode: 200 })).toBe("");
    expect(getAuditDetailsExtra(null)).toBe("");
  });

  it("includes HTTP error statuses", () => {
    expect(getAuditDetailsExtra({ statusCode: 403 })).toBe("HTTP 403");
  });

  it("includes sync metrics without duplicating labels", () => {
    expect(
      getAuditDetailsExtra({ recordsProcessed: 120, duration: "1.4s" })
    ).toBe("120 records processed · Duration 1.4s");
  });

  it("combines every non-duplicative extra", () => {
    expect(
      getAuditDetailsExtra({
        statusCode: 500,
        recordsProcessed: 3,
        duration: "0.2s",
      })
    ).toBe("HTTP 500 · 3 records processed · Duration 0.2s");
  });
});

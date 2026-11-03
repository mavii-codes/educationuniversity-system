import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import {
  comparePassword,
  hashPassword,
  toPortalRole,
  verifyAccessToken,
} from "./auth.service";

describe("toPortalRole", () => {
  it("maps the registrar role to the Registrar portal role", () => {
    expect(toPortalRole("University Registrar Admin")).toBe("Registrar");
  });

  it("maps every other role to Administrator", () => {
    expect(toPortalRole("System Administrator")).toBe("Administrator");
    expect(toPortalRole("Something Else")).toBe("Administrator");
  });
});

describe("password hashing", () => {
  it("round-trips a password through hash and compare", () => {
    const hash = hashPassword("correct horse battery staple");
    expect(hash).not.toContain("correct");
    expect(comparePassword("correct horse battery staple", hash)).toBe(true);
    expect(comparePassword("wrong password", hash)).toBe(false);
  });

  it("treats disabled/placeholder hashes as non-matching", () => {
    expect(comparePassword("anything", "!disabled")).toBe(false);
    expect(comparePassword("anything", "")).toBe(false);
  });
});

describe("verifyAccessToken", () => {
  const claims = {
    sub: "user-1",
    id: "user-1",
    name: "Test Admin",
    email: "admin@university.edu",
    portalRole: "Administrator",
    accessRole: "System Administrator",
  };

  it("verifies a valid access token", () => {
    const token = jwt.sign(claims, env.auth.accessSecret, {
      algorithm: "HS256",
      expiresIn: "15m",
    });
    const ctx = verifyAccessToken(token);
    expect(ctx).not.toBeNull();
    expect(ctx?.id).toBe("user-1");
    expect(ctx?.portalRole).toBe("Administrator");
  });

  it("rejects tokens signed with a different secret", () => {
    const token = jwt.sign(claims, "wrong-secret", {
      algorithm: "HS256",
      expiresIn: "15m",
    });
    expect(verifyAccessToken(token)).toBeNull();
  });

  it("rejects expired tokens", () => {
    const token = jwt.sign(claims, env.auth.accessSecret, {
      algorithm: "HS256",
      expiresIn: "1ms",
    });
    expect(verifyAccessToken(token)).toBeNull();
  });

  it("rejects tokens without an id claim", () => {
    const token = jwt.sign(
      { sub: "user-1", portalRole: "Administrator" },
      env.auth.accessSecret,
      { algorithm: "HS256", expiresIn: "15m" }
    );
    expect(verifyAccessToken(token)).toBeNull();
  });
});

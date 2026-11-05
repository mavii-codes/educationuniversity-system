import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import {
  attachAuthContext,
  csrfGuard,
  requireAuth,
  requireRoles,
} from "./auth.middleware";

function createRes(): Response {
  const res = {
    locals: {},
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
    headersSent: false,
  } as unknown as Response;
  return res;
}

function createReq(overrides: Partial<Request> = {}): Request {
  return {
    cookies: {},
    headers: {},
    originalUrl: "/api/students",
    method: "POST",
    ...overrides,
    header: function (this: Request, name: string) {
      const key = name.toLowerCase().replace(/-([a-z])/g, (_, c: string) =>
        c.toUpperCase()
      );
      const headers = this.headers as Record<string, string | undefined>;
      if (name === "authorization") return headers.authorization;
      if (name === "x-csrf-token") return headers["x-csrf-token"];
      return (this.headers as Record<string, unknown>)[key] as string;
    },
  } as unknown as Request;
}

const next = vi.fn() as unknown as NextFunction;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("attachAuthContext", () => {
  it("attaches the user from the access cookie", () => {
    const token = jwt.sign(
      {
        sub: "u1",
        id: "u1",
        name: "Admin",
        email: "a@x.com",
        portalRole: "Administrator",
        accessRole: "System Administrator",
      },
      env.auth.accessSecret,
      { algorithm: "HS256", expiresIn: "15m" }
    );
    const req = createReq({ cookies: { udis_at: token } });
    const res = createRes();

    attachAuthContext(req, res, next);

    expect((res.locals as { user?: unknown }).user).toMatchObject({
      id: "u1",
      portalRole: "Administrator",
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("falls back to the Bearer header when no cookie is present", () => {
    const token = jwt.sign(
      {
        sub: "u2",
        id: "u2",
        name: "Registrar",
        email: "r@x.com",
        portalRole: "Registrar",
        accessRole: "University Registrar Admin",
      },
      env.auth.accessSecret,
      { algorithm: "HS256", expiresIn: "15m" }
    );
    const req = createReq();
    (req as unknown as { headers: Record<string, string> }).headers.authorization =
      `Bearer ${token}`;
    const res = createRes();

    attachAuthContext(req, res, next);

    expect((res.locals as { user?: unknown }).user).toMatchObject({
      id: "u2",
      portalRole: "Librarian",
    });
  });

  it("does not attach a user for invalid tokens", () => {
    const req = createReq({ cookies: { udis_at: "garbage" } });
    const res = createRes();

    attachAuthContext(req, res, next);

    expect((res.locals as { user?: unknown }).user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("requireAuth", () => {
  it("passes through when a user is attached", () => {
    const req = createReq();
    const res = createRes();
    (res.locals as { user?: unknown }).user = { id: "u1" };

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests with 401", () => {
    const req = createReq();
    const res = createRes();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("requireRoles", () => {
  it("allows users with an authorized role", () => {
    const middleware = requireRoles("Administrator");
    const req = createReq();
    const res = createRes();
    (res.locals as { user?: unknown }).user = { id: "u1", portalRole: "Administrator" };

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects users with the wrong role with 403", () => {
    const middleware = requireRoles("Administrator");
    const req = createReq();
    const res = createRes();
    (res.locals as { user?: unknown }).user = { id: "u2", portalRole: "Librarian" };

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated users with 401", () => {
    const middleware = requireRoles("Administrator");
    const req = createReq();
    const res = createRes();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("csrfGuard", () => {
  it("skips safe methods", () => {
    const req = createReq({ method: "GET" });
    const res = createRes();

    csrfGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("skips the login endpoint", () => {
    const req = createReq({ originalUrl: "/api/auth/login" });
    const res = createRes();

    csrfGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("skips the student registration endpoint", () => {
    const req = createReq({ originalUrl: "/api/auth/register" });
    const res = createRes();

    csrfGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("skips public password reset endpoints", () => {
    const req = createReq({
      originalUrl: "/api/auth/forgot-password?source=form",
    });
    const res = createRes();

    csrfGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("skips the password update endpoint", () => {
    const req = createReq({ originalUrl: "/api/auth/reset-password" });
    const res = createRes();

    csrfGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects missing CSRF tokens with 403", () => {
    const req = createReq();
    const res = createRes();
    res.locals.authSource = "cookie";

    csrfGuard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects mismatching CSRF tokens with 403", () => {
    const cookieToken = crypto.randomBytes(24).toString("hex");
    const headerToken = crypto.randomBytes(24).toString("hex");
    const req = createReq();
    (req as unknown as { cookies: Record<string, string> }).cookies = {
      udis_csrf: cookieToken,
    };
    (req as unknown as { headers: Record<string, string> }).headers = {
      "x-csrf-token": headerToken,
    };
    const res = createRes();
    res.locals.authSource = "cookie";

    csrfGuard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts matching CSRF tokens", () => {
    const token = crypto.randomBytes(24).toString("hex");
    const req = createReq();
    (req as unknown as { cookies: Record<string, string> }).cookies = {
      udis_csrf: token,
    };
    (req as unknown as { headers: Record<string, string> }).headers = {
      "x-csrf-token": token,
    };
    const res = createRes();
    res.locals.authSource = "cookie";

    csrfGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

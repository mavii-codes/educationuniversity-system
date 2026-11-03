import crypto from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { AuthorizedRole } from "../models";
import {
  ACCESS_COOKIE,
  AuthContext,
  CSRF_COOKIE,
  verifyAccessToken,
} from "../services/auth.service";

/**
 * Attaches the authenticated user from the access-token cookie (or Bearer header).
 * Never trusts client-supplied role headers.
 */
export function attachAuthContext(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const cookieToken = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  const authHeader = req.header("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;

  const token = cookieToken || bearerToken;
  if (token) {
    const context = verifyAccessToken(token);
    if (context) {
      res.locals.user = context;
      // Track how the principal authenticated so CSRF only applies to
      // ambient-cookie sessions, not Bearer-token API clients.
      res.locals.authSource = cookieToken ? "cookie" : "bearer";
    }
  }

  next();
}

export function currentUser(res: Response): AuthContext | undefined {
  return res.locals.user as AuthContext | undefined;
}

export function requireAuth(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!currentUser(res)) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return;
  }
  next();
}

export function requireRoles(...allowedRoles: AuthorizedRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = currentUser(res);
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    if (!allowedRoles.includes(user.portalRole)) {
      res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to access this resource.",
      });
      return;
    }

    next();
  };
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Double-submit CSRF protection for cookie-authenticated mutations.
 * The readable udis_csrf cookie must match the X-CSRF-Token header.
 */
export function csrfGuard(req: Request, res: Response, next: NextFunction): void {
  const publicAuthMutations = new Set([
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/auth/logout",
  ]);
  const requestPath = req.originalUrl.split("?")[0];
  if (SAFE_METHODS.has(req.method) || publicAuthMutations.has(requestPath)) {
    next();
    return;
  }

  // CSRF only protects ambient-cookie authentication. Requests authenticated
  // with a Bearer token (or carrying no cookie session at all) cannot be
  // forged by a third-party site, so the double-submit check does not apply.
  if (res.locals.authSource !== "cookie") {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const headerToken = req.header("x-csrf-token");

  if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length) {
    res.status(403).json({ success: false, message: "Invalid CSRF token." });
    return;
  }

  const valid = crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
  if (!valid) {
    res.status(403).json({ success: false, message: "Invalid CSRF token." });
    return;
  }

  next();
}

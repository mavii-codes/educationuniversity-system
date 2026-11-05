import { NextFunction, Request, Response } from "express";

type Attempt = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
// Missing identifiers get their own per-IP bucket, throttled just as hard.
const ANONYMOUS_MAX_ATTEMPTS = 5;
const attempts = new Map<string, Attempt>();
const resetAttempts = new Map<string, Attempt>();
const registrationAttempts = new Map<string, Attempt>();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of attempts) {
    if (value.resetAt <= now) attempts.delete(key);
  }
  for (const [key, value] of resetAttempts) {
    if (value.resetAt <= now) resetAttempts.delete(key);
  }
  for (const [key, value] of registrationAttempts) {
    if (value.resetAt <= now) registrationAttempts.delete(key);
  }
}, 5 * 60 * 1000).unref();

export function studentRegistrationRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const attempt = registrationAttempts.get(key);
  const windowMs = 60 * 60 * 1000;
  const maxAttempts = 5;

  if (!attempt || attempt.resetAt <= now) {
    registrationAttempts.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (attempt.count >= maxAttempts) {
    res.setHeader("Retry-After", String(Math.ceil((attempt.resetAt - now) / 1000)));
    res.status(429).json({
      success: false,
      message: "Too many registration attempts. Please try again later.",
    });
    return;
  }

  attempt.count += 1;
  next();
}

export function passwordResetRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const attempt = resetAttempts.get(key);
  const windowMs = 60 * 60 * 1000;
  const maxAttempts = 5;

  if (!attempt || attempt.resetAt <= now) {
    resetAttempts.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (attempt.count >= maxAttempts) {
    res.setHeader("Retry-After", String(Math.ceil((attempt.resetAt - now) / 1000)));
    res.status(429).json({
      success: false,
      message: "Too many password reset attempts. Please try again later.",
    });
    return;
  }

  attempt.count += 1;
  next();
}

/**
 * Stable rate-limit key for a login attempt. Empty identifiers use a dedicated
 * per-IP bucket so anonymous probes do not share one global identifier bucket.
 */
export function loginAttemptKey(req: Pick<Request, "ip" | "body">): string {
  const identifier =
    typeof req.body?.identifier === "string"
      ? req.body.identifier.trim().toLowerCase()
      : "";
  const ip = req.ip ?? "unknown";
  return identifier ? `${ip}:${identifier}` : `ip:${ip}`;
}

/**
 * Clears the failure counter after a successful login. The limiter increments
 * on every request so failures are always recorded; this reset is what makes
 * the bucket effectively count failed attempts only.
 */
export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}

export function loginRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const identifier =
    typeof req.body?.identifier === "string"
      ? req.body.identifier.trim().toLowerCase()
      : "";
  const key = loginAttemptKey(req);
  const maxAttempts = identifier ? MAX_ATTEMPTS : ANONYMOUS_MAX_ATTEMPTS;
  const now = Date.now();
  const attempt = attempts.get(key);

  if (!attempt || attempt.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (attempt.count >= maxAttempts) {
    const retryAfter = Math.ceil((attempt.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({
      success: false,
      message: "Too many sign-in attempts. Please try again later.",
    });
    return;
  }

  attempt.count += 1;
  next();
}

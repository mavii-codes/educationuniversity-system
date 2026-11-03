import { NextFunction, Request, Response } from "express";

type Attempt = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, Attempt>();
const resetAttempts = new Map<string, Attempt>();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of attempts) {
    if (value.resetAt <= now) attempts.delete(key);
  }
  for (const [key, value] of resetAttempts) {
    if (value.resetAt <= now) resetAttempts.delete(key);
  }
}, 5 * 60 * 1000).unref();

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

export function loginRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const identifier =
    typeof req.body?.identifier === "string"
      ? req.body.identifier.trim().toLowerCase()
      : "";
  const key = `${req.ip ?? "unknown"}:${identifier}`;
  const now = Date.now();
  const attempt = attempts.get(key);

  if (!attempt || attempt.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (attempt.count >= MAX_ATTEMPTS) {
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

import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
}

function resolveStatusCode(err: Error | ApiError): number {
  if (err instanceof ApiError) return err.statusCode;

  const candidate = err as Error & { status?: unknown; statusCode?: unknown };
  const status = candidate.status ?? candidate.statusCode;
  return typeof status === "number" && status >= 400 && status <= 499
    ? status
    : 500;
}

export function errorHandler(
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = resolveStatusCode(err);
  const isServerError = statusCode >= 500;

  if (isServerError) {
    console.error("[University Library Backend] Unhandled error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message:
      isServerError && env.isProduction
        ? "We couldn't complete the request right now. Please try again shortly."
        : err.message ||
          "We couldn't complete the request right now. Please try again shortly.",
  });
}

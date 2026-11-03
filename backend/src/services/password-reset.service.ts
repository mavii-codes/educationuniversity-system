import crypto from "node:crypto";
import { Resend } from "resend";
import { env } from "../config/env";
import { ApiError } from "../middleware/error.middleware";
import * as authRepository from "../repositories/auth.repository";
import { hashPassword } from "./auth.service";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function resetUrl(token: string): string {
  if (!env.email.frontendUrl) {
    throw new ApiError(503, "Password reset email is not configured.");
  }
  let url: URL;
  try {
    url = new URL("/reset-password", env.email.frontendUrl);
  } catch {
    throw new ApiError(503, "Password reset email is not configured.");
  }
  if (env.isProduction && url.protocol !== "https:") {
    throw new ApiError(503, "Password reset email is not configured.");
  }
  url.searchParams.set("token", token);
  return url.toString();
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!env.db.enabled) {
    throw new ApiError(503, "Password reset requires the PostgreSQL database.");
  }
  if (!env.email.resendApiKey || !env.email.resendFromEmail || !env.email.frontendUrl) {
    throw new ApiError(503, "Password reset email is not configured.");
  }

  const user = await authRepository.findUserByEmail(email);
  if (!user || user.status !== "Active") return;

  const token = crypto.randomBytes(32).toString("base64url");
  const link = resetUrl(token);
  await authRepository.createPasswordResetToken({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });

  const resend = new Resend(env.email.resendApiKey);
  const { error } = await resend.emails.send({
    from: env.email.resendFromEmail,
    to: user.email,
    subject: "Reset your University DataHub password",
    text: `Hello ${user.name},\n\nUse this link to reset your password. It expires in 30 minutes and can only be used once:\n${link}\n\nIf you did not request a reset, you can ignore this email.`,
    html: `<p>Hello ${escapeHtml(user.name)},</p><p>Use the link below to reset your password. It expires in 30 minutes and can only be used once.</p><p><a href="${escapeHtml(link)}">Reset password</a></p><p>If you did not request a reset, you can ignore this email.</p>`,
  });
  if (error) {
    console.error("[University DataHub Backend] Resend delivery failed:", error.message);
    throw new ApiError(502, "Unable to send the password reset email right now.");
  }
}

export async function resetPassword(token: string, password: string): Promise<void> {
  if (!env.db.enabled) {
    throw new ApiError(503, "Password reset requires the PostgreSQL database.");
  }

  const consumed = await authRepository.consumePasswordResetToken(
    hashToken(token),
    hashPassword(password)
  );
  if (!consumed) {
    throw new ApiError(400, "This password reset link is invalid or has expired.");
  }
}

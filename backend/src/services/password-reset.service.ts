import crypto from "node:crypto";
import { Resend } from "resend";
import { env } from "../config/env";
import { ApiError } from "../middleware/error.middleware";
import * as authRepository from "../repositories/auth.repository";
import { hashPassword } from "./auth.service";

const RESET_CODE_TTL_MS = 10 * 60 * 1000;

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

function generateCode(): string {
  // Cryptographically random 6-digit code, zero-padded so every code has the
  // same length regardless of value.
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!env.db.enabled) {
    throw new ApiError(503, "Password reset requires the PostgreSQL database.");
  }

  const user = await authRepository.findUserByEmail(email);
  if (!user || user.status !== "Active") return;
  if (!env.email.resendApiKey || !env.email.resendFromEmail) {
    throw new ApiError(503, "Password reset email is not configured.");
  }

  const code = generateCode();
  await authRepository.createPasswordResetToken({
    userId: user.id,
    tokenHash: hashToken(code),
    expiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
  });

  const resend = new Resend(env.email.resendApiKey);
  const { error } = await resend.emails.send({
    from: env.email.resendFromEmail,
    to: user.email,
    subject: "Your University DataHub verification code",
    text: `Hello ${user.name},\n\nYour password reset verification code is:\n\n${code}\n\nIt expires in 10 minutes and can only be used once.\n\nIf you did not request a reset, you can ignore this email.`,
    html: `<p>Hello ${escapeHtml(user.name)},</p><p>Use this 6-digit verification code to reset your password. It expires in 10 minutes and can only be used once.</p><p style="font-size:28px;line-height:1.4;font-weight:700;letter-spacing:8px;color:#312E81;">${code}</p><p>If you did not request a reset, you can ignore this email.</p>`,
  });
  if (error) {
    console.error("[University DataHub Backend] Resend delivery failed:", error.message);
    throw new ApiError(502, "Unable to send the password reset email right now.");
  }
}

export async function resetPassword(code: string, password: string): Promise<void> {
  if (!env.db.enabled) {
    throw new ApiError(503, "Password reset requires the PostgreSQL database.");
  }

  const consumed = await authRepository.consumePasswordResetToken(
    hashToken(code),
    hashPassword(password)
  );
  if (!consumed) {
    throw new ApiError(400, "This verification code is invalid or has expired.");
  }
}

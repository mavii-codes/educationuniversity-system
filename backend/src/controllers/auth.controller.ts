import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  requestPasswordReset,
  resetPassword,
} from "../services/password-reset.service";
import { env } from "../config/env";
import { ApiError } from "../middleware/error.middleware";
import { currentUser } from "../middleware/auth.middleware";
import {
  ACCESS_COOKIE,
  CSRF_COOKIE,
  IssuedSession,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  getSessionUser,
  login,
  logout,
  refresh,
  sessionCookies,
} from "../services/auth.service";

const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(160),
  password: z.string().min(1).max(200),
  rememberMe: z.boolean().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(160),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(12).max(200),
});

function applySessionCookies(res: Response, session: IssuedSession): void {
  const cookies = sessionCookies(session);
  res.cookie(ACCESS_COOKIE, cookies.access.value, cookies.access.options);
  res.cookie(REFRESH_COOKIE, cookies.refresh.value, cookies.refresh.options);
  res.cookie(CSRF_COOKIE, cookies.csrf.value, cookies.csrf.options);
}

function clearSessionCookies(res: Response): void {
  const common = {
    secure: env.auth.cookieSecure,
    sameSite: env.auth.cookieSameSite,
    domain: env.auth.cookieDomain,
  };
  res.clearCookie(ACCESS_COOKIE, { ...common, path: "/" });
  res.clearCookie(REFRESH_COOKIE, { ...common, path: REFRESH_COOKIE_PATH });
  res.clearCookie(CSRF_COOKIE, { ...common, path: "/" });
}

export class AuthController {
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "Enter a valid email address.");
      }

      await requestPasswordReset(parsed.data.email);
      res.status(202).json({
        message: "If an active account matches that email, a reset link will be sent.",
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "Use a valid reset link and a password of at least 12 characters.");
      }

      await resetPassword(parsed.data.token, parsed.data.password);
      res.json({ message: "Password updated. You can now sign in." });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "Email/ID and password are required.");
      }

      const session = await login({
        ...parsed.data,
        ip: req.ip,
        userAgent: req.header("user-agent"),
        dbEnabled: env.db.enabled,
      });

      applySessionCookies(res, session);
      res.json({ user: session.user, csrfToken: session.csrfToken });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
      if (!token) {
        throw new ApiError(401, "No session to refresh.");
      }

      const session = await refresh({
        refreshToken: token,
        ip: req.ip,
        userAgent: req.header("user-agent"),
        dbEnabled: env.db.enabled,
      });

      applySessionCookies(res, session);
      res.json({ user: session.user, csrfToken: session.csrfToken });
    } catch (error) {
      clearSessionCookies(res);
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
      await logout(token);
      clearSessionCookies(res);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async me(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = currentUser(res);
      if (!context) {
        throw new ApiError(401, "Authentication required.");
      }

      const user = await getSessionUser(context.id);
      if (!user) {
        clearSessionCookies(res);
        throw new ApiError(401, "Session is no longer valid.");
      }

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

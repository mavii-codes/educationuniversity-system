import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { AuthorizedRole } from "../models";
import { ApiError } from "../middleware/error.middleware";
import * as authRepository from "../repositories/auth.repository";

export const ACCESS_COOKIE = "udis_at";
export const REFRESH_COOKIE = "udis_rt";
export const CSRF_COOKIE = "udis_csrf";
export const REFRESH_COOKIE_PATH = "/api/auth";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: AuthorizedRole;
  accessRole: string;
  department: string;
  lastLogin: string;
}

export interface AuthContext {
  id: string;
  portalRole: AuthorizedRole;
  accessRole: string;
  email: string;
  name: string;
}

// Explicit allowlist of the real DB role strings (see db/migrations).
const PORTAL_ROLE_BY_ACCESS_ROLE: Record<string, AuthorizedRole> = {
  "System Administrator": "Administrator",
  "Library Staff": "Librarian",
  "University Registrar Admin": "Librarian",
  Student: "Student",
  // These roles operate the admin/integration consoles, so they keep the
  // Administrator portal access they had before this allowlist existed.
  "Data Integration Engineer": "Administrator",
  "Institutional Data Steward": "Administrator",
};

export function toPortalRole(accessRole: string): AuthorizedRole {
  return PORTAL_ROLE_BY_ACCESS_ROLE[accessRole] ?? "Administrator";
}

export function toSessionUser(user: authRepository.UserRow): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: toPortalRole(user.role),
    accessRole: user.role,
    department: user.department,
    lastLogin: "Just now",
  };
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function comparePassword(password: string, hash: string): boolean {
  if (!hash || hash.startsWith("!")) return false;
  return bcrypt.compareSync(password, hash);
}

export async function registerStudent(input: {
  studentId: string;
  name: string;
  email: string;
  password: string;
  programCode: string;
  yearLevel: string;
  dbEnabled: boolean;
}): Promise<SessionUser> {
  if (!input.dbEnabled) {
    throw new ApiError(503, "Student registration requires the PostgreSQL database (DB_ENABLED=true).");
  }

  const user = await authRepository.registerStudent({
    id: input.studentId,
    name: input.name,
    email: input.email,
    passwordHash: hashPassword(input.password),
    programCode: input.programCode,
    yearLevel: input.yearLevel,
  });

  await safeAudit(null, "auth.student_registered", { userId: user.id });
  return toSessionUser(user);
}

const DUMMY_PASSWORD_HASH = bcrypt.hashSync("udis-invalid-password", 12);

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function signAccessToken(user: authRepository.UserRow): string {
  const payload: AuthContext = {
    id: user.id,
    portalRole: toPortalRole(user.role),
    accessRole: user.role,
    email: user.email,
    name: user.name,
  };
  return jwt.sign({ sub: user.id, ...payload }, env.auth.accessSecret, {
    algorithm: "HS256",
    expiresIn: env.auth.accessTtl as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AuthContext | null {
  try {
    const decoded = jwt.verify(token, env.auth.accessSecret, {
      algorithms: ["HS256"],
    }) as Record<string, unknown>;
    if (
      typeof decoded.id !== "string" ||
      typeof decoded.portalRole !== "string" ||
      typeof decoded.accessRole !== "string"
    ) {
      return null;
    }
    return {
      id: decoded.id,
      portalRole: toPortalRole(decoded.accessRole),
      accessRole: decoded.accessRole,
      email: String(decoded.email ?? ""),
      name: String(decoded.name ?? ""),
    };
  } catch {
    return null;
  }
}

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  refreshTtlMs: number;
  user: SessionUser;
}

function issueRefreshToken(
  userId: string,
  remember: boolean,
  ip: string | undefined,
  userAgent: string | undefined
): Promise<{ refreshToken: string; ttlMs: number }> {
  const ttlDays = remember
    ? env.auth.refreshTtlDaysRemember
    : env.auth.refreshTtlDays;
  const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
  const id = crypto.randomUUID();
  const raw = crypto.randomBytes(48).toString("base64url");

  return authRepository
    .createRefreshToken({
      id,
      userId,
      tokenHash: sha256(`${id}.${raw}`),
      expiresAt: new Date(Date.now() + ttlMs),
      remember,
      ip,
      userAgent,
    })
    .then(() => ({ refreshToken: `${id}.${raw}`, ttlMs }));
}

export function sessionCookies(session: IssuedSession) {
  return {
    access: {
      value: session.accessToken,
      options: {
        httpOnly: true,
        secure: env.auth.cookieSecure,
        sameSite: env.auth.cookieSameSite,
        domain: env.auth.cookieDomain,
        path: "/",
        maxAge: env.auth.accessTtlMs,
      },
    },
    refresh: {
      value: session.refreshToken,
      options: {
        httpOnly: true,
        secure: env.auth.cookieSecure,
        sameSite: env.auth.cookieSameSite,
        domain: env.auth.cookieDomain,
        path: REFRESH_COOKIE_PATH,
        maxAge: session.refreshTtlMs,
      },
    },
    csrf: {
      value: session.csrfToken,
      options: {
        httpOnly: false,
        secure: env.auth.cookieSecure,
        sameSite: env.auth.cookieSameSite,
        domain: env.auth.cookieDomain,
        path: "/",
        maxAge: session.refreshTtlMs,
      },
    },
  };
}

async function issueSession(
  user: authRepository.UserRow,
  remember: boolean,
  ip?: string,
  userAgent?: string
): Promise<IssuedSession> {
  const { refreshToken, ttlMs } = await issueRefreshToken(user.id, remember, ip, userAgent);
  return {
    accessToken: signAccessToken(user),
    refreshToken,
    csrfToken: crypto.randomBytes(24).toString("base64url"),
    refreshTtlMs: ttlMs,
    user: toSessionUser(user),
  };
}

export async function login(input: {
  identifier: string;
  password: string;
  rememberMe?: boolean;
  ip?: string;
  userAgent?: string;
  dbEnabled: boolean;
}): Promise<IssuedSession> {
  if (!input.dbEnabled) {
    throw new ApiError(503, "Authentication requires the PostgreSQL database (DB_ENABLED=true).");
  }

  const identifier = input.identifier.trim();
  const user = await authRepository.findUserByIdentifier(identifier);
  const passwordMatches = comparePassword(
    input.password,
    user?.password_hash ?? DUMMY_PASSWORD_HASH
  );

  if (!user || !passwordMatches) {
    await safeAudit(null, "auth.login_failed", { identifier });
    throw new ApiError(401, "Invalid email or password.");
  }

  if (user.status !== "Active") {
    await safeAudit(user.id, "auth.login_blocked", { status: user.status });
    throw new ApiError(403, `This account is ${user.status.toLowerCase()}. Contact an administrator.`);
  }

  await authRepository.touchLastLogin(user.id);
  await safeAudit(user.id, "auth.login_succeeded", { role: user.role });

  return issueSession(user, Boolean(input.rememberMe), input.ip, input.userAgent);
}

export async function refresh(input: {
  refreshToken: string;
  ip?: string;
  userAgent?: string;
  dbEnabled: boolean;
}): Promise<IssuedSession> {
  if (!input.dbEnabled) {
    throw new ApiError(503, "Authentication requires the PostgreSQL database.");
  }

  const [id, raw] = input.refreshToken.split(".");
  if (!id || !raw) {
    throw new ApiError(401, "Invalid session.");
  }

  const nextId = crypto.randomUUID();
  const nextRaw = crypto.randomBytes(48).toString("base64url");

  // The repository locks the current row FOR UPDATE and revokes + inserts the
  // replacement inside one transaction, so parallel refreshes cannot both win.
  const rotation = await authRepository.rotateRefreshToken({
    id,
    tokenHash: sha256(`${id}.${raw}`),
    nextId,
    nextTokenHash: sha256(`${nextId}.${nextRaw}`),
    defaultTtlMs: env.auth.refreshTtlDays * 24 * 60 * 60 * 1000,
    rememberTtlMs: env.auth.refreshTtlDaysRemember * 24 * 60 * 60 * 1000,
    ip: input.ip,
    userAgent: input.userAgent,
  });

  if (rotation.status === "invalid") {
    throw new ApiError(401, "Invalid session.");
  }

  if (rotation.status === "reused") {
    // Token reuse after rotation: the whole family was already revoked.
    await safeAudit(rotation.userId, "auth.refresh_reuse_detected", { tokenId: id });
    throw new ApiError(401, "Session has been revoked. Please sign in again.");
  }

  if (rotation.status === "expired") {
    throw new ApiError(401, "Session expired. Please sign in again.");
  }

  if (rotation.status === "inactive") {
    throw new ApiError(401, "Account is not active.");
  }

  const user = await authRepository.findUserById(rotation.token.user_id);
  if (!user || user.status !== "Active") {
    await authRepository.revokeRefreshToken(nextId);
    throw new ApiError(401, "Account is not active.");
  }

  return {
    accessToken: signAccessToken(user),
    refreshToken: `${nextId}.${nextRaw}`,
    csrfToken: crypto.randomBytes(24).toString("base64url"),
    refreshTtlMs: rotation.ttlMs,
    user: toSessionUser(user),
  };
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;
  const [id] = refreshToken.split(".");
  if (!id) return;
  await authRepository.revokeRefreshToken(id);
}

export async function getSessionUser(userId: string): Promise<SessionUser | null> {
  const user = await authRepository.findUserById(userId);
  if (!user || user.status !== "Active") return null;
  return toSessionUser(user);
}

async function safeAudit(
  actorUserId: string | null,
  action: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await authRepository.writeAudit({
      actorUserId,
      action,
      entityType: "auth",
      metadata,
    });
  } catch {
    // Audit failures must never block authentication.
  }
}

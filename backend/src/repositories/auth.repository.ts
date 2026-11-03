import { queryDb, withTransaction } from "../config/database";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  department: string;
  status: "Active" | "Inactive" | "Invited";
  mfa_enabled: boolean;
  last_login_at: Date | null;
};

export type RefreshTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by_token_id: string | null;
  remember: boolean;
};

export async function findUserByIdentifier(identifier: string): Promise<UserRow | null> {
  const result = await queryDb<UserRow>(
    `SELECT id, name, email, password_hash, role, department, status, mfa_enabled, last_login_at
       FROM users
      WHERE lower(email) = lower($1) OR id = $1
      LIMIT 1`,
    [identifier]
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await queryDb<UserRow>(
    `SELECT id, name, email, password_hash, role, department, status, mfa_enabled, last_login_at
       FROM users
      WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await queryDb<UserRow>(
    `SELECT id, name, email, password_hash, role, department, status, mfa_enabled, last_login_at
       FROM users
      WHERE lower(email) = lower($1)
      LIMIT 1`,
    [email]
  );
  return result.rows[0] ?? null;
}

export async function createPasswordResetToken(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE password_reset_tokens
          SET used_at = NOW()
        WHERE user_id = $1 AND used_at IS NULL`,
      [input.userId]
    );
    await client.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [input.userId, input.tokenHash, input.expiresAt]
    );
  });
}

export async function consumePasswordResetToken(
  tokenHash: string,
  passwordHash: string
): Promise<boolean> {
  return withTransaction(async (client) => {
    const result = await client.query<{ user_id: string }>(
      `SELECT prt.user_id
         FROM password_reset_tokens AS prt
         JOIN users ON users.id = prt.user_id AND users.status = 'Active'
        WHERE prt.token_hash = $1
          AND prt.used_at IS NULL
          AND prt.expires_at > NOW()
        FOR UPDATE OF prt, users`,
      [tokenHash]
    );
    const reset = result.rows[0];
    if (!reset) return false;

    await client.query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1`,
      [tokenHash]
    );
    await client.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, reset.user_id]
    );
    await client.query(
      `UPDATE refresh_tokens SET revoked_at = NOW()
        WHERE user_id = $1 AND revoked_at IS NULL`,
      [reset.user_id]
    );
    return true;
  });
}

export async function touchLastLogin(userId: string): Promise<void> {
  await queryDb(
    `UPDATE users SET last_login_at = NOW(), last_active_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [userId]
  );
}

export async function createRefreshToken(input: {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  remember: boolean;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  await queryDb(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, remember, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.id,
      input.userId,
      input.tokenHash,
      input.expiresAt,
      input.remember,
      input.ip ?? null,
      input.userAgent?.slice(0, 240) ?? null,
    ]
  );
}

export async function findRefreshTokenById(id: string): Promise<RefreshTokenRow | null> {
  const result = await queryDb<RefreshTokenRow>(
    `SELECT id, user_id, token_hash, expires_at, revoked_at, replaced_by_token_id, remember
       FROM refresh_tokens
      WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function revokeRefreshToken(
  id: string,
  replacedByTokenId?: string
): Promise<void> {
  await queryDb(
    `UPDATE refresh_tokens
        SET revoked_at = NOW(), replaced_by_token_id = COALESCE($2, replaced_by_token_id)
      WHERE id = $1 AND revoked_at IS NULL`,
    [id, replacedByTokenId ?? null]
  );
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await queryDb(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

export async function writeAudit(input: {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await queryDb(
    `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      input.actorUserId ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      JSON.stringify(input.metadata ?? {}),
    ]
  );
}

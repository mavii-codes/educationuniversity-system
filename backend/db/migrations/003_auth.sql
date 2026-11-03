-- Authentication and authorization tables.
-- Password hashes are bcrypt; refresh tokens are stored hashed and rotated.

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(120) NOT NULL,
  role VARCHAR(48) NOT NULL CHECK (role IN (
    'System Administrator',
    'University Registrar Admin',
    'Data Integration Engineer',
    'Institutional Data Steward'
  )),
  department VARCHAR(160) NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('Active', 'Inactive', 'Invited')),
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  replaced_by_token_id VARCHAR(64),
  ip VARCHAR(64),
  user_agent VARCHAR(240),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

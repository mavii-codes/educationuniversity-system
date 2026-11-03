-- Preserve "remember me" semantics across refresh-token rotation.
ALTER TABLE refresh_tokens
  ADD COLUMN IF NOT EXISTS remember BOOLEAN NOT NULL DEFAULT FALSE;

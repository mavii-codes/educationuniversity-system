-- 015: FERPA governance — consent registry, directory-information opt-out, record access log
-- Idempotent; follows existing snake_case + VARCHAR PK conventions.

CREATE TABLE IF NOT EXISTS ferpa_consent_records (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  consent_type VARCHAR(48) NOT NULL CHECK (consent_type IN ('RECORDS_RELEASE', 'DIRECTORY_INFO', 'THIRD_PARTY', 'RESEARCH_USE')),
  status VARCHAR(16) NOT NULL CHECK (status IN ('Granted', 'Revoked')),
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  recorded_by VARCHAR(32),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ferpa_consents_student ON ferpa_consent_records(student_id, effective_at DESC);
CREATE INDEX IF NOT EXISTS idx_ferpa_consents_type ON ferpa_consent_records(consent_type);

CREATE TABLE IF NOT EXISTS ferpa_directory_settings (
  student_id VARCHAR(32) PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  directory_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by VARCHAR(32),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ferpa_access_log (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  viewer_id VARCHAR(32) NOT NULL,
  viewer_name VARCHAR(160),
  viewer_role VARCHAR(32) NOT NULL,
  action VARCHAR(48) NOT NULL, -- VIEW_PROFILE | VIEW_LIFECYCLE | VIEW_DIRECTORY | MASK_APPLIED
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ferpa_access_student ON ferpa_access_log(student_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ferpa_access_occurred ON ferpa_access_log(occurred_at DESC);

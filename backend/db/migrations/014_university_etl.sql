-- 014: Unified student lifecycle timeline events.
-- Idempotent; follows existing snake_case + VARCHAR PK conventions.

-- Lifecycle events are retained for the student's unified timeline. The
-- ETL source list in this application is Library-only.
CREATE TABLE IF NOT EXISTS student_lifecycle_events (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  stage VARCHAR(32) NOT NULL CHECK (stage IN ('ADMISSIONS', 'ENROLLMENT', 'LMS_ENGAGEMENT', 'LIBRARY_ACTIVITY', 'FINANCIAL_STANDING', 'ALUMNI')),
  source_system VARCHAR(32) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_events_student ON student_lifecycle_events(student_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_stage ON student_lifecycle_events(stage);

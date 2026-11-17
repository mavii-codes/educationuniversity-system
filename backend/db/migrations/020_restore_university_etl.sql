-- 020: Restore the university multi-source ETL tables (SIS, LMS, HR, Alumni CRM, Library).
-- Migration 016 dropped them under a library-only policy; the University DataHub
-- integration method (ETL/ELT across campus systems) requires them again.
-- Idempotent: safe on databases where 016 never ran.

CREATE TABLE IF NOT EXISTS etl_sources (
  code VARCHAR(32) PRIMARY KEY, -- SIS | LMS | HR | ALUMNI_CRM | LIBRARY
  name VARCHAR(120) NOT NULL,
  description TEXT,
  adapter VARCHAR(64) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'Connected' CHECK (status IN ('Connected', 'Degraded', 'Disabled')),
  last_synced_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS etl_runs (
  id VARCHAR(64) PRIMARY KEY,
  triggered_by VARCHAR(120) NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('Completed', 'Partial', 'Failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  total_extracted INTEGER NOT NULL DEFAULT 0,
  total_validated INTEGER NOT NULL DEFAULT 0,
  total_cleaned INTEGER NOT NULL DEFAULT 0,
  total_transformed INTEGER NOT NULL DEFAULT 0,
  total_loaded INTEGER NOT NULL DEFAULT 0,
  total_rejected INTEGER NOT NULL DEFAULT 0,
  source_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_etl_runs_started_at ON etl_runs(started_at DESC);

CREATE TABLE IF NOT EXISTS etl_run_sources (
  id VARCHAR(64) PRIMARY KEY,
  run_id VARCHAR(64) NOT NULL REFERENCES etl_runs(id) ON DELETE CASCADE,
  source_code VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('Completed', 'Failed')),
  records_extracted INTEGER NOT NULL DEFAULT 0,
  records_validated INTEGER NOT NULL DEFAULT 0,
  records_cleaned INTEGER NOT NULL DEFAULT 0,
  records_transformed INTEGER NOT NULL DEFAULT 0,
  records_loaded INTEGER NOT NULL DEFAULT 0,
  records_rejected INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_etl_run_sources_run ON etl_run_sources(run_id);

-- HR system extract: student assistantships / work-study employment
CREATE TABLE IF NOT EXISTS hr_student_employment (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  department VARCHAR(120) NOT NULL,
  position_title VARCHAR(120) NOT NULL,
  employment_status VARCHAR(24) NOT NULL DEFAULT 'Active' CHECK (employment_status IN ('Active', 'Ended', 'On Leave')),
  hired_on DATE,
  supervisor VARCHAR(160),
  weekly_hours NUMERIC(5, 2),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_student_employment_student ON hr_student_employment(student_id);

-- Unified per-student lifecycle timeline events (written by ETL loads)
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

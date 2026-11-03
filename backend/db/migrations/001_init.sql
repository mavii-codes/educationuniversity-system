-- Initial University DataHub schema.
-- Mirrors src/models/schema.sql; applied once by src/db/migrate.ts.

CREATE TABLE IF NOT EXISTS programs (
  id VARCHAR(32) PRIMARY KEY,
  code VARCHAR(16) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  department VARCHAR(160) NOT NULL,
  enrolled_count INTEGER NOT NULL DEFAULT 0 CHECK (enrolled_count >= 0),
  average_gpa NUMERIC(4, 2) NOT NULL DEFAULT 0.00 CHECK (average_gpa BETWEEN 0 AND 4),
  graduation_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (graduation_rate BETWEEN 0 AND 100),
  withdrawal_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (withdrawal_rate BETWEEN 0 AND 100),
  attendance_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (attendance_rate BETWEEN 0 AND 100),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  program_code VARCHAR(16) NOT NULL REFERENCES programs(code) ON UPDATE CASCADE,
  year_level VARCHAR(24) NOT NULL,
  status VARCHAR(24) NOT NULL CHECK (status IN ('Active', 'Graduated', 'On Leave', 'Withdrawn')),
  performance_score NUMERIC(5, 2) NOT NULL CHECK (performance_score BETWEEN 0 AND 100),
  gpa NUMERIC(4, 2) NOT NULL CHECK (gpa BETWEEN 0 AND 4),
  attendance_rate NUMERIC(5, 2) NOT NULL CHECK (attendance_rate BETWEEN 0 AND 100),
  risk_level VARCHAR(16) NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_program_code ON students(program_code);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_risk_level ON students(risk_level);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);

CREATE TABLE IF NOT EXISTS data_sources (
  id VARCHAR(32) PRIMARY KEY,
  code VARCHAR(24) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  status VARCHAR(24) NOT NULL CHECK (status IN ('Connected', 'Syncing', 'Warning', 'Disconnected')),
  record_count INTEGER NOT NULL DEFAULT 0 CHECK (record_count >= 0),
  last_synced_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id VARCHAR(64) PRIMARY KEY,
  source_code VARCHAR(24) NOT NULL,
  source_name VARCHAR(120) NOT NULL,
  records_processed INTEGER NOT NULL DEFAULT 0 CHECK (records_processed >= 0),
  duplicates_detected INTEGER NOT NULL DEFAULT 0 CHECK (duplicates_detected >= 0),
  failed_records INTEGER NOT NULL DEFAULT 0 CHECK (failed_records >= 0),
  status VARCHAR(24) NOT NULL CHECK (status IN ('Successful', 'Warning', 'Failed')),
  notes TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_executed_at ON integration_sync_logs(executed_at DESC);

CREATE TABLE IF NOT EXISTS alumni_records (
  id VARCHAR(32) PRIMARY KEY,
  student_id VARCHAR(32),
  name VARCHAR(160) NOT NULL,
  graduation_year INTEGER NOT NULL CHECK (graduation_year BETWEEN 1900 AND 2200),
  program_code VARCHAR(16) NOT NULL REFERENCES programs(code) ON UPDATE CASCADE,
  employment_status VARCHAR(48) NOT NULL,
  current_company VARCHAR(160),
  location VARCHAR(120)
);

CREATE INDEX IF NOT EXISTS idx_alumni_records_program_code ON alumni_records(program_code);
CREATE INDEX IF NOT EXISTS idx_alumni_records_graduation_year ON alumni_records(graduation_year DESC);

CREATE TABLE IF NOT EXISTS integrated_alumni_crm (
  id VARCHAR(32) PRIMARY KEY,
  student_id VARCHAR(32) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  program_code VARCHAR(16) NOT NULL,
  program_name VARCHAR(160) NOT NULL,
  department VARCHAR(160) NOT NULL,
  batch VARCHAR(16) NOT NULL,
  graduation_date VARCHAR(48) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'Alumni',
  source VARCHAR(48) NOT NULL DEFAULT 'Alumni CRM',
  email VARCHAR(160),
  contact_number VARCHAR(48),
  enrollment_year VARCHAR(16),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrated_alumni_batch ON integrated_alumni_crm(batch DESC);
CREATE INDEX IF NOT EXISTS idx_integrated_alumni_program_code ON integrated_alumni_crm(program_code);

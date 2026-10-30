-- PostgreSQL Schema Reference for University DataHub
-- Prepared for future relational database migration

CREATE TABLE IF NOT EXISTS programs (
  id VARCHAR(32) PRIMARY KEY,
  code VARCHAR(16) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  department VARCHAR(160) NOT NULL,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  average_gpa NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
  graduation_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  withdrawal_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  attendance_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(32) PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  program_code VARCHAR(16) NOT NULL REFERENCES programs(code),
  year_level VARCHAR(24) NOT NULL,
  status VARCHAR(24) NOT NULL,
  performance_score NUMERIC(5, 2) NOT NULL,
  gpa NUMERIC(3, 2) NOT NULL,
  attendance_rate NUMERIC(5, 2) NOT NULL,
  risk_level VARCHAR(16) NOT NULL,
  admission_year INTEGER NOT NULL,
  expected_graduation INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_sources (
  id VARCHAR(32) PRIMARY KEY,
  code VARCHAR(24) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  status VARCHAR(24) NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  last_synced_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id VARCHAR(64) PRIMARY KEY,
  source_code VARCHAR(24) NOT NULL,
  records_processed INTEGER NOT NULL DEFAULT 0,
  duplicates_detected INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(24) NOT NULL,
  notes TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alumni_records (
  id VARCHAR(32) PRIMARY KEY,
  student_id VARCHAR(32) REFERENCES students(id),
  full_name VARCHAR(160) NOT NULL,
  graduation_year INTEGER NOT NULL,
  program_code VARCHAR(16) NOT NULL REFERENCES programs(code),
  employment_status VARCHAR(48) NOT NULL,
  current_company VARCHAR(160),
  location VARCHAR(120)
);


-- External Alumni CRM ETL / ELT synchronized mirror table
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

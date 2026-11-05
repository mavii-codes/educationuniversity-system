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
  last_synced_at TIMESTAMPTZ,
  is_planned BOOLEAN NOT NULL DEFAULT FALSE
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

-- -------------------------------------------------------------
-- LIBRARY MANAGEMENT SYSTEM INTEGRATED REPOSITORY (SOLE SELECTED SOURCE)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS library_books (
  id VARCHAR(32) PRIMARY KEY,
  isbn VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(160) NOT NULL,
  publisher VARCHAR(160),
  publication_year INTEGER,
  category VARCHAR(80) NOT NULL,
  call_number VARCHAR(64) NOT NULL,
  total_copies INTEGER NOT NULL DEFAULT 1,
  available_copies INTEGER NOT NULL DEFAULT 1,
  borrowed_copies INTEGER NOT NULL DEFAULT 0,
  location VARCHAR(80),
  status VARCHAR(32) NOT NULL DEFAULT 'Available',
  cover_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS library_borrowers (
  id VARCHAR(32) PRIMARY KEY,
  borrower_id VARCHAR(32) UNIQUE NOT NULL,
  student_id VARCHAR(32) NOT NULL REFERENCES students(id),
  student_name VARCHAR(160) NOT NULL,
  email VARCHAR(160) NOT NULL,
  program_code VARCHAR(16) NOT NULL,
  program_name VARCHAR(160) NOT NULL,
  year_level VARCHAR(24) NOT NULL,
  active_loans_count INTEGER NOT NULL DEFAULT 0,
  total_loans_history INTEGER NOT NULL DEFAULT 0,
  fines_balance NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(24) NOT NULL DEFAULT 'Active',
  last_active VARCHAR(48)
);

CREATE TABLE IF NOT EXISTS library_transactions (
  id VARCHAR(32) PRIMARY KEY,
  transaction_code VARCHAR(48) UNIQUE NOT NULL,
  book_id VARCHAR(32) NOT NULL REFERENCES library_books(id),
  book_title VARCHAR(255) NOT NULL,
  isbn VARCHAR(32) NOT NULL,
  student_id VARCHAR(32) NOT NULL REFERENCES students(id),
  student_name VARCHAR(160) NOT NULL,
  program_code VARCHAR(16) NOT NULL,
  borrow_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  return_date TIMESTAMPTZ,
  status VARCHAR(24) NOT NULL DEFAULT 'Borrowed',
  fines_accrued NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  source_system VARCHAR(48) NOT NULL DEFAULT 'Library LMS'
);

CREATE TABLE IF NOT EXISTS library_reservations (
  id VARCHAR(32) PRIMARY KEY,
  reservation_code VARCHAR(48) UNIQUE NOT NULL,
  book_id VARCHAR(32) NOT NULL REFERENCES library_books(id),
  book_title VARCHAR(255) NOT NULL,
  isbn VARCHAR(32) NOT NULL,
  student_id VARCHAR(32) NOT NULL REFERENCES students(id),
  student_name VARCHAR(160) NOT NULL,
  program_code VARCHAR(16) NOT NULL,
  reserved_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Pending'
);

CREATE TABLE IF NOT EXISTS library_fines (
  id VARCHAR(32) PRIMARY KEY,
  transaction_id VARCHAR(32) NOT NULL REFERENCES library_transactions(id),
  book_title VARCHAR(255) NOT NULL,
  student_id VARCHAR(32) NOT NULL REFERENCES students(id),
  student_name VARCHAR(160) NOT NULL,
  program_code VARCHAR(16) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  days_overdue INTEGER NOT NULL DEFAULT 0,
  fine_amount NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  payment_status VARCHAR(24) NOT NULL DEFAULT 'Unpaid'
);

CREATE TABLE IF NOT EXISTS library_fine_payments (
  fine_id VARCHAR(64) PRIMARY KEY,
  payment_status VARCHAR(16) NOT NULL CHECK (payment_status IN ('Paid')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS library_etl_logs (
  id VARCHAR(64) PRIMARY KEY,
  job_name VARCHAR(120) NOT NULL,
  status VARCHAR(24) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration VARCHAR(32),
  records_extracted INTEGER NOT NULL DEFAULT 0,
  records_validated INTEGER NOT NULL DEFAULT 0,
  duplicates_cleaned INTEGER NOT NULL DEFAULT 0,
  students_matched INTEGER NOT NULL DEFAULT 0,
  records_loaded INTEGER NOT NULL DEFAULT 0,
  errors JSONB,
  execution_log JSONB
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor VARCHAR(120) NOT NULL,
  actor_role VARCHAR(64) NOT NULL,
  action VARCHAR(120) NOT NULL,
  resource VARCHAR(120) NOT NULL,
  status VARCHAR(24) NOT NULL,
  ip_address VARCHAR(48) NOT NULL,
  details TEXT
);

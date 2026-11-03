-- Full data model: student profiles, academic records, LMS, library, analytics, admin.
-- Appended after 001_init.sql; never edit 001 once applied.

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS department VARCHAR(160),
  ADD COLUMN IF NOT EXISTS adviser VARCHAR(120),
  ADD COLUMN IF NOT EXISTS scholarship VARCHAR(120),
  ADD COLUMN IF NOT EXISTS admission_year INTEGER,
  ADD COLUMN IF NOT EXISTS expected_graduation INTEGER,
  ADD COLUMN IF NOT EXISTS contact_number VARCHAR(48),
  ADD COLUMN IF NOT EXISTS address VARCHAR(240),
  ADD COLUMN IF NOT EXISTS current_semester VARCHAR(64),
  ADD COLUMN IF NOT EXISTS units_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS units_required INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS absences_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS excused_absences INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lms_weekly_logins INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lms_total_hours NUMERIC(6, 1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lms_assignments_submitted INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lms_assignments_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lms_completion_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS library_total_borrowed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS library_returned_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS library_current_borrowed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS library_fines_balance NUMERIC(10, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS courses (
  code VARCHAR(24) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  program_code VARCHAR(16) NOT NULL REFERENCES programs(code) ON UPDATE CASCADE,
  units INTEGER NOT NULL CHECK (units > 0),
  instructor VARCHAR(120) NOT NULL,
  enrolled_students INTEGER NOT NULL DEFAULT 0 CHECK (enrolled_students >= 0),
  lms_active_rate NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (lms_active_rate BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_courses_program_code ON courses(program_code);

CREATE TABLE IF NOT EXISTS enrollments (
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_code VARCHAR(24) NOT NULL,
  course_title VARCHAR(160) NOT NULL,
  term VARCHAR(64) NOT NULL,
  units INTEGER NOT NULL CHECK (units > 0),
  midterm_grade NUMERIC(5, 2),
  final_grade NUMERIC(5, 2),
  gpa_equivalent NUMERIC(3, 2),
  instructor VARCHAR(120),
  status VARCHAR(24) NOT NULL CHECK (status IN ('Passed', 'In Progress', 'At Risk')),
  PRIMARY KEY (student_id, course_code, term)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);

CREATE TABLE IF NOT EXISTS semester_gpa_history (
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  semester VARCHAR(64) NOT NULL,
  gpa NUMERIC(3, 2) NOT NULL CHECK (gpa BETWEEN 0 AND 4),
  units_completed INTEGER NOT NULL DEFAULT 0,
  standing VARCHAR(64) NOT NULL,
  PRIMARY KEY (student_id, semester)
);

CREATE TABLE IF NOT EXISTS attendance_monthly (
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month VARCHAR(16) NOT NULL,
  rate NUMERIC(5, 2) NOT NULL CHECK (rate BETWEEN 0 AND 100),
  present_days INTEGER NOT NULL DEFAULT 0,
  absent_days INTEGER NOT NULL DEFAULT 0,
  late_days INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (student_id, month)
);

CREATE TABLE IF NOT EXISTS lms_course_progress (
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_code VARCHAR(24) NOT NULL,
  course_title VARCHAR(160) NOT NULL,
  completion_rate NUMERIC(5, 2) NOT NULL CHECK (completion_rate BETWEEN 0 AND 100),
  assignments_completed INTEGER NOT NULL DEFAULT 0,
  assignments_total INTEGER NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  PRIMARY KEY (student_id, course_code)
);

CREATE TABLE IF NOT EXISTS lms_weekly_engagement (
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  week_label VARCHAR(16) NOT NULL,
  logins INTEGER NOT NULL DEFAULT 0,
  submissions INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (student_id, week_label)
);

CREATE TABLE IF NOT EXISTS library_books (
  id VARCHAR(32) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS library_loans (
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  book_id VARCHAR(32) NOT NULL REFERENCES library_books(id) ON UPDATE CASCADE,
  borrowed_date DATE,
  due_date DATE,
  returned_date DATE,
  status VARCHAR(24) NOT NULL CHECK (status IN ('Borrowed', 'Returned', 'Due Soon')),
  PRIMARY KEY (student_id, book_id, borrowed_date)
);

CREATE INDEX IF NOT EXISTS idx_library_loans_student ON library_loans(student_id);

CREATE TABLE IF NOT EXISTS student_source_sync (
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  source_code VARCHAR(24) NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, source_code)
);

ALTER TABLE data_sources
  ADD COLUMN IF NOT EXISTS short_name VARCHAR(80),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS sync_frequency VARCHAR(64),
  ADD COLUMN IF NOT EXISTS endpoint_preview VARCHAR(120),
  ADD COLUMN IF NOT EXISTS health_score NUMERIC(5, 2) NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS entities_synced TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS maintainer_dept VARCHAR(160);

ALTER TABLE integration_sync_logs
  ADD COLUMN IF NOT EXISTS duration_label VARCHAR(16),
  ADD COLUMN IF NOT EXISTS date_label VARCHAR(24),
  ADD COLUMN IF NOT EXISTS timestamp_label VARCHAR(48);

CREATE TABLE IF NOT EXISTS sync_history (
  id VARCHAR(32) PRIMARY KEY,
  data_source VARCHAR(24) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  sync_mode VARCHAR(48) NOT NULL,
  last_sync_label VARCHAR(48) NOT NULL,
  records INTEGER NOT NULL DEFAULT 0 CHECK (records >= 0),
  duration VARCHAR(16) NOT NULL,
  status VARCHAR(24) NOT NULL CHECK (status IN ('Connected', 'Syncing', 'Warning', 'Disconnected')),
  notes TEXT,
  started_at TIMESTAMPTZ
);

ALTER TABLE alumni_records
  ADD COLUMN IF NOT EXISTS job_title VARCHAR(160),
  ADD COLUMN IF NOT EXISTS industry VARCHAR(120),
  ADD COLUMN IF NOT EXISTS aligned_with_degree BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(32) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(16) NOT NULL CHECK (type IN ('success', 'warning', 'info', 'alert')),
  source VARCHAR(80) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  href VARCHAR(160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_feed (
  id VARCHAR(32) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  detail TEXT NOT NULL,
  source VARCHAR(24) NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('success', 'warning', 'info')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(32) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(32) NOT NULL,
  description TEXT NOT NULL,
  last_generated_label VARCHAR(48) NOT NULL,
  frequency VARCHAR(80) NOT NULL,
  source_systems TEXT[] NOT NULL DEFAULT '{}',
  file_size VARCHAR(16) NOT NULL,
  highlights JSONB NOT NULL DEFAULT '[]',
  preview_headers JSONB NOT NULL DEFAULT '[]',
  preview_rows JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS lifecycle_overview_stats (
  label VARCHAR(64) PRIMARY KEY,
  value INTEGER NOT NULL,
  change VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lifecycle_stages (
  key VARCHAR(32) PRIMARY KEY,
  title VARCHAR(64) NOT NULL,
  subtitle TEXT NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('completed', 'current', 'upcoming')),
  metric_label VARCHAR(64) NOT NULL,
  metric_count INTEGER NOT NULL,
  conversion_rate VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  source_systems TEXT[] NOT NULL DEFAULT '{}',
  key_milestones TEXT[] NOT NULL DEFAULT '{}',
  insights JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Aggregate snapshots produced by the integration/ETL layer (dashboard, alumni, admin).
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  key VARCHAR(64) PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id VARCHAR(32),
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(48) NOT NULL,
  entity_id VARCHAR(64),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

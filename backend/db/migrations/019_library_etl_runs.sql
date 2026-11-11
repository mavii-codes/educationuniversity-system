-- 019: Persist live Library-to-lifecycle ETL run history.
CREATE TABLE IF NOT EXISTS library_etl_runs (
  id VARCHAR(64) PRIMARY KEY,
  job_name VARCHAR(160) NOT NULL,
  triggered_by VARCHAR(120) NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('Running', 'Completed', 'Failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  records_extracted INTEGER NOT NULL DEFAULT 0 CHECK (records_extracted >= 0),
  records_validated INTEGER NOT NULL DEFAULT 0 CHECK (records_validated >= 0),
  duplicates_cleaned INTEGER NOT NULL DEFAULT 0 CHECK (duplicates_cleaned >= 0),
  students_matched INTEGER NOT NULL DEFAULT 0 CHECK (students_matched >= 0),
  records_loaded INTEGER NOT NULL DEFAULT 0 CHECK (records_loaded >= 0),
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  execution_log JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_library_etl_runs_started
  ON library_etl_runs(started_at DESC);

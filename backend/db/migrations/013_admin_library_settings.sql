CREATE TABLE IF NOT EXISTS library_system_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  library_name VARCHAR(160) NOT NULL DEFAULT 'University Library',
  office_location VARCHAR(160) NOT NULL DEFAULT 'Library Office',
  due_date_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  fine_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO library_system_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

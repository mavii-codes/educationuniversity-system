-- Preserve curriculum-history display order for semester GPA records.
ALTER TABLE semester_gpa_history
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

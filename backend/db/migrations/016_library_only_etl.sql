-- 016: Keep the Library as the only configured ETL data source.
-- Historical multi-source ETL tables were empty when removed from the application.
DROP TABLE IF EXISTS etl_run_sources, etl_runs, etl_sources, hr_student_employment;

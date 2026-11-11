-- 017: Remove non-Library source records and their synchronization history.
DELETE FROM integration_sync_logs
WHERE UPPER(source_code) <> 'LIBRARY';

DELETE FROM sync_history
WHERE UPPER(data_source) NOT IN ('LIBRARY', 'LIBRARY SYSTEM', 'CAMPUS LIBRARY');

DELETE FROM data_sources
WHERE code <> 'LIBRARY';

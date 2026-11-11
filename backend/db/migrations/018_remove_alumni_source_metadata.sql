-- 018: Remove the obsolete Alumni CRM connector status snapshot.
DELETE FROM analytics_snapshots
WHERE key = 'alumni_crm_source_info';

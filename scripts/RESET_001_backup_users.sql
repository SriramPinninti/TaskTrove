-- ============================================
-- BACKUP SCRIPT: Create backup of all user data
-- ============================================
-- Run this BEFORE resetting to preserve data
-- This creates a backup schema with timestamped tables

-- Create backup schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS backup;

-- Create backup tables with timestamp
DO $$
DECLARE
  timestamp_suffix TEXT := to_char(now(), 'YYYYMMDD_HH24MISS');
BEGIN
  -- Backup profiles
  EXECUTE format('CREATE TABLE backup.profiles_%s AS SELECT * FROM public.profiles', timestamp_suffix);
  
  -- Backup tasks
  EXECUTE format('CREATE TABLE backup.tasks_%s AS SELECT * FROM public.tasks', timestamp_suffix);
  
  -- Backup messages
  EXECUTE format('CREATE TABLE backup.messages_%s AS SELECT * FROM public.messages', timestamp_suffix);
  
  -- Backup ratings
  EXECUTE format('CREATE TABLE backup.ratings_%s AS SELECT * FROM public.ratings', timestamp_suffix);
  
  -- Backup transactions
  EXECUTE format('CREATE TABLE backup.transactions_%s AS SELECT * FROM public.transactions', timestamp_suffix);
  
  -- Backup task_requests
  EXECUTE format('CREATE TABLE backup.task_requests_%s AS SELECT * FROM public.task_requests', timestamp_suffix);
  
  -- Backup notifications
  EXECUTE format('CREATE TABLE backup.notifications_%s AS SELECT * FROM public.notifications', timestamp_suffix);
  
  -- Backup password_reset_tokens
  EXECUTE format('CREATE TABLE backup.password_reset_tokens_%s AS SELECT * FROM public.password_reset_tokens', timestamp_suffix);
  
  RAISE NOTICE 'Backup completed with suffix: %', timestamp_suffix;
END $$;

-- Verify backup
SELECT 
  schemaname, 
  tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'backup' 
ORDER BY tablename DESC 
LIMIT 20;

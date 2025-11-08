-- ============================================
-- RESET SCRIPT: Delete all user data
-- ============================================
-- WARNING: This will delete ALL user data!
-- Run RESET_001_backup_users.sql first if you want to preserve data

-- Disable RLS temporarily for deletion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- Delete data in correct order (respecting foreign key constraints)
-- Delete dependent data first
DELETE FROM public.messages;
DELETE FROM public.notifications;
DELETE FROM public.ratings;
DELETE FROM public.transactions;
DELETE FROM public.task_requests;
DELETE FROM public.tasks;
DELETE FROM public.password_reset_tokens;
DELETE FROM public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Verify deletion
SELECT 
  'profiles' as table_name, COUNT(*) as remaining_rows FROM public.profiles
UNION ALL
SELECT 'tasks', COUNT(*) FROM public.tasks
UNION ALL
SELECT 'messages', COUNT(*) FROM public.messages
UNION ALL
SELECT 'ratings', COUNT(*) FROM public.ratings
UNION ALL
SELECT 'transactions', COUNT(*) FROM public.transactions
UNION ALL
SELECT 'task_requests', COUNT(*) FROM public.task_requests
UNION ALL
SELECT 'notifications', COUNT(*) FROM public.notifications
UNION ALL
SELECT 'password_reset_tokens', COUNT(*) FROM public.password_reset_tokens;

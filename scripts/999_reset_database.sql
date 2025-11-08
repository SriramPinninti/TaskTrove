-- =====================================================
-- DATABASE RESET SCRIPT
-- =====================================================
-- WARNING: This will DELETE ALL DATA from your database
-- This is intended for development/testing only
-- =====================================================

-- Step 1: Delete all data from application tables (in correct order to respect foreign keys)
DELETE FROM transactions;
DELETE FROM ratings;
DELETE FROM task_requests;
DELETE FROM messages;
DELETE FROM notifications;
DELETE FROM tasks;
DELETE FROM password_reset_tokens;
DELETE FROM profiles;

-- Step 2: Delete all users from auth.users
-- Note: This requires service_role permissions
-- If this fails, you'll need to delete users manually from Supabase Dashboard
-- Go to: Authentication > Users > Select all > Delete
DELETE FROM auth.users;

-- Step 3: Reset any sequences (if you have auto-incrementing IDs)
-- Not needed for UUID primary keys, but keeping for reference

-- Step 4: Verification - Check all tables are empty
SELECT 'transactions' as table_name, COUNT(*) as row_count FROM transactions
UNION ALL
SELECT 'ratings', COUNT(*) FROM ratings
UNION ALL
SELECT 'task_requests', COUNT(*) FROM task_requests
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'password_reset_tokens', COUNT(*) FROM password_reset_tokens
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;

-- =====================================================
-- RESULT: All tables should show 0 rows
-- =====================================================

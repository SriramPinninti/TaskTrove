-- ============================================
-- RESET SCRIPT: Delete all authentication users
-- ============================================
-- WARNING: This will delete ALL users from Supabase Auth!
-- Run this AFTER RESET_002_delete_all_data.sql

-- This must be run with service role privileges
-- Delete all users from auth.users table
DELETE FROM auth.users;

-- Verify deletion
SELECT COUNT(*) as remaining_auth_users FROM auth.users;

-- Note: If you see an error about permissions, you need to run this
-- from the Supabase SQL Editor with service role access

-- ============================================
-- VERIFICATION SCRIPT: Check database is clean
-- ============================================
-- Run this to verify the reset was successful

-- Check all public tables are empty
SELECT 
  'profiles' as table_name, 
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) = 0 THEN '✓ CLEAN' ELSE '✗ HAS DATA' END as status
FROM public.profiles
UNION ALL
SELECT 'tasks', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✓ CLEAN' ELSE '✗ HAS DATA' END FROM public.tasks
UNION ALL
SELECT 'messages', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✓ CLEAN' ELSE '✗ HAS DATA' END FROM public.messages
UNION ALL
SELECT 'ratings', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✓ CLEAN' ELSE '✗ HAS DATA' END FROM public.ratings
UNION ALL
SELECT 'transactions', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✓ CLEAN' ELSE '✗ HAS DATA' END FROM public.transactions
UNION ALL
SELECT 'task_requests', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✓ CLEAN' ELSE '✗ HAS DATA' END FROM public.task_requests
UNION ALL
SELECT 'notifications', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✓ CLEAN' ELSE '✗ HAS DATA' END FROM public.notifications
UNION ALL
SELECT 'password_reset_tokens', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✓ CLEAN' ELSE '✗ HAS DATA' END FROM public.password_reset_tokens;

-- Check auth users are empty
SELECT 
  'auth.users' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) = 0 THEN '✓ CLEAN' ELSE '✗ HAS DATA' END as status
FROM auth.users;

-- Summary
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM public.profiles) = 0 
    AND (SELECT COUNT(*) FROM public.tasks) = 0
    AND (SELECT COUNT(*) FROM public.messages) = 0
    AND (SELECT COUNT(*) FROM public.ratings) = 0
    AND (SELECT COUNT(*) FROM public.transactions) = 0
    AND (SELECT COUNT(*) FROM public.task_requests) = 0
    AND (SELECT COUNT(*) FROM public.notifications) = 0
    AND (SELECT COUNT(*) FROM public.password_reset_tokens) = 0
    AND (SELECT COUNT(*) FROM auth.users) = 0
    THEN '✅ DATABASE FULLY RESET - READY FOR TESTING'
    ELSE '⚠️ SOME DATA REMAINS - CHECK RESULTS ABOVE'
  END as reset_status;

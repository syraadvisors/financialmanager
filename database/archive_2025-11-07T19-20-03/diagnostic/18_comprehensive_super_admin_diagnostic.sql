-- =====================================================
-- Comprehensive Super Admin Diagnostic and Fix
-- =====================================================
-- This script will:
-- 1. Check current user profile status
-- 2. Check for any blocking triggers
-- 3. Check for any problematic RLS policies
-- 4. Update user to super_admin role
-- 5. Verify the update worked
-- =====================================================

-- ===================
-- SECTION 1: Current Status Check
-- ===================
\echo '=== SECTION 1: Current User Profile Status ==='
SELECT
  id,
  email,
  full_name,
  role,
  firm_id,
  status,
  created_at,
  updated_at
FROM user_profiles
WHERE id = 'a5d3fd07-b718-44aa-879c-d6979a13ab00';

-- ===================
-- SECTION 2: Check for Triggers
-- ===================
\echo ''
\echo '=== SECTION 2: Checking for Triggers on user_profiles ==='
SELECT
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'user_profiles'
ORDER BY trigger_name;

-- ===================
-- SECTION 3: Check RLS Status and Policies
-- ===================
\echo ''
\echo '=== SECTION 3: RLS Status and Policies ==='
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'user_profiles';

\echo ''
\echo 'Active RLS Policies:'
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- ===================
-- SECTION 4: Check for any hung connections
-- ===================
\echo ''
\echo '=== SECTION 4: Active Connections to Database ==='
SELECT
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  state_change,
  wait_event_type,
  wait_event,
  LEFT(query, 100) as query_preview
FROM pg_stat_activity
WHERE datname = current_database()
  AND state != 'idle'
ORDER BY query_start;

-- ===================
-- SECTION 5: Update User to Super Admin
-- ===================
\echo ''
\echo '=== SECTION 5: Updating User to Super Admin ==='

-- Disable RLS temporarily to ensure update works
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Update the user
UPDATE user_profiles
SET
  role = 'super_admin',
  firm_id = NULL,
  status = 'active',
  updated_at = NOW()
WHERE id = 'a5d3fd07-b718-44aa-879c-d6979a13ab00';

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ===================
-- SECTION 6: Verify Update
-- ===================
\echo ''
\echo '=== SECTION 6: Verifying Update ==='
SELECT
  id,
  email,
  full_name,
  role,
  firm_id,
  status,
  email_verified,
  mfa_enabled,
  created_at,
  updated_at
FROM user_profiles
WHERE id = 'a5d3fd07-b718-44aa-879c-d6979a13ab00';

-- ===================
-- SECTION 7: Test Query Performance
-- ===================
\echo ''
\echo '=== SECTION 7: Testing Query Performance ==='
\timing on

-- Test direct query
EXPLAIN ANALYZE
SELECT *
FROM user_profiles
WHERE id = 'a5d3fd07-b718-44aa-879c-d6979a13ab00';

\timing off

-- ===================
-- SECTION 8: Check auth.users table
-- ===================
\echo ''
\echo '=== SECTION 8: Auth Users Table ==='
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at
FROM auth.users
WHERE id = 'a5d3fd07-b718-44aa-879c-d6979a13ab00';

-- ===================
-- SECTION 9: Summary and Recommendations
-- ===================
\echo ''
\echo '=== SECTION 9: Summary ==='
\echo 'If the update was successful, you should see:'
\echo '  - role: super_admin'
\echo '  - firm_id: NULL'
\echo '  - status: active'
\echo ''
\echo 'If queries are slow, check SECTION 7 for timing information.'
\echo 'If triggers exist in SECTION 2, they may be causing hangs.'
\echo ''
\echo 'After running this script:'
\echo '1. Log out and log back in to your application'
\echo '2. Check browser console for any new errors'
\echo '3. The super admin button should appear'
\echo '4. Clicking it should load the super admin dashboard'

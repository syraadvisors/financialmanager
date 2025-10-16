-- =====================================================
-- Simple Super Admin Diagnostic and Fix
-- (Compatible with Supabase SQL Editor)
-- =====================================================

-- SECTION 1: Current User Profile Status
SELECT
  '=== Current User Profile Status ===' as section,
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

-- SECTION 2: Check for Triggers on user_profiles
SELECT
  '=== Triggers on user_profiles ===' as section,
  trigger_name,
  event_manipulation,
  action_timing,
  LEFT(action_statement, 100) as action_preview
FROM information_schema.triggers
WHERE event_object_table = 'user_profiles'
ORDER BY trigger_name;

-- SECTION 3: Check RLS Status
SELECT
  '=== RLS Status ===' as section,
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'user_profiles';

-- SECTION 4: Active RLS Policies
SELECT
  '=== Active RLS Policies ===' as section,
  policyname,
  permissive,
  roles,
  cmd,
  LEFT(qual::text, 100) as condition_preview
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- SECTION 5: Update User to Super Admin
-- Disable RLS temporarily
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

-- SECTION 6: Verify Update
SELECT
  '=== Verification ===' as section,
  id,
  email,
  full_name,
  role,
  firm_id,
  status,
  email_verified,
  mfa_enabled,
  updated_at
FROM user_profiles
WHERE id = 'a5d3fd07-b718-44aa-879c-d6979a13ab00';

-- SECTION 7: Test Query Performance with EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT *
FROM user_profiles
WHERE id = 'a5d3fd07-b718-44aa-879c-d6979a13ab00';

-- SECTION 8: Check auth.users table
SELECT
  '=== Auth Users Table ===' as section,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE id = 'a5d3fd07-b718-44aa-879c-d6979a13ab00';

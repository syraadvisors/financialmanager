-- =====================================================
-- Diagnose User Profiles RLS Policies
-- =====================================================
-- This helps identify why super admins can't see user profiles

-- =====================================================
-- Step 1: Check current user's role
-- =====================================================
SELECT
  id,
  email,
  role,
  firm_id,
  status
FROM user_profiles
WHERE id = auth.uid();

-- =====================================================
-- Step 2: List all policies on user_profiles
-- =====================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;

-- =====================================================
-- Step 3: Test if super admin can see all profiles
-- =====================================================
-- This should return all user profiles if policies work
SELECT
  id,
  email,
  role,
  firm_id,
  status,
  created_at
FROM user_profiles
ORDER BY created_at DESC;

-- =====================================================
-- Step 4: Check if RLS is enabled
-- =====================================================
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles';

-- =====================================================
-- Step 5: Count total users (should work for super admin)
-- =====================================================
SELECT COUNT(*) as total_users FROM user_profiles;

-- =====================================================
-- Interpretation Guide
-- =====================================================
-- If Step 1 shows role = 'super_admin', your user is correctly set up
-- If Step 2 shows multiple SELECT policies, there might be conflicts
-- If Step 3 returns no rows, RLS is blocking even with super admin role
-- If Step 4 shows rowsecurity = true, RLS is enabled (expected)
-- If Step 5 returns 0 but you know users exist, RLS is blocking the query

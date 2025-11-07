-- ================================================================
-- DIAGNOSTIC: Check User Profile and RLS Policy Issues
-- ================================================================
-- This script checks if the user profile exists and matches the firm_id
-- Run this to diagnose why imports are failing

-- 1. Check if there are any users in auth.users
SELECT
  'Auth Users' as check_name,
  COUNT(*) as count,
  array_agg(email) as emails
FROM auth.users;

-- 2. Check user_profiles table
SELECT
  'User Profiles' as check_name,
  COUNT(*) as count
FROM user_profiles;

-- 3. Check detailed user profiles
SELECT
  id,
  email,
  firm_id,
  role,
  created_at
FROM user_profiles
ORDER BY created_at DESC;

-- 4. Check firms table
SELECT
  'Firms' as check_name,
  COUNT(*) as count
FROM firms;

-- 5. Check firm details
SELECT
  id,
  name,
  domain,
  created_at
FROM firms
ORDER BY created_at DESC;

-- 6. Check if there's a mismatch between auth.users and user_profiles
SELECT
  'Users without profiles' as issue,
  au.id as user_id,
  au.email
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- 7. Check imported_balance_data table (should be empty if RLS is blocking)
SELECT
  'Imported Balance Data' as table_name,
  COUNT(*) as count
FROM imported_balance_data;

-- 8. Check RLS policies on imported_balance_data
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
WHERE tablename = 'imported_balance_data';

-- 9. Test INSERT policy for specific firm
-- Replace 'dc838876-888c-4cce-b37d-f055f40fcb0c' with your actual firm_id
DO $$
DECLARE
  test_firm_id UUID := 'dc838876-888c-4cce-b37d-f055f40fcb0c';
  current_user_id UUID;
  user_firm_id UUID;
  has_profile BOOLEAN;
BEGIN
  -- Get current user
  current_user_id := auth.uid();

  RAISE NOTICE 'Current user ID: %', current_user_id;

  -- Check if user has profile
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = current_user_id) INTO has_profile;
  RAISE NOTICE 'User has profile: %', has_profile;

  -- Get user's firm_id
  SELECT firm_id INTO user_firm_id FROM user_profiles WHERE id = current_user_id;
  RAISE NOTICE 'User firm_id: %', user_firm_id;
  RAISE NOTICE 'Target firm_id: %', test_firm_id;
  RAISE NOTICE 'Firm IDs match: %', (user_firm_id = test_firm_id);
END $$;

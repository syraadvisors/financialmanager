-- =====================================================
-- Fix RLS for Super Admin User Profile Access
-- =====================================================
-- Super admins have firm_id = NULL, so they can't read their own profile
-- with the existing RLS policies. This adds a policy to allow users to
-- always read their own profile.

-- =====================================================
-- Step 1: Enable RLS on user_profiles if not already enabled
-- =====================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Step 2: Drop existing user_profiles policies if any
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles in their firm" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- =====================================================
-- Step 3: Create new policies for user_profiles
-- =====================================================

-- Allow users to ALWAYS read their own profile (regardless of firm_id)
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to read other profiles in their firm (but not super_admins)
-- Note: Using auth.user_firm_id() function to avoid recursive query
CREATE POLICY "Users can view profiles in their firm"
  ON user_profiles FOR SELECT
  USING (
    firm_id IS NOT NULL
    AND firm_id = (SELECT firm_id FROM user_profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile (for OAuth signup)
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- Step 4: Verification
-- =====================================================

-- Check that policies were created successfully
SELECT
  tablename,
  policyname,
  cmd,
  CASE
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No condition'
  END as condition
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Test that current user can read their own profile
SELECT
  id,
  email,
  role,
  firm_id,
  CASE
    WHEN firm_id IS NULL THEN 'Super Admin (no firm)'
    ELSE 'Regular user (firm: ' || firm_id || ')'
  END as user_type
FROM user_profiles
WHERE id = auth.uid();

-- =====================================================
-- SUCCESS!
-- =====================================================
SELECT
  'RLS policies for user_profiles updated successfully!' as message,
  'Super admins can now read their own profile' as details;

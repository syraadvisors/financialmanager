-- =====================================================
-- SIMPLE FIX: Super Admin RLS - Remove Recursive Policies
-- =====================================================
-- The previous policy had a recursive query causing 500 errors.
-- This simpler version only allows users to read/write their OWN profile.

-- =====================================================
-- Step 1: Drop ALL existing user_profiles policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles in their firm" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- =====================================================
-- Step 2: Create SIMPLE policies (no recursive queries)
-- =====================================================

-- Allow users to ALWAYS read their own profile (regardless of firm_id)
-- This is the KEY policy for super_admins
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile (for OAuth signup)
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- Step 3: Verification
-- =====================================================

-- Test that current user can read their own profile
SELECT
  id,
  email,
  role,
  firm_id,
  status,
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
  'Simple RLS policies created successfully!' as message,
  'Super admins can now read their own profile' as details;

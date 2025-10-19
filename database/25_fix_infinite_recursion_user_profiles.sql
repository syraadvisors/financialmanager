-- =====================================================
-- Fix Infinite Recursion in User Profiles RLS
-- =====================================================
-- The previous policies caused infinite recursion because they
-- queried user_profiles within the policy itself.
-- Solution: Use a SECURITY DEFINER function that bypasses RLS

-- =====================================================
-- Step 1: Create helper function that bypasses RLS
-- =====================================================

-- This function bypasses RLS to check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Query with SECURITY DEFINER bypasses RLS
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN (user_role = 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_super_admin() IS 'Returns true if current user is a super admin (bypasses RLS to prevent recursion)';

-- =====================================================
-- Step 2: Drop problematic policies
-- =====================================================

DROP POLICY IF EXISTS "Super admins can view all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can insert user profiles" ON user_profiles;

-- =====================================================
-- Step 3: Create non-recursive policies
-- =====================================================

-- Allow users to view their own profile OR super admins to view all
CREATE POLICY "Users can view own profile and super admins view all"
  ON user_profiles FOR SELECT
  USING (
    id = auth.uid()  -- Users can see their own profile
    OR public.is_super_admin()  -- Super admins can see all profiles
  );

-- Allow users to update their own profile OR super admins to update any
CREATE POLICY "Users can update own profile and super admins update all"
  ON user_profiles FOR UPDATE
  USING (
    id = auth.uid()  -- Users can update their own profile
    OR public.is_super_admin()  -- Super admins can update all profiles
  )
  WITH CHECK (
    id = auth.uid()
    OR public.is_super_admin()
  );

-- Allow super admins to insert new user profiles
CREATE POLICY "Super admins can insert user profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (
    public.is_super_admin()  -- Only super admins can create users
  );

-- Allow super admins to delete user profiles
CREATE POLICY "Super admins can delete user profiles"
  ON user_profiles FOR DELETE
  USING (
    public.is_super_admin()  -- Only super admins can delete users
  );

-- =====================================================
-- Step 4: Verification
-- =====================================================

-- Check that policies were created
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Test the function (should return true/false, not error)
SELECT public.is_super_admin() as am_i_super_admin;

-- Test querying user_profiles (should work now, no recursion)
SELECT id, email, role FROM user_profiles WHERE id = auth.uid();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'SUCCESS! Fixed infinite recursion in user_profiles RLS policies' as message,
       'Super admins can now view all user profiles without recursion errors' as details;

-- =====================================================
-- Add Super Admin Access to User Profiles
-- =====================================================
-- This allows super admins to view all user profiles across all firms
-- for the Super Admin Dashboard

-- =====================================================
-- Step 0: Create helper function in public schema
-- =====================================================

-- Create the function in public schema (we don't have access to auth schema)
-- This gets the current user's firm_id from their profile
CREATE OR REPLACE FUNCTION public.get_current_user_firm_id()
RETURNS UUID AS $$
  SELECT firm_id FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public;

COMMENT ON FUNCTION public.get_current_user_firm_id() IS 'Returns the firm_id for the currently authenticated user from user_profiles table';

-- =====================================================
-- Step 1: Drop existing conflicting policies
-- =====================================================

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Super admins can view all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can insert user profiles" ON user_profiles;

-- =====================================================
-- Step 2: Add super admin bypass policies
-- =====================================================

-- Allow super admins to SELECT all user profiles
CREATE POLICY "Super admins can view all user profiles"
  ON user_profiles FOR SELECT
  USING (
    -- Super admins can see all profiles
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
    -- OR users can see their own profile (existing behavior)
    OR id = auth.uid()
    -- OR users can see profiles in their firm
    OR firm_id = public.get_current_user_firm_id()
  );

-- Allow super admins to UPDATE any user profile
CREATE POLICY "Super admins can update all user profiles"
  ON user_profiles FOR UPDATE
  USING (
    -- Super admins can update all profiles
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
    -- OR users can update their own profile
    OR id = auth.uid()
  )
  WITH CHECK (
    -- Same conditions for the updated data
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
    OR id = auth.uid()
  );

-- Allow super admins to INSERT user profiles (for creating new users)
CREATE POLICY "Super admins can insert user profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (
    -- Super admins can insert new profiles
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  );

-- =====================================================
-- Step 3: Verification
-- =====================================================

-- Check that policies were created
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
AND policyname LIKE '%Super admin%'
ORDER BY policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'SUCCESS! Super admin access policies added to user_profiles table' as message,
       'Super admins can now view and manage all user profiles across all firms' as details;

-- =====================================================
-- Remove ALL RLS Policies on user_profiles
-- =====================================================
-- Start fresh by removing every single policy

DROP POLICY IF EXISTS "Admins can insert users in their firm" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their firm" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can insert any profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

-- =====================================================
-- Create ONLY Simple Policies (No Recursion)
-- =====================================================

-- Allow users to read their OWN profile (KEY for super_admins)
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their OWN profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow users to insert their OWN profile (for OAuth)
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- Verification
-- =====================================================

-- Show final policies
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Test reading own profile
SELECT id, email, role, firm_id
FROM user_profiles
WHERE id = auth.uid();

SELECT 'All problematic policies removed!' as message;

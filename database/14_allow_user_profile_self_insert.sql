-- =====================================================
-- Allow users to create their own profile
-- =====================================================

-- Users can insert their own profile (needed for OAuth first login)
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

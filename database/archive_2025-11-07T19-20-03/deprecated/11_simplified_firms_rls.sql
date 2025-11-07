-- =====================================================
-- Simplified Firms RLS for OAuth
-- =====================================================
-- This version doesn't rely on custom auth functions

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own firm" ON firms;
DROP POLICY IF EXISTS "Users can update their own firm" ON firms;
DROP POLICY IF EXISTS "Allow public read access to firms for OAuth validation" ON firms;

-- Allow anyone to read firms table (needed for OAuth domain validation)
-- This is safe because:
-- 1. Only SELECT is allowed (no modifications)
-- 2. Firms table is used for public domain whitelisting
-- 3. No sensitive data is exposed (just company names and domains)
CREATE POLICY "Allow public read access to firms"
  ON firms FOR SELECT
  USING (true);

-- For now, allow authenticated users to update any firm
-- TODO: In production, you'll want to restrict this to admins only
CREATE POLICY "Authenticated users can update firms"
  ON firms FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Insert and delete operations are only allowed via service role
-- (No policies = only service_role can do these operations)

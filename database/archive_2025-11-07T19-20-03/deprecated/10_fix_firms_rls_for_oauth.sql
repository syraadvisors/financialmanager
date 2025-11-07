-- =====================================================
-- Fix Firms RLS for OAuth Domain Validation
-- =====================================================
-- Allow unauthenticated users to query firms table by domain
-- This is needed during OAuth callback to validate email domains

-- Drop the restrictive policies
DROP POLICY IF EXISTS "Users can view their own firm" ON firms;
DROP POLICY IF EXISTS "Users can update their own firm" ON firms;

-- Allow anyone to SELECT from firms (read-only for domain validation)
-- This is safe because:
-- 1. Only SELECT is allowed (no INSERT/UPDATE/DELETE)
-- 2. Firms table doesn't contain sensitive data
-- 3. We need this for OAuth domain whitelisting
CREATE POLICY "Allow public read access to firms for OAuth validation"
  ON firms FOR SELECT
  USING (true);

-- Authenticated users can update their own firm's settings
CREATE POLICY "Users can update their own firm"
  ON firms FOR UPDATE
  USING (auth.uid() IS NOT NULL AND id = auth.user_firm_id())
  WITH CHECK (auth.uid() IS NOT NULL AND id = auth.user_firm_id());

-- Only service role can insert/delete firms (admin operations)
-- No policies needed - service role bypasses RLS

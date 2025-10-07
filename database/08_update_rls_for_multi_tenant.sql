-- =====================================================
-- Multi-Tenant Row Level Security (RLS) Policies
-- =====================================================
-- This implements firm-level data isolation
-- Users can ONLY see data from their own firm

-- =====================================================
-- Step 1: Create helper function to get current user's firm_id
-- =====================================================

-- This function extracts firm_id from the authenticated user's JWT token
-- Supabase Auth will store firm_id in user metadata
CREATE OR REPLACE FUNCTION auth.user_firm_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'firm_id')::UUID,
    (auth.jwt() -> 'user_metadata' ->> 'firm_id')::UUID
  );
$$ LANGUAGE sql STABLE;

-- =====================================================
-- Step 2: Drop existing permissive policies
-- =====================================================

-- Drop old policies (the ones we created for development)
DROP POLICY IF EXISTS "Enable all operations for all users" ON relationships;
DROP POLICY IF EXISTS "Enable all operations for all users" ON master_accounts;
DROP POLICY IF EXISTS "Enable all operations for all users" ON households;
DROP POLICY IF EXISTS "Enable all operations for all users" ON clients;
DROP POLICY IF EXISTS "Enable all operations for all users" ON accounts;
DROP POLICY IF EXISTS "Enable all operations for all users" ON positions;
DROP POLICY IF EXISTS "Enable all operations for all users" ON fee_schedules;
DROP POLICY IF EXISTS "Enable all operations for all users" ON billing_periods;
DROP POLICY IF EXISTS "Enable all operations for all users" ON fee_calculations;
DROP POLICY IF EXISTS "Enable all operations for all users" ON balance_history;

-- =====================================================
-- Step 3: Create firm-scoped RLS policies
-- =====================================================

-- RELATIONSHIPS table
CREATE POLICY "Users can view their firm's relationships"
  ON relationships FOR SELECT
  USING (firm_id = auth.user_firm_id());

CREATE POLICY "Users can insert relationships for their firm"
  ON relationships FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can update their firm's relationships"
  ON relationships FOR UPDATE
  USING (firm_id = auth.user_firm_id())
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can delete their firm's relationships"
  ON relationships FOR DELETE
  USING (firm_id = auth.user_firm_id());

-- MASTER_ACCOUNTS table
CREATE POLICY "Users can view their firm's master accounts"
  ON master_accounts FOR SELECT
  USING (firm_id = auth.user_firm_id());

CREATE POLICY "Users can insert master accounts for their firm"
  ON master_accounts FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can update their firm's master accounts"
  ON master_accounts FOR UPDATE
  USING (firm_id = auth.user_firm_id())
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can delete their firm's master accounts"
  ON master_accounts FOR DELETE
  USING (firm_id = auth.user_firm_id());

-- HOUSEHOLDS table
CREATE POLICY "Users can view their firm's households"
  ON households FOR SELECT
  USING (firm_id = auth.user_firm_id());

CREATE POLICY "Users can insert households for their firm"
  ON households FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can update their firm's households"
  ON households FOR UPDATE
  USING (firm_id = auth.user_firm_id())
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can delete their firm's households"
  ON households FOR DELETE
  USING (firm_id = auth.user_firm_id());

-- CLIENTS table
CREATE POLICY "Users can view their firm's clients"
  ON clients FOR SELECT
  USING (firm_id = auth.user_firm_id());

CREATE POLICY "Users can insert clients for their firm"
  ON clients FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can update their firm's clients"
  ON clients FOR UPDATE
  USING (firm_id = auth.user_firm_id())
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can delete their firm's clients"
  ON clients FOR DELETE
  USING (firm_id = auth.user_firm_id());

-- ACCOUNTS table
CREATE POLICY "Users can view their firm's accounts"
  ON accounts FOR SELECT
  USING (firm_id = auth.user_firm_id());

CREATE POLICY "Users can insert accounts for their firm"
  ON accounts FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can update their firm's accounts"
  ON accounts FOR UPDATE
  USING (firm_id = auth.user_firm_id())
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can delete their firm's accounts"
  ON accounts FOR DELETE
  USING (firm_id = auth.user_firm_id());

-- POSITIONS table
CREATE POLICY "Users can view their firm's positions"
  ON positions FOR SELECT
  USING (firm_id = auth.user_firm_id());

CREATE POLICY "Users can insert positions for their firm"
  ON positions FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can update their firm's positions"
  ON positions FOR UPDATE
  USING (firm_id = auth.user_firm_id())
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can delete their firm's positions"
  ON positions FOR DELETE
  USING (firm_id = auth.user_firm_id());

-- FEE_SCHEDULES table
CREATE POLICY "Users can view their firm's fee schedules"
  ON fee_schedules FOR SELECT
  USING (firm_id = auth.user_firm_id());

CREATE POLICY "Users can insert fee schedules for their firm"
  ON fee_schedules FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can update their firm's fee schedules"
  ON fee_schedules FOR UPDATE
  USING (firm_id = auth.user_firm_id())
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can delete their firm's fee schedules"
  ON fee_schedules FOR DELETE
  USING (firm_id = auth.user_firm_id());

-- BILLING_PERIODS table
CREATE POLICY "Users can view their firm's billing periods"
  ON billing_periods FOR SELECT
  USING (firm_id = auth.user_firm_id());

CREATE POLICY "Users can insert billing periods for their firm"
  ON billing_periods FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can update their firm's billing periods"
  ON billing_periods FOR UPDATE
  USING (firm_id = auth.user_firm_id())
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can delete their firm's billing periods"
  ON billing_periods FOR DELETE
  USING (firm_id = auth.user_firm_id());

-- FEE_CALCULATIONS table
CREATE POLICY "Users can view their firm's fee calculations"
  ON fee_calculations FOR SELECT
  USING (firm_id = auth.user_firm_id());

CREATE POLICY "Users can insert fee calculations for their firm"
  ON fee_calculations FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can update their firm's fee calculations"
  ON fee_calculations FOR UPDATE
  USING (firm_id = auth.user_firm_id())
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can delete their firm's fee calculations"
  ON fee_calculations FOR DELETE
  USING (firm_id = auth.user_firm_id());

-- BALANCE_HISTORY table
CREATE POLICY "Users can view their firm's balance history"
  ON balance_history FOR SELECT
  USING (firm_id = auth.user_firm_id());

CREATE POLICY "Users can insert balance history for their firm"
  ON balance_history FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can update their firm's balance history"
  ON balance_history FOR UPDATE
  USING (firm_id = auth.user_firm_id())
  WITH CHECK (firm_id = auth.user_firm_id());

CREATE POLICY "Users can delete their firm's balance history"
  ON balance_history FOR DELETE
  USING (firm_id = auth.user_firm_id());

-- =====================================================
-- Step 4: RLS for firms table itself
-- =====================================================

-- Enable RLS on firms table
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;

-- Users can view their own firm
CREATE POLICY "Users can view their own firm"
  ON firms FOR SELECT
  USING (id = auth.user_firm_id());

-- Users can update their own firm (for settings, etc.)
CREATE POLICY "Users can update their own firm"
  ON firms FOR UPDATE
  USING (id = auth.user_firm_id())
  WITH CHECK (id = auth.user_firm_id());

-- Only allow inserts/deletes via service role (admin operations)
-- Regular users cannot create or delete firms

-- =====================================================
-- Notes for Development/Testing
-- =====================================================

-- TEMPORARY: For development without auth, allow anon access
-- REMOVE THESE IN PRODUCTION!

-- Uncomment these for local development without authentication:
/*
CREATE POLICY "Allow anon access to all tables (DEV ONLY)"
  ON clients FOR ALL
  USING (true)
  WITH CHECK (true);

-- Apply similar policy to other tables as needed
*/

-- To test with a specific firm_id during development,
-- you can temporarily modify the user_firm_id function:
/*
CREATE OR REPLACE FUNCTION auth.user_firm_id()
RETURNS UUID AS $$
  SELECT 'YOUR_TEST_FIRM_ID_HERE'::UUID;
$$ LANGUAGE sql STABLE;
*/

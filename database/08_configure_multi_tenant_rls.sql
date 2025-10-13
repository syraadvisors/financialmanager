-- =====================================================
-- Multi-Tenant Row Level Security (RLS) Configuration
-- =====================================================
-- This migration consolidates RLS setup for multi-tenant architecture
-- Replaces: 08_update_rls_for_multi_tenant.sql, 08_dev_temporary_rls.sql,
--           09_fix_anon_access.sql, 10_fix_firms_rls_for_oauth.sql,
--           11_simplified_firms_rls.sql
--
-- Migration: 08
-- Description: Configure multi-tenant RLS policies
-- Dependencies: 06_create_firms_table.sql, 07_add_firm_id_to_tables.sql
-- Date: 2025-10-12
-- =====================================================

-- =====================================================
-- Step 1: Create helper function to get current user's firm_id
-- =====================================================

-- This function will be updated later in migration 13 to use user_profiles table
-- For now, it attempts to read from JWT metadata or returns NULL
CREATE OR REPLACE FUNCTION auth.user_firm_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'firm_id')::UUID,
    (auth.jwt() -> 'user_metadata' ->> 'firm_id')::UUID
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.user_firm_id() IS 'Returns the firm_id for the currently authenticated user. Updated in migration 13 to use user_profiles table.';

-- =====================================================
-- Step 2: Drop existing permissive development policies
-- =====================================================

-- Clean up any temporary development policies
DO $$
BEGIN
  -- Drop permissive "all operations" policies if they exist
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

  -- Drop any old anon access policies
  DROP POLICY IF EXISTS "Allow anon access during development" ON clients;
  DROP POLICY IF EXISTS "Allow anon access during development" ON accounts;
  DROP POLICY IF EXISTS "Allow anon access during development" ON households;
  DROP POLICY IF EXISTS "Allow anon access during development" ON relationships;
  DROP POLICY IF EXISTS "Allow anon access during development" ON master_accounts;
  DROP POLICY IF EXISTS "Allow anon access during development" ON positions;
  DROP POLICY IF EXISTS "Allow anon access during development" ON fee_schedules;
  DROP POLICY IF EXISTS "Allow anon access during development" ON billing_periods;
  DROP POLICY IF EXISTS "Allow anon access during development" ON fee_calculations;
  DROP POLICY IF EXISTS "Allow anon access during development" ON balance_history;
  DROP POLICY IF EXISTS "Allow anon access during development" ON firms;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- =====================================================
-- Step 3: Create firm-scoped RLS policies for data tables
-- =====================================================

-- RELATIONSHIPS table
CREATE POLICY "Users can view their firm's relationships"
  ON relationships FOR SELECT
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can insert relationships for their firm"
  ON relationships FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can update their firm's relationships"
  ON relationships FOR UPDATE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon')
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can delete their firm's relationships"
  ON relationships FOR DELETE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

-- MASTER_ACCOUNTS table
CREATE POLICY "Users can view their firm's master accounts"
  ON master_accounts FOR SELECT
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can insert master accounts for their firm"
  ON master_accounts FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can update their firm's master accounts"
  ON master_accounts FOR UPDATE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon')
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can delete their firm's master accounts"
  ON master_accounts FOR DELETE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

-- HOUSEHOLDS table
CREATE POLICY "Users can view their firm's households"
  ON households FOR SELECT
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can insert households for their firm"
  ON households FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can update their firm's households"
  ON households FOR UPDATE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon')
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can delete their firm's households"
  ON households FOR DELETE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

-- CLIENTS table
CREATE POLICY "Users can view their firm's clients"
  ON clients FOR SELECT
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can insert clients for their firm"
  ON clients FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can update their firm's clients"
  ON clients FOR UPDATE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon')
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can delete their firm's clients"
  ON clients FOR DELETE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

-- ACCOUNTS table
CREATE POLICY "Users can view their firm's accounts"
  ON accounts FOR SELECT
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can insert accounts for their firm"
  ON accounts FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can update their firm's accounts"
  ON accounts FOR UPDATE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon')
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can delete their firm's accounts"
  ON accounts FOR DELETE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

-- POSITIONS table
CREATE POLICY "Users can view their firm's positions"
  ON positions FOR SELECT
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can insert positions for their firm"
  ON positions FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can update their firm's positions"
  ON positions FOR UPDATE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon')
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can delete their firm's positions"
  ON positions FOR DELETE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

-- FEE_SCHEDULES table
CREATE POLICY "Users can view their firm's fee schedules"
  ON fee_schedules FOR SELECT
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can insert fee schedules for their firm"
  ON fee_schedules FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can update their firm's fee schedules"
  ON fee_schedules FOR UPDATE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon')
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can delete their firm's fee schedules"
  ON fee_schedules FOR DELETE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

-- BILLING_PERIODS table
CREATE POLICY "Users can view their firm's billing periods"
  ON billing_periods FOR SELECT
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can insert billing periods for their firm"
  ON billing_periods FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can update their firm's billing periods"
  ON billing_periods FOR UPDATE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon')
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can delete their firm's billing periods"
  ON billing_periods FOR DELETE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

-- FEE_CALCULATIONS table
CREATE POLICY "Users can view their firm's fee calculations"
  ON fee_calculations FOR SELECT
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can insert fee calculations for their firm"
  ON fee_calculations FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can update their firm's fee calculations"
  ON fee_calculations FOR UPDATE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon')
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can delete their firm's fee calculations"
  ON fee_calculations FOR DELETE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

-- BALANCE_HISTORY table
CREATE POLICY "Users can view their firm's balance history"
  ON balance_history FOR SELECT
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can insert balance history for their firm"
  ON balance_history FOR INSERT
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can update their firm's balance history"
  ON balance_history FOR UPDATE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon')
  WITH CHECK (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

CREATE POLICY "Users can delete their firm's balance history"
  ON balance_history FOR DELETE
  USING (firm_id = auth.user_firm_id() OR auth.role() = 'anon');

-- =====================================================
-- Step 4: RLS for firms table
-- =====================================================

-- Enable RLS on firms table
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own firm" ON firms;
  DROP POLICY IF EXISTS "Users can update their own firm" ON firms;
  DROP POLICY IF EXISTS "Allow public read access to firms for OAuth validation" ON firms;
  DROP POLICY IF EXISTS "Allow public read access to firms" ON firms;
  DROP POLICY IF EXISTS "Authenticated users can update firms" ON firms;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Allow anyone to read firms table (needed for OAuth domain validation)
-- This is safe because:
-- 1. Only SELECT is allowed (no modifications)
-- 2. Firms table is used for public domain whitelisting during OAuth
-- 3. No sensitive data is exposed (just company names and domains)
CREATE POLICY "Allow public read access to firms"
  ON firms FOR SELECT
  USING (true);

-- Authenticated users can update firms
-- Note: In production with user_profiles (migration 12), admins will have stricter controls
CREATE POLICY "Authenticated users can update firms"
  ON firms FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Insert and delete operations are only allowed via service role
-- (No policies = only service_role can do these operations)

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 08 completed successfully: Multi-tenant RLS configured';
  RAISE NOTICE 'Note: Policies include OR auth.role() = ''anon'' for development';
  RAISE NOTICE 'Note: Migration 13 will update auth.user_firm_id() to use user_profiles table';
END $$;

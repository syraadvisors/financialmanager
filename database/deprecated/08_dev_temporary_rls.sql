-- =====================================================
-- DEVELOPMENT ONLY: Temporary RLS with Hardcoded Firm
-- =====================================================
-- This version allows development without authentication
-- by temporarily hardcoding your test firm_id

-- IMPORTANT: Replace 'YOUR_FIRM_ID_HERE' with the actual UUID
-- from Step 1 (06_create_firms_table.sql)

-- =====================================================
-- Step 1: Get your firm_id
-- =====================================================
-- Run this query and copy the UUID:
-- SELECT id FROM firms WHERE firm_domain = 'testfirm.com';

-- =====================================================
-- Step 2: Create temporary helper function
-- =====================================================

-- TEMPORARY: Returns hardcoded firm_id for development
CREATE OR REPLACE FUNCTION auth.user_firm_id()
RETURNS UUID AS $$
  -- Replace this with your actual firm UUID from step 1
  SELECT id FROM firms WHERE firm_domain = 'testfirm.com' LIMIT 1;
$$ LANGUAGE sql STABLE;

-- =====================================================
-- Step 3: Keep existing permissive policies FOR NOW
-- =====================================================
-- We'll keep the current "Enable all operations" policies
-- This means RLS won't actually block anything yet

-- Later, when you implement OAuth, you'll:
-- 1. Update the user_firm_id() function to read from JWT
-- 2. Drop these permissive policies
-- 3. Create the firm-scoped policies from 08_update_rls_for_multi_tenant.sql

-- =====================================================
-- Test that it works
-- =====================================================

-- This should return your firm's UUID
SELECT auth.user_firm_id();

-- This should return your clients (if you have any)
SELECT * FROM clients LIMIT 5;

-- =====================================================
-- Notes
-- =====================================================

-- When you're ready to implement real RLS (after OAuth setup):
-- 1. Run 08_update_rls_for_multi_tenant.sql
-- 2. Update user_firm_id() to read from JWT:
--
--    CREATE OR REPLACE FUNCTION auth.user_firm_id()
--    RETURNS UUID AS $$
--      SELECT COALESCE(
--        (auth.jwt() -> 'app_metadata' ->> 'firm_id')::UUID,
--        (auth.jwt() -> 'user_metadata' ->> 'firm_id')::UUID
--      );
--    $$ LANGUAGE sql STABLE;

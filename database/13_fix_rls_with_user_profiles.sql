-- =====================================================
-- Fix RLS Policies to Use user_profiles Table
-- =====================================================
-- This updates all RLS policies to get firm_id from user_profiles
-- instead of JWT metadata (which we're not using)

-- =====================================================
-- Step 1: Update helper function
-- =====================================================

-- Drop old function
DROP FUNCTION IF EXISTS auth.user_firm_id();

-- Create new function that queries user_profiles table
CREATE OR REPLACE FUNCTION auth.user_firm_id()
RETURNS UUID AS $$
  SELECT firm_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.user_firm_id() IS 'Returns the firm_id for the currently authenticated user from user_profiles table';

-- =====================================================
-- Step 2: Verify all RLS policies are enabled
-- =====================================================

-- Ensure RLS is enabled on all tables
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Step 3: Test RLS Policies
-- =====================================================

-- You can test RLS by running queries like:
-- SELECT COUNT(*) FROM clients WHERE firm_id = auth.user_firm_id();

-- To verify isolation, log in as users from different firms and ensure
-- they can only see their own firm's data

-- =====================================================
-- Step 4: Optional - Create admin bypass policies
-- =====================================================

-- Uncomment these if you want super admins to see all data
-- (Generally not recommended for multi-tenant security)

/*
CREATE POLICY "Super admins can view all relationships"
  ON relationships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
*/

-- =====================================================
-- Verification Queries
-- =====================================================

-- Run these to verify RLS is working:

-- 1. Check that all tables have RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'relationships', 'master_accounts', 'households', 'clients',
  'accounts', 'positions', 'fee_schedules', 'billing_periods',
  'fee_calculations', 'balance_history'
)
ORDER BY tablename;

-- 2. Check all policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Test firm_id function
SELECT auth.user_firm_id() as my_firm_id;

-- =====================================================
-- SUCCESS!
-- =====================================================
SELECT 'RLS policies updated successfully!' as message,
       'All tables now use user_profiles.firm_id for isolation' as details;

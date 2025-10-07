-- =====================================================
-- FIX: Allow Anonymous Access During Development
-- =====================================================
-- Run this if you can't see any data after running scripts 6, 7, 8

-- Option 1: Add permissive policy for anon users (TEMPORARY)
-- This allows the anon key to bypass RLS during development

CREATE POLICY "Allow anon access during development" ON clients
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon access during development" ON accounts
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon access during development" ON households
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon access during development" ON relationships
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon access during development" ON master_accounts
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon access during development" ON positions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon access during development" ON fee_schedules
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon access during development" ON billing_periods
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon access during development" ON fee_calculations
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon access during development" ON balance_history
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Also allow anon to see firms
CREATE POLICY "Allow anon access during development" ON firms
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Verify it works
SELECT COUNT(*) as client_count FROM clients;
SELECT COUNT(*) as account_count FROM accounts;

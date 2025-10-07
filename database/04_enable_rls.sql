-- ==================================================================
-- FINANCIAL MANAGER DATABASE SCHEMA - PART 4: ROW LEVEL SECURITY
-- ==================================================================
-- Run this script AFTER creating tables, indexes, and functions
-- This enables security policies (currently allowing all access)
-- ==================================================================

-- ==================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ==================================================================
-- This is important for future multi-tenant functionality
-- For now, we'll create permissive policies that allow all operations

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

-- ==================================================================
-- CREATE PERMISSIVE POLICIES (Allow all access for now)
-- ==================================================================
-- Later, you can modify these to restrict access based on user roles

-- Relationships
CREATE POLICY "Allow all operations on relationships"
  ON relationships FOR ALL
  USING (true)
  WITH CHECK (true);

-- Master Accounts
CREATE POLICY "Allow all operations on master_accounts"
  ON master_accounts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Households
CREATE POLICY "Allow all operations on households"
  ON households FOR ALL
  USING (true)
  WITH CHECK (true);

-- Clients
CREATE POLICY "Allow all operations on clients"
  ON clients FOR ALL
  USING (true)
  WITH CHECK (true);

-- Accounts
CREATE POLICY "Allow all operations on accounts"
  ON accounts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Positions
CREATE POLICY "Allow all operations on positions"
  ON positions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Fee Schedules
CREATE POLICY "Allow all operations on fee_schedules"
  ON fee_schedules FOR ALL
  USING (true)
  WITH CHECK (true);

-- Billing Periods
CREATE POLICY "Allow all operations on billing_periods"
  ON billing_periods FOR ALL
  USING (true)
  WITH CHECK (true);

-- Fee Calculations
CREATE POLICY "Allow all operations on fee_calculations"
  ON fee_calculations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Balance History
CREATE POLICY "Allow all operations on balance_history"
  ON balance_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==================================================================
-- SUCCESS MESSAGE
-- ==================================================================
SELECT
  'SUCCESS! Row Level Security enabled.' as message,
  'All tables have permissive policies for development' as status,
  'You can add user-based restrictions later' as note;

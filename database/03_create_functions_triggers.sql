-- ==================================================================
-- FINANCIAL MANAGER DATABASE SCHEMA - PART 3: FUNCTIONS & TRIGGERS
-- ==================================================================
-- Run this script AFTER creating tables and indexes
-- This adds automatic timestamp updates and other database functions
-- ==================================================================

-- ==================================================================
-- FUNCTION: Auto-update 'updated_at' timestamp
-- ==================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at column on row update';

-- ==================================================================
-- TRIGGERS: Apply auto-update to all tables with 'updated_at'
-- ==================================================================

-- Relationships
CREATE TRIGGER update_relationships_updated_at
  BEFORE UPDATE ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Master Accounts
CREATE TRIGGER update_master_accounts_updated_at
  BEFORE UPDATE ON master_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Households
CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Clients
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Accounts
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fee Schedules
CREATE TRIGGER update_fee_schedules_updated_at
  BEFORE UPDATE ON fee_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================================================================
-- SUCCESS MESSAGE
-- ==================================================================
SELECT
  'SUCCESS! Functions and triggers created.' as message,
  'updated_at will now auto-update on all tables' as benefit,
  '✅ Database automation configured' as status;

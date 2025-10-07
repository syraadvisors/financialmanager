-- =====================================================
-- Multi-Tenant Migration: Add firm_id to all tables
-- =====================================================
-- This migration adds firm_id foreign key to all data tables
-- for proper multi-tenant data isolation

-- Add firm_id to relationships table
ALTER TABLE relationships
ADD COLUMN firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

-- Add firm_id to master_accounts table
ALTER TABLE master_accounts
ADD COLUMN firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

-- Add firm_id to households table
ALTER TABLE households
ADD COLUMN firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

-- Add firm_id to clients table
ALTER TABLE clients
ADD COLUMN firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

-- Add firm_id to accounts table
ALTER TABLE accounts
ADD COLUMN firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

-- Add firm_id to positions table (time-series data)
ALTER TABLE positions
ADD COLUMN firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

-- Add firm_id to fee_schedules table
ALTER TABLE fee_schedules
ADD COLUMN firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

-- Add firm_id to billing_periods table
ALTER TABLE billing_periods
ADD COLUMN firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

-- Add firm_id to fee_calculations table
ALTER TABLE fee_calculations
ADD COLUMN firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

-- Add firm_id to balance_history table
ALTER TABLE balance_history
ADD COLUMN firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

-- =====================================================
-- Update existing sample data with firm_id
-- =====================================================
-- IMPORTANT: Replace 'YOUR_FIRM_ID_HERE' with the actual firm UUID from step 06

-- First, get your firm_id (run this query and copy the id)
-- SELECT id FROM firms WHERE firm_domain = 'testfirm.com';

-- Then update all existing records (replace the UUID below)
-- Example: UPDATE relationships SET firm_id = '123e4567-e89b-12d3-a456-426614174000' WHERE firm_id IS NULL;

-- For now, we'll use a placeholder approach:
DO $$
DECLARE
  default_firm_id UUID;
BEGIN
  -- Get the first firm (your test firm)
  SELECT id INTO default_firm_id FROM firms LIMIT 1;

  -- Update all existing records
  UPDATE relationships SET firm_id = default_firm_id WHERE firm_id IS NULL;
  UPDATE master_accounts SET firm_id = default_firm_id WHERE firm_id IS NULL;
  UPDATE households SET firm_id = default_firm_id WHERE firm_id IS NULL;
  UPDATE clients SET firm_id = default_firm_id WHERE firm_id IS NULL;
  UPDATE accounts SET firm_id = default_firm_id WHERE firm_id IS NULL;
  UPDATE positions SET firm_id = default_firm_id WHERE firm_id IS NULL;
  UPDATE fee_schedules SET firm_id = default_firm_id WHERE firm_id IS NULL;
  UPDATE billing_periods SET firm_id = default_firm_id WHERE firm_id IS NULL;
  UPDATE fee_calculations SET firm_id = default_firm_id WHERE firm_id IS NULL;
  UPDATE balance_history SET firm_id = default_firm_id WHERE firm_id IS NULL;
END $$;

-- =====================================================
-- Make firm_id NOT NULL (after data migration)
-- =====================================================
-- This ensures all future records MUST have a firm_id

ALTER TABLE relationships ALTER COLUMN firm_id SET NOT NULL;
ALTER TABLE master_accounts ALTER COLUMN firm_id SET NOT NULL;
ALTER TABLE households ALTER COLUMN firm_id SET NOT NULL;
ALTER TABLE clients ALTER COLUMN firm_id SET NOT NULL;
ALTER TABLE accounts ALTER COLUMN firm_id SET NOT NULL;
ALTER TABLE positions ALTER COLUMN firm_id SET NOT NULL;
ALTER TABLE fee_schedules ALTER COLUMN firm_id SET NOT NULL;
ALTER TABLE billing_periods ALTER COLUMN firm_id SET NOT NULL;
ALTER TABLE fee_calculations ALTER COLUMN firm_id SET NOT NULL;
ALTER TABLE balance_history ALTER COLUMN firm_id SET NOT NULL;

-- =====================================================
-- Create indexes for firm_id (CRITICAL for performance)
-- =====================================================
-- These indexes ensure queries filtered by firm_id are fast

CREATE INDEX idx_relationships_firm ON relationships(firm_id);
CREATE INDEX idx_master_accounts_firm ON master_accounts(firm_id);
CREATE INDEX idx_households_firm ON households(firm_id);
CREATE INDEX idx_clients_firm ON clients(firm_id);
CREATE INDEX idx_accounts_firm ON accounts(firm_id);
CREATE INDEX idx_positions_firm ON positions(firm_id);
CREATE INDEX idx_fee_schedules_firm ON fee_schedules(firm_id);
CREATE INDEX idx_billing_periods_firm ON billing_periods(firm_id);
CREATE INDEX idx_fee_calculations_firm ON fee_calculations(firm_id);
CREATE INDEX idx_balance_history_firm ON balance_history(firm_id);

-- Composite indexes for common queries
CREATE INDEX idx_clients_firm_status ON clients(firm_id, client_status);
CREATE INDEX idx_accounts_firm_client ON accounts(firm_id, client_id);
CREATE INDEX idx_positions_firm_account_date ON positions(firm_id, account_id, date DESC);
CREATE INDEX idx_fee_calculations_firm_period ON fee_calculations(firm_id, billing_period_id);

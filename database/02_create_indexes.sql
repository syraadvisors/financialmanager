-- ==================================================================
-- FINANCIAL MANAGER DATABASE SCHEMA - PART 2: CREATE INDEXES
-- ==================================================================
-- Run this script AFTER creating tables (01_create_tables.sql)
-- Indexes dramatically improve query performance
-- ==================================================================

-- ==================================================================
-- RELATIONSHIPS INDEXES
-- ==================================================================
CREATE INDEX idx_relationships_status
  ON relationships(relationship_status);

-- ==================================================================
-- MASTER ACCOUNTS INDEXES
-- ==================================================================
CREATE INDEX idx_master_accounts_relationship
  ON master_accounts(relationship_id);

CREATE INDEX idx_master_accounts_status
  ON master_accounts(master_account_status);

CREATE INDEX idx_master_accounts_number
  ON master_accounts(master_account_number);

-- ==================================================================
-- HOUSEHOLDS INDEXES
-- ==================================================================
CREATE INDEX idx_households_relationship
  ON households(relationship_id);

CREATE INDEX idx_households_master_account
  ON households(master_account_id);

CREATE INDEX idx_households_status
  ON households(household_status);

-- ==================================================================
-- CLIENTS INDEXES
-- ==================================================================
CREATE INDEX idx_clients_household
  ON clients(household_id);

CREATE INDEX idx_clients_relationship
  ON clients(relationship_id);

CREATE INDEX idx_clients_master_account
  ON clients(master_account_id);

CREATE INDEX idx_clients_status
  ON clients(client_status);

CREATE INDEX idx_clients_email
  ON clients(primary_email);

CREATE INDEX idx_clients_name
  ON clients(full_legal_name);

-- ==================================================================
-- ACCOUNTS INDEXES
-- ==================================================================
CREATE INDEX idx_accounts_client
  ON accounts(client_id);

CREATE INDEX idx_accounts_household
  ON accounts(household_id);

CREATE INDEX idx_accounts_relationship
  ON accounts(relationship_id);

CREATE INDEX idx_accounts_master_account
  ON accounts(master_account_id);

CREATE INDEX idx_accounts_status
  ON accounts(account_status);

CREATE INDEX idx_accounts_number
  ON accounts(account_number);

-- ==================================================================
-- POSITIONS INDEXES (Critical for performance!)
-- ==================================================================
-- Most important index: date descending (newest first)
CREATE INDEX idx_positions_date
  ON positions(date DESC);

-- Composite index for account + date queries
CREATE INDEX idx_positions_account_date
  ON positions(account_id, date DESC);

-- Index for symbol lookups
CREATE INDEX idx_positions_symbol
  ON positions(symbol);

-- Index for security type filtering
CREATE INDEX idx_positions_security_type
  ON positions(security_type);

-- Index for asset class reporting
CREATE INDEX idx_positions_asset_class
  ON positions(asset_class);

-- ==================================================================
-- FEE SCHEDULES INDEXES
-- ==================================================================
CREATE INDEX idx_fee_schedules_status
  ON fee_schedules(schedule_status);

CREATE INDEX idx_fee_schedules_name
  ON fee_schedules(schedule_name);

-- ==================================================================
-- BILLING PERIODS INDEXES
-- ==================================================================
CREATE INDEX idx_billing_periods_status
  ON billing_periods(status);

CREATE INDEX idx_billing_periods_year_quarter
  ON billing_periods(period_year, period_quarter);

CREATE INDEX idx_billing_periods_dates
  ON billing_periods(start_date, end_date);

-- ==================================================================
-- FEE CALCULATIONS INDEXES
-- ==================================================================
CREATE INDEX idx_fee_calc_billing_period
  ON fee_calculations(billing_period_id);

CREATE INDEX idx_fee_calc_account
  ON fee_calculations(account_id);

CREATE INDEX idx_fee_calc_client
  ON fee_calculations(client_id);

CREATE INDEX idx_fee_calc_status
  ON fee_calculations(status);

-- Composite index for period + status queries
CREATE INDEX idx_fee_calc_period_status
  ON fee_calculations(billing_period_id, status);

-- ==================================================================
-- BALANCE HISTORY INDEXES (Critical for performance!)
-- ==================================================================
-- Most important: account + date
CREATE INDEX idx_balance_history_account_date
  ON balance_history(account_id, date DESC);

-- Date index for range queries
CREATE INDEX idx_balance_history_date
  ON balance_history(date DESC);

-- ==================================================================
-- SUCCESS MESSAGE
-- ==================================================================
SELECT
  'SUCCESS! All indexes created.' as message,
  'Your queries will now be much faster!' as benefit,
  '✅ Ready for production use' as status;

-- ==================================================================
-- FINANCIAL MANAGER DATABASE SCHEMA - PART 1: CREATE TABLES
-- ==================================================================
-- Run this script in Supabase SQL Editor
-- This creates all 10 tables with proper relationships
-- ==================================================================

-- Enable UUID extension (required for generating unique IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================================================================
-- TABLE 1: RELATIONSHIPS
-- Top level of the hierarchy - groups of related clients
-- ==================================================================
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic Info
  relationship_name TEXT NOT NULL,
  relationship_status TEXT NOT NULL DEFAULT 'Active',

  -- Billing Configuration
  billing_aggregation_level TEXT DEFAULT 'household',
  default_fee_schedule_id UUID,

  -- Computed fields (will be calculated from child records)
  total_aum DECIMAL(15,2) DEFAULT 0,
  number_of_households INTEGER DEFAULT 0,
  number_of_clients INTEGER DEFAULT 0,
  number_of_accounts INTEGER DEFAULT 0
);

COMMENT ON TABLE relationships IS 'Top-level grouping of related clients, households, and accounts';
COMMENT ON COLUMN relationships.billing_aggregation_level IS 'How to aggregate fees: account, household, or relationship';

-- ==================================================================
-- TABLE 2: MASTER ACCOUNTS
-- Second level - groups of households
-- ==================================================================
CREATE TABLE master_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic Info
  master_account_number TEXT UNIQUE NOT NULL,
  master_account_name TEXT NOT NULL,
  master_account_status TEXT NOT NULL DEFAULT 'Active',

  -- Relationships
  relationship_id UUID REFERENCES relationships(id) ON DELETE SET NULL,

  -- Billing Configuration
  billing_aggregation_level TEXT DEFAULT 'household',
  default_fee_schedule_id UUID,

  -- Computed fields
  total_aum DECIMAL(15,2) DEFAULT 0,
  number_of_households INTEGER DEFAULT 0,
  number_of_accounts INTEGER DEFAULT 0
);

COMMENT ON TABLE master_accounts IS 'Master account grouping for billing and reporting';

-- ==================================================================
-- TABLE 3: HOUSEHOLDS
-- Third level - family units or business entities
-- ==================================================================
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic Info
  household_name TEXT NOT NULL,
  household_status TEXT NOT NULL DEFAULT 'Active',

  -- Relationships (links to parents in hierarchy)
  relationship_id UUID REFERENCES relationships(id) ON DELETE SET NULL,
  master_account_id UUID REFERENCES master_accounts(id) ON DELETE SET NULL,

  -- Primary Contact
  primary_client_id UUID, -- Will reference clients table (added after clients table exists)

  -- Billing Configuration
  billing_aggregation_level TEXT DEFAULT 'household',
  default_fee_schedule_id UUID,

  -- Address Information
  mailing_address JSONB,

  -- Computed fields
  total_aum DECIMAL(15,2) DEFAULT 0,
  number_of_clients INTEGER DEFAULT 0,
  number_of_accounts INTEGER DEFAULT 0
);

COMMENT ON TABLE households IS 'Household grouping for families or business entities';
COMMENT ON COLUMN households.mailing_address IS 'Stored as JSON: {street1, street2, city, state, zipCode, country}';

-- ==================================================================
-- TABLE 4: CLIENTS
-- Individual people or entities
-- ==================================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic Information
  full_legal_name TEXT NOT NULL,
  date_of_birth DATE,
  tax_id_type TEXT DEFAULT 'SSN',
  tax_id_number TEXT,
  entity_type TEXT DEFAULT 'Individual',
  client_status TEXT NOT NULL DEFAULT 'Active',

  -- Hierarchy Relationships
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  relationship_id UUID REFERENCES relationships(id) ON DELETE SET NULL,
  master_account_id UUID REFERENCES master_accounts(id) ON DELETE SET NULL,

  -- Contact Information
  primary_email TEXT,
  secondary_email TEXT,
  mobile_phone TEXT,
  home_phone TEXT,
  office_phone TEXT,
  mailing_address JSONB,
  physical_address JSONB,

  -- Billing Configuration
  default_fee_schedule_id UUID,
  billing_frequency TEXT DEFAULT 'Quarterly',
  billing_method TEXT DEFAULT 'Debit from Account',
  fee_payment_account_id UUID,
  custom_fee_adjustment DECIMAL(5,2),

  -- Relationship Management
  primary_advisor TEXT,
  relationship_manager TEXT,
  service_team TEXT,
  client_since_date DATE,
  last_review_date DATE,
  next_review_date DATE,

  -- Additional Information
  risk_tolerance TEXT,
  investment_objectives TEXT,
  notes TEXT,
  preferred_contact_method TEXT,
  do_not_contact BOOLEAN DEFAULT false,
  do_not_email BOOLEAN DEFAULT false,
  do_not_call BOOLEAN DEFAULT false,

  -- Computed fields
  total_aum DECIMAL(15,2) DEFAULT 0,
  number_of_accounts INTEGER DEFAULT 0
);

COMMENT ON TABLE clients IS 'Individual clients or entities with their contact and billing information';
COMMENT ON COLUMN clients.custom_fee_adjustment IS 'Percentage adjustment to standard fee (e.g., -10 for 10% discount)';

-- ==================================================================
-- TABLE 5: ACCOUNTS
-- Individual investment accounts
-- ==================================================================
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic Information
  account_number TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  account_status TEXT NOT NULL DEFAULT 'Active',
  custodian TEXT,

  -- Hierarchy Relationships
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  relationship_id UUID REFERENCES relationships(id) ON DELETE SET NULL,
  master_account_id UUID REFERENCES master_accounts(id) ON DELETE SET NULL,

  -- Registration Information
  registration_type TEXT,
  tax_status TEXT,

  -- Current Balances (snapshot)
  portfolio_value DECIMAL(15,2) DEFAULT 0,
  total_cash DECIMAL(15,2) DEFAULT 0,
  total_equity DECIMAL(15,2) DEFAULT 0,
  total_fixed_income DECIMAL(15,2) DEFAULT 0,
  total_alternative DECIMAL(15,2) DEFAULT 0,
  total_other DECIMAL(15,2) DEFAULT 0,

  -- Billing Configuration
  fee_schedule_id UUID,
  custom_fee_rate DECIMAL(5,4),
  billing_enabled BOOLEAN DEFAULT true,

  -- Important Dates
  account_opened_date DATE,
  account_closed_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE accounts IS 'Individual investment accounts with current balances';
COMMENT ON COLUMN accounts.custom_fee_rate IS 'Override fee rate for this specific account (e.g., 0.0100 for 1%)';

-- ==================================================================
-- TABLE 6: POSITIONS
-- Individual securities held in accounts (time-series data)
-- ==================================================================
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Relationships
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,

  -- Time-series date (critical for historical tracking)
  date DATE NOT NULL,

  -- Security Information
  symbol TEXT NOT NULL,
  cusip TEXT,
  security_description TEXT,
  security_type TEXT,

  -- Position Data
  number_of_shares DECIMAL(15,4),
  price DECIMAL(15,4),
  market_value DECIMAL(15,2),
  cost_basis DECIMAL(15,2),
  unrealized_gain_loss DECIMAL(15,2),
  percent_of_account DECIMAL(5,2),

  -- Classification
  asset_class TEXT,
  sector TEXT,
  country TEXT
);

COMMENT ON TABLE positions IS 'Time-series data of security positions held in accounts';
COMMENT ON COLUMN positions.date IS 'Date of this position snapshot - allows historical tracking';

-- ==================================================================
-- TABLE 7: FEE SCHEDULES
-- Tiered fee structures
-- ==================================================================
CREATE TABLE fee_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic Information
  schedule_name TEXT NOT NULL,
  schedule_description TEXT,
  schedule_status TEXT DEFAULT 'Active',

  -- Tiers stored as JSON array
  tiers JSONB NOT NULL,

  -- Settings
  billing_frequency TEXT DEFAULT 'Quarterly',
  minimum_fee DECIMAL(10,2),

  -- Effective dates
  effective_start_date DATE,
  effective_end_date DATE
);

COMMENT ON TABLE fee_schedules IS 'Fee schedule templates with tiered rate structures';
COMMENT ON COLUMN fee_schedules.tiers IS 'Array of tiers: [{min: 0, max: 1000000, rate: 0.0100}, ...]';

-- Example of tiers format:
-- [
--   {"min": 0, "max": 1000000, "rate": 0.0100, "label": "First $1M"},
--   {"min": 1000000, "max": 5000000, "rate": 0.0075, "label": "$1M - $5M"},
--   {"min": 5000000, "max": null, "rate": 0.0050, "label": "Over $5M"}
-- ]

-- ==================================================================
-- TABLE 8: BILLING PERIODS
-- Quarterly billing periods
-- ==================================================================
CREATE TABLE billing_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Period Identification
  period_name TEXT NOT NULL UNIQUE,  -- e.g., "Q4-2024"
  period_year INTEGER NOT NULL,
  period_quarter INTEGER,  -- 1-4 for quarterly
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_in_period INTEGER NOT NULL,
  proration_factor DECIMAL(8,6),  -- days_in_period / 365

  -- Status
  status TEXT NOT NULL DEFAULT 'upcoming',  -- upcoming, current, completed

  -- Summary (calculated after fees are computed)
  total_fees_calculated DECIMAL(15,2) DEFAULT 0,
  number_of_accounts_billed INTEGER DEFAULT 0,
  calculation_date TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE billing_periods IS 'Quarterly billing periods with proration factors';
COMMENT ON COLUMN billing_periods.proration_factor IS 'Used to calculate fees: (days_in_period / 365) * annual_fee';

-- ==================================================================
-- TABLE 9: FEE CALCULATIONS
-- Calculated fees for each account per billing period
-- ==================================================================
CREATE TABLE fee_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Relationships
  billing_period_id UUID REFERENCES billing_periods(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  fee_schedule_id UUID REFERENCES fee_schedules(id),

  -- Calculation Inputs
  average_aum DECIMAL(15,2) NOT NULL,
  fee_rate DECIMAL(5,4) NOT NULL,
  days_in_period INTEGER NOT NULL,
  proration_factor DECIMAL(8,6),

  -- Calculation Results
  calculated_fee DECIMAL(15,2) NOT NULL,
  adjustments DECIMAL(15,2) DEFAULT 0,
  final_fee DECIMAL(15,2) NOT NULL,

  -- Status Tracking
  status TEXT DEFAULT 'calculated',  -- calculated, pending, invoiced, paid
  invoice_number TEXT,
  invoice_date DATE,
  payment_date DATE,

  -- Audit Trail
  calculation_method TEXT,
  notes TEXT
);

COMMENT ON TABLE fee_calculations IS 'Historical record of all fee calculations by account and period';
COMMENT ON COLUMN fee_calculations.average_aum IS 'Average AUM for the billing period';
COMMENT ON COLUMN fee_calculations.adjustments IS 'Manual adjustments (discounts, credits, etc.)';

-- ==================================================================
-- TABLE 10: BALANCE HISTORY
-- Historical daily account balances
-- ==================================================================
CREATE TABLE balance_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Relationships
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,

  -- Time-series date
  date DATE NOT NULL,

  -- Balance snapshot
  portfolio_value DECIMAL(15,2),
  total_cash DECIMAL(15,2),
  total_equity DECIMAL(15,2),
  total_fixed_income DECIMAL(15,2),
  total_alternative DECIMAL(15,2),
  total_other DECIMAL(15,2)
);

COMMENT ON TABLE balance_history IS 'Daily historical snapshots of account balances';
COMMENT ON COLUMN balance_history.date IS 'Date of this balance snapshot';

-- ==================================================================
-- SUCCESS MESSAGE
-- ==================================================================
SELECT
  'SUCCESS! All 10 tables created:' as message,
  '1. relationships' as table_1,
  '2. master_accounts' as table_2,
  '3. households' as table_3,
  '4. clients' as table_4,
  '5. accounts' as table_5,
  '6. positions' as table_6,
  '7. fee_schedules' as table_7,
  '8. billing_periods' as table_8,
  '9. fee_calculations' as table_9,
  '10. balance_history' as table_10;

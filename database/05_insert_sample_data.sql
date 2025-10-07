-- ==================================================================
-- FINANCIAL MANAGER DATABASE SCHEMA - PART 5: SAMPLE DATA
-- ==================================================================
-- Run this script LAST (after all other scripts)
-- This inserts sample data to test your database
-- ==================================================================

-- ==================================================================
-- 1. INSERT SAMPLE FEE SCHEDULE
-- ==================================================================
INSERT INTO fee_schedules (
  schedule_name,
  schedule_description,
  tiers,
  billing_frequency,
  minimum_fee,
  schedule_status,
  effective_start_date
) VALUES (
  'Standard Advisory Fee Schedule',
  'Tiered fee schedule for standard advisory accounts',
  '[
    {"min": 0, "max": 1000000, "rate": 0.0100, "label": "First $1M"},
    {"min": 1000000, "max": 5000000, "rate": 0.0075, "label": "$1M - $5M"},
    {"min": 5000000, "max": null, "rate": 0.0050, "label": "Over $5M"}
  ]'::jsonb,
  'Quarterly',
  0,
  'Active',
  '2024-01-01'
),
(
  'Premium Fee Schedule',
  'Higher service level with lower fees',
  '[
    {"min": 0, "max": 2000000, "rate": 0.0085, "label": "First $2M"},
    {"min": 2000000, "max": 10000000, "rate": 0.0065, "label": "$2M - $10M"},
    {"min": 10000000, "max": null, "rate": 0.0040, "label": "Over $10M"}
  ]'::jsonb,
  'Quarterly',
  0,
  'Active',
  '2024-01-01'
);

-- ==================================================================
-- 2. INSERT BILLING PERIODS (Past, Current, Future)
-- ==================================================================

-- Q3 2024 (Completed)
INSERT INTO billing_periods (
  period_name, period_year, period_quarter,
  start_date, end_date, days_in_period, proration_factor,
  status, total_fees_calculated, calculation_date
) VALUES (
  'Q3-2024', 2024, 3,
  '2024-07-01', '2024-09-30', 92, 92.0/365.0,
  'completed', 0, '2024-09-30 23:59:59'
);

-- Q4 2024 (Current)
INSERT INTO billing_periods (
  period_name, period_year, period_quarter,
  start_date, end_date, days_in_period, proration_factor,
  status
) VALUES (
  'Q4-2024', 2024, 4,
  '2024-10-01', '2024-12-31', 92, 92.0/365.0,
  'current'
);

-- Q1 2025 (Upcoming)
INSERT INTO billing_periods (
  period_name, period_year, period_quarter,
  start_date, end_date, days_in_period, proration_factor,
  status
) VALUES (
  'Q1-2025', 2025, 1,
  '2025-01-01', '2025-03-31', 90, 90.0/365.0,
  'upcoming'
);

-- Q2 2025 (Upcoming)
INSERT INTO billing_periods (
  period_name, period_year, period_quarter,
  start_date, end_date, days_in_period, proration_factor,
  status
) VALUES (
  'Q2-2025', 2025, 2,
  '2025-04-01', '2025-06-30', 91, 91.0/365.0,
  'upcoming'
);

-- ==================================================================
-- 3. INSERT SAMPLE RELATIONSHIP
-- ==================================================================
INSERT INTO relationships (
  relationship_name,
  relationship_status,
  billing_aggregation_level
) VALUES (
  'Sample Family Relationship',
  'Active',
  'household'
) RETURNING id;

-- Note: Copy the ID that's returned - we'll use it below
-- For this script, we'll use a variable (PostgreSQL specific)

DO $$
DECLARE
  relationship_uuid UUID;
  master_account_uuid UUID;
  household_uuid UUID;
  client_uuid UUID;
  account_uuid UUID;
  fee_schedule_uuid UUID;
BEGIN
  -- Get the fee schedule ID
  SELECT id INTO fee_schedule_uuid FROM fee_schedules WHERE schedule_name = 'Standard Advisory Fee Schedule';

  -- Create relationship
  INSERT INTO relationships (relationship_name, relationship_status)
  VALUES ('Sample Family Relationship', 'Active')
  RETURNING id INTO relationship_uuid;

  -- Create master account
  INSERT INTO master_accounts (
    master_account_number, master_account_name, master_account_status,
    relationship_id, default_fee_schedule_id
  ) VALUES (
    'MA-001', 'Sample Master Account', 'Active',
    relationship_uuid, fee_schedule_uuid
  ) RETURNING id INTO master_account_uuid;

  -- Create household
  INSERT INTO households (
    household_name, household_status,
    relationship_id, master_account_id,
    default_fee_schedule_id,
    mailing_address
  ) VALUES (
    'Sample Family Household', 'Active',
    relationship_uuid, master_account_uuid,
    fee_schedule_uuid,
    '{"street1": "123 Main St", "city": "Anytown", "state": "CA", "zipCode": "90210", "country": "USA"}'::jsonb
  ) RETURNING id INTO household_uuid;

  -- Create client
  INSERT INTO clients (
    full_legal_name, date_of_birth, client_status,
    entity_type, tax_id_type,
    household_id, relationship_id, master_account_id,
    default_fee_schedule_id,
    primary_email, mobile_phone,
    primary_advisor, client_since_date
  ) VALUES (
    'John Sample', '1975-05-15', 'Active',
    'Individual', 'SSN',
    household_uuid, relationship_uuid, master_account_uuid,
    fee_schedule_uuid,
    'john.sample@example.com', '(555) 123-4567',
    'Senior Advisor', '2020-01-01'
  ) RETURNING id INTO client_uuid;

  -- Create account
  INSERT INTO accounts (
    account_number, account_name, account_type, account_status,
    custodian, registration_type,
    client_id, household_id, relationship_id, master_account_id,
    fee_schedule_id,
    portfolio_value, total_cash, total_equity, total_fixed_income,
    account_opened_date, billing_enabled
  ) VALUES (
    'ACC-001', 'Individual Brokerage Account', 'Brokerage', 'Active',
    'Fidelity', 'Individual',
    client_uuid, household_uuid, relationship_uuid, master_account_uuid,
    fee_schedule_uuid,
    1500000.00, 50000.00, 1200000.00, 250000.00,
    '2020-01-01', true
  ) RETURNING id INTO account_uuid;

  -- Insert sample positions for this account
  INSERT INTO positions (
    account_id, date,
    symbol, security_description, security_type, asset_class,
    number_of_shares, price, market_value,
    percent_of_account
  ) VALUES
  (account_uuid, CURRENT_DATE, 'AAPL', 'Apple Inc.', 'Stock', 'Equity', 5000, 175.00, 875000.00, 58.33),
  (account_uuid, CURRENT_DATE, 'MSFT', 'Microsoft Corporation', 'Stock', 'Equity', 2000, 350.00, 700000.00, 46.67),
  (account_uuid, CURRENT_DATE, 'VFIAX', 'Vanguard 500 Index Fund', 'Mutual Fund', 'Equity', 500, 400.00, 200000.00, 13.33),
  (account_uuid, CURRENT_DATE, 'BND', 'Vanguard Total Bond Market ETF', 'ETF', 'Fixed Income', 3000, 75.00, 225000.00, 15.00);

  -- Insert balance history
  INSERT INTO balance_history (
    account_id, date,
    portfolio_value, total_cash, total_equity, total_fixed_income
  ) VALUES
  (account_uuid, CURRENT_DATE, 1500000.00, 50000.00, 1200000.00, 250000.00),
  (account_uuid, CURRENT_DATE - INTERVAL '1 day', 1495000.00, 50000.00, 1195000.00, 250000.00),
  (account_uuid, CURRENT_DATE - INTERVAL '7 days', 1480000.00, 50000.00, 1180000.00, 250000.00);

END $$;

-- ==================================================================
-- SUCCESS MESSAGE & SUMMARY
-- ==================================================================
SELECT
  'SUCCESS! Sample data inserted.' as message,
  (SELECT COUNT(*) FROM fee_schedules) as fee_schedules_count,
  (SELECT COUNT(*) FROM billing_periods) as billing_periods_count,
  (SELECT COUNT(*) FROM relationships) as relationships_count,
  (SELECT COUNT(*) FROM clients) as clients_count,
  (SELECT COUNT(*) FROM accounts) as accounts_count,
  (SELECT COUNT(*) FROM positions) as positions_count;

-- Show sample data
SELECT
  '=== SAMPLE CLIENT CREATED ===' as section,
  c.full_legal_name as client_name,
  a.account_number as account_number,
  a.portfolio_value as account_value,
  (SELECT COUNT(*) FROM positions WHERE account_id = a.id) as number_of_positions
FROM clients c
JOIN accounts a ON a.client_id = c.id
WHERE c.full_legal_name = 'John Sample';

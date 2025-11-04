-- =====================================================
-- Add missing fields to accounts table
-- =====================================================
-- Migration: 34
-- Description: Add missing fields needed by the frontend
-- Date: 2025-10-23
-- =====================================================

-- Add registration_name field (legal name as registered with custodian)
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS registration_name TEXT;

-- Add custodian_account_id field (custodian's internal account identifier)
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS custodian_account_id TEXT;

-- Add tax_id field (tax identification number for the account)
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Add reconciliation fields
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS reconciliation_status TEXT DEFAULT 'Matched';

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS last_reconciled_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS reconciliation_notes TEXT;

-- Add general notes field
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add billing configuration fields
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS is_excluded_from_billing BOOLEAN DEFAULT false;

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS billing_override TEXT;

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS minimum_fee DECIMAL(10,2);

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS fee_exclusions TEXT[]; -- Array of asset types to exclude

-- Add import/statement tracking fields
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS last_import_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS last_statement_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN accounts.registration_name IS 'Legal registration name as it appears on custodian records';
COMMENT ON COLUMN accounts.custodian_account_id IS 'Custodian internal account identifier (often same as account_number)';
COMMENT ON COLUMN accounts.tax_id IS 'Tax identification number for this account';
COMMENT ON COLUMN accounts.reconciliation_status IS 'Status of account reconciliation: Matched, New Account, Delinked, Pending Link';
COMMENT ON COLUMN accounts.last_reconciled_date IS 'Date when this account was last reconciled';
COMMENT ON COLUMN accounts.reconciliation_notes IS 'Notes about account reconciliation status or issues';
COMMENT ON COLUMN accounts.notes IS 'General notes about the account';
COMMENT ON COLUMN accounts.is_excluded_from_billing IS 'Whether this account should be excluded from fee calculations';
COMMENT ON COLUMN accounts.billing_override IS 'Special billing instructions or overrides for this account';
COMMENT ON COLUMN accounts.minimum_fee IS 'Minimum fee amount for this account';
COMMENT ON COLUMN accounts.fee_exclusions IS 'Array of asset types to exclude from fee calculations';
COMMENT ON COLUMN accounts.last_import_date IS 'Date of last data import from custodian';
COMMENT ON COLUMN accounts.last_statement_date IS 'Date of last custodian statement';

-- Success message
SELECT 'SUCCESS! Added missing fields to accounts table' as message;

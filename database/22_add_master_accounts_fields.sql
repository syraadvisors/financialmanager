-- Add missing fields to master_accounts table
-- Fields: office, description

ALTER TABLE master_accounts
ADD COLUMN IF NOT EXISTS office TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN master_accounts.office IS 'Office location for the master account';
COMMENT ON COLUMN master_accounts.description IS 'Description of the master account purpose';

-- Success message
SELECT 'SUCCESS! Added office and description fields to master_accounts table' as message;

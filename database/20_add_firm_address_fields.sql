-- =====================================================
-- Add Individual Address Fields to Firms Table
-- =====================================================
-- This migration adds individual address fields to match
-- the frontend FirmSettings interface expectations

-- Add new columns for firm settings
ALTER TABLE firms
ADD COLUMN IF NOT EXISTS legal_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT,
ADD COLUMN IF NOT EXISTS default_invoice_terms INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS default_invoice_message TEXT;

-- Migrate data from existing columns if they exist
-- Move primary_contact_email to email if email is null
UPDATE firms
SET email = primary_contact_email
WHERE email IS NULL AND primary_contact_email IS NOT NULL;

-- Move phone_number to phone if phone is null
UPDATE firms
SET phone = phone_number
WHERE phone IS NULL AND phone_number IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_firms_city ON firms(city);
CREATE INDEX IF NOT EXISTS idx_firms_state ON firms(state);

-- Add comment for documentation
COMMENT ON COLUMN firms.legal_name IS 'Legal business name (may differ from firm_name)';
COMMENT ON COLUMN firms.address IS 'Street address';
COMMENT ON COLUMN firms.city IS 'City';
COMMENT ON COLUMN firms.state IS 'State/Province';
COMMENT ON COLUMN firms.zip_code IS 'ZIP/Postal code';
COMMENT ON COLUMN firms.tax_id IS 'Tax identification number (EIN)';
COMMENT ON COLUMN firms.logo_url IS 'URL to firm logo in storage';
COMMENT ON COLUMN firms.primary_color IS 'Primary brand color (hex code)';
COMMENT ON COLUMN firms.default_invoice_terms IS 'Default payment terms in days';
COMMENT ON COLUMN firms.default_invoice_message IS 'Default message on invoices';

-- =====================================================
-- Add Address Line 2 to Firms Table
-- =====================================================
-- This migration adds address2 field for suite numbers,
-- apartment numbers, building names, etc.

-- Add address2 column
ALTER TABLE firms
ADD COLUMN IF NOT EXISTS address2 TEXT;

-- Add comment for documentation
COMMENT ON COLUMN firms.address2 IS 'Address line 2 (suite, apartment, building, floor, etc.)';

-- Success message
SELECT 'SUCCESS! address2 field added to firms table' as message;

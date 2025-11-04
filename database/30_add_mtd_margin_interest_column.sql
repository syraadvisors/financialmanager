-- ==================================================================
-- ADD MISSING MTD_MARGIN_INTEREST COLUMN
-- ==================================================================
-- This migration adds the missing mtd_margin_interest column to the
-- imported_balance_data table
-- ==================================================================

-- Add the missing column
ALTER TABLE imported_balance_data
ADD COLUMN mtd_margin_interest DECIMAL(15,2);

-- Add comment for documentation
COMMENT ON COLUMN imported_balance_data.mtd_margin_interest IS 'Month-to-date margin interest';

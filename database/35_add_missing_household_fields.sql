-- Migration: Add missing fields to households table
-- This adds fields that are in the TypeScript Household interface but missing from the database

-- Add custom_fee_adjustment column
ALTER TABLE households
ADD COLUMN IF NOT EXISTS custom_fee_adjustment DECIMAL(5,2);

COMMENT ON COLUMN households.custom_fee_adjustment IS 'Percentage adjustment to fees for this household (e.g., 0.25 for 0.25% adjustment)';

-- Add fee_schedule_id column (renaming default_fee_schedule_id)
-- First, copy data if the old column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'households' AND column_name = 'default_fee_schedule_id'
  ) THEN
    -- Add new column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'households' AND column_name = 'fee_schedule_id'
    ) THEN
      ALTER TABLE households ADD COLUMN fee_schedule_id UUID;
      -- Copy data from old column to new
      UPDATE households SET fee_schedule_id = default_fee_schedule_id;
    END IF;
  ELSE
    -- Just add the column if old one doesn't exist
    ALTER TABLE households ADD COLUMN IF NOT EXISTS fee_schedule_id UUID;
  END IF;
END $$;

COMMENT ON COLUMN households.fee_schedule_id IS 'Fee schedule to use for this household';

-- Add member_account_ids column (array of account IDs)
ALTER TABLE households
ADD COLUMN IF NOT EXISTS member_account_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN households.member_account_ids IS 'Array of account IDs that belong to this household';

-- Add notes column
ALTER TABLE households
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN households.notes IS 'General notes about the household';

-- Add established_date column
ALTER TABLE households
ADD COLUMN IF NOT EXISTS established_date DATE;

COMMENT ON COLUMN households.established_date IS 'Date the household was established';

-- Add last_review_date column
ALTER TABLE households
ADD COLUMN IF NOT EXISTS last_review_date DATE;

COMMENT ON COLUMN households.last_review_date IS 'Date of last review for this household';

-- Add relationship_name (computed field, but we'll store it for performance)
ALTER TABLE households
ADD COLUMN IF NOT EXISTS relationship_name TEXT;

COMMENT ON COLUMN households.relationship_name IS 'Display name of the related relationship (denormalized for performance)';

-- Add total_annual_fees (computed field)
ALTER TABLE households
ADD COLUMN IF NOT EXISTS total_annual_fees DECIMAL(15,2) DEFAULT 0;

COMMENT ON COLUMN households.total_annual_fees IS 'Total annual fees for all accounts in this household (computed)';

-- Update the updated_at trigger to work with these new columns
-- The trigger should already exist from previous migrations

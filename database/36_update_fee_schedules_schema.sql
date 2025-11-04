-- Migration: Update fee_schedules table to match TypeScript interface
-- This migration updates column names and adds missing columns

-- Add new columns with proper names
ALTER TABLE fee_schedules
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS category_id UUID,
ADD COLUMN IF NOT EXISTS structure_type TEXT DEFAULT 'tiered',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS flat_rate DECIMAL(10,6),
ADD COLUMN IF NOT EXISTS flat_fee_per_quarter DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS minimum_fee_per_year DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS has_minimum_fee BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_direct_bill BOOLEAN DEFAULT false;

-- Migrate data from old columns to new columns
UPDATE fee_schedules
SET
  name = COALESCE(schedule_name, 'Unnamed Schedule'),
  code = COALESCE(schedule_name, 'SCHED-' || SUBSTRING(id::TEXT, 1, 8)),
  status = CASE
    WHEN LOWER(schedule_status) = 'active' THEN 'active'
    WHEN LOWER(schedule_status) = 'inactive' THEN 'inactive'
    ELSE 'active'
  END,
  description = COALESCE(schedule_description, ''),
  structure_type = 'tiered',
  has_minimum_fee = (minimum_fee IS NOT NULL AND minimum_fee > 0),
  minimum_fee_per_year = minimum_fee
WHERE name IS NULL;

-- Drop old columns (commented out for safety - uncomment after verifying migration)
-- ALTER TABLE fee_schedules
-- DROP COLUMN IF EXISTS schedule_name,
-- DROP COLUMN IF EXISTS schedule_status,
-- DROP COLUMN IF EXISTS schedule_description,
-- DROP COLUMN IF EXISTS minimum_fee,
-- DROP COLUMN IF EXISTS billing_frequency,
-- DROP COLUMN IF EXISTS effective_start_date,
-- DROP COLUMN IF EXISTS effective_end_date;

-- Add constraints
ALTER TABLE fee_schedules
ALTER COLUMN code SET NOT NULL,
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN status SET NOT NULL,
ALTER COLUMN structure_type SET NOT NULL,
ALTER COLUMN has_minimum_fee SET NOT NULL;

-- Add check constraint for status
ALTER TABLE fee_schedules
DROP CONSTRAINT IF EXISTS fee_schedules_status_check,
ADD CONSTRAINT fee_schedules_status_check
  CHECK (status IN ('active', 'inactive'));

-- Add check constraint for structure_type
ALTER TABLE fee_schedules
DROP CONSTRAINT IF EXISTS fee_schedules_structure_type_check,
ADD CONSTRAINT fee_schedules_structure_type_check
  CHECK (structure_type IN ('tiered', 'flat_rate', 'flat_fee'));

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_fee_schedules_status ON fee_schedules(status);
CREATE INDEX IF NOT EXISTS idx_fee_schedules_firm_id_status ON fee_schedules(firm_id, status);

COMMENT ON COLUMN fee_schedules.code IS 'Unique identifier code for the fee schedule';
COMMENT ON COLUMN fee_schedules.name IS 'Display name for the fee schedule';
COMMENT ON COLUMN fee_schedules.status IS 'active or inactive';
COMMENT ON COLUMN fee_schedules.structure_type IS 'tiered, flat_rate, or flat_fee';
COMMENT ON COLUMN fee_schedules.tags IS 'Classification tags for filtering';

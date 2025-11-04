-- Fix NOT NULL constraints on fee_schedules table
-- Run this FIRST before running 38_insert_all_real_fee_schedules.sql

-- Drop NOT NULL constraints on old columns
ALTER TABLE fee_schedules ALTER COLUMN schedule_name DROP NOT NULL;
ALTER TABLE fee_schedules ALTER COLUMN tiers DROP NOT NULL;

-- Verify constraints are removed
SELECT
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'fee_schedules'
  AND column_name IN ('schedule_name', 'tiers')
ORDER BY column_name;

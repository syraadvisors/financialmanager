-- Insert fee schedules for your firm
-- Run this in Supabase SQL Editor after running migration 36

-- First, drop the NOT NULL constraint on old columns if they exist
ALTER TABLE fee_schedules ALTER COLUMN schedule_name DROP NOT NULL;

-- Update existing fee schedules if migration was run
UPDATE fee_schedules
SET
  firm_id = 'dc838876-888c-4cce-b37d-f055f40fcb0c',
  code = COALESCE(code, 'STD-001'),
  name = COALESCE(name, schedule_name, 'Standard Fee Schedule'),
  status = 'active',
  structure_type = 'tiered',
  has_minimum_fee = false,
  description = COALESCE(description, schedule_description, ''),
  schedule_name = COALESCE(schedule_name, name, 'Standard Fee Schedule'),
  schedule_status = COALESCE(schedule_status, 'Active')
WHERE firm_id IS NULL OR code IS NULL;

-- Insert new fee schedules for your firm with proper schema
-- Include old columns to satisfy constraints
INSERT INTO fee_schedules (
  firm_id,
  code,
  name,
  status,
  structure_type,
  tiers,
  has_minimum_fee,
  minimum_fee_per_year,
  description,
  schedule_name,
  schedule_status
) VALUES
(
  'dc838876-888c-4cce-b37d-f055f40fcb0c',
  'STD-001',
  'Standard Advisory Fee Schedule',
  'active',
  'tiered',
  '[
    {"minAmount": 0, "maxAmount": 1000000, "rate": 0.0100},
    {"minAmount": 1000000, "maxAmount": 5000000, "rate": 0.0075},
    {"minAmount": 5000000, "maxAmount": null, "rate": 0.0050}
  ]'::jsonb,
  false,
  0,
  'Tiered fee schedule for standard advisory accounts',
  'Standard Advisory Fee Schedule',
  'Active'
),
(
  'dc838876-888c-4cce-b37d-f055f40fcb0c',
  'PREM-001',
  'Premium Fee Schedule',
  'active',
  'tiered',
  '[
    {"minAmount": 0, "maxAmount": 2000000, "rate": 0.0085},
    {"minAmount": 2000000, "maxAmount": 10000000, "rate": 0.0065},
    {"minAmount": 10000000, "maxAmount": null, "rate": 0.0040}
  ]'::jsonb,
  false,
  0,
  'Higher service level with lower fees for premium clients',
  'Premium Fee Schedule',
  'Active'
),
(
  'dc838876-888c-4cce-b37d-f055f40fcb0c',
  'FLAT-001',
  'Flat Rate 1%',
  'active',
  'flat_rate',
  NULL,
  false,
  0,
  'Simple 1% annual fee on all assets',
  'Flat Rate 1%',
  'Active'
),
(
  'dc838876-888c-4cce-b37d-f055f40fcb0c',
  'MIN-001',
  'Standard with $5K Minimum',
  'active',
  'tiered',
  '[
    {"minAmount": 0, "maxAmount": 1000000, "rate": 0.0100},
    {"minAmount": 1000000, "maxAmount": 5000000, "rate": 0.0075},
    {"minAmount": 5000000, "maxAmount": null, "rate": 0.0050}
  ]'::jsonb,
  true,
  5000,
  'Standard tiered schedule with $5,000 annual minimum fee',
  'Standard with $5K Minimum',
  'Active'
)
ON CONFLICT DO NOTHING;

-- Verify the insert
SELECT code, name, status, firm_id
FROM fee_schedules
WHERE firm_id = 'dc838876-888c-4cce-b37d-f055f40fcb0c'
ORDER BY code;

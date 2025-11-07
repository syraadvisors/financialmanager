-- ================================================================
-- CLEAR IMPORTED DATA TABLES
-- ================================================================
-- This script deletes all data from imported_balance_data and
-- imported_positions_data tables while preserving the table structure
-- ================================================================

-- Delete all records from imported_balance_data
DELETE FROM imported_balance_data;

-- Delete all records from imported_positions_data
DELETE FROM imported_positions_data;

-- Show counts to confirm deletion
SELECT
  'imported_balance_data' as table_name,
  COUNT(*) as remaining_records
FROM imported_balance_data

UNION ALL

SELECT
  'imported_positions_data' as table_name,
  COUNT(*) as remaining_records
FROM imported_positions_data;

-- Success message
SELECT 'SUCCESS! All imported data has been cleared from both tables' as message;

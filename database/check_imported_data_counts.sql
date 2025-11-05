-- ================================================================
-- CHECK IMPORTED DATA COUNTS
-- ================================================================
-- This script shows counts and details of imported data
-- ================================================================

-- Count of records in imported_balance_data by firm
SELECT
  'imported_balance_data' as table_name,
  firm_id,
  COUNT(*) as total_records,
  COUNT(DISTINCT account_number) as unique_accounts,
  COUNT(DISTINCT as_of_business_date) as unique_dates,
  COUNT(DISTINCT import_batch_id) as unique_batches,
  MIN(import_timestamp) as first_import,
  MAX(import_timestamp) as last_import
FROM imported_balance_data
GROUP BY firm_id

UNION ALL

-- Count of records in imported_positions_data by firm
SELECT
  'imported_positions_data' as table_name,
  firm_id,
  COUNT(*) as total_records,
  COUNT(DISTINCT account_number) as unique_accounts,
  COUNT(DISTINCT as_of_business_date) as unique_dates,
  COUNT(DISTINCT import_batch_id) as unique_batches,
  MIN(import_timestamp) as first_import,
  MAX(import_timestamp) as last_import
FROM imported_positions_data
GROUP BY firm_id;

-- Show unique dates in imported_balance_data
SELECT
  'Available Balance Dates' as info,
  as_of_business_date,
  COUNT(*) as record_count,
  COUNT(DISTINCT account_number) as unique_accounts
FROM imported_balance_data
GROUP BY as_of_business_date
ORDER BY as_of_business_date DESC;

-- Show import batches
SELECT
  'Import Batches' as info,
  import_batch_id,
  import_filename,
  import_timestamp,
  COUNT(*) as records,
  COUNT(DISTINCT account_number) as unique_accounts,
  as_of_business_date
FROM imported_balance_data
GROUP BY import_batch_id, import_filename, import_timestamp, as_of_business_date
ORDER BY import_timestamp DESC;

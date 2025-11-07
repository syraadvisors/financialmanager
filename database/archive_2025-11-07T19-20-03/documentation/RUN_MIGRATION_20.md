# Run Migration 20: Add Firm Address Fields

## Problem
The firm settings page is trying to save individual address fields (`city`, `state`, `zip_code`, etc.) but the database only has a JSONB `address` column.

## Solution
Run the migration script `20_add_firm_address_fields.sql` to add the missing columns.

## How to Run

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `20_add_firm_address_fields.sql`
5. Click **Run** or press `Ctrl+Enter`

### Option 2: Using Supabase CLI (if installed)
```bash
supabase db execute --file database/20_add_firm_address_fields.sql
```

### Option 3: Using psql
```bash
psql "postgresql://postgres:[password]@[host]:[port]/postgres" -f database/20_add_firm_address_fields.sql
```

## What This Migration Does
- Adds individual address columns: `address`, `city`, `state`, `zip_code`
- Adds firm settings columns: `legal_name`, `phone`, `email`, `website`, `tax_id`
- Adds branding columns: `logo_url`, `primary_color`
- Adds invoice settings: `default_invoice_terms`, `default_invoice_message`
- Migrates existing data from old columns where applicable
- Creates indexes for better performance

## Verification
After running the migration, verify it worked:

```sql
-- Check that new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'firms'
  AND column_name IN ('city', 'state', 'zip_code', 'legal_name', 'address');
```

You should see all 5 columns listed.

## Next Steps
After running this migration, the Firm Settings page should work without errors.

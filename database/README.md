# Database Migrations

This directory contains SQL migration scripts for the FeeMGR database schema. Migrations are numbered sequentially and should be run in order.

## Migration Tracking

We use a migration tracking system to record which migrations have been applied. This prevents accidental re-application of migrations and provides an audit trail.

### First Time Setup

1. **Run the migration tracker first:**
   ```sql
   -- Run this in your Supabase SQL Editor
   -- File: 00_migration_tracker.sql
   ```

2. **Check current migration status:**
   ```sql
   SELECT * FROM migration_status;
   ```

3. **Apply missing migrations in order** (see migration list below)

## Migration Files

### Core Schema (01-05)

| File | Version | Name | Description | Status |
|------|---------|------|-------------|--------|
| `01_create_tables.sql` | 01 | create_tables | Creates initial database tables (clients, accounts, households, etc.) | ✅ Applied |
| `02_create_indexes.sql` | 02 | create_indexes | Adds performance indexes on frequently queried columns | ✅ Applied |
| `03_create_functions_triggers.sql` | 03 | create_functions_triggers | Creates helper functions and triggers (e.g., auto-update timestamps) | ✅ Applied |
| `04_enable_rls.sql` | 04 | enable_rls | Enables Row Level Security on all tables | ✅ Applied |
| `05_insert_sample_data.sql` | 05 | insert_sample_data | Inserts sample/test data for development | ✅ Applied |

### Multi-Tenancy (06-08)

| File | Version | Name | Description | Status |
|------|---------|------|-------------|--------|
| `06_create_firms_table.sql` | 06 | create_firms_table | Creates firms table for multi-tenant architecture | ✅ Applied |
| `07_add_firm_id_to_tables.sql` | 07 | add_firm_id_to_tables | Adds firm_id foreign key to all data tables | ✅ Applied |
| `08_configure_multi_tenant_rls.sql` | 08 | configure_multi_tenant_rls | Configures RLS policies for multi-tenant data isolation | ✅ Applied |

### User Management & RBAC (12-14)

| File | Version | Name | Description | Status |
|------|---------|------|-------------|--------|
| `12_create_user_profiles_and_rbac.sql` | 12 | create_user_profiles_and_rbac | Creates user_profiles table with role-based access control | ✅ Applied |
| `13_fix_rls_with_user_profiles.sql` | 13 | fix_rls_with_user_profiles | Updates RLS policies to use user_profiles table instead of JWT | ✅ Applied |
| `14_allow_user_profile_self_insert.sql` | 14 | allow_user_profile_self_insert | Allows users to create their own profile on first OAuth login | ✅ Applied |

## Deprecated Files

The following files have been **consolidated** into `08_configure_multi_tenant_rls.sql` and should **NOT** be run:

- ~~`08_update_rls_for_multi_tenant.sql`~~ (Original multi-tenant RLS)
- ~~`08_dev_temporary_rls.sql`~~ (Development workaround with hardcoded firm)
- ~~`09_fix_anon_access.sql`~~ (Added anon policies)
- ~~`10_fix_firms_rls_for_oauth.sql`~~ (Made firms table publicly readable)
- ~~`11_simplified_firms_rls.sql`~~ (Simplified version)

These files have been moved to `database/deprecated/` for reference only.

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the migration file contents
5. Click **Run** (or press `Ctrl+Enter`)
6. Verify success messages in the output

### Option 2: Using psql CLI

```bash
# Connect to your database
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run a specific migration
\i database/01_create_tables.sql

# Or run multiple migrations
\i database/00_migration_tracker.sql
\i database/01_create_tables.sql
\i database/02_create_indexes.sql
```

### Option 3: Using Supabase CLI

```bash
# Link your project
supabase link --project-ref your-project-ref

# Run migration
supabase db execute -f database/01_create_tables.sql
```

## Checking Migration Status

After applying migrations, verify they were recorded:

```sql
-- View all applied migrations
SELECT * FROM migration_status;

-- Check if a specific migration was applied
SELECT migration_applied('08');

-- Get the latest migration version
SELECT latest_migration_version();

-- View all RLS policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check if RLS is enabled on tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

## Migration Dependencies

```
00_migration_tracker.sql (Run FIRST)
  ↓
01_create_tables.sql
  ↓
02_create_indexes.sql
  ↓
03_create_functions_triggers.sql
  ↓
04_enable_rls.sql
  ↓
05_insert_sample_data.sql (optional for production)
  ↓
06_create_firms_table.sql
  ↓
07_add_firm_id_to_tables.sql
  ↓
08_configure_multi_tenant_rls.sql
  ↓
12_create_user_profiles_and_rbac.sql
  ↓
13_fix_rls_with_user_profiles.sql
  ↓
14_allow_user_profile_self_insert.sql
```

## Creating New Migrations

When creating a new migration:

1. **Use the next sequential number:**
   ```
   15_your_migration_name.sql
   ```

2. **Include standard header:**
   ```sql
   -- =====================================================
   -- Your Migration Title
   -- =====================================================
   -- Description of what this migration does
   --
   -- Migration: 15
   -- Description: Brief one-line description
   -- Dependencies: List any migrations this depends on
   -- Date: YYYY-MM-DD
   -- =====================================================
   ```

3. **Make migrations idempotent (safe to re-run):**
   ```sql
   -- Use IF NOT EXISTS
   CREATE TABLE IF NOT EXISTS my_table (...);

   -- Use DROP IF EXISTS before CREATE OR REPLACE
   DROP POLICY IF EXISTS "old_policy" ON my_table;
   CREATE POLICY "new_policy" ON my_table ...;

   -- Use DO blocks for conditional logic
   DO $$
   BEGIN
     IF NOT EXISTS (SELECT FROM ...) THEN
       -- Do something
     END IF;
   END $$;
   ```

4. **Record the migration:**
   ```sql
   -- At the end of your migration
   SELECT record_migration(
     '15',
     'your_migration_name',
     'Detailed description of changes',
     NULL  -- execution_time_ms (optional)
   );
   ```

5. **Add success message:**
   ```sql
   DO $$
   BEGIN
     RAISE NOTICE 'Migration 15 completed successfully: Your migration name';
   END $$;
   ```

## Common Migration Tasks

### Adding a New Column

```sql
-- Add column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'new_field'
  ) THEN
    ALTER TABLE clients ADD COLUMN new_field TEXT;
    RAISE NOTICE 'Column new_field added to clients table';
  END IF;
END $$;
```

### Creating a New RLS Policy

```sql
-- Drop old policy if exists
DROP POLICY IF EXISTS "Policy name" ON table_name;

-- Create new policy
CREATE POLICY "Policy name"
  ON table_name FOR SELECT
  USING (firm_id = get_user_firm_id());
```

### Adding an Index

```sql
-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column_name);
```

## Troubleshooting

### Migration Already Applied

If you see "duplicate key value violates unique constraint" on schema_migrations:

```sql
-- Check what's been applied
SELECT * FROM schema_migrations WHERE version = '08';

-- If you need to re-run a migration, delete the record first
DELETE FROM schema_migrations WHERE version = '08';
```

### RLS Blocking Your Queries

If RLS is blocking your queries:

```sql
-- Check which policies exist
SELECT * FROM pg_policies WHERE tablename = 'clients';

-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- Re-enable when done
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
```

### Testing User Firm ID

```sql
-- Check if user_firm_id function works
SELECT auth.user_firm_id();
SELECT get_user_firm_id();

-- Check your user profile
SELECT * FROM user_profiles WHERE id = auth.uid();
```

## Security Notes

1. **Never disable RLS in production** without understanding the security implications
2. **The `auth.role() = 'anon'` bypass** in migration 08 is for development only
   - In production, remove these OR clauses to enforce proper isolation
3. **Firms table is publicly readable** to support OAuth domain validation
   - This is safe as it contains no sensitive data
4. **Service role bypasses RLS** - protect your service role key
5. **Always test migrations** on a staging/dev database first

## Support

For issues or questions:
- Check the [Supabase RLS documentation](https://supabase.com/docs/guides/auth/row-level-security)
- Review the migration file comments for detailed explanations
- Check existing policies: `SELECT * FROM pg_policies WHERE schemaname = 'public';`

## Migration History

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-12 | 00 | Created migration tracking system | Claude |
| 2025-10-12 | 08 | Consolidated RLS migrations 08-11 into single file | Claude |
| [Previous dates] | 01-14 | Initial schema and multi-tenant setup | [Original authors] |

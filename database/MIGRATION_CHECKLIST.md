# Database Migration Checklist

Use this checklist when setting up a new database or verifying an existing one.

## Fresh Database Setup

### Prerequisites
- [ ] Supabase project created
- [ ] Database connection credentials available
- [ ] Access to Supabase SQL Editor or psql CLI

### Migration Steps

#### 1. Initialize Migration Tracking
- [ ] Run `00_migration_tracker.sql`
- [ ] Verify: `SELECT * FROM schema_migrations;`
- [ ] Expected: Should show migration 00 recorded

#### 2. Core Schema (Required)
- [ ] Run `01_create_tables.sql`
  - Creates: clients, accounts, households, relationships, positions, etc.
  - Verify: `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';`

- [ ] Run `02_create_indexes.sql`
  - Creates: Performance indexes
  - Verify: `SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';`

- [ ] Run `03_create_functions_triggers.sql`
  - Creates: Helper functions and triggers
  - Verify: `SELECT proname FROM pg_proc WHERE proname = 'update_updated_at_column';`

- [ ] Run `04_enable_rls.sql`
  - Enables: Row Level Security
  - Verify: `SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;`

#### 3. Sample Data (Optional - Development Only)
- [ ] Run `05_insert_sample_data.sql` (Skip for production)
  - Creates: Test clients, accounts, sample data
  - Verify: `SELECT COUNT(*) FROM clients;`

#### 4. Multi-Tenancy (Required)
- [ ] Run `06_create_firms_table.sql`
  - Creates: firms table
  - Verify: `SELECT * FROM firms;`

- [ ] **Important:** Insert your firm data
  ```sql
  INSERT INTO firms (firm_name, firm_domain, settings)
  VALUES (
    'Your Firm Name',
    'yourfirm.com',  -- Must match OAuth email domain
    '{}'::jsonb
  );
  ```

- [ ] Run `07_add_firm_id_to_tables.sql`
  - Adds: firm_id column to all tables
  - Verify: `SELECT column_name FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'firm_id';`

- [ ] **Important:** Update existing data with firm_id
  ```sql
  -- Get your firm_id
  SELECT id FROM firms WHERE firm_domain = 'yourfirm.com';

  -- Update tables with your firm_id (if you have data from step 5)
  UPDATE clients SET firm_id = 'YOUR_FIRM_ID_HERE';
  UPDATE accounts SET firm_id = 'YOUR_FIRM_ID_HERE';
  -- ... etc for all tables
  ```

- [ ] Run `08_configure_multi_tenant_rls.sql`
  - Creates: Multi-tenant RLS policies
  - Verify: `SELECT COUNT(*) FROM pg_policies WHERE tablename = 'clients';`

#### 5. User Profiles & RBAC (Required)
- [ ] Run `12_create_user_profiles_and_rbac.sql`
  - Creates: user_profiles, permissions, role_permissions, audit_logs
  - Verify: `SELECT * FROM permissions;`
  - Verify: `SELECT DISTINCT role FROM role_permissions;`

- [ ] Run `13_fix_rls_with_user_profiles.sql`
  - Updates: auth.user_firm_id() to use user_profiles
  - Verify: `SELECT proname FROM pg_proc WHERE proname = 'get_user_firm_id';`

- [ ] Run `14_allow_user_profile_self_insert.sql`
  - Allows: Users to create profile on first login
  - Verify: `SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles';`

#### 6. First User Setup
- [ ] Log in via Google OAuth (first time)
- [ ] Verify user_profile was created:
  ```sql
  SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 1;
  ```

- [ ] **Important:** Make first user an admin
  ```sql
  UPDATE user_profiles
  SET role = 'admin'
  WHERE email = 'your-email@yourfirm.com';
  ```

#### 7. Verify Setup
- [ ] Check migration status:
  ```sql
  SELECT * FROM migration_status ORDER BY version::integer;
  ```

- [ ] Should see migrations: 00, 01, 02, 03, 04, (05), 06, 07, 08, 12, 13, 14

- [ ] Test RLS isolation:
  ```sql
  -- Should return your firm_id
  SELECT get_user_firm_id();

  -- Should only return your firm's data
  SELECT COUNT(*) FROM clients WHERE firm_id = get_user_firm_id();
  ```

- [ ] Test permissions:
  ```sql
  -- Check your role
  SELECT role FROM user_profiles WHERE id = auth.uid();

  -- Check your permissions
  SELECT p.name
  FROM permissions p
  JOIN role_permissions rp ON rp.permission_id = p.id
  WHERE rp.role = (SELECT role FROM user_profiles WHERE id = auth.uid());
  ```

## Existing Database Verification

If you have an existing database and want to verify it's up to date:

### Quick Health Check
```sql
-- 1. Check migration tracker exists
SELECT * FROM schema_migrations ORDER BY version::integer;

-- 2. Check latest migration
SELECT latest_migration_version();

-- 3. Check for missing migrations
-- Should return: 00, 01, 02, 03, 04, 06, 07, 08, 12, 13, 14 (minimum)
SELECT version FROM migration_status ORDER BY version::integer;

-- 4. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Check you have user_profiles table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 6. Test your access
SELECT
  auth.uid() as my_user_id,
  get_user_firm_id() as my_firm_id,
  (SELECT role FROM user_profiles WHERE id = auth.uid()) as my_role;
```

### Common Issues

#### Issue: "relation schema_migrations does not exist"
**Solution:** Run `00_migration_tracker.sql` first

#### Issue: "function auth.user_firm_id() does not exist"
**Solution:** Run `08_configure_multi_tenant_rls.sql`

#### Issue: "function get_user_firm_id() does not exist"
**Solution:** Run `13_fix_rls_with_user_profiles.sql`

#### Issue: RLS is blocking all queries
**Solutions:**
1. Check if you're logged in: `SELECT auth.uid();`
2. Check if you have a user_profile: `SELECT * FROM user_profiles WHERE id = auth.uid();`
3. Check if your profile has a firm_id: `SELECT firm_id FROM user_profiles WHERE id = auth.uid();`
4. Verify the firm exists: `SELECT * FROM firms WHERE id = (SELECT firm_id FROM user_profiles WHERE id = auth.uid());`

#### Issue: Can't insert user_profile on first login
**Solution:** Run `14_allow_user_profile_self_insert.sql`

## Production Deployment Checklist

Before deploying to production:

- [ ] Remove sample data (if migration 05 was run)
  ```sql
  -- Only if you ran 05_insert_sample_data.sql
  DELETE FROM fee_calculations;
  DELETE FROM billing_periods;
  DELETE FROM positions;
  DELETE FROM accounts;
  DELETE FROM clients;
  DELETE FROM households;
  DELETE FROM relationships;
  DELETE FROM master_accounts;
  ```

- [ ] Remove anon access from RLS policies
  - Edit `08_configure_multi_tenant_rls.sql`
  - Remove all `OR auth.role() = 'anon'` clauses
  - Re-run the migration after deleting its record:
    ```sql
    DELETE FROM schema_migrations WHERE version = '08';
    -- Then re-run 08_configure_multi_tenant_rls.sql
    ```

- [ ] Verify firm domains match OAuth configuration
  ```sql
  SELECT firm_name, firm_domain FROM firms;
  ```

- [ ] Create backup before migration
  ```bash
  # Using Supabase CLI
  supabase db dump -f backup-$(date +%Y%m%d).sql
  ```

- [ ] Test with multiple users from different firms
  - Verify data isolation
  - Verify permissions work correctly

- [ ] Set up monitoring/alerting for RLS policy violations

## Rollback Procedures

If you need to rollback a migration:

1. **Identify the problem migration:**
   ```sql
   SELECT * FROM migration_status ORDER BY applied_at DESC LIMIT 5;
   ```

2. **Manual rollback** (no automatic rollback - SQL changes are immediate)
   - Review the migration file
   - Manually write and execute reverse operations
   - Example: If migration added a table, drop it

3. **Remove from migration tracker:**
   ```sql
   DELETE FROM schema_migrations WHERE version = '08';
   ```

4. **Re-run corrected migration**

## Support Resources

- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL Policies:** https://www.postgresql.org/docs/current/sql-createpolicy.html
- **Database README:** See `README.md` in this directory
- **Migration Files:** Each file has detailed comments explaining what it does

## Notes

- ⚠️ Migrations are **not automatically reversible** - changes are immediate
- ✅ All migration files are **idempotent** - safe to re-run
- 📝 Always test migrations on a development database first
- 🔒 Never disable RLS in production without understanding the security implications
- 🏷️ Use the migration tracker to maintain consistency across environments

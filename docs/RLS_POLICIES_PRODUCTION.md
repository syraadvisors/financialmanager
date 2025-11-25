# Row Level Security (RLS) Policies - Production Readiness Guide

## Overview

This document outlines the current RLS policies and what needs to be reviewed/updated before production deployment.

## Current Status

### Development Bypasses

✅ **RESOLVED**: Migration `39_remove_dev_rls_bypasses.sql` removes every
`OR auth.role() = 'anon'` clause that previously existed for development
convenience. All tenant tables now rely on explicit joins to
`user_profiles` to confirm the authenticated user's firm.

```sql
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
      AND up.firm_id = firm_id
  )
);
```

### Tables Updated

The following tables had their policies recreated without the anonymous bypass:

1. `relationships`
2. `master_accounts`
3. `households`
4. `clients`
5. `accounts`
6. `positions`
7. `fee_schedules`
8. `billing_periods`
9. `fee_calculations`
10. `balance_history`

> `imported_balance_data` and `imported_positions_data` already enforced firm
> isolation via `user_profiles` checks and did not require changes.

## Production Checklist

### Before Production Deployment

1. **Ensure Migration 39 Has Been Applied**
   - Run the SQL in `database/39_remove_dev_rls_bypasses.sql`
   - Verify no policies still contain `auth.role() = 'anon'`

2. **Verify User Profile Data**
   - Ensure every authenticated user has a `user_profiles` row
   - Confirm `user_profiles.firm_id` is populated correctly
   - Test with multiple users from different firms

3. **Test RLS Policies**
   - Create test users in different firms
   - Verify they can only see their own firm's data
   - Verify they cannot access other firms' data
   - Test all CRUD operations

4. **Review Service Role Access**
   - Service role bypasses RLS (by design)
   - Ensure service role key is **never** exposed to client
   - Only use service role in server-side code or Supabase Edge Functions

## Policy Structure

### Standard Pattern

Each data table should have 4 policies:

1. **SELECT** - Users can view their firm's data
2. **INSERT** - Users can insert data for their firm
3. **UPDATE** - Users can update their firm's data
4. **DELETE** - Users can delete their firm's data

### Example (Production-Ready)

```sql
-- SELECT Policy
CREATE POLICY "Users can view their firm's clients"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.firm_id = firm_id
    )
  );

-- INSERT Policy
CREATE POLICY "Users can insert clients for their firm"
  ON clients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.firm_id = firm_id
    )
  );

-- UPDATE Policy
CREATE POLICY "Users can update their firm's clients"
  ON clients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.firm_id = firm_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.firm_id = firm_id
    )
  );

-- DELETE Policy
CREATE POLICY "Users can delete their firm's clients"
  ON clients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.firm_id = firm_id
    )
  );
```

## Special Cases

### Firms Table

The `firms` table is publicly readable to support OAuth domain validation:

```sql
-- This is safe - firms table contains no sensitive data
CREATE POLICY "Firms are publicly readable"
  ON firms FOR SELECT
  USING (true);
```

### User Profiles Table

User profiles have special RLS policies:
- Users can read their own profile
- Users can update their own profile (limited fields)
- Admins can read/update all profiles in their firm

### Audit Logs

Audit logs are read-only for regular users:
- Users can only read audit logs for their firm
- Only service role can insert audit logs

## Migration Script

Create a migration script to remove development bypasses:

```sql
-- Migration: Remove development RLS bypasses
-- Run this before production deployment

-- Update all SELECT policies
DO $$
DECLARE
  table_name TEXT;
  policy_name TEXT;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'relationships', 'master_accounts', 'households', 'clients',
      'accounts', 'positions', 'fee_schedules', 'billing_periods',
      'fee_calculations', 'balance_history', 'imported_balance_data',
      'imported_positions_data'
    )
  LOOP
    -- Drop existing policies
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
    END LOOP;
    
    -- Recreate policies without anon bypass
    -- (Implementation depends on specific table structure)
  END LOOP;
END $$;
```

## Testing RLS Policies

### Test Script

```sql
-- Test as user from Firm A
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'user-a-id';
-- Should only see Firm A data

-- Test as user from Firm B
SET LOCAL request.jwt.claim.sub TO 'user-b-id';
-- Should only see Firm B data

-- Test as anonymous
SET LOCAL role TO anon;
-- Should see NO data (after removing bypasses)
```

## Security Best Practices

1. **Never disable RLS** in production
2. **Remove all development bypasses** before deployment
3. **Test data isolation** thoroughly
4. **Monitor for unauthorized access** attempts
5. **Keep service role key secure** (never in client code)
6. **Use least privilege principle** - only grant necessary permissions

## Monitoring

After deployment, monitor:
- Failed RLS policy checks (in Supabase logs)
- Unusual access patterns
- Cross-firm data access attempts

## Rollback Plan

If RLS policies cause issues:
1. Temporarily add back anon bypass (NOT recommended)
2. Verify `user_profiles` contains the correct firm assignments
3. Verify user_profiles table has correct firm_id
4. Review Supabase logs for specific errors

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- Migration files: `database/08_configure_multi_tenant_rls.sql`
- User profiles migration: `database/13_fix_rls_with_user_profiles.sql`



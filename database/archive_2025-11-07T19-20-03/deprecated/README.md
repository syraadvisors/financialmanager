# Deprecated Migration Files

⚠️ **DO NOT RUN THESE FILES** ⚠️

These migration files have been **consolidated** into `08_configure_multi_tenant_rls.sql` and are kept here for historical reference only.

## Why These Were Deprecated

During development, migrations 08-11 evolved iteratively as we refined the multi-tenant Row Level Security (RLS) implementation:

1. **08_update_rls_for_multi_tenant.sql** - Initial attempt at multi-tenant RLS using JWT metadata
2. **08_dev_temporary_rls.sql** - Development workaround with hardcoded firm_id
3. **09_fix_anon_access.sql** - Added temporary anonymous access policies for development
4. **10_fix_firms_rls_for_oauth.sql** - Made firms table publicly readable for OAuth domain validation
5. **11_simplified_firms_rls.sql** - Further simplified firms table policies

These represented an evolutionary process as we discovered requirements and refined the implementation.

## What Replaced Them

All functionality from these files has been consolidated into:

**`../08_configure_multi_tenant_rls.sql`**

This consolidated file:
- ✅ Creates the `auth.user_firm_id()` helper function
- ✅ Drops all old/conflicting policies
- ✅ Creates firm-scoped RLS policies for all data tables
- ✅ Includes `OR auth.role() = 'anon'` for development (to be removed in production)
- ✅ Configures firms table RLS for OAuth domain validation
- ✅ Is idempotent (safe to re-run)
- ✅ Includes proper documentation and comments

## Migration History Timeline

```
October 6-7, 2025:
├── 08_update_rls_for_multi_tenant.sql (Created)
├── 08_dev_temporary_rls.sql (Workaround added)
├── 09_fix_anon_access.sql (Anon access fix)
├── 10_fix_firms_rls_for_oauth.sql (OAuth domain fix)
└── 11_simplified_firms_rls.sql (Simplified version)

October 12, 2025:
└── All consolidated into 08_configure_multi_tenant_rls.sql ✅
```

## If You've Already Applied These

If you've already run some or all of these deprecated files in your database, that's okay! The new `08_configure_multi_tenant_rls.sql` file is designed to:

1. Drop any existing policies created by these files
2. Create fresh, consistent policies
3. Work regardless of which old migrations were applied

The migration tracker (`00_migration_tracker.sql`) will record that migration 08 has been applied, preventing duplicate runs.

## Reference Only

These files are kept for:
- Historical documentation
- Understanding the evolution of the RLS implementation
- Reference if you need to understand why certain decisions were made
- Debugging if you encounter issues related to old policies

## Clean Database Setup

For a **fresh database**, follow this sequence:

1. Run `00_migration_tracker.sql` first
2. Run migrations 01-07 in order
3. Run `08_configure_multi_tenant_rls.sql` (the new consolidated version)
4. Skip everything in this deprecated folder
5. Continue with migrations 12-14

See the main `../README.md` for complete migration documentation.

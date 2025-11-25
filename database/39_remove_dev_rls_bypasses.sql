-- =====================================================
-- Migration 39: Remove development RLS bypasses
-- =====================================================
-- This migration removes the temporary "OR auth.role() = 'anon'"
-- clauses that were added during development. All tenant-scoped
-- tables now rely exclusively on auth.user_firm_id() for access
-- control so that anonymous users cannot read or mutate data.
-- =====================================================

BEGIN;

-- Helper macro: drop a policy if it exists so we can recreate it
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'relationships',
        'master_accounts',
        'households',
        'clients',
        'accounts',
        'positions',
        'fee_schedules',
        'billing_periods',
        'fee_calculations',
        'balance_history'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, policy_record.tablename);
  END LOOP;
END $$;

-- =====================================================
-- Recreate policies without anon or helper function dependencies
-- =====================================================
DO $$
DECLARE
  table_name text;
  readable_name text;
  condition text := 'EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.firm_id = firm_id)';
BEGIN
  FOR table_name IN
    SELECT unnest(ARRAY[
      'relationships',
      'master_accounts',
      'households',
      'clients',
      'accounts',
      'positions',
      'fee_schedules',
      'billing_periods',
      'fee_calculations',
      'balance_history'
    ])
  LOOP
    readable_name := replace(table_name, '_', ' ');

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (%s);',
      format('Users can view their firm''s %s', readable_name),
      table_name,
      condition
    );

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (%s);',
      format('Users can insert %s for their firm', readable_name),
      table_name,
      condition
    );

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE USING (%s) WITH CHECK (%s);',
      format('Users can update their firm''s %s', readable_name),
      table_name,
      condition,
      condition
    );

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE USING (%s);',
      format('Users can delete their firm''s %s', readable_name),
      table_name,
      condition
    );
  END LOOP;
END $$;

COMMIT;

-- =====================================================
-- Verification helper
-- =====================================================
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'relationships',
    'master_accounts',
    'households',
    'clients',
    'accounts',
    'positions',
    'fee_schedules',
    'billing_periods',
    'fee_calculations',
    'balance_history'
  )
ORDER BY tablename, policyname, cmd;


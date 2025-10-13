-- =====================================================
-- Database Migration Tracking System
-- =====================================================
-- This creates a table to track which migrations have been applied
-- Run this FIRST before running any other migration scripts
--
-- Migration: 00
-- Description: Create migration tracking system
-- Dependencies: None
-- Date: 2025-10-12
-- =====================================================

-- =====================================================
-- Step 1: Enable UUID extension if not already enabled
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Step 2: Create schema_migrations table
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  execution_time_ms INTEGER,
  checksum TEXT,

  CONSTRAINT valid_version CHECK (version ~ '^\d{2,}$')
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at DESC);

COMMENT ON TABLE schema_migrations IS 'Tracks database migrations that have been applied';
COMMENT ON COLUMN schema_migrations.version IS 'Migration version number (e.g., ''01'', ''02'', ''12'')';
COMMENT ON COLUMN schema_migrations.name IS 'Short name of the migration (e.g., ''create_tables'')';
COMMENT ON COLUMN schema_migrations.description IS 'Detailed description of what the migration does';
COMMENT ON COLUMN schema_migrations.applied_at IS 'Timestamp when the migration was applied';
COMMENT ON COLUMN schema_migrations.execution_time_ms IS 'How long the migration took to run (milliseconds)';
COMMENT ON COLUMN schema_migrations.checksum IS 'Optional checksum to verify migration file integrity';

-- =====================================================
-- Step 3: Create helper functions
-- =====================================================

-- Function to check if a migration has been applied
CREATE OR REPLACE FUNCTION migration_applied(migration_version TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM schema_migrations WHERE version = migration_version
  );
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION migration_applied IS 'Check if a specific migration version has been applied';

-- Function to get the latest migration version
CREATE OR REPLACE FUNCTION latest_migration_version()
RETURNS TEXT AS $$
  SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION latest_migration_version IS 'Get the most recently applied migration version';

-- Function to record a migration
CREATE OR REPLACE FUNCTION record_migration(
  p_version TEXT,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_execution_time_ms INTEGER DEFAULT NULL,
  p_checksum TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO schema_migrations (version, name, description, execution_time_ms, checksum)
  VALUES (p_version, p_name, p_description, p_execution_time_ms, p_checksum)
  ON CONFLICT (version) DO NOTHING;

  RAISE NOTICE 'Migration % (%) recorded successfully', p_version, p_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_migration IS 'Record that a migration has been successfully applied';

-- =====================================================
-- Step 4: Insert existing migrations (if not already tracked)
-- =====================================================

-- Record this migration itself
SELECT record_migration('00', 'migration_tracker', 'Create migration tracking system');

-- Record existing migrations that have likely been applied
-- Adjust these based on what's actually in your database
DO $$
BEGIN
  -- Only record these if the tables exist
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
    PERFORM record_migration('01', 'create_tables', 'Create initial database tables');
  END IF;

  IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_clients_firm_id') THEN
    PERFORM record_migration('02', 'create_indexes', 'Create database indexes for performance');
  END IF;

  IF EXISTS (SELECT FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    PERFORM record_migration('03', 'create_functions_triggers', 'Create helper functions and triggers');
  END IF;

  IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'clients') THEN
    PERFORM record_migration('04', 'enable_rls', 'Enable Row Level Security on tables');
  END IF;

  -- Check for sample data (look for a known test record)
  IF EXISTS (SELECT FROM clients LIMIT 1) THEN
    PERFORM record_migration('05', 'insert_sample_data', 'Insert sample/test data');
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'firms') THEN
    PERFORM record_migration('06', 'create_firms_table', 'Create firms table for multi-tenancy');
  END IF;

  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'firm_id'
  ) THEN
    PERFORM record_migration('07', 'add_firm_id_to_tables', 'Add firm_id column to all tables');
  END IF;

  -- Check if RLS policies have been configured
  IF EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'clients' AND policyname LIKE '%firm%'
  ) THEN
    PERFORM record_migration('08', 'configure_multi_tenant_rls', 'Configure multi-tenant RLS policies');
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    PERFORM record_migration('12', 'create_user_profiles_and_rbac', 'Create user profiles and RBAC system');
  END IF;

  IF EXISTS (SELECT FROM pg_proc WHERE proname = 'get_user_firm_id') THEN
    PERFORM record_migration('13', 'fix_rls_with_user_profiles', 'Update RLS to use user_profiles table');
  END IF;

  IF EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    PERFORM record_migration('14', 'allow_user_profile_self_insert', 'Allow users to create their own profile');
  END IF;
END $$;

-- =====================================================
-- Step 5: Create view for migration status
-- =====================================================

CREATE OR REPLACE VIEW migration_status AS
SELECT
  version,
  name,
  description,
  applied_at,
  execution_time_ms,
  CASE
    WHEN execution_time_ms IS NOT NULL THEN
      ROUND(execution_time_ms::numeric / 1000, 2) || 's'
    ELSE 'N/A'
  END as execution_time,
  AGE(NOW(), applied_at) as time_since_applied
FROM schema_migrations
ORDER BY version::integer;

COMMENT ON VIEW migration_status IS 'Human-readable view of migration status';

-- =====================================================
-- Success Message
-- =====================================================
DO $$
DECLARE
  migration_count INTEGER;
  latest_version TEXT;
BEGIN
  SELECT COUNT(*), COALESCE(MAX(version), 'none')
  INTO migration_count, latest_version
  FROM schema_migrations;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Tracker initialized successfully!';
  RAISE NOTICE 'Migrations tracked: %', migration_count;
  RAISE NOTICE 'Latest version: %', latest_version;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'View current status: SELECT * FROM migration_status;';
  RAISE NOTICE 'Check if applied: SELECT migration_applied(''01'');';
  RAISE NOTICE 'Latest version: SELECT latest_migration_version();';
END $$;

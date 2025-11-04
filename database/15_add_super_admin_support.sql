-- =====================================================
-- Super Admin Support
-- =====================================================
-- This migration adds support for super-admin users who can:
-- 1. Access all firms and data across the system
-- 2. Manage users across all firms
-- 3. Impersonate other users for troubleshooting
-- 4. Create and manage other super-admins
-- =====================================================

-- =====================================================
-- 1. Update User Profiles to Support Super Admin Role
-- =====================================================

-- Drop existing role constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS valid_role;

-- Add super_admin to valid roles
ALTER TABLE user_profiles ADD CONSTRAINT valid_role
  CHECK (role IN ('super_admin', 'admin', 'user', 'viewer'));

-- Make firm_id nullable for super admins (they don't belong to a specific firm)
ALTER TABLE user_profiles ALTER COLUMN firm_id DROP NOT NULL;

-- Add index for super admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_super_admin ON user_profiles(role) WHERE role = 'super_admin';

-- =====================================================
-- 2. Add Super Admin Permissions
-- =====================================================

INSERT INTO permissions (name, description, category) VALUES
  ('super_admin.access', 'Access super admin dashboard', 'super_admin'),
  ('super_admin.impersonate', 'Impersonate other users', 'super_admin'),
  ('super_admin.manage_firms', 'Manage all firms', 'super_admin'),
  ('super_admin.manage_super_admins', 'Create and manage super admins', 'super_admin'),
  ('super_admin.view_all_data', 'View data across all firms', 'super_admin')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to super_admin role
INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin', id FROM permissions
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. Create Impersonation Sessions Table
-- =====================================================

CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,

  -- Super admin who is impersonating
  super_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  super_admin_email TEXT NOT NULL,

  -- User being impersonated
  impersonated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  impersonated_user_email TEXT NOT NULL,
  impersonated_user_firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,

  -- Session metadata
  reason TEXT,
  ip_address INET,
  user_agent TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  CONSTRAINT impersonation_active_check
    CHECK ((is_active = true AND ended_at IS NULL) OR (is_active = false AND ended_at IS NOT NULL))
);

-- Indexes
CREATE INDEX idx_impersonation_sessions_super_admin ON impersonation_sessions(super_admin_id);
CREATE INDEX idx_impersonation_sessions_impersonated_user ON impersonation_sessions(impersonated_user_id);
CREATE INDEX idx_impersonation_sessions_active ON impersonation_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_impersonation_sessions_created_at ON impersonation_sessions(created_at DESC);

-- =====================================================
-- 4. Update RLS Policies for Super Admin Access
-- =====================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can insert any profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON audit_logs;

-- Super admins can view ALL user profiles across all firms
CREATE POLICY "Super admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Super admins can update ANY user profile
CREATE POLICY "Super admins can update any profile"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Super admins can insert user profiles for any firm
CREATE POLICY "Super admins can insert any profile"
  ON user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Super admins can view ALL audit logs
CREATE POLICY "Super admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Impersonation sessions policies
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Super admins can view all impersonation sessions
CREATE POLICY "Super admins can view impersonation sessions"
  ON impersonation_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Super admins can create impersonation sessions
CREATE POLICY "Super admins can create impersonation sessions"
  ON impersonation_sessions FOR INSERT
  WITH CHECK (
    super_admin_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Super admins can update their own impersonation sessions
CREATE POLICY "Super admins can update their impersonation sessions"
  ON impersonation_sessions FOR UPDATE
  USING (
    super_admin_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    super_admin_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- =====================================================
-- 5. Update Existing RLS Policies to Support Super Admins
-- =====================================================

-- For each main data table, add super admin access
-- We'll create helper functions to simplify this

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Update existing policies by adding super admin bypass
-- For clients table
DROP POLICY IF EXISTS "Super admins can view all clients" ON clients;
CREATE POLICY "Super admins can view all clients"
  ON clients FOR SELECT
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can manage all clients" ON clients;
CREATE POLICY "Super admins can manage all clients"
  ON clients FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- For accounts table
DROP POLICY IF EXISTS "Super admins can view all accounts" ON accounts;
CREATE POLICY "Super admins can view all accounts"
  ON accounts FOR SELECT
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can manage all accounts" ON accounts;
CREATE POLICY "Super admins can manage all accounts"
  ON accounts FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- For fee_schedules table
DROP POLICY IF EXISTS "Super admins can view all fee_schedules" ON fee_schedules;
CREATE POLICY "Super admins can view all fee_schedules"
  ON fee_schedules FOR SELECT
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can manage all fee_schedules" ON fee_schedules;
CREATE POLICY "Super admins can manage all fee_schedules"
  ON fee_schedules FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- For billing_periods table
DROP POLICY IF EXISTS "Super admins can view all billing_periods" ON billing_periods;
CREATE POLICY "Super admins can view all billing_periods"
  ON billing_periods FOR SELECT
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can manage all billing_periods" ON billing_periods;
CREATE POLICY "Super admins can manage all billing_periods"
  ON billing_periods FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- For fee_calculations table
DROP POLICY IF EXISTS "Super admins can view all fee_calculations" ON fee_calculations;
CREATE POLICY "Super admins can view all fee_calculations"
  ON fee_calculations FOR SELECT
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can manage all fee_calculations" ON fee_calculations;
CREATE POLICY "Super admins can manage all fee_calculations"
  ON fee_calculations FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- For firms table
DROP POLICY IF EXISTS "Super admins can view all firms" ON firms;
CREATE POLICY "Super admins can view all firms"
  ON firms FOR SELECT
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can manage all firms" ON firms;
CREATE POLICY "Super admins can manage all firms"
  ON firms FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- =====================================================
-- 6. Helper Functions for Super Admin Operations
-- =====================================================

-- Function to check if a user is a super admin
CREATE OR REPLACE FUNCTION check_is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND role = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Function to get active impersonation session
CREATE OR REPLACE FUNCTION get_active_impersonation_session()
RETURNS TABLE (
  id UUID,
  super_admin_id UUID,
  super_admin_email TEXT,
  impersonated_user_id UUID,
  impersonated_user_email TEXT,
  impersonated_user_firm_id UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  reason TEXT
) AS $$
  SELECT
    id,
    super_admin_id,
    super_admin_email,
    impersonated_user_id,
    impersonated_user_email,
    impersonated_user_firm_id,
    created_at as started_at,
    reason
  FROM impersonation_sessions
  WHERE super_admin_id = auth.uid()
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Function to start impersonation
CREATE OR REPLACE FUNCTION start_impersonation(
  target_user_id UUID,
  impersonation_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
  super_admin_email_var TEXT;
  target_email_var TEXT;
  target_firm_id_var UUID;
BEGIN
  -- Check if caller is super admin
  IF NOT check_is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can impersonate users';
  END IF;

  -- End any existing active impersonation sessions
  UPDATE impersonation_sessions
  SET is_active = false, ended_at = NOW()
  WHERE super_admin_id = auth.uid() AND is_active = true;

  -- Get super admin email
  SELECT email INTO super_admin_email_var
  FROM user_profiles WHERE id = auth.uid();

  -- Get target user info
  SELECT email, firm_id
  INTO target_email_var, target_firm_id_var
  FROM user_profiles WHERE id = target_user_id;

  IF target_email_var IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  -- Create new impersonation session
  INSERT INTO impersonation_sessions (
    super_admin_id,
    super_admin_email,
    impersonated_user_id,
    impersonated_user_email,
    impersonated_user_firm_id,
    reason,
    is_active
  ) VALUES (
    auth.uid(),
    super_admin_email_var,
    target_user_id,
    target_email_var,
    target_firm_id_var,
    impersonation_reason,
    true
  ) RETURNING id INTO session_id;

  -- Log the impersonation start
  INSERT INTO audit_logs (
    user_id,
    firm_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    target_firm_id_var,
    'super_admin.impersonate.start',
    'user',
    target_user_id::TEXT,
    jsonb_build_object(
      'superAdminId', auth.uid(),
      'superAdminEmail', super_admin_email_var,
      'targetUserId', target_user_id,
      'targetUserEmail', target_email_var,
      'targetFirmId', target_firm_id_var,
      'reason', impersonation_reason
    )
  );

  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Function to end impersonation
CREATE OR REPLACE FUNCTION end_impersonation()
RETURNS BOOLEAN AS $$
DECLARE
  session_record RECORD;
BEGIN
  -- Check if caller is super admin
  IF NOT check_is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can end impersonation';
  END IF;

  -- Get active session
  SELECT * INTO session_record
  FROM impersonation_sessions
  WHERE super_admin_id = auth.uid() AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF session_record.id IS NULL THEN
    RETURN false; -- No active session
  END IF;

  -- End the session
  UPDATE impersonation_sessions
  SET is_active = false, ended_at = NOW()
  WHERE id = session_record.id;

  -- Log the impersonation end
  INSERT INTO audit_logs (
    user_id,
    firm_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    session_record.impersonated_user_firm_id,
    'super_admin.impersonate.end',
    'user',
    session_record.impersonated_user_id::TEXT,
    jsonb_build_object(
      'superAdminId', auth.uid(),
      'superAdminEmail', session_record.super_admin_email,
      'targetUserId', session_record.impersonated_user_id,
      'targetUserEmail', session_record.impersonated_user_email,
      'targetFirmId', session_record.impersonated_user_firm_id,
      'duration', EXTRACT(EPOCH FROM (NOW() - session_record.created_at))
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public;

-- =====================================================
-- 7. Create First Super Admin
-- =====================================================

-- To create your first super admin, run this after your first login:
-- UPDATE user_profiles
-- SET role = 'super_admin', firm_id = NULL
-- WHERE email = 'your-email@domain.com';

-- Note: This will be documented in the setup guide

-- =====================================================
-- 8. Add Comments for Documentation
-- =====================================================

COMMENT ON TABLE impersonation_sessions IS
  'Tracks super admin impersonation sessions for auditing and security';

COMMENT ON FUNCTION is_super_admin() IS
  'Returns true if the current user is a super admin';

COMMENT ON FUNCTION start_impersonation(UUID, TEXT) IS
  'Starts an impersonation session for a super admin to view as another user';

COMMENT ON FUNCTION end_impersonation() IS
  'Ends the current active impersonation session';

COMMENT ON FUNCTION check_is_super_admin(UUID) IS
  'Checks if a specific user ID is a super admin';

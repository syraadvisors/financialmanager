-- =====================================================
-- Complete Super Admin Fix
-- Run this in Supabase SQL Editor to fix all constraints
-- =====================================================

-- 1. Fix user_profiles table constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE user_profiles ADD CONSTRAINT valid_role
  CHECK (role IN ('super_admin', 'admin', 'user', 'viewer'));

-- 2. Fix role_permissions table constraint
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE role_permissions ADD CONSTRAINT valid_role
  CHECK (role IN ('super_admin', 'admin', 'user', 'viewer'));

-- 3. Make firm_id nullable for super admins
ALTER TABLE user_profiles ALTER COLUMN firm_id DROP NOT NULL;

-- 4. Add index for super admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_super_admin
  ON user_profiles(role) WHERE role = 'super_admin';

-- 5. Add super admin permissions
INSERT INTO permissions (name, description, category) VALUES
  ('super_admin.access', 'Access super admin dashboard', 'super_admin'),
  ('super_admin.impersonate', 'Impersonate other users', 'super_admin'),
  ('super_admin.manage_firms', 'Manage all firms', 'super_admin'),
  ('super_admin.manage_super_admins', 'Create and manage super admins', 'super_admin'),
  ('super_admin.view_all_data', 'View data across all firms', 'super_admin')
ON CONFLICT (name) DO NOTHING;

-- 6. Assign all permissions to super_admin role
INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin', id FROM permissions
ON CONFLICT DO NOTHING;

-- 7. Create impersonation_sessions table
CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  super_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  super_admin_email TEXT NOT NULL,
  impersonated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  impersonated_user_email TEXT NOT NULL,
  impersonated_user_firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT impersonation_active_check
    CHECK ((is_active = true AND ended_at IS NULL) OR (is_active = false AND ended_at IS NOT NULL))
);

-- 8. Create indexes for impersonation_sessions
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_super_admin
  ON impersonation_sessions(super_admin_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_impersonated_user
  ON impersonation_sessions(impersonated_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_active
  ON impersonation_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_created_at
  ON impersonation_sessions(created_at DESC);

-- 9. Enable RLS on impersonation_sessions
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- 10. Create helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 11. Create helper function with user_id parameter
CREATE OR REPLACE FUNCTION check_is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND role = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 12. Create RLS policies for super admins on user_profiles
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
CREATE POLICY "Super admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can update any profile" ON user_profiles;
CREATE POLICY "Super admins can update any profile"
  ON user_profiles FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can insert any profile" ON user_profiles;
CREATE POLICY "Super admins can insert any profile"
  ON user_profiles FOR INSERT
  WITH CHECK (is_super_admin());

-- 13. Create RLS policies for super admins on impersonation_sessions
DROP POLICY IF EXISTS "Super admins can view impersonation sessions" ON impersonation_sessions;
CREATE POLICY "Super admins can view impersonation sessions"
  ON impersonation_sessions FOR SELECT
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can create impersonation sessions" ON impersonation_sessions;
CREATE POLICY "Super admins can create impersonation sessions"
  ON impersonation_sessions FOR INSERT
  WITH CHECK (super_admin_id = auth.uid() AND is_super_admin());

DROP POLICY IF EXISTS "Super admins can update their impersonation sessions" ON impersonation_sessions;
CREATE POLICY "Super admins can update their impersonation sessions"
  ON impersonation_sessions FOR UPDATE
  USING (super_admin_id = auth.uid() AND is_super_admin())
  WITH CHECK (super_admin_id = auth.uid() AND is_super_admin());

-- 14. Create function to get active impersonation session
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
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 15. Create function to start impersonation
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
  IF NOT check_is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can impersonate users';
  END IF;

  UPDATE impersonation_sessions
  SET is_active = false, ended_at = NOW()
  WHERE super_admin_id = auth.uid() AND is_active = true;

  SELECT email INTO super_admin_email_var
  FROM user_profiles WHERE id = auth.uid();

  SELECT email, firm_id
  INTO target_email_var, target_firm_id_var
  FROM user_profiles WHERE id = target_user_id;

  IF target_email_var IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Create function to end impersonation
CREATE OR REPLACE FUNCTION end_impersonation()
RETURNS BOOLEAN AS $$
DECLARE
  session_record RECORD;
BEGIN
  IF NOT check_is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can end impersonation';
  END IF;

  SELECT * INTO session_record
  FROM impersonation_sessions
  WHERE super_admin_id = auth.uid() AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF session_record.id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE impersonation_sessions
  SET is_active = false, ended_at = NOW()
  WHERE id = session_record.id;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Add super admin policies for main tables
DROP POLICY IF EXISTS "Super admins can view all firms" ON firms;
CREATE POLICY "Super admins can view all firms"
  ON firms FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can manage all firms" ON firms;
CREATE POLICY "Super admins can manage all firms"
  ON firms FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can view all audit logs" ON audit_logs;
CREATE POLICY "Super admins can view all audit logs"
  ON audit_logs FOR SELECT USING (is_super_admin());

-- 18. NOW promote your user to super admin
UPDATE user_profiles
SET role = 'super_admin', firm_id = NULL
WHERE email = 'kellen@syraadvisors.com';

-- 19. Verify it worked
SELECT id, email, role, firm_id, full_name, status
FROM user_profiles
WHERE email = 'kellen@syraadvisors.com';

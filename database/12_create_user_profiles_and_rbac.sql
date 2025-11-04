-- =====================================================
-- User Profiles and Role-Based Access Control (RBAC)
-- =====================================================

-- =====================================================
-- 1. User Profiles Table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic Info (from OAuth)
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- Profile Details
  job_title TEXT,
  department TEXT,
  phone_number TEXT,
  bio TEXT,

  -- Role and Status
  role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user', 'viewer'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'inactive'

  -- Preferences
  preferences JSONB DEFAULT '{
    "theme": "light",
    "notifications_enabled": true,
    "email_notifications": true,
    "language": "en",
    "timezone": "America/New_York",
    "remember_me": false
  }'::jsonb,

  -- Audit
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  mfa_enabled BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,

  CONSTRAINT valid_role CHECK (role IN ('admin', 'user', 'viewer')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'inactive'))
);

-- Indexes
CREATE INDEX idx_user_profiles_firm_id ON user_profiles(firm_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);

-- Trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. Permissions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT, -- 'clients', 'accounts', 'fees', 'settings', etc.

  CONSTRAINT valid_permission_name CHECK (name ~ '^[a-z_]+\.[a-z_]+$') -- e.g., 'clients.create'
);

-- Insert default permissions
INSERT INTO permissions (name, description, category) VALUES
  -- Client permissions
  ('clients.view', 'View clients', 'clients'),
  ('clients.create', 'Create new clients', 'clients'),
  ('clients.update', 'Update client information', 'clients'),
  ('clients.delete', 'Delete clients', 'clients'),

  -- Account permissions
  ('accounts.view', 'View accounts', 'accounts'),
  ('accounts.create', 'Create new accounts', 'accounts'),
  ('accounts.update', 'Update account information', 'accounts'),
  ('accounts.delete', 'Delete accounts', 'accounts'),

  -- Fee permissions
  ('fees.view', 'View fee schedules and calculations', 'fees'),
  ('fees.create', 'Create fee schedules', 'fees'),
  ('fees.update', 'Update fee schedules', 'fees'),
  ('fees.delete', 'Delete fee schedules', 'fees'),
  ('fees.calculate', 'Run fee calculations', 'fees'),

  -- Settings permissions
  ('settings.view', 'View firm settings', 'settings'),
  ('settings.update', 'Update firm settings', 'settings'),

  -- User management permissions
  ('users.view', 'View users', 'users'),
  ('users.create', 'Invite new users', 'users'),
  ('users.update', 'Update user roles and permissions', 'users'),
  ('users.delete', 'Remove users', 'users'),

  -- Data import permissions
  ('import.upload', 'Upload data files', 'import'),
  ('import.process', 'Process and import data', 'import')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 3. Role Permissions Junction Table
-- =====================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  role TEXT NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

  UNIQUE(role, permission_id),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'user', 'viewer'))
);

-- Assign permissions to roles
-- Admin: Full access
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions
ON CONFLICT DO NOTHING;

-- User: Most access except user management and settings
INSERT INTO role_permissions (role, permission_id)
SELECT 'user', id FROM permissions
WHERE category IN ('clients', 'accounts', 'fees', 'import')
  AND name NOT IN ('fees.delete', 'users.create', 'users.update', 'users.delete')
ON CONFLICT DO NOTHING;

-- Viewer: Read-only access
INSERT INTO role_permissions (role, permission_id)
SELECT 'viewer', id FROM permissions
WHERE name LIKE '%.view'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. Audit Log Table
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,

  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout'
  resource_type TEXT, -- 'client', 'account', 'fee_schedule', etc.
  resource_id TEXT,

  details JSONB, -- Additional context about the action
  ip_address INET,
  user_agent TEXT
);

-- Index for querying logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_firm_id ON audit_logs(firm_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- =====================================================
-- 5. RLS Policies
-- =====================================================

-- User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view profiles in their firm
CREATE POLICY "Users can view profiles in their firm"
  ON user_profiles FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update any profile in their firm
CREATE POLICY "Admins can update profiles in their firm"
  ON user_profiles FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert new users in their firm
CREATE POLICY "Admins can insert users in their firm"
  ON user_profiles FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Permissions and Role Permissions (read-only for all authenticated users)
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view permissions"
  ON permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view role permissions"
  ON role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs for their firm
CREATE POLICY "Admins can view audit logs for their firm"
  ON audit_logs FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert audit logs (service role)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 6. Helper Functions
-- =====================================================

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles up
    JOIN role_permissions rp ON rp.role = up.role
    JOIN permissions p ON p.id = rp.permission_id
    WHERE up.id = auth.uid()
      AND p.name = permission_name
      AND up.status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Function to get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Function to get user's firm_id
CREATE OR REPLACE FUNCTION get_user_firm_id()
RETURNS UUID AS $$
  SELECT firm_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Function to log user login
CREATE OR REPLACE FUNCTION log_user_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET
    last_login_at = NOW(),
    login_count = login_count + 1
  WHERE id = NEW.id;

  INSERT INTO audit_logs (user_id, firm_id, action, details)
  SELECT
    NEW.id,
    firm_id,
    'login',
    jsonb_build_object('email', email)
  FROM user_profiles
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Trigger to log logins (on auth.users table)
-- Note: This may require additional setup in Supabase
-- For now, we'll handle login tracking in the application code

-- =====================================================
-- 7. Create initial admin user (run after first OAuth login)
-- =====================================================

-- After your first Google OAuth login, run this to make yourself an admin:
-- UPDATE user_profiles SET role = 'admin' WHERE email = 'your-email@syraadvisors.com';

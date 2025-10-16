-- Promote a user to super admin
-- Usage: Replace the email address with the user you want to promote

-- Example: Promote a specific user
UPDATE user_profiles
SET
  role = 'super_admin',
  updated_at = NOW()
WHERE email = 'YOUR_EMAIL_HERE@example.com';

-- Verify the change
SELECT id, email, role, full_name, created_at
FROM user_profiles
WHERE role = 'super_admin';

-- Optional: Create an audit log entry
INSERT INTO audit_logs (user_id, action, resource_type, details, timestamp)
SELECT
  id,
  'user.role_changed',
  'user_profile',
  jsonb_build_object(
    'old_role', 'admin',
    'new_role', 'super_admin',
    'reason', 'Initial super admin setup'
  ),
  NOW()
FROM user_profiles
WHERE email = 'YOUR_EMAIL_HERE@example.com';

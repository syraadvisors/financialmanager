-- =====================================================
-- Manual Super Admin Update
-- =====================================================
-- This script manually updates the user profile to super_admin role
-- This is a workaround for the hanging database query issue
-- =====================================================

-- First, verify the user exists
DO $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_profiles
    WHERE id = 'a5d3fd07-b718-44aa-879c-d6979a13ab00'
  ) INTO user_exists;

  IF user_exists THEN
    RAISE NOTICE 'User found: a5d3fd07-b718-44aa-879c-d6979a13ab00';
  ELSE
    RAISE NOTICE 'WARNING: User NOT found!';
  END IF;
END $$;

-- Update the user to super_admin
UPDATE user_profiles
SET
  role = 'super_admin',
  firm_id = NULL,
  updated_at = NOW()
WHERE id = 'a5d3fd07-b718-44aa-879c-d6979a13ab00';

-- Verify the update
SELECT
  id,
  email,
  role,
  firm_id,
  status,
  full_name,
  updated_at
FROM user_profiles
WHERE id = 'a5d3fd07-b718-44aa-879c-d6979a13ab00';

-- Check if there are any active sessions for this user
SELECT
  id,
  super_admin_id,
  impersonated_user_id,
  is_active,
  created_at
FROM impersonation_sessions
WHERE super_admin_id = 'a5d3fd07-b718-44aa-879c-d6979a13ab00'
  OR impersonated_user_id = 'a5d3fd07-b718-44aa-879c-d6979a13ab00'
ORDER BY created_at DESC
LIMIT 5;

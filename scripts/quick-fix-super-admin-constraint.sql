-- Quick fix to allow super_admin role
-- Run this in Supabase SQL Editor

-- Drop existing role constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS valid_role;

-- Add super_admin to valid roles
ALTER TABLE user_profiles ADD CONSTRAINT valid_role
  CHECK (role IN ('super_admin', 'admin', 'user', 'viewer'));

-- Make firm_id nullable for super admins (they don't belong to a specific firm)
ALTER TABLE user_profiles ALTER COLUMN firm_id DROP NOT NULL;

-- Now you can promote your user to super admin
-- Replace YOUR_EMAIL with your actual email
UPDATE user_profiles
SET role = 'super_admin', firm_id = NULL
WHERE email = 'kellen@syraadvisors.com';

-- Verify it worked
SELECT id, email, role, firm_id, full_name
FROM user_profiles
WHERE email = 'kellen@syraadvisors.com';

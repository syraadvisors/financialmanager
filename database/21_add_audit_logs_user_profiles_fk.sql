-- =====================================================
-- Add Foreign Key Relationship: audit_logs -> user_profiles
-- =====================================================
-- This migration adds a foreign key constraint from audit_logs.user_id
-- to user_profiles.id so we can join and display user information

-- First, check if there are any orphaned records (user_ids not in user_profiles)
-- and set them to NULL
UPDATE audit_logs
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM user_profiles);

-- Drop the existing foreign key to auth.users if it exists
-- (we'll keep the relationship through user_profiles instead)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'audit_logs_user_id_fkey'
        AND table_name = 'audit_logs'
    ) THEN
        ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_user_id_fkey;
    END IF;
END $$;

-- Add the new foreign key constraint to user_profiles
-- This allows Supabase to automatically join user_profiles data when querying
ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES user_profiles(id)
ON DELETE SET NULL;

-- Add an index if it doesn't exist (should already exist from previous migration)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT audit_logs_user_id_fkey ON audit_logs IS
'Links audit logs to user profiles for displaying user information';

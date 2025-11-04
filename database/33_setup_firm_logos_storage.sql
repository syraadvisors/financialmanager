-- =====================================================
-- Setup Firm Logos Storage Bucket
-- =====================================================
-- This migration creates the storage bucket for firm logos
-- and sets up the necessary RLS policies

-- Create the firm-logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'firm-logos',
  'firm-logos',
  true, -- Public bucket so logos can be displayed
  2097152, -- 2MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Firm members can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Firm members can update their logos" ON storage.objects;
DROP POLICY IF EXISTS "Firm members can delete their logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view firm logos" ON storage.objects;

-- Allow authenticated users to upload logos to their firm's folder
CREATE POLICY "Firm members can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'firm-logos' AND
  auth.uid() IN (
    SELECT id
    FROM user_profiles
    WHERE firm_id = (storage.foldername(name))[1]::uuid
  )
);

-- Allow firm members to update their firm's logos
CREATE POLICY "Firm members can update their logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'firm-logos' AND
  auth.uid() IN (
    SELECT id
    FROM user_profiles
    WHERE firm_id = (storage.foldername(name))[1]::uuid
  )
);

-- Allow firm members to delete their firm's logos
CREATE POLICY "Firm members can delete their logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'firm-logos' AND
  auth.uid() IN (
    SELECT id
    FROM user_profiles
    WHERE firm_id = (storage.foldername(name))[1]::uuid
  )
);

-- Allow anyone to view firm logos (public access)
CREATE POLICY "Anyone can view firm logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'firm-logos');

-- Success message
SELECT 'SUCCESS! firm-logos storage bucket created with RLS policies' as message;

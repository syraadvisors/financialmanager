# Financial Manager - Setup Guide

## Supabase Configuration

### Storage Buckets

The application requires a Supabase storage bucket for user profile avatars.

#### Create the `user-assets` bucket:

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Configure the bucket:
   - **Name**: `user-assets`
   - **Public**: Yes (enable public access)
   - **File size limit**: 5 MB (optional but recommended)
   - **Allowed MIME types**: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`

5. Create the bucket

#### Set up bucket policies:

After creating the bucket, you need to set up RLS (Row Level Security) policies:

1. Go to **Storage** > **Policies**
2. Create the following policies for the `user-assets` bucket:

**Policy 1: Allow authenticated users to upload their own avatars**
```sql
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-assets'
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = (storage.filename(name))[1]
);
```

**Policy 2: Allow authenticated users to update their own avatars**
```sql
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-assets'
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = (storage.filename(name))[1]
);
```

**Policy 3: Allow authenticated users to delete their own avatars**
```sql
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-assets'
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = (storage.filename(name))[1]
);
```

**Policy 4: Allow public read access to all avatars**
```sql
CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'user-assets'
  AND (storage.foldername(name))[1] = 'avatars'
);
```

### Folder Structure

The `user-assets` bucket will contain:
```
user-assets/
└── avatars/
    ├── {user-id-1}-{timestamp}.jpg
    ├── {user-id-2}-{timestamp}.png
    └── ...
```

Each avatar file is named with the pattern: `{user-id}-{timestamp}.{extension}`

### Features Using Storage

- **Profile Picture Upload** (UserProfileModal → Profile tab)
  - Users can upload profile pictures up to 5MB
  - Supported formats: JPG, JPEG, PNG, GIF, WebP
  - Old avatars are automatically deleted when uploading new ones
  - Avatar URLs are stored in `user_profiles.avatar_url`

### Testing the Setup

1. Log in to the application
2. Click your profile avatar in the navigation
3. Go to the **Profile** tab
4. Click the camera icon or "Upload Photo" button
5. Select an image file
6. The avatar should upload and display immediately

If you encounter errors:
- Check that the `user-assets` bucket exists and is public
- Verify all RLS policies are created
- Check the browser console for detailed error messages
- Ensure your Supabase project URL and anon key are correctly configured in `.env`

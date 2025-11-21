-- Setup Supabase Storage for avatar uploads (FIXED VERSION)
-- Run this in Supabase SQL Editor

-- 1. Create storage bucket for avatars (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;

-- 3. Create policy to allow authenticated users to upload avatars
-- Files are named as: {user_id}-{timestamp}.{ext}
-- We use LIKE to check that filename starts with user_id
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (name LIKE auth.uid()::text || '-%')
);

-- 4. Create policy to allow users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (name LIKE auth.uid()::text || '-%')
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (name LIKE auth.uid()::text || '-%')
);

-- 5. Create policy to allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (name LIKE auth.uid()::text || '-%')
);

-- 6. Create policy to allow public read access
CREATE POLICY "Public avatar access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Verify bucket exists and is public
SELECT id, name, public FROM storage.buckets WHERE id = 'avatars';


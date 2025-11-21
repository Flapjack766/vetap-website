-- Fix RLS Policies for template-images Storage Bucket (Version 2)
-- Run this in Supabase SQL Editor
-- This fixes the "new row violates row-level security policy" error

-- 1. Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('template-images', 'template-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop ALL existing policies for template-images (clean slate)
DROP POLICY IF EXISTS "Users can upload template images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own template images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view template images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own template images" ON storage.objects;

-- 3. Create policy to allow authenticated users to upload template images
-- Files are stored as: {user_id}/{imageType}-{timestamp}.{ext}
-- We check that the path starts with user_id followed by /
CREATE POLICY "Users can upload template images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'template-images' AND
  (name LIKE auth.uid()::text || '/%')
);

-- 4. Create policy to allow users to view their own template images
CREATE POLICY "Users can view own template images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'template-images' AND
  (name LIKE auth.uid()::text || '/%')
);

-- 5. Create policy to allow public read access (for displaying images in templates)
-- This is important so images can be displayed in the public profile pages
CREATE POLICY "Public can view template images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'template-images');

-- 6. Create policy to allow users to delete their own template images
CREATE POLICY "Users can delete own template images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'template-images' AND
  (name LIKE auth.uid()::text || '/%')
);

-- 7. Verify bucket exists and is public
SELECT id, name, public FROM storage.buckets WHERE id = 'template-images';

-- 8. Test query to verify policies work (optional - run this manually)
-- SELECT name FROM storage.objects WHERE bucket_id = 'template-images' LIMIT 1;


-- Fix RLS Policies for template-images Storage Bucket
-- Run this in Supabase SQL Editor

-- 1. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload template images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own template images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view template images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own template images" ON storage.objects;

-- 2. Create policy to allow authenticated users to upload template images
-- Files are stored as: template-images/{user_id}/{imageType}-{timestamp}.{ext}
-- We check that the path starts with template-images/ and contains user_id
CREATE POLICY "Users can upload template images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'template-images' AND
  (name LIKE 'template-images/' || auth.uid()::text || '/%')
);

-- 3. Create policy to allow users to view their own template images
CREATE POLICY "Users can view own template images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'template-images' AND
  (name LIKE 'template-images/' || auth.uid()::text || '/%')
);

-- 4. Create policy to allow public read access (for displaying images in templates)
CREATE POLICY "Public can view template images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'template-images');

-- 5. Create policy to allow users to delete their own template images
CREATE POLICY "Users can delete own template images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'template-images' AND
  (name LIKE 'template-images/' || auth.uid()::text || '/%')
);

-- Verify bucket exists and is public
SELECT id, name, public FROM storage.buckets WHERE id = 'template-images';


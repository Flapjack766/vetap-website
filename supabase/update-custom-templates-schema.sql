-- Update Custom Templates Schema
-- Add new fields for data source, required fields, and uploaded images

-- Add new columns to custom_template_requests
ALTER TABLE custom_template_requests 
ADD COLUMN IF NOT EXISTS data_source TEXT CHECK (data_source IN ('use_existing', 'build_from_scratch')) DEFAULT 'use_existing',
ADD COLUMN IF NOT EXISTS required_fields JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS uploaded_images JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;

-- Add is_deleted flag instead of actually deleting
ALTER TABLE custom_templates 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add index for is_deleted
CREATE INDEX IF NOT EXISTS idx_custom_templates_is_deleted ON custom_templates(is_deleted);

-- Update RLS policy to exclude deleted templates
DROP POLICY IF EXISTS "Users can view own custom templates" ON custom_templates;
CREATE POLICY "Users can view own custom templates"
ON custom_templates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = custom_templates.profile_id
    AND profiles.user_id = auth.uid()
  )
  AND is_deleted = false
);

-- Create storage bucket for template images
INSERT INTO storage.buckets (id, name, public)
VALUES ('template-images', 'template-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for template-images bucket
-- Files are stored as: {user_id}/{imageType}-{timestamp}.{ext}
-- We use LIKE to check that path starts with user_id
CREATE POLICY "Users can upload template images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'template-images' AND
  (name LIKE auth.uid()::text || '/%')
);

CREATE POLICY "Users can view own template images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'template-images' AND
  (name LIKE auth.uid()::text || '/%')
);

CREATE POLICY "Public can view template images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'template-images');

CREATE POLICY "Users can delete own template images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'template-images' AND
  (name LIKE auth.uid()::text || '/%')
);


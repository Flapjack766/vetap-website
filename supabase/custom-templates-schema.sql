-- Custom Templates Request System Schema
-- Run this in Supabase SQL Editor

-- Create custom_template_requests table
CREATE TABLE IF NOT EXISTS custom_template_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  request_title TEXT NOT NULL,
  description TEXT,
  color_scheme TEXT,
  layout_preference TEXT,
  special_features TEXT,
  reference_urls TEXT,
  additional_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  template_code TEXT, -- Full template code uploaded by admin
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create custom_templates table to store approved custom templates
CREATE TABLE IF NOT EXISTS custom_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  request_id UUID REFERENCES custom_template_requests(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  template_code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_template_requests_profile_id ON custom_template_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_custom_template_requests_status ON custom_template_requests(status);
CREATE INDEX IF NOT EXISTS idx_custom_templates_profile_id ON custom_templates(profile_id);

-- Enable RLS
ALTER TABLE custom_template_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_template_requests

-- Users can view and create their own template requests
CREATE POLICY "Users can view own template requests"
ON custom_template_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = custom_template_requests.profile_id
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own template requests"
ON custom_template_requests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = custom_template_requests.profile_id
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own template requests (cancel)"
ON custom_template_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = custom_template_requests.profile_id
    AND profiles.user_id = auth.uid()
  )
  AND status = 'pending'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = custom_template_requests.profile_id
    AND profiles.user_id = auth.uid()
  )
  AND status = 'pending'
);

-- Admin can view all template requests
CREATE POLICY "Admin can view all template requests"
ON custom_template_requests
FOR SELECT
TO authenticated
USING (
  is_admin_user(auth.uid())
);

-- Admin can update any template request
CREATE POLICY "Admin can update any template request"
ON custom_template_requests
FOR UPDATE
TO authenticated
USING (
  is_admin_user(auth.uid())
)
WITH CHECK (
  is_admin_user(auth.uid())
);

-- RLS Policies for custom_templates

-- Users can view their own custom templates
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
);

-- Admin can view all custom templates
CREATE POLICY "Admin can view all custom templates"
ON custom_templates
FOR SELECT
TO authenticated
USING (
  is_admin_user(auth.uid())
);

-- Admin can insert custom templates
CREATE POLICY "Admin can insert custom templates"
ON custom_templates
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_user(auth.uid())
);

-- Admin can update custom templates
CREATE POLICY "Admin can update custom templates"
ON custom_templates
FOR UPDATE
TO authenticated
USING (
  is_admin_user(auth.uid())
)
WITH CHECK (
  is_admin_user(auth.uid())
);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_custom_template_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_template_requests_updated_at
  BEFORE UPDATE ON custom_template_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_template_requests_updated_at();

CREATE OR REPLACE FUNCTION update_custom_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_templates_updated_at
  BEFORE UPDATE ON custom_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_templates_updated_at();


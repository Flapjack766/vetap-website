-- Analytics Reports Schema
-- Run this in Supabase SQL Editor

-- Create analytics_reports table for email report preferences
CREATE TABLE IF NOT EXISTS analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  email TEXT,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_analytics_reports_profile_id ON analytics_reports(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_enabled ON analytics_reports(enabled);

-- Enable RLS
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view and update their own report preferences
CREATE POLICY "Users can manage own analytics reports"
ON analytics_reports
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = analytics_reports.profile_id
    AND profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = analytics_reports.profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_analytics_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analytics_reports_updated_at
  BEFORE UPDATE ON analytics_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_reports_updated_at();


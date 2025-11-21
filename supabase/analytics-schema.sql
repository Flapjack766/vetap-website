-- Analytics and Visitor Tracking Schema
-- Run this in Supabase SQL Editor

-- Create analytics_events table for tracking page views and events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'page_view' CHECK (event_type IN ('page_view', 'link_click', 'contact_action', 'download')),
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  language TEXT,
  session_id TEXT,
  metadata JSONB, -- For storing additional data like link_type, link_url, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_analytics_profile_id ON analytics_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics_events(country);

-- Create function to update updated_at (if needed)
CREATE OR REPLACE FUNCTION update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Analytics events are append-only, no updated_at needed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view analytics for their own profiles
CREATE POLICY "Users can view own analytics"
ON analytics_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = analytics_events.profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- Allow public to insert analytics events (for tracking)
CREATE POLICY "Public can insert analytics events"
ON analytics_events
FOR INSERT
TO public
WITH CHECK (true);

-- Admin can view all analytics
CREATE POLICY "Admin can view all analytics"
ON analytics_events
FOR SELECT
TO authenticated
USING (
  is_admin_user(auth.uid())
);

-- Create view for daily statistics
CREATE OR REPLACE VIEW analytics_daily_stats AS
SELECT
  profile_id,
  DATE(created_at) as date,
  COUNT(*) as total_views,
  COUNT(DISTINCT session_id) as unique_visitors,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT country) as countries_count,
  COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile_views,
  COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop_views,
  COUNT(CASE WHEN device_type = 'tablet' THEN 1 END) as tablet_views
FROM analytics_events
WHERE event_type = 'page_view'
GROUP BY profile_id, DATE(created_at);

-- Create view for top referrers
CREATE OR REPLACE VIEW analytics_top_referrers AS
SELECT
  profile_id,
  referrer,
  COUNT(*) as visit_count,
  COUNT(DISTINCT session_id) as unique_visitors
FROM analytics_events
WHERE event_type = 'page_view'
  AND referrer IS NOT NULL
  AND referrer != ''
GROUP BY profile_id, referrer
ORDER BY visit_count DESC;

-- Create view for top countries
CREATE OR REPLACE VIEW analytics_top_countries AS
SELECT
  profile_id,
  country,
  COUNT(*) as visit_count,
  COUNT(DISTINCT session_id) as unique_visitors
FROM analytics_events
WHERE event_type = 'page_view'
  AND country IS NOT NULL
GROUP BY profile_id, country
ORDER BY visit_count DESC;

-- Create view for device breakdown
CREATE OR REPLACE VIEW analytics_device_breakdown AS
SELECT
  profile_id,
  device_type,
  browser,
  os,
  COUNT(*) as visit_count,
  COUNT(DISTINCT session_id) as unique_visitors
FROM analytics_events
WHERE event_type = 'page_view'
GROUP BY profile_id, device_type, browser, os
ORDER BY visit_count DESC;

-- Grant access to views
GRANT SELECT ON analytics_daily_stats TO authenticated;
GRANT SELECT ON analytics_top_referrers TO authenticated;
GRANT SELECT ON analytics_top_countries TO authenticated;
GRANT SELECT ON analytics_device_breakdown TO authenticated;


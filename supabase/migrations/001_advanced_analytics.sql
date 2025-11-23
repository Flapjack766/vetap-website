-- Advanced Analytics Tables Migration
-- This migration creates tables for advanced analytics, conversions, goals, and sessions

-- Analytics Conversions Table
CREATE TABLE IF NOT EXISTS analytics_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversion_type VARCHAR(100) NOT NULL,
  conversion_value DECIMAL(10, 2),
  goal_id VARCHAR(100),
  session_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Goals Table
CREATE TABLE IF NOT EXISTS analytics_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_name VARCHAR(255) NOT NULL,
  goal_type VARCHAR(50) NOT NULL, -- 'page_view', 'event', 'conversion', 'custom'
  goal_value DECIMAL(10, 2),
  target_value DECIMAL(10, 2),
  conditions JSONB, -- Conditions for goal completion
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Sessions Table (for session-level analytics)
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id VARCHAR(255) PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  referrer TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  country VARCHAR(100),
  city VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_address INET,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Journey Table (for tracking user paths)
CREATE TABLE IF NOT EXISTS analytics_user_journey (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  step_number INTEGER NOT NULL,
  page_path TEXT NOT NULL,
  event_type VARCHAR(100),
  event_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  time_from_previous INTEGER, -- milliseconds from previous step
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_conversions_profile_id ON analytics_conversions(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_conversions_type ON analytics_conversions(conversion_type);
CREATE INDEX IF NOT EXISTS idx_analytics_conversions_created_at ON analytics_conversions(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_conversions_session_id ON analytics_conversions(session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_goals_profile_id ON analytics_goals(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_goals_active ON analytics_goals(is_active);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_profile_id ON analytics_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_start_time ON analytics_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_user_journey_profile_id ON analytics_user_journey(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_journey_session_id ON analytics_user_journey(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_journey_timestamp ON analytics_user_journey(timestamp);

-- Add event_category and event_label to analytics_events if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analytics_events' AND column_name = 'event_category'
  ) THEN
    ALTER TABLE analytics_events ADD COLUMN event_category VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analytics_events' AND column_name = 'event_label'
  ) THEN
    ALTER TABLE analytics_events ADD COLUMN event_label VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analytics_events' AND column_name = 'event_value'
  ) THEN
    ALTER TABLE analytics_events ADD COLUMN event_value DECIMAL(10, 2);
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_analytics_conversions_updated_at ON analytics_conversions;
CREATE TRIGGER update_analytics_conversions_updated_at
  BEFORE UPDATE ON analytics_conversions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_analytics_goals_updated_at ON analytics_goals;
CREATE TRIGGER update_analytics_goals_updated_at
  BEFORE UPDATE ON analytics_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_analytics_sessions_updated_at ON analytics_sessions;
CREATE TRIGGER update_analytics_sessions_updated_at
  BEFORE UPDATE ON analytics_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate session metrics
CREATE OR REPLACE FUNCTION calculate_session_metrics(session_id_param VARCHAR(255))
RETURNS TABLE (
  page_views INTEGER,
  events_count INTEGER,
  conversions_count INTEGER,
  engagement_score INTEGER,
  duration_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT CASE WHEN ae.event_type = 'page_view' THEN ae.id END)::INTEGER as page_views,
    COUNT(DISTINCT ae.id)::INTEGER as events_count,
    COUNT(DISTINCT ac.id)::INTEGER as conversions_count,
    COALESCE(SUM(CASE 
      WHEN ae.event_type = 'page_view' THEN 1
      WHEN ae.event_type = 'scroll' THEN 0.5
      WHEN ae.event_type = 'click' THEN 2
      WHEN ae.event_type = 'form_interaction' THEN 3
      WHEN ae.event_type = 'form_submit' THEN 10
      WHEN ae.event_type = 'conversion' THEN 20
      ELSE 0
    END)::INTEGER, 0) as engagement_score,
    EXTRACT(EPOCH FROM (MAX(ae.created_at) - MIN(ae.created_at)))::INTEGER as duration_seconds
  FROM analytics_events ae
  LEFT JOIN analytics_conversions ac ON ac.session_id = session_id_param
  WHERE ae.session_id = session_id_param;
END;
$$ LANGUAGE plpgsql;


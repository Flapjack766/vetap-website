-- Enable RLS on Analytics Tables and Create Security Policies
-- This migration enables Row Level Security (RLS) on all sensitive analytics tables
-- and creates policies to allow proper access control

-- ============================================
-- 1. Enable RLS on all sensitive tables
-- ============================================

ALTER TABLE IF EXISTS admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_user_journey ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Drop existing policies if they exist
-- ============================================

DROP POLICY IF EXISTS "admin_users_select_policy" ON admin_users;
DROP POLICY IF EXISTS "analytics_sessions_select_policy" ON analytics_sessions;
DROP POLICY IF EXISTS "analytics_sessions_insert_policy" ON analytics_sessions;
DROP POLICY IF EXISTS "analytics_sessions_update_policy" ON analytics_sessions;
DROP POLICY IF EXISTS "analytics_goals_select_policy" ON analytics_goals;
DROP POLICY IF EXISTS "analytics_conversions_select_policy" ON analytics_conversions;
DROP POLICY IF EXISTS "analytics_conversions_insert_policy" ON analytics_conversions;
DROP POLICY IF EXISTS "analytics_user_journey_select_policy" ON analytics_user_journey;
DROP POLICY IF EXISTS "analytics_user_journey_insert_policy" ON analytics_user_journey;
DROP POLICY IF EXISTS "analytics_events_select_policy" ON analytics_events;
DROP POLICY IF EXISTS "analytics_events_insert_policy" ON analytics_events;

-- ============================================
-- 3. Create helper function to check if user is admin
-- ============================================

CREATE OR REPLACE FUNCTION is_admin_user(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user exists in admin_users table
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Policies for admin_users table
-- ============================================

-- Only admins can read admin_users table
CREATE POLICY "admin_users_select_policy" ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 5. Policies for analytics_sessions table
-- ============================================

-- Admins can read all sessions
CREATE POLICY "analytics_sessions_select_admin" ON analytics_sessions
  FOR SELECT
  USING (is_admin_user(auth.uid()));

-- Regular users can only read their own sessions (via profile_id)
CREATE POLICY "analytics_sessions_select_own" ON analytics_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = analytics_sessions.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Allow inserts for tracking (anyone can insert, but only for their own profile)
CREATE POLICY "analytics_sessions_insert_policy" ON analytics_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = analytics_sessions.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Allow updates for tracking (anyone can update, but only their own sessions)
CREATE POLICY "analytics_sessions_update_policy" ON analytics_sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = analytics_sessions.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- ============================================
-- 6. Policies for analytics_goals table
-- ============================================

-- Admins can read all goals
CREATE POLICY "analytics_goals_select_admin" ON analytics_goals
  FOR SELECT
  USING (is_admin_user(auth.uid()));

-- Regular users can only read their own goals
CREATE POLICY "analytics_goals_select_own" ON analytics_goals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = analytics_goals.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. Policies for analytics_conversions table
-- ============================================

-- Admins can read all conversions
CREATE POLICY "analytics_conversions_select_admin" ON analytics_conversions
  FOR SELECT
  USING (is_admin_user(auth.uid()));

-- Regular users can only read their own conversions
CREATE POLICY "analytics_conversions_select_own" ON analytics_conversions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = analytics_conversions.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Allow inserts for tracking (anyone can insert, but only for their own profile)
CREATE POLICY "analytics_conversions_insert_policy" ON analytics_conversions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = analytics_conversions.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- ============================================
-- 8. Policies for analytics_user_journey table
-- ============================================

-- Admins can read all user journeys
CREATE POLICY "analytics_user_journey_select_admin" ON analytics_user_journey
  FOR SELECT
  USING (is_admin_user(auth.uid()));

-- Regular users can only read their own journeys
CREATE POLICY "analytics_user_journey_select_own" ON analytics_user_journey
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = analytics_user_journey.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Allow inserts for tracking (anyone can insert, but only for their own profile)
CREATE POLICY "analytics_user_journey_insert_policy" ON analytics_user_journey
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = analytics_user_journey.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- ============================================
-- 9. Policies for analytics_events table
-- ============================================

-- Admins can read all events
CREATE POLICY "analytics_events_select_admin" ON analytics_events
  FOR SELECT
  USING (is_admin_user(auth.uid()));

-- Regular users can only read their own events
CREATE POLICY "analytics_events_select_own" ON analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = analytics_events.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Allow inserts for tracking (anyone can insert, but only for their own profile)
CREATE POLICY "analytics_events_insert_policy" ON analytics_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = analytics_events.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- ============================================
-- 10. Grant necessary permissions
-- ============================================

-- Ensure authenticated users can use the is_admin_user function
GRANT EXECUTE ON FUNCTION is_admin_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user(UUID) TO anon;


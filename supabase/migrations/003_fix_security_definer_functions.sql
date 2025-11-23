-- Fix Security Definer Functions - Set search_path to prevent security vulnerabilities
-- This migration fixes all SECURITY DEFINER functions to use a fixed search_path
-- This prevents search_path injection attacks and resolves Critical security warnings

-- ============================================
-- 1. Fix is_admin_user function
-- ============================================

-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS is_admin_user(UUID) CASCADE;

CREATE OR REPLACE FUNCTION is_admin_user(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Check if user exists in admin_users table
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = user_uuid
  );
END;
$$;

-- ============================================
-- 2. Fix calculate_session_metrics function
-- ============================================

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS calculate_session_metrics(VARCHAR) CASCADE;

CREATE OR REPLACE FUNCTION calculate_session_metrics(session_id_param VARCHAR(255))
RETURNS TABLE (
  page_views INTEGER,
  events_count INTEGER,
  conversions_count INTEGER,
  engagement_score INTEGER,
  duration_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
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
$$;

-- ============================================
-- 3. Fix check_expired_custom_usernames function
-- ============================================

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS check_expired_custom_usernames() CASCADE;

CREATE OR REPLACE FUNCTION check_expired_custom_usernames()
RETURNS TABLE (
  profile_id UUID,
  username_custom TEXT,
  user_id UUID,
  expired_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as profile_id,
    p.username_custom,
    p.user_id,
    p.custom_username_expires_at as expired_at
  FROM profiles p
  WHERE p.username_custom IS NOT NULL
    AND p.custom_username_expires_at IS NOT NULL
    AND p.custom_username_expires_at < NOW()
    AND p.custom_username_expired = FALSE;
END;
$$;

-- ============================================
-- 4. Fix handle_new_user function (if exists)
-- ============================================

-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  random_username TEXT;
BEGIN
  -- Generate random username
  random_username := generate_random_username();
  
  -- Create profile for new user
  INSERT INTO profiles (
    user_id,
    username_random,
    profile_name,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    random_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- ============================================
-- 5. Fix update_updated_at_column function
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- 6. Fix other utility functions (if they exist)
-- ============================================

-- Fix generate_random_username if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'generate_random_username'
  ) THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION generate_random_username()
      RETURNS TEXT
      LANGUAGE plpgsql
      SET search_path = public, extensions
      AS $func$
      DECLARE
        random_part TEXT;
        username TEXT;
        exists_check BOOLEAN;
      BEGIN
        LOOP
          random_part := substr(md5(random()::text), 1, 8);
          username := ''user_'' || random_part;
          
          SELECT NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE username_random = username
          ) INTO exists_check;
          
          EXIT WHEN exists_check;
        END LOOP;
        
        RETURN username;
      END;
      $func$;
    ';
  END IF;
END $$;

-- Fix is_reserved_username if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_reserved_username'
  ) THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION is_reserved_username(username TEXT)
      RETURNS BOOLEAN
      LANGUAGE plpgsql
      SET search_path = public, extensions
      AS $func$
      BEGIN
        RETURN username IN (
          ''admin'', ''administrator'', ''root'', ''system'',
          ''api'', ''www'', ''mail'', ''ftp'', ''localhost'',
          ''test'', ''demo'', ''example'', ''sample''
        );
      END;
      $func$;
    ';
  END IF;
END $$;

-- ============================================
-- 7. Fix Views - Convert Security Definer Views to Security Invoker
-- ============================================

-- Drop and recreate analytics views as SECURITY INVOKER
-- Note: In PostgreSQL 15+, we use security_invoker option
-- For older versions, views run with caller's permissions by default

DROP VIEW IF EXISTS analytics_daily_stats CASCADE;
CREATE OR REPLACE VIEW analytics_daily_stats
AS
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

DROP VIEW IF EXISTS analytics_top_referrers CASCADE;
CREATE OR REPLACE VIEW analytics_top_referrers
AS
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

DROP VIEW IF EXISTS analytics_top_countries CASCADE;
CREATE OR REPLACE VIEW analytics_top_countries
AS
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

DROP VIEW IF EXISTS analytics_device_breakdown CASCADE;
CREATE OR REPLACE VIEW analytics_device_breakdown
AS
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

-- ============================================
-- 8. Fix remaining Functions with mutable search_path
-- ============================================

-- Fix count_random_profiles
DROP FUNCTION IF EXISTS count_random_profiles(UUID) CASCADE;
CREATE OR REPLACE FUNCTION count_random_profiles(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SET search_path = public, extensions
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM profiles
    WHERE user_id = p_user_id
      AND username_type = 'random'
      AND is_deleted = false
  );
END;
$$;

-- Fix can_create_random_profile
DROP FUNCTION IF EXISTS can_create_random_profile(UUID) CASCADE;
CREATE OR REPLACE FUNCTION can_create_random_profile(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public, extensions
AS $$
BEGIN
  RETURN count_random_profiles(p_user_id) < 3;
END;
$$;

-- Fix get_user_profile_count
DROP FUNCTION IF EXISTS get_user_profile_count(UUID) CASCADE;
CREATE OR REPLACE FUNCTION get_user_profile_count(p_user_id UUID)
RETURNS TABLE(
  random_count INTEGER,
  custom_count INTEGER,
  total_count INTEGER
)
LANGUAGE plpgsql
STABLE
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE username_type = 'random' AND is_deleted = false)::INTEGER as random_count,
    COUNT(*) FILTER (WHERE username_type = 'custom' AND is_deleted = false)::INTEGER as custom_count,
    COUNT(*) FILTER (WHERE is_deleted = false)::INTEGER as total_count
  FROM profiles
  WHERE user_id = p_user_id;
END;
$$;

-- Fix update_analytics_reports_updated_at
DROP FUNCTION IF EXISTS update_analytics_reports_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_analytics_reports_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix update_analytics_updated_at
DROP FUNCTION IF EXISTS update_analytics_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_analytics_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  -- Analytics events are append-only, no updated_at needed
  RETURN NEW;
END;
$$;

-- ============================================
-- 9. Set Views as SECURITY INVOKER explicitly
-- ============================================

ALTER VIEW IF EXISTS public.analytics_daily_stats
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.analytics_device_breakdown
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.analytics_top_countries
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.analytics_top_referrers
  SET (security_invoker = true);

-- ============================================
-- 10. Grant necessary permissions (SECURE)
-- ============================================

-- Grant execute permissions on fixed functions
-- IMPORTANT: Remove anon access from is_admin_user for security
REVOKE EXECUTE ON FUNCTION is_admin_user(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION is_admin_user(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user(UUID) TO service_role;

-- Other functions can be used by authenticated users
GRANT EXECUTE ON FUNCTION calculate_session_metrics(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION check_expired_custom_usernames() TO authenticated;
GRANT EXECUTE ON FUNCTION check_expired_custom_usernames() TO service_role;
GRANT EXECUTE ON FUNCTION count_random_profiles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_create_random_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile_count(UUID) TO authenticated;

-- Grant select on views
GRANT SELECT ON analytics_daily_stats TO authenticated;
GRANT SELECT ON analytics_top_referrers TO authenticated;
GRANT SELECT ON analytics_top_countries TO authenticated;
GRANT SELECT ON analytics_device_breakdown TO authenticated;

-- ============================================
-- 11. Add comments for documentation
-- ============================================

COMMENT ON FUNCTION is_admin_user(UUID) IS 'Checks if a user is an admin. Uses SECURITY DEFINER with fixed search_path for security. Only accessible via service_role.';
COMMENT ON FUNCTION calculate_session_metrics(VARCHAR) IS 'Calculates session metrics. Uses SECURITY DEFINER with fixed search_path for security.';
COMMENT ON FUNCTION check_expired_custom_usernames() IS 'Checks for expired custom usernames. Uses SECURITY DEFINER with fixed search_path for security.';
COMMENT ON FUNCTION handle_new_user() IS 'Handles new user creation. Uses SECURITY DEFINER with fixed search_path for security.';
COMMENT ON FUNCTION count_random_profiles(UUID) IS 'Counts random profiles for a user. Uses fixed search_path for security.';
COMMENT ON FUNCTION can_create_random_profile(UUID) IS 'Checks if user can create a random profile. Uses fixed search_path for security.';
COMMENT ON FUNCTION get_user_profile_count(UUID) IS 'Gets profile count breakdown for a user. Uses fixed search_path for security.';
COMMENT ON FUNCTION update_analytics_reports_updated_at() IS 'Updates updated_at timestamp. Uses fixed search_path for security.';
COMMENT ON FUNCTION update_analytics_updated_at() IS 'Updates analytics updated_at. Uses fixed search_path for security.';


-- Fix RLS policies to allow admin to update profiles and username_requests
-- Run this in Supabase SQL Editor

-- 1. Add policy for admin to update any profile
DROP POLICY IF EXISTS "Admin can update any profile" ON profiles;

CREATE POLICY "Admin can update any profile"
ON profiles
FOR UPDATE
TO authenticated
USING (
  is_admin_user(auth.uid())
)
WITH CHECK (
  is_admin_user(auth.uid())
);

-- 2. Add policy for admin to update any username_request
DROP POLICY IF EXISTS "Admin can update any username request" ON username_requests;

CREATE POLICY "Admin can update any username request"
ON username_requests
FOR UPDATE
TO authenticated
USING (
  is_admin_user(auth.uid())
)
WITH CHECK (
  is_admin_user(auth.uid())
);

-- Add policy for admin to view all analytics
DROP POLICY IF EXISTS "Admin can view all analytics" ON analytics_events;

CREATE POLICY "Admin can view all analytics"
ON analytics_events
FOR SELECT
TO authenticated
USING (
  is_admin_user(auth.uid())
);

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'username_requests', 'analytics_events')
ORDER BY tablename, policyname;


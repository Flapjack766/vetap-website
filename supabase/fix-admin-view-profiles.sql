-- Fix RLS policies to allow admin to VIEW (SELECT) all profiles
-- Run this in Supabase SQL Editor

-- Ensure is_admin_user function exists
CREATE OR REPLACE FUNCTION is_admin_user(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure admin_users table exists
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert admin user if not exists
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'admin@vetaps.com'
ON CONFLICT (user_id) DO NOTHING;

-- 1. Add policy for admin to SELECT (view) all profiles
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

CREATE POLICY "Admin can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  is_admin_user(auth.uid())
);

-- 2. Verify the policy was created
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
WHERE tablename = 'profiles'
  AND cmd = 'SELECT'
ORDER BY policyname;


-- Fix RLS policies for admin to view all username requests
-- Run this in Supabase SQL Editor

-- Drop existing "Users can view own username requests" policy
DROP POLICY IF EXISTS "Users can view own username requests" ON username_requests;

-- Create policy for users to view their own requests
CREATE POLICY "Users can view own username requests"
ON username_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for admin to view ALL requests
-- Note: Replace 'YOUR_ADMIN_USER_ID' with the actual admin user ID
-- You can find it by running: SELECT id FROM auth.users WHERE email = 'admin@vetaps.com';

-- Option 1: If you know the admin user ID, uncomment and replace:
/*
CREATE POLICY "Admin can view all username requests"
ON username_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = 'YOUR_ADMIN_USER_ID_HERE'::uuid
);
*/

-- Option 2: Create a function to check if user is admin (more flexible)
-- First, create a table to store admin user IDs (optional, for future use)
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policy for admin to view ALL requests using the function
CREATE POLICY "Admin can view all username requests"
ON username_requests
FOR SELECT
TO authenticated
USING (
  is_admin_user(auth.uid())
);

-- Insert admin user ID into admin_users table
-- This will automatically get the admin user ID from auth.users
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'admin@vetaps.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify the setup
SELECT 
  'Admin users table created' AS status,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_users') AS result;


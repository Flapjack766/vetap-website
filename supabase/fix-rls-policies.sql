-- Fix RLS policies to allow UPDATE with proper permissions
-- Run this in Supabase SQL Editor if you're getting 406 errors

-- Drop existing update policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create update policy that allows both USING and WITH CHECK
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;


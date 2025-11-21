-- Script to verify Supabase setup
-- Run this in Supabase SQL Editor to check if everything is set up correctly

-- 1. Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
) AS profiles_table_exists;

-- 2. Check if trigger exists
SELECT EXISTS (
  SELECT FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created'
) AS trigger_exists;

-- 3. Check if function exists
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'handle_new_user'
) AS function_exists;

-- 4. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'profiles';

-- 6. Test: Try to see if we can query the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;


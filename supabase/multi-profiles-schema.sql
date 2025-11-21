-- Multi-Profiles System Schema
-- Allows users to have multiple profiles (up to 3 random, unlimited custom)
-- Run this in Supabase SQL Editor

-- 1. Remove UNIQUE constraint from username_random (allow multiple profiles per user)
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_username_random_key;

-- 2. Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_name TEXT, -- User-friendly name for the profile
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false, -- Primary profile (first created)
ADD COLUMN IF NOT EXISTS username_type TEXT DEFAULT 'random' CHECK (username_type IN ('random', 'custom')); -- Type of username

-- 3. Create index for username_type
CREATE INDEX IF NOT EXISTS profiles_username_type_idx ON profiles(username_type);

-- 4. Create index for user_id + username_type (for counting)
CREATE INDEX IF NOT EXISTS profiles_user_id_type_idx ON profiles(user_id, username_type);

-- 5. Add soft delete column if not exists (must be before functions and index)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 6. Function to count random profiles for a user
CREATE OR REPLACE FUNCTION count_random_profiles(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM profiles
    WHERE user_id = p_user_id
      AND username_type = 'random'
      AND is_deleted = false
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. Function to check if user can create random profile (max 3)
CREATE OR REPLACE FUNCTION can_create_random_profile(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN count_random_profiles(p_user_id) < 3;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. Update existing profiles to set is_primary for the first profile of each user
UPDATE profiles p1
SET is_primary = true
WHERE NOT EXISTS (
  SELECT 1
  FROM profiles p2
  WHERE p2.user_id = p1.user_id
    AND p2.created_at < p1.created_at
);

-- 9. Ensure only one primary profile per user (constraint)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_one_primary_per_user 
ON profiles(user_id) 
WHERE is_primary = true AND is_deleted = false;

-- 10. Update RLS policies to support multiple profiles
-- (Existing policies should work, but we'll ensure they're correct)

-- 11. Function to get active profile count (for display)
CREATE OR REPLACE FUNCTION get_user_profile_count(p_user_id UUID)
RETURNS TABLE(
  random_count INTEGER,
  custom_count INTEGER,
  total_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE username_type = 'random' AND is_deleted = false)::INTEGER as random_count,
    COUNT(*) FILTER (WHERE username_type = 'custom' AND is_deleted = false)::INTEGER as custom_count,
    COUNT(*) FILTER (WHERE is_deleted = false)::INTEGER as total_count
  FROM profiles
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;


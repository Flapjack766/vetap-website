-- SIMPLE SCHEMA - Run this first if you're getting database errors
-- This creates the table without triggers (we'll create profiles manually from code)
-- 
-- IMPORTANT: If you have existing triggers, run supabase/remove-trigger.sql FIRST

-- 0. Remove any existing triggers first (to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS generate_random_username();

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  headline TEXT,
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  location TEXT,
  links JSONB DEFAULT '{}'::jsonb,
  template_id INTEGER NOT NULL DEFAULT 1,
  username_random TEXT NOT NULL UNIQUE,
  username_custom TEXT UNIQUE,
  custom_username_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS profiles_username_random_idx ON profiles(username_random);
CREATE INDEX IF NOT EXISTS profiles_username_custom_idx ON profiles(username_custom);

-- 3. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are readable" ON profiles;

-- 7. Create RLS policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public profiles are readable"
  ON profiles
  FOR SELECT
  USING (true);

-- 8. Verify setup
SELECT 
  'Table created' AS status,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') AS result;


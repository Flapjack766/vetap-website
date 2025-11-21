-- Create profiles table
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

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);

-- Create index on username_random for faster lookups
CREATE INDEX IF NOT EXISTS profiles_username_random_idx ON profiles(username_random);

-- Create index on username_custom for faster lookups
CREATE INDEX IF NOT EXISTS profiles_username_custom_idx ON profiles(username_custom);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Public profiles are readable by everyone (for public pages)
CREATE POLICY "Public profiles are readable"
  ON profiles
  FOR SELECT
  USING (true);

-- Create function to generate random username
CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS TEXT AS $$
DECLARE
  random_username TEXT;
BEGIN
  -- Generate a random username (10 alphanumeric characters)
  random_username := lower(substring(md5(random()::text || clock_timestamp()::text || random()::text) from 1 for 10));
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username_random = random_username) LOOP
    random_username := lower(substring(md5(random()::text || clock_timestamp()::text || random()::text) from 1 for 10));
  END LOOP;
  
  RETURN random_username;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  random_username TEXT;
BEGIN
  -- Generate random username
  random_username := generate_random_username();
  
  -- Insert profile with error handling
  BEGIN
    INSERT INTO profiles (user_id, email, username_random, template_id)
    VALUES (NEW.id, NEW.email, random_username, 1);
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


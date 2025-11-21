-- Fix setup script
-- Run this if you're getting 500 errors during signup

-- 1. Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS generate_random_username();

-- 2. Recreate the function to generate random username
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

-- 3. Recreate the function to handle new user
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

-- 4. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 5. Verify the setup
SELECT 
  'Trigger exists' AS check_name,
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') AS result
UNION ALL
SELECT 
  'Function exists' AS check_name,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') AS result
UNION ALL
SELECT 
  'Table exists' AS check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') AS result;


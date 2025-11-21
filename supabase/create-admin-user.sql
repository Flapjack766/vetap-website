-- Create Admin User
-- Run this in Supabase SQL Editor
-- 
-- Note: This script creates the user in auth.users and creates a profile
-- You'll need to manually set the password in Supabase Dashboard > Authentication > Users

-- Step 1: Create the user in auth.users
-- Note: Supabase doesn't allow direct INSERT into auth.users via SQL
-- You need to create the user through the Supabase Dashboard or Auth API
-- 
-- Go to: Supabase Dashboard > Authentication > Users > Add User
-- Email: admin@vetaps.com
-- Password: Aa@0556160304.com
-- Auto Confirm User: Yes

-- Step 2: After creating the user, get their user_id from:
-- SELECT id, email FROM auth.users WHERE email = 'admin@vetaps.com';

-- Step 3: Create profile for admin user
-- Replace 'USER_ID_HERE' with the actual user_id from Step 2
DO $$
DECLARE
  admin_user_id UUID;
  admin_username_random TEXT;
BEGIN
  -- Get the admin user ID
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@vetaps.com';

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found. Please create the user first in Supabase Dashboard > Authentication > Users';
  END IF;

  -- Generate random username (u + 10 alphanumeric chars)
  admin_username_random := 'u' || array_to_string(
    ARRAY(
      SELECT substr('abcdefghijklmnopqrstuvwxyz0123456789', floor(random() * 36)::int + 1, 1)
      FROM generate_series(1, 10)
    ),
    ''
  );

  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = admin_user_id) THEN
    -- Create profile
    INSERT INTO profiles (
      user_id,
      email,
      display_name,
      username_random,
      template_id,
      links
    ) VALUES (
      admin_user_id,
      'admin@vetaps.com',
      'Admin',
      admin_username_random,
      1,
      '{}'::jsonb
    );

    RAISE NOTICE 'Admin profile created successfully!';
    RAISE NOTICE 'User ID: %', admin_user_id;
    RAISE NOTICE 'Random Username: %', admin_username_random;
  ELSE
    RAISE NOTICE 'Admin profile already exists';
  END IF;
END $$;

-- Step 4: Verify the admin user and profile
SELECT 
  u.id as user_id,
  u.email,
  p.display_name,
  p.username_random,
  p.username_custom
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'admin@vetaps.com';


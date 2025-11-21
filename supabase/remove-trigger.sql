-- Remove trigger and functions to fix "function does not exist" error
-- Run this FIRST if you're getting database errors

-- 1. Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop functions if they exist
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS generate_random_username();

-- 3. Verify removal
SELECT 
  'Trigger removed' AS status,
  NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') AS result
UNION ALL
SELECT 
  'Functions removed' AS status,
  NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname IN ('handle_new_user', 'generate_random_username')) AS result;


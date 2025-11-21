-- Fix primary profile constraint
-- Drop and recreate the constraint to ensure it works correctly

-- Drop existing constraint if it exists
DROP INDEX IF EXISTS profiles_one_primary_per_user;

-- Recreate the constraint with proper WHERE clause
-- This ensures only ONE profile per user can have is_primary = true AND is_deleted = false
CREATE UNIQUE INDEX profiles_one_primary_per_user 
ON profiles(user_id) 
WHERE is_primary = true AND (is_deleted = false OR is_deleted IS NULL);

-- Verify the constraint
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE indexname = 'profiles_one_primary_per_user';


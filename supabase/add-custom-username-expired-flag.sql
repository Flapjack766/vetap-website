-- Add custom_username_expired flag to profiles table
-- This flag helps track which custom usernames have expired

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS custom_username_expired BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on expired usernames
CREATE INDEX IF NOT EXISTS profiles_custom_username_expired_idx 
ON profiles(custom_username_expired) 
WHERE custom_username_expired = TRUE;

-- Create index for faster queries on active custom usernames
CREATE INDEX IF NOT EXISTS profiles_custom_username_active_idx 
ON profiles(username_custom) 
WHERE username_custom IS NOT NULL AND custom_username_expired = FALSE;

-- Function to check and update expired custom usernames
CREATE OR REPLACE FUNCTION check_expired_custom_usernames()
RETURNS TABLE(
  profile_id UUID,
  user_id UUID,
  email TEXT,
  username_custom TEXT,
  custom_username_expires_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Update expired usernames
  UPDATE profiles
  SET custom_username_expired = TRUE
  WHERE username_custom IS NOT NULL
    AND custom_username_expires_at IS NOT NULL
    AND custom_username_expires_at <= NOW()
    AND custom_username_expired = FALSE;
  
  -- Return expired profiles for email notification
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.username_custom,
    p.custom_username_expires_at
  FROM profiles p
  WHERE p.username_custom IS NOT NULL
    AND p.custom_username_expires_at IS NOT NULL
    AND p.custom_username_expires_at <= NOW()
    AND p.custom_username_expired = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on the function
COMMENT ON FUNCTION check_expired_custom_usernames() IS 
'Checks and marks expired custom usernames, returns list of newly expired profiles';


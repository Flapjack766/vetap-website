-- Update username_requests table to support profile_id
-- This allows creating a new profile when custom username is approved

ALTER TABLE username_requests 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Create index for profile_id
CREATE INDEX IF NOT EXISTS idx_username_requests_profile_id ON username_requests(profile_id);


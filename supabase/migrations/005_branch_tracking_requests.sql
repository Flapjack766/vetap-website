-- Schema for branch_tracking_requests table
-- This table stores requests for the branch tracking dashboard feature

-- Create branch_tracking_requests table
CREATE TABLE IF NOT EXISTS branch_tracking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_branch_tracking_requests_user_id ON branch_tracking_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_branch_tracking_requests_status ON branch_tracking_requests(status);
CREATE INDEX IF NOT EXISTS idx_branch_tracking_requests_profile_id ON branch_tracking_requests(profile_id);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_branch_tracking_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_branch_tracking_requests_updated_at_column
  BEFORE UPDATE ON branch_tracking_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_branch_tracking_requests_updated_at();

-- Enable RLS
ALTER TABLE branch_tracking_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own requests
CREATE POLICY "Users can view own branch tracking requests"
ON branch_tracking_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own branch tracking requests"
ON branch_tracking_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending requests (to cancel)
CREATE POLICY "Users can update own pending branch tracking requests"
ON branch_tracking_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id AND
  status = 'pending'
)
WITH CHECK (
  auth.uid() = user_id AND
  (status = 'pending' OR status = 'cancelled')
);

-- Admin users can view all requests (using function to avoid recursion)
CREATE POLICY "Admin users can view all branch tracking requests"
ON branch_tracking_requests
FOR SELECT
TO authenticated
USING (
  is_admin_user_for_rls()
  OR auth.jwt()->>'email' = 'admin@vetaps.com'
  OR auth.uid() = '15f7e23f-8b8f-4f73-ae2d-e75201d788bc'::uuid
);

-- Admin users can update all requests
CREATE POLICY "Admin users can update all branch tracking requests"
ON branch_tracking_requests
FOR UPDATE
TO authenticated
USING (
  is_admin_user_for_rls()
  OR auth.jwt()->>'email' = 'admin@vetaps.com'
  OR auth.uid() = '15f7e23f-8b8f-4f73-ae2d-e75201d788bc'::uuid
);


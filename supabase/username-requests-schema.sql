-- Schema for username_requests table
-- Run this in Supabase SQL Editor after creating the profiles table

-- Create username_requests table
CREATE TABLE IF NOT EXISTS username_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_username TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('week', 'month', 'year')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_username_requests_user_id ON username_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_username_requests_status ON username_requests(status);
CREATE INDEX IF NOT EXISTS idx_username_requests_username ON username_requests(requested_username);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_username_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_username_requests_updated_at_column
  BEFORE UPDATE ON username_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_username_requests_updated_at();

-- Enable RLS
ALTER TABLE username_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own requests
CREATE POLICY "Users can view own username requests"
ON username_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own username requests"
ON username_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending requests (to cancel)
CREATE POLICY "Users can update own pending requests"
ON username_requests
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

-- Admin can view all requests (using service role key)
-- Note: This requires service role key, not handled by RLS

-- Reserved usernames list (stored as a function for easy checking)
CREATE OR REPLACE FUNCTION is_reserved_username(username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN username IN (
    'admin', 'administrator', 'root', 'system',
    'login', 'signup', 'signin', 'logout',
    'api', 'www', 'mail', 'email',
    'support', 'help', 'contact', 'about',
    'dashboard', 'profile', 'settings', 'account',
    'p', 'u', 'user', 'users',
    'test', 'testing', 'dev', 'development',
    'null', 'undefined', 'true', 'false'
  ) OR LENGTH(username) < 3;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Enable RLS on username_requests table and create policies
-- This ensures admin users can read all requests while regular users can only read their own

-- Create a safe function to check if user is admin (for use in RLS policies)
-- This function bypasses RLS to avoid recursion
CREATE OR REPLACE FUNCTION is_admin_user_for_rls()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
STABLE
AS $$
BEGIN
  -- Check if user exists in admin_users table (bypasses RLS)
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
END;
$$;

-- Grant execute to authenticated users so it can be used in RLS policies
GRANT EXECUTE ON FUNCTION is_admin_user_for_rls() TO authenticated;

-- Enable RLS on username_requests table
ALTER TABLE IF EXISTS username_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own username requests" ON username_requests;
DROP POLICY IF EXISTS "Users can create their own username requests" ON username_requests;
DROP POLICY IF EXISTS "Admin users can view all username requests" ON username_requests;

-- Policy: Users can view their own username requests
CREATE POLICY "Users can view their own username requests"
ON username_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can create their own username requests
CREATE POLICY "Users can create their own username requests"
ON username_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Admin users can view all username requests
-- Uses is_admin_user_for_rls() function to avoid recursion
-- Also checks email and user_id directly as fallback
CREATE POLICY "Admin users can view all username requests"
ON username_requests
FOR SELECT
TO authenticated
USING (
  is_admin_user_for_rls()
  OR auth.jwt()->>'email' = 'admin@vetaps.com'
  OR auth.uid() = '15f7e23f-8b8f-4f73-ae2d-e75201d788bc'::uuid
);

-- Note: Updates and deletes should be handled through admin API routes only
-- Regular users should not be able to update or delete their requests directly


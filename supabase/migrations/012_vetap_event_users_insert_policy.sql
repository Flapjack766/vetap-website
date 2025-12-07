-- =====================================================
-- VETAP Event - Allow Users to Insert Their Own Record
-- =====================================================
-- This migration adds an RLS policy that allows users
-- to insert their own record in event_users during signup
-- =====================================================

-- Users can insert their own record (for signup)
-- This policy allows a user to create their own record
-- when they sign up, matching their auth.uid()
DROP POLICY IF EXISTS "Users can insert own record" ON event_users;
CREATE POLICY "Users can insert own record" ON event_users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Verify the policy was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'event_users' 
    AND policyname = 'Users can insert own record'
  ) THEN
    RAISE NOTICE '✅ Policy "Users can insert own record" created successfully';
  ELSE
    RAISE WARNING '⚠️ Policy "Users can insert own record" was not created';
  END IF;
END $$;


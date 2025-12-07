-- ============================================
-- Google Business Profile Connections
-- ============================================
-- This migration creates the table for storing Google Business Profile OAuth connections

CREATE TABLE IF NOT EXISTS google_business_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  google_account_email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  scope TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id) -- One connection per business
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_google_business_connections_business_id ON google_business_connections(business_id);
CREATE INDEX IF NOT EXISTS idx_google_business_connections_expires_at ON google_business_connections(expires_at);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_google_business_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_google_business_connections_updated_at_column
  BEFORE UPDATE ON google_business_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_google_business_connections_updated_at();

-- Enable RLS
ALTER TABLE google_business_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view connections for their own businesses
CREATE POLICY "Users can view own business Google connections"
ON google_business_connections
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = google_business_connections.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);

-- Users can create connections for their own businesses
CREATE POLICY "Users can create Google connections for own businesses"
ON google_business_connections
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = google_business_connections.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);
 
-- Users can update connections for their own businesses
CREATE POLICY "Users can update Google connections for own businesses"
ON google_business_connections
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = google_business_connections.business_id
    AND businesses.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = google_business_connections.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);

-- Users can delete connections for their own businesses
CREATE POLICY "Users can delete Google connections for own businesses"
ON google_business_connections
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = google_business_connections.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);

-- Admin users can view all connections
CREATE POLICY "Admin users can view all Google connections"
ON google_business_connections
FOR SELECT
TO authenticated
USING (
  is_admin_user_for_rls()
  OR auth.jwt()->>'email' = 'admin@vetaps.com'
  OR auth.uid() = '15f7e23f-8b8f-4f73-ae2d-e75201d788bc'::uuid
);

COMMENT ON TABLE google_business_connections IS 'Stores OAuth connections between businesses and Google Business Profile accounts';


-- ============================================
-- Branch Tracking System - Database Schema
-- ============================================
-- This migration creates all tables needed for the branch tracking dashboard
-- System: VETAP Branch Tracking & NFC Cards Analytics

-- ============================================
-- 1. Businesses Table (المنشآت)
-- ============================================

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  industry TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for businesses
CREATE INDEX IF NOT EXISTS idx_businesses_owner_user_id ON businesses(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_industry ON businesses(industry) WHERE industry IS NOT NULL;

-- ============================================
-- 2. Branches Table (الفروع)
-- ============================================

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country TEXT,
  city TEXT,
  district TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  google_maps_url TEXT,
  google_place_id TEXT,
  timezone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for branches
CREATE INDEX IF NOT EXISTS idx_branches_business_id ON branches(business_id);
CREATE INDEX IF NOT EXISTS idx_branches_google_place_id ON branches(google_place_id) WHERE google_place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_branches_location ON branches(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================
-- 3. Tracking Links Table (الروابط الفريدة)
-- ============================================
-- Note: Created before nfc_cards because nfc_cards references it

CREATE TABLE IF NOT EXISTS tracking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('google_maps_review', 'restaurant_page', 'menu_page', 'custom_url')),
  destination_url TEXT NOT NULL,
  show_intermediate_page BOOLEAN NOT NULL DEFAULT true,
  collect_feedback_first BOOLEAN NOT NULL DEFAULT false,
  selected_template TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for tracking_links
CREATE INDEX IF NOT EXISTS idx_tracking_links_business_id ON tracking_links(business_id);
CREATE INDEX IF NOT EXISTS idx_tracking_links_branch_id ON tracking_links(branch_id);
CREATE INDEX IF NOT EXISTS idx_tracking_links_slug ON tracking_links(slug);
CREATE INDEX IF NOT EXISTS idx_tracking_links_is_active ON tracking_links(is_active);
CREATE INDEX IF NOT EXISTS idx_tracking_links_destination_type ON tracking_links(destination_type);

-- ============================================
-- 4. NFC Cards Table (الكروت)
-- ============================================

CREATE TABLE IF NOT EXISTS nfc_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  nfc_uid TEXT UNIQUE,
  tracking_link_id UUID REFERENCES tracking_links(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for nfc_cards
CREATE INDEX IF NOT EXISTS idx_nfc_cards_branch_id ON nfc_cards(branch_id);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_tracking_link_id ON nfc_cards(tracking_link_id) WHERE tracking_link_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nfc_cards_nfc_uid ON nfc_cards(nfc_uid) WHERE nfc_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nfc_cards_is_active ON nfc_cards(is_active);

-- ============================================
-- 5. Tracking Events Table (أحداث التتبع)
-- ============================================

CREATE TABLE IF NOT EXISTS tracking_events (
  id BIGSERIAL PRIMARY KEY,
  tracking_link_id UUID NOT NULL REFERENCES tracking_links(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  card_id UUID REFERENCES nfc_cards(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash TEXT,
  country TEXT,
  city TEXT,
  user_agent TEXT,
  device_type TEXT,
  referrer TEXT,
  meta JSONB DEFAULT '{}'::jsonb
);

-- Indexes for tracking_events (critical for performance)
CREATE INDEX IF NOT EXISTS idx_tracking_events_tracking_link_id ON tracking_events(tracking_link_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_branch_id ON tracking_events(branch_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_business_id ON tracking_events(business_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_card_id ON tracking_events(card_id) WHERE card_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tracking_events_timestamp ON tracking_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_business_timestamp ON tracking_events(business_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_branch_timestamp ON tracking_events(branch_id, timestamp DESC);

-- ============================================
-- 6. Review Sync Table (مزامنة التقييمات)
-- ============================================

CREATE TABLE IF NOT EXISTS review_sync (
  id BIGSERIAL PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_reviews INTEGER NOT NULL DEFAULT 0,
  average_rating NUMERIC(3,2),
  new_reviews_count INTEGER DEFAULT 0,
  raw_payload JSONB
);

-- Indexes for review_sync
CREATE INDEX IF NOT EXISTS idx_review_sync_branch_id ON review_sync(branch_id);
CREATE INDEX IF NOT EXISTS idx_review_sync_business_id ON review_sync(business_id);
CREATE INDEX IF NOT EXISTS idx_review_sync_synced_at ON review_sync(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_sync_branch_synced ON review_sync(branch_id, synced_at DESC);

-- ============================================
-- 7. Page Templates Table (قوالب الصفحات)
-- ============================================

CREATE TABLE IF NOT EXISTS page_templates (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('restaurant_page', 'menu_page', 'custom')),
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for page_templates
CREATE INDEX IF NOT EXISTS idx_page_templates_type ON page_templates(type);

-- ============================================
-- 8. Functions for updating updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_branches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_nfc_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_tracking_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_page_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. Triggers for updated_at
-- ============================================

CREATE TRIGGER update_businesses_updated_at_column
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_businesses_updated_at();

CREATE TRIGGER update_branches_updated_at_column
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_branches_updated_at();

CREATE TRIGGER update_nfc_cards_updated_at_column
  BEFORE UPDATE ON nfc_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_nfc_cards_updated_at();

CREATE TRIGGER update_tracking_links_updated_at_column
  BEFORE UPDATE ON tracking_links
  FOR EACH ROW
  EXECUTE FUNCTION update_tracking_links_updated_at();

CREATE TRIGGER update_page_templates_updated_at_column
  BEFORE UPDATE ON page_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_page_templates_updated_at();

-- ============================================
-- 10. Enable RLS on all tables
-- ============================================
-- IMPORTANT: Row Level Security (RLS) is enabled on all tables to ensure:
-- 1. Users can only access their own data (business.owner_user_id = auth.uid())
-- 2. Multi-tenant isolation is enforced at the database level
-- 3. Public access is restricted except for specific use cases (tracking_links, tracking_events)
-- 4. Admin users have read access to all data for support purposes
--
-- NOTE: For tracking_events INSERT operations from public API (short links),
-- consider using Service Role key in API routes instead of relying on RLS policies
-- for better security and performance.

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. RLS Policies for businesses
-- ============================================
-- Core security principle: Users can only access businesses where
-- business.owner_user_id = auth.uid()
-- This ensures complete multi-tenant isolation.
--
-- FUTURE: For delegation/agency features, you can add a separate table
-- (e.g., business_delegations) and modify policies to check:
--   auth.uid() = owner_user_id OR EXISTS (SELECT 1 FROM business_delegations WHERE ...)
-- For now, only direct ownership is enforced.

CREATE POLICY "Users can view own businesses"
ON businesses
FOR SELECT
TO authenticated
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can create own businesses"
ON businesses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own businesses"
ON businesses
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete own businesses"
ON businesses
FOR DELETE
TO authenticated
USING (auth.uid() = owner_user_id);

CREATE POLICY "Admin users can view all businesses"
ON businesses
FOR SELECT
TO authenticated
USING (
  is_admin_user_for_rls()
  OR auth.jwt()->>'email' = 'admin@vetaps.com'
  OR auth.uid() = '15f7e23f-8b8f-4f73-ae2d-e75201d788bc'::uuid
);

-- ============================================
-- 12. RLS Policies for branches
-- ============================================
-- Security: Users can only access branches that belong to their businesses.
-- The check ensures: business.owner_user_id = auth.uid()

CREATE POLICY "Users can view branches of own businesses"
ON branches
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create branches for own businesses"
ON branches
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update branches of own businesses"
ON branches
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete branches of own businesses"
ON branches
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Admin users can view all branches"
ON branches
FOR SELECT
TO authenticated
USING (
  is_admin_user_for_rls()
  OR auth.jwt()->>'email' = 'admin@vetaps.com'
  OR auth.uid() = '15f7e23f-8b8f-4f73-ae2d-e75201d788bc'::uuid
);

-- ============================================
-- 13. RLS Policies for nfc_cards
-- ============================================

CREATE POLICY "Users can view cards of own branches"
ON nfc_cards
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM branches
    JOIN businesses ON businesses.id = branches.business_id
    WHERE branches.id = nfc_cards.branch_id
    AND businesses.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create cards for own branches"
ON nfc_cards
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM branches
    JOIN businesses ON businesses.id = branches.business_id
    WHERE branches.id = nfc_cards.branch_id
    AND businesses.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update cards of own branches"
ON nfc_cards
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM branches
    JOIN businesses ON businesses.id = branches.business_id
    WHERE branches.id = nfc_cards.branch_id
    AND businesses.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM branches
    JOIN businesses ON businesses.id = branches.business_id
    WHERE branches.id = nfc_cards.branch_id
    AND businesses.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete cards of own branches"
ON nfc_cards
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM branches
    JOIN businesses ON businesses.id = branches.business_id
    WHERE branches.id = nfc_cards.branch_id
    AND businesses.owner_user_id = auth.uid()
  )
);

-- ============================================
-- 14. RLS Policies for tracking_links
-- ============================================

CREATE POLICY "Users can view links of own businesses"
ON tracking_links
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = tracking_links.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create links for own businesses"
ON tracking_links
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = tracking_links.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update links of own businesses"
ON tracking_links
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = tracking_links.business_id
    AND businesses.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = tracking_links.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete links of own businesses"
ON tracking_links
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = tracking_links.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);

-- Public access for active tracking links (for redirects)
-- This allows anonymous users to access tracking links via short URLs
-- (e.g., /t/ab12cd) to redirect to destination URLs.
-- Only active links are accessible to prevent abuse.
CREATE POLICY "Public can view active tracking links"
ON tracking_links
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- ============================================
-- 15. RLS Policies for tracking_events
-- ============================================
-- IMPORTANT SECURITY NOTE:
-- While we allow public INSERT for tracking_events (needed for short link clicks),
-- it's RECOMMENDED to use Service Role key in API routes instead of this policy
-- for better security control and validation.
--
-- Best practice: Create API route (e.g., /api/track/[slug]) that:
-- 1. Uses Service Role key to bypass RLS
-- 2. Validates the tracking_link exists and is active
-- 3. Extracts IP, user-agent, and other metadata server-side
-- 4. Inserts the event with proper data validation
--
-- This policy is kept as a fallback, but API routes with Service Role are preferred.

CREATE POLICY "Users can view events of own businesses"
ON tracking_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = tracking_events.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);

-- Allow public/anonymous to insert events (for tracking)
-- NOTE: This is a fallback. Prefer using Service Role in API routes.
CREATE POLICY "Public can insert tracking events"
ON tracking_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admin users can view all tracking events"
ON tracking_events
FOR SELECT
TO authenticated
USING (
  is_admin_user_for_rls()
  OR auth.jwt()->>'email' = 'admin@vetaps.com'
  OR auth.uid() = '15f7e23f-8b8f-4f73-ae2d-e75201d788bc'::uuid
);

-- ============================================
-- 16. RLS Policies for review_sync
-- ============================================

CREATE POLICY "Users can view review sync of own businesses"
ON review_sync
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = review_sync.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create review sync for own businesses"
ON review_sync
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = review_sync.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update review sync of own businesses"
ON review_sync
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = review_sync.business_id
    AND businesses.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = review_sync.business_id
    AND businesses.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Admin users can view all review sync"
ON review_sync
FOR SELECT
TO authenticated
USING (
  is_admin_user_for_rls()
  OR auth.jwt()->>'email' = 'admin@vetaps.com'
  OR auth.uid() = '15f7e23f-8b8f-4f73-ae2d-e75201d788bc'::uuid
);

-- ============================================
-- 17. RLS Policies for page_templates
-- ============================================

-- Public read access for page templates
CREATE POLICY "Public can view page templates"
ON page_templates
FOR SELECT
TO anon, authenticated
USING (true);

-- Only admins can manage templates
CREATE POLICY "Admin users can manage page templates"
ON page_templates
FOR ALL
TO authenticated
USING (
  is_admin_user_for_rls()
  OR auth.jwt()->>'email' = 'admin@vetaps.com'
  OR auth.uid() = '15f7e23f-8b8f-4f73-ae2d-e75201d788bc'::uuid
)
WITH CHECK (
  is_admin_user_for_rls()
  OR auth.jwt()->>'email' = 'admin@vetaps.com'
  OR auth.uid() = '15f7e23f-8b8f-4f73-ae2d-e75201d788bc'::uuid
);

-- ============================================
-- 18. Helper function to generate unique slug
-- ============================================

CREATE OR REPLACE FUNCTION generate_tracking_slug()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generate 6 character random slug
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  -- Check if slug exists, if yes, regenerate
  WHILE EXISTS (SELECT 1 FROM tracking_links WHERE slug = result) LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 19. Comments for documentation
-- ============================================

COMMENT ON TABLE businesses IS 'Stores business/establishment information. Each business belongs to a VETAP user.';
COMMENT ON TABLE branches IS 'Stores branch locations for each business. Includes Google Maps integration.';
COMMENT ON TABLE nfc_cards IS 'Stores NFC card information linked to branches and tracking links.';
COMMENT ON TABLE tracking_links IS 'Core table for unique tracking links. Each link can redirect to Google Maps reviews or custom pages.';
COMMENT ON TABLE tracking_events IS 'Logs all link clicks and interactions. High-volume table with time-series data.';
COMMENT ON TABLE review_sync IS 'Stores snapshots of Google Maps reviews data synced from Google API.';
COMMENT ON TABLE page_templates IS 'Stores page template configurations for intermediate pages before redirect.';


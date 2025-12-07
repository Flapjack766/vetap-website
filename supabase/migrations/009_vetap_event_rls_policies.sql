-- =====================================================
-- VETAP Event - Row Level Security (RLS) Policies
-- =====================================================
-- This migration creates RLS policies for multi-tenant security
-- Each partner can only access their own data
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE event_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_pass_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_api_keys ENABLE ROW LEVEL SECURITY;

-- ==================== Helper Function: Get Current User Partner ID ====================
-- This function gets the partner_id of the current authenticated user
CREATE OR REPLACE FUNCTION get_current_user_partner_id()
RETURNS UUID AS $$
DECLARE
  user_partner_id UUID;
BEGIN
  SELECT partner_id INTO user_partner_id
  FROM event_users
  WHERE id = auth.uid();
  
  RETURN user_partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== Helper Function: Check if User is Owner ====================
CREATE OR REPLACE FUNCTION is_user_owner()
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val user_role;
BEGIN
  SELECT role INTO user_role_val
  FROM event_users
  WHERE id = auth.uid();
  
  RETURN user_role_val = 'owner';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== Helper Function: Check User Role ====================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  user_role_val user_role;
BEGIN
  SELECT role INTO user_role_val
  FROM event_users
  WHERE id = auth.uid();
  
  RETURN user_role_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== Partners Policies ====================
-- Owners can see all partners
CREATE POLICY "Owners can view all partners"
  ON event_partners FOR SELECT
  USING (is_user_owner());

-- Partners can view their own data
CREATE POLICY "Partners can view own data"
  ON event_partners FOR SELECT
  USING (id = get_current_user_partner_id());

-- Owners can insert partners
CREATE POLICY "Owners can insert partners"
  ON event_partners FOR INSERT
  WITH CHECK (is_user_owner());

-- Owners can update partners
CREATE POLICY "Owners can update partners"
  ON event_partners FOR UPDATE
  USING (is_user_owner())
  WITH CHECK (is_user_owner());

-- Partners can update their own data
CREATE POLICY "Partners can update own data"
  ON event_partners FOR UPDATE
  USING (id = get_current_user_partner_id())
  WITH CHECK (id = get_current_user_partner_id());

-- ==================== Users Policies ====================
-- Users can view their own data
CREATE POLICY "Users can view own data"
  ON event_users FOR SELECT
  USING (id = auth.uid());

-- Users can view users in their partner
CREATE POLICY "Users can view partner users"
  ON event_users FOR SELECT
  USING (
    partner_id = get_current_user_partner_id() 
    OR is_user_owner()
  );

-- Users can insert their own record (for signup)
CREATE POLICY "Users can insert own record"
  ON event_users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Owners can insert users
CREATE POLICY "Owners can insert users"
  ON event_users FOR INSERT
  WITH CHECK (is_user_owner());

-- Partner admins can insert users for their partner
CREATE POLICY "Partner admins can insert users"
  ON event_users FOR INSERT
  WITH CHECK (
    get_user_role() = 'partner_admin' 
    AND partner_id = get_current_user_partner_id()
  );

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON event_users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Partner admins can update users in their partner
CREATE POLICY "Partner admins can update partner users"
  ON event_users FOR UPDATE
  USING (
    partner_id = get_current_user_partner_id() 
    AND (get_user_role() = 'partner_admin' OR is_user_owner())
  )
  WITH CHECK (
    partner_id = get_current_user_partner_id() 
    AND (get_user_role() = 'partner_admin' OR is_user_owner())
  );

-- ==================== Venues Policies ====================
-- All authenticated users can view venues (they're shared)
CREATE POLICY "Authenticated users can view venues"
  ON event_venues FOR SELECT
  USING (auth.role() = 'authenticated');

-- Owners and partner admins can insert venues
CREATE POLICY "Owners and admins can insert venues"
  ON event_venues FOR INSERT
  WITH CHECK (is_user_owner() OR get_user_role() = 'partner_admin');

-- Owners and partner admins can update venues
CREATE POLICY "Owners and admins can update venues"
  ON event_venues FOR UPDATE
  USING (is_user_owner() OR get_user_role() = 'partner_admin')
  WITH CHECK (is_user_owner() OR get_user_role() = 'partner_admin');

-- ==================== Templates Policies ====================
-- Users can view global templates (partner_id IS NULL)
CREATE POLICY "Users can view global templates"
  ON event_templates FOR SELECT
  USING (partner_id IS NULL OR partner_id = get_current_user_partner_id() OR is_user_owner());

-- Partners can insert templates for their partner
CREATE POLICY "Partners can insert own templates"
  ON event_templates FOR INSERT
  WITH CHECK (
    partner_id = get_current_user_partner_id() 
    OR is_user_owner()
  );

-- Partners can update their own templates
CREATE POLICY "Partners can update own templates"
  ON event_templates FOR UPDATE
  USING (
    partner_id = get_current_user_partner_id() 
    OR is_user_owner()
  )
  WITH CHECK (
    partner_id = get_current_user_partner_id() 
    OR is_user_owner()
  );

-- ==================== Events Policies ====================
-- Users can view events from their partner
CREATE POLICY "Users can view partner events"
  ON event_events FOR SELECT
  USING (
    partner_id = get_current_user_partner_id() 
    OR is_user_owner()
  );

-- Organizers and admins can insert events for their partner
CREATE POLICY "Organizers can insert events"
  ON event_events FOR INSERT
  WITH CHECK (
    partner_id = get_current_user_partner_id() 
    AND (
      get_user_role() = 'organizer' 
      OR get_user_role() = 'partner_admin' 
      OR is_user_owner()
    )
  );

-- Organizers and admins can update events for their partner
CREATE POLICY "Organizers can update events"
  ON event_events FOR UPDATE
  USING (
    partner_id = get_current_user_partner_id() 
    AND (
      get_user_role() = 'organizer' 
      OR get_user_role() = 'partner_admin' 
      OR is_user_owner()
    )
  )
  WITH CHECK (
    partner_id = get_current_user_partner_id() 
    AND (
      get_user_role() = 'organizer' 
      OR get_user_role() = 'partner_admin' 
      OR is_user_owner()
    )
  );

-- Organizers and admins can delete events for their partner
CREATE POLICY "Organizers can delete events"
  ON event_events FOR DELETE
  USING (
    partner_id = get_current_user_partner_id() 
    AND (
      get_user_role() = 'organizer' 
      OR get_user_role() = 'partner_admin' 
      OR is_user_owner()
    )
  );

-- ==================== Zones Policies ====================
-- Users can view zones from events in their partner
CREATE POLICY "Users can view partner zones"
  ON event_zones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_zones.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
    )
    OR is_user_owner()
  );

-- Organizers can insert zones for their partner's events
CREATE POLICY "Organizers can insert zones"
  ON event_zones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_zones.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
      AND (
        get_user_role() = 'organizer' 
        OR get_user_role() = 'partner_admin' 
        OR is_user_owner()
      )
    )
  );

-- Organizers can update zones for their partner's events
CREATE POLICY "Organizers can update zones"
  ON event_zones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_zones.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
      AND (
        get_user_role() = 'organizer' 
        OR get_user_role() = 'partner_admin' 
        OR is_user_owner()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_zones.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
      AND (
        get_user_role() = 'organizer' 
        OR get_user_role() = 'partner_admin' 
        OR is_user_owner()
      )
    )
  );

-- ==================== Gates Policies ====================
-- Users can view gates from events in their partner
CREATE POLICY "Users can view partner gates"
  ON event_gates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_gates.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
    )
    OR is_user_owner()
  );

-- Organizers and gate staff can insert gates
CREATE POLICY "Organizers can insert gates"
  ON event_gates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_gates.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
      AND (
        get_user_role() = 'organizer' 
        OR get_user_role() = 'partner_admin' 
        OR get_user_role() = 'gate_staff'
        OR is_user_owner()
      )
    )
  );

-- Organizers and gate staff can update gates
CREATE POLICY "Organizers can update gates"
  ON event_gates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_gates.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
      AND (
        get_user_role() = 'organizer' 
        OR get_user_role() = 'partner_admin' 
        OR get_user_role() = 'gate_staff'
        OR is_user_owner()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_gates.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
      AND (
        get_user_role() = 'organizer' 
        OR get_user_role() = 'partner_admin' 
        OR get_user_role() = 'gate_staff'
        OR is_user_owner()
      )
    )
  );

-- ==================== Guests Policies ====================
-- Users can view guests from events in their partner
CREATE POLICY "Users can view partner guests"
  ON event_guests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_guests.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
    )
    OR is_user_owner()
  );

-- Organizers can insert guests for their partner's events
CREATE POLICY "Organizers can insert guests"
  ON event_guests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_guests.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
      AND (
        get_user_role() = 'organizer' 
        OR get_user_role() = 'partner_admin' 
        OR is_user_owner()
      )
    )
  );

-- Organizers can update guests for their partner's events
CREATE POLICY "Organizers can update guests"
  ON event_guests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_guests.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
      AND (
        get_user_role() = 'organizer' 
        OR get_user_role() = 'partner_admin' 
        OR is_user_owner()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_guests.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
      AND (
        get_user_role() = 'organizer' 
        OR get_user_role() = 'partner_admin' 
        OR is_user_owner()
      )
    )
  );

-- ==================== Passes Policies ====================
-- Users can view passes from events in their partner
CREATE POLICY "Users can view partner passes"
  ON event_passes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_passes.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
    )
    OR is_user_owner()
  );

-- Organizers can insert passes for their partner's events
CREATE POLICY "Organizers can insert passes"
  ON event_passes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_passes.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
      AND (
        get_user_role() = 'organizer' 
        OR get_user_role() = 'partner_admin' 
        OR is_user_owner()
      )
    )
  );

-- Organizers and gate staff can update passes (for check-in)
CREATE POLICY "Organizers and gate staff can update passes"
  ON event_passes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_passes.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
      AND (
        get_user_role() = 'organizer' 
        OR get_user_role() = 'partner_admin' 
        OR get_user_role() = 'gate_staff'
        OR is_user_owner()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_passes.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
      AND (
        get_user_role() = 'organizer' 
        OR get_user_role() = 'partner_admin' 
        OR get_user_role() = 'gate_staff'
        OR is_user_owner()
      )
    )
  );

-- ==================== Pass Zones Policies ====================
-- Users can view pass zones from their partner's passes
CREATE POLICY "Users can view partner pass zones"
  ON event_pass_zones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_passes 
      JOIN event_events ON event_events.id = event_passes.event_id
      WHERE event_passes.id = event_pass_zones.pass_id 
      AND event_events.partner_id = get_current_user_partner_id()
    )
    OR is_user_owner()
  );

-- Organizers can insert pass zones
CREATE POLICY "Organizers can insert pass zones"
  ON event_pass_zones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_passes 
      JOIN event_events ON event_events.id = event_passes.event_id
      WHERE event_passes.id = event_pass_zones.pass_id 
      AND event_events.partner_id = get_current_user_partner_id()
      AND (
        get_user_role() = 'organizer' 
        OR get_user_role() = 'partner_admin' 
        OR is_user_owner()
      )
    )
  );

-- ==================== Scan Logs Policies ====================
-- Users can view scan logs from events in their partner
CREATE POLICY "Users can view partner scan logs"
  ON event_scan_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_scan_logs.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
    )
    OR is_user_owner()
  );

-- Gate staff and organizers can insert scan logs
CREATE POLICY "Gate staff can insert scan logs"
  ON event_scan_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_events 
      WHERE event_events.id = event_scan_logs.event_id 
      AND event_events.partner_id = get_current_user_partner_id()
      AND (
        get_user_role() = 'gate_staff' 
        OR get_user_role() = 'organizer' 
        OR get_user_role() = 'partner_admin'
        OR is_user_owner()
      )
    )
  );

-- ==================== Webhook Endpoints Policies ====================
-- Partners can view their own webhook endpoints
CREATE POLICY "Partners can view own webhooks"
  ON event_webhook_endpoints FOR SELECT
  USING (
    partner_id = get_current_user_partner_id() 
    OR is_user_owner()
  );

-- Partners can insert webhook endpoints
CREATE POLICY "Partners can insert webhooks"
  ON event_webhook_endpoints FOR INSERT
  WITH CHECK (
    partner_id = get_current_user_partner_id() 
    AND (
      get_user_role() = 'partner_admin' 
      OR is_user_owner()
    )
  );

-- Partners can update their webhook endpoints
CREATE POLICY "Partners can update own webhooks"
  ON event_webhook_endpoints FOR UPDATE
  USING (
    partner_id = get_current_user_partner_id() 
    AND (
      get_user_role() = 'partner_admin' 
      OR is_user_owner()
    )
  )
  WITH CHECK (
    partner_id = get_current_user_partner_id() 
    AND (
      get_user_role() = 'partner_admin' 
      OR is_user_owner()
    )
  );

-- ==================== API Keys Policies ====================
-- Partners can view their own API keys
CREATE POLICY "Partners can view own api keys"
  ON event_api_keys FOR SELECT
  USING (
    partner_id = get_current_user_partner_id() 
    OR is_user_owner()
  );

-- Partner admins can insert API keys
CREATE POLICY "Partner admins can insert api keys"
  ON event_api_keys FOR INSERT
  WITH CHECK (
    partner_id = get_current_user_partner_id() 
    AND (
      get_user_role() = 'partner_admin' 
      OR is_user_owner()
    )
  );

-- Partner admins can update their API keys
CREATE POLICY "Partner admins can update own api keys"
  ON event_api_keys FOR UPDATE
  USING (
    partner_id = get_current_user_partner_id() 
    AND (
      get_user_role() = 'partner_admin' 
      OR is_user_owner()
    )
  )
  WITH CHECK (
    partner_id = get_current_user_partner_id() 
    AND (
      get_user_role() = 'partner_admin' 
      OR is_user_owner()
    )
  );

-- ==================== Comments ====================
COMMENT ON FUNCTION get_current_user_partner_id() IS 'Gets the partner_id of the current authenticated user';
COMMENT ON FUNCTION is_user_owner() IS 'Checks if the current user is an owner';
COMMENT ON FUNCTION get_user_role() IS 'Gets the role of the current user';


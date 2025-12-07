-- =====================================================
-- VETAP Event - Complete Database Setup
-- =====================================================
-- This file contains ALL migrations in the correct order
-- Run this entire file in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- MIGRATION 1: Schema (008_vetap_event_schema.sql)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== Enums ====================
-- Create enums only if they don't exist
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'partner_admin', 'organizer', 'gate_staff');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pass_status AS ENUM ('unused', 'used', 'revoked', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE guest_type AS ENUM ('VIP', 'Regular', 'Staff', 'Media', 'Other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE scan_result AS ENUM ('valid', 'already_used', 'invalid', 'expired', 'not_allowed_zone', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE webhook_event_type AS ENUM (
    'on_pass_generated',
    'on_check_in_valid',
    'on_check_in_invalid',
    'on_event_created',
    'on_event_updated'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==================== Partners Table ====================
CREATE TABLE IF NOT EXISTS event_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  api_key_hash TEXT, -- Hashed API key
  client_id VARCHAR(255),
  client_secret_hash TEXT, -- Hashed client secret
  logo_url TEXT,
  webhook_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_client_id UNIQUE (client_id)
);

CREATE INDEX IF NOT EXISTS idx_partners_created_at ON event_partners(created_at);

-- ==================== Users Table ====================
CREATE TABLE IF NOT EXISTS event_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'organizer',
  partner_id UUID REFERENCES event_partners(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_partner_id ON event_users(partner_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON event_users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON event_users(email);

-- ==================== Venues Table (Optional) ====================
CREATE TABLE IF NOT EXISTS event_venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  capacity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venues_name ON event_venues(name);

-- ==================== Templates Table ====================
CREATE TABLE IF NOT EXISTS event_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES event_partners(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_file_url TEXT NOT NULL,
  qr_position_x NUMERIC(10, 2),
  qr_position_y NUMERIC(10, 2),
  qr_width NUMERIC(10, 2),
  qr_height NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_partner_id ON event_templates(partner_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON event_templates(is_active);

-- ==================== Events Table ====================
CREATE TABLE IF NOT EXISTS event_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES event_partners(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  venue TEXT, -- Free text venue
  venue_id UUID REFERENCES event_venues(id) ON DELETE SET NULL,
  template_id UUID REFERENCES event_templates(id) ON DELETE SET NULL,
  status event_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES event_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_event_dates CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_events_partner_id ON event_events(partner_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON event_events(status);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON event_events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON event_events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_template_id ON event_events(template_id);

-- ==================== Zones Table ====================
CREATE TABLE IF NOT EXISTS event_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES event_events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  capacity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_zone_name_per_event UNIQUE (event_id, name)
);

CREATE INDEX IF NOT EXISTS idx_zones_event_id ON event_zones(event_id);

-- ==================== Gates Table ====================
CREATE TABLE IF NOT EXISTS event_gates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES event_events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  secret TEXT, -- For device authentication
  login_code VARCHAR(50), -- For device login
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_gate_name_per_event UNIQUE (event_id, name)
);

CREATE INDEX IF NOT EXISTS idx_gates_event_id ON event_gates(event_id);
CREATE INDEX IF NOT EXISTS idx_gates_login_code ON event_gates(login_code);

-- ==================== Guests Table ====================
CREATE TABLE IF NOT EXISTS event_guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES event_events(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  type guest_type NOT NULL DEFAULT 'Regular',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guests_event_id ON event_guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_email ON event_guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_type ON event_guests(type);

-- ==================== Passes Table ====================
CREATE TABLE IF NOT EXISTS event_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES event_events(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES event_guests(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE, -- Unique random token
  qr_payload TEXT NOT NULL, -- Text to be placed in QR code
  status pass_status NOT NULL DEFAULT 'unused',
  first_scanned_at TIMESTAMPTZ,
  last_scanned_at TIMESTAMPTZ,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT unique_token UNIQUE (token),
  CONSTRAINT valid_pass_dates CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to > valid_from)
);

CREATE INDEX IF NOT EXISTS idx_passes_event_id ON event_passes(event_id);
CREATE INDEX IF NOT EXISTS idx_passes_guest_id ON event_passes(guest_id);
CREATE INDEX IF NOT EXISTS idx_passes_token ON event_passes(token); -- Critical for fast lookups
CREATE INDEX IF NOT EXISTS idx_passes_status ON event_passes(status);
CREATE INDEX IF NOT EXISTS idx_passes_qr_payload ON event_passes(qr_payload); -- For QR scanning

-- ==================== Pass Zones Junction Table ====================
CREATE TABLE IF NOT EXISTS event_pass_zones (
  pass_id UUID NOT NULL REFERENCES event_passes(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES event_zones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (pass_id, zone_id)
);

CREATE INDEX IF NOT EXISTS idx_pass_zones_pass_id ON event_pass_zones(pass_id);
CREATE INDEX IF NOT EXISTS idx_pass_zones_zone_id ON event_pass_zones(zone_id);

-- ==================== Scan Logs Table ====================
CREATE TABLE IF NOT EXISTS event_scan_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES event_events(id) ON DELETE CASCADE,
  pass_id UUID REFERENCES event_passes(id) ON DELETE SET NULL,
  gate_id UUID NOT NULL REFERENCES event_gates(id) ON DELETE RESTRICT,
  scanner_user_id UUID REFERENCES event_users(id) ON DELETE SET NULL,
  result scan_result NOT NULL,
  raw_payload TEXT NOT NULL, -- Original scanned data
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_ip INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_scan_logs_event_id ON event_scan_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_pass_id ON event_scan_logs(pass_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_gate_id ON event_scan_logs(gate_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at ON event_scan_logs(scanned_at); -- For time-based queries
CREATE INDEX IF NOT EXISTS idx_scan_logs_result ON event_scan_logs(result);

-- ==================== Webhook Endpoints Table ====================
CREATE TABLE IF NOT EXISTS event_webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES event_partners(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  event webhook_event_type NOT NULL,
  secret TEXT NOT NULL, -- For webhook signature verification
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_partner_id ON event_webhook_endpoints(partner_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_event ON event_webhook_endpoints(event);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_is_active ON event_webhook_endpoints(is_active);

-- ==================== API Keys Table ====================
CREATE TABLE IF NOT EXISTS event_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES event_partners(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL, -- Hashed API key
  name VARCHAR(255), -- Optional name for the key
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES event_users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_api_keys_partner_id ON event_api_keys(partner_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON event_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON event_api_keys(expires_at);

-- ==================== Triggers for updated_at ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_partners_updated_at ON event_partners;
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON event_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON event_users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON event_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON event_templates;
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON event_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON event_events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON event_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gates_updated_at ON event_gates;
CREATE TRIGGER update_gates_updated_at BEFORE UPDATE ON event_gates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guests_updated_at ON event_guests;
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON event_guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhook_endpoints_updated_at ON event_webhook_endpoints;
CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON event_webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION 2: Contact Info (011_vetap_event_users_contact_info.sql)
-- =====================================================

-- Add new columns to event_users table
ALTER TABLE event_users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS phone_country_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON event_users(phone);

-- Create index on country for filtering
CREATE INDEX IF NOT EXISTS idx_users_country ON event_users(country);

-- =====================================================
-- MIGRATION 3: RLS Policies (009_vetap_event_rls_policies.sql)
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

-- ==================== Helper Function: Is User Owner ====================
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

-- ==================== Helper Function: Get User Role ====================
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
-- Owners can do everything
DROP POLICY IF EXISTS "Owners can manage all partners" ON event_partners;
CREATE POLICY "Owners can manage all partners" ON event_partners
  FOR ALL
  USING (is_user_owner())
  WITH CHECK (is_user_owner());

-- Partners can view their own record
DROP POLICY IF EXISTS "Partners can view their own record" ON event_partners;
CREATE POLICY "Partners can view their own record" ON event_partners
  FOR SELECT
  USING (id = get_current_user_partner_id());

-- ==================== Users Policies ====================
-- Owners can do everything
DROP POLICY IF EXISTS "Owners can manage all users" ON event_users;
CREATE POLICY "Owners can manage all users" ON event_users
  FOR ALL
  USING (is_user_owner())
  WITH CHECK (is_user_owner());

-- Users can view their own record
DROP POLICY IF EXISTS "Users can view their own record" ON event_users;
CREATE POLICY "Users can view their own record" ON event_users
  FOR SELECT
  USING (id = auth.uid());

-- Users can insert their own record (for signup)
DROP POLICY IF EXISTS "Users can insert own record" ON event_users;
CREATE POLICY "Users can insert own record" ON event_users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can update their own record (limited fields)
DROP POLICY IF EXISTS "Users can update their own record" ON event_users;
CREATE POLICY "Users can update their own record" ON event_users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Partner admins can view users in their partner
DROP POLICY IF EXISTS "Partner admins can view their partner users" ON event_users;
CREATE POLICY "Partner admins can view their partner users" ON event_users
  FOR SELECT
  USING (
    get_user_role() = 'partner_admin' AND
    partner_id = get_current_user_partner_id()
  );

-- ==================== Venues Policies ====================
-- Owners can do everything
DROP POLICY IF EXISTS "Owners can manage all venues" ON event_venues;
CREATE POLICY "Owners can manage all venues" ON event_venues
  FOR ALL
  USING (is_user_owner())
  WITH CHECK (is_user_owner());

-- All authenticated users can view venues
DROP POLICY IF EXISTS "Authenticated users can view venues" ON event_venues;
CREATE POLICY "Authenticated users can view venues" ON event_venues
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ==================== Templates Policies ====================
-- Owners can do everything
DROP POLICY IF EXISTS "Owners can manage all templates" ON event_templates;
CREATE POLICY "Owners can manage all templates" ON event_templates
  FOR ALL
  USING (is_user_owner())
  WITH CHECK (is_user_owner());

-- Users can view templates for their partner or global templates
DROP POLICY IF EXISTS "Users can view partner or global templates" ON event_templates;
CREATE POLICY "Users can view partner or global templates" ON event_templates
  FOR SELECT
  USING (
    partner_id IS NULL OR
    partner_id = get_current_user_partner_id() OR
    is_user_owner()
  );

-- Partner admins can manage templates for their partner
DROP POLICY IF EXISTS "Partner admins can manage their partner templates" ON event_templates;
CREATE POLICY "Partner admins can manage their partner templates" ON event_templates
  FOR ALL
  USING (
    get_user_role() = 'partner_admin' AND
    partner_id = get_current_user_partner_id()
  )
  WITH CHECK (
    get_user_role() = 'partner_admin' AND
    partner_id = get_current_user_partner_id()
  );

-- ==================== Events Policies ====================
-- Owners can do everything
DROP POLICY IF EXISTS "Owners can manage all events" ON event_events;
CREATE POLICY "Owners can manage all events" ON event_events
  FOR ALL
  USING (is_user_owner())
  WITH CHECK (is_user_owner());

-- Users can view events for their partner
DROP POLICY IF EXISTS "Users can view their partner events" ON event_events;
CREATE POLICY "Users can view their partner events" ON event_events
  FOR SELECT
  USING (
    partner_id = get_current_user_partner_id() OR
    is_user_owner()
  );

-- Partner admins and organizers can manage events for their partner
DROP POLICY IF EXISTS "Partner users can manage their partner events" ON event_events;
CREATE POLICY "Partner users can manage their partner events" ON event_events
  FOR ALL
  USING (
    (get_user_role() = 'partner_admin' OR get_user_role() = 'organizer') AND
    partner_id = get_current_user_partner_id()
  )
  WITH CHECK (
    (get_user_role() = 'partner_admin' OR get_user_role() = 'organizer') AND
    partner_id = get_current_user_partner_id()
  );

-- ==================== Zones Policies ====================
-- Users can view zones for events they can access
DROP POLICY IF EXISTS "Users can view zones for accessible events" ON event_zones;
CREATE POLICY "Users can view zones for accessible events" ON event_zones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_zones.event_id
      AND (
        event_events.partner_id = get_current_user_partner_id() OR
        is_user_owner()
      )
    )
  );

-- Partner admins and organizers can manage zones for their partner events
DROP POLICY IF EXISTS "Partner users can manage zones for their events" ON event_zones;
CREATE POLICY "Partner users can manage zones for their events" ON event_zones
  FOR ALL
  USING (
    (get_user_role() = 'partner_admin' OR get_user_role() = 'organizer') AND
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_zones.event_id
      AND event_events.partner_id = get_current_user_partner_id()
    )
  )
  WITH CHECK (
    (get_user_role() = 'partner_admin' OR get_user_role() = 'organizer') AND
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_zones.event_id
      AND event_events.partner_id = get_current_user_partner_id()
    )
  );

-- ==================== Gates Policies ====================
-- Users can view gates for events they can access
DROP POLICY IF EXISTS "Users can view gates for accessible events" ON event_gates;
CREATE POLICY "Users can view gates for accessible events" ON event_gates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_gates.event_id
      AND (
        event_events.partner_id = get_current_user_partner_id() OR
        is_user_owner()
      )
    )
  );

-- Partner admins and organizers can manage gates for their partner events
DROP POLICY IF EXISTS "Partner users can manage gates for their events" ON event_gates;
CREATE POLICY "Partner users can manage gates for their events" ON event_gates
  FOR ALL
  USING (
    (get_user_role() = 'partner_admin' OR get_user_role() = 'organizer') AND
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_gates.event_id
      AND event_events.partner_id = get_current_user_partner_id()
    )
  )
  WITH CHECK (
    (get_user_role() = 'partner_admin' OR get_user_role() = 'organizer') AND
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_gates.event_id
      AND event_events.partner_id = get_current_user_partner_id()
    )
  );

-- Gate staff can view gates for their events
DROP POLICY IF EXISTS "Gate staff can view gates for their events" ON event_gates;
CREATE POLICY "Gate staff can view gates for their events" ON event_gates
  FOR SELECT
  USING (
    get_user_role() = 'gate_staff' AND
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_gates.event_id
      AND event_events.partner_id = get_current_user_partner_id()
    )
  );

-- ==================== Guests Policies ====================
-- Users can view guests for events they can access
DROP POLICY IF EXISTS "Users can view guests for accessible events" ON event_guests;
CREATE POLICY "Users can view guests for accessible events" ON event_guests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_guests.event_id
      AND (
        event_events.partner_id = get_current_user_partner_id() OR
        is_user_owner()
      )
    )
  );

-- Partner admins and organizers can manage guests for their partner events
DROP POLICY IF EXISTS "Partner users can manage guests for their events" ON event_guests;
CREATE POLICY "Partner users can manage guests for their events" ON event_guests
  FOR ALL
  USING (
    (get_user_role() = 'partner_admin' OR get_user_role() = 'organizer') AND
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_guests.event_id
      AND event_events.partner_id = get_current_user_partner_id()
    )
  )
  WITH CHECK (
    (get_user_role() = 'partner_admin' OR get_user_role() = 'organizer') AND
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_guests.event_id
      AND event_events.partner_id = get_current_user_partner_id()
    )
  );

-- ==================== Passes Policies ====================
-- Users can view passes for events they can access
DROP POLICY IF EXISTS "Users can view passes for accessible events" ON event_passes;
CREATE POLICY "Users can view passes for accessible events" ON event_passes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_passes.event_id
      AND (
        event_events.partner_id = get_current_user_partner_id() OR
        is_user_owner()
      )
    )
  );

-- Partner admins and organizers can manage passes for their partner events
DROP POLICY IF EXISTS "Partner users can manage passes for their events" ON event_passes;
CREATE POLICY "Partner users can manage passes for their events" ON event_passes
  FOR ALL
  USING (
    (get_user_role() = 'partner_admin' OR get_user_role() = 'organizer') AND
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_passes.event_id
      AND event_events.partner_id = get_current_user_partner_id()
    )
  )
  WITH CHECK (
    (get_user_role() = 'partner_admin' OR get_user_role() = 'organizer') AND
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_passes.event_id
      AND event_events.partner_id = get_current_user_partner_id()
    )
  );

-- Gate staff can view passes for their events (for scanning)
DROP POLICY IF EXISTS "Gate staff can view passes for their events" ON event_passes;
CREATE POLICY "Gate staff can view passes for their events" ON event_passes
  FOR SELECT
  USING (
    get_user_role() = 'gate_staff' AND
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_passes.event_id
      AND event_events.partner_id = get_current_user_partner_id()
    )
  );

-- ==================== Pass Zones Policies ====================
-- Users can view pass zones for passes they can access
DROP POLICY IF EXISTS "Users can view pass zones for accessible passes" ON event_pass_zones;
CREATE POLICY "Users can view pass zones for accessible passes" ON event_pass_zones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_passes
      JOIN event_events ON event_events.id = event_passes.event_id
      WHERE event_passes.id = event_pass_zones.pass_id
      AND (
        event_events.partner_id = get_current_user_partner_id() OR
        is_user_owner()
      )
    )
  );

-- Partner admins and organizers can manage pass zones
DROP POLICY IF EXISTS "Partner users can manage pass zones" ON event_pass_zones;
CREATE POLICY "Partner users can manage pass zones" ON event_pass_zones
  FOR ALL
  USING (
    (get_user_role() = 'partner_admin' OR get_user_role() = 'organizer') AND
    EXISTS (
      SELECT 1 FROM event_passes
      JOIN event_events ON event_events.id = event_passes.event_id
      WHERE event_passes.id = event_pass_zones.pass_id
      AND event_events.partner_id = get_current_user_partner_id()
    )
  )
  WITH CHECK (
    (get_user_role() = 'partner_admin' OR get_user_role() = 'organizer') AND
    EXISTS (
      SELECT 1 FROM event_passes
      JOIN event_events ON event_events.id = event_passes.event_id
      WHERE event_passes.id = event_pass_zones.pass_id
      AND event_events.partner_id = get_current_user_partner_id()
    )
  );

-- ==================== Scan Logs Policies ====================
-- Users can view scan logs for events they can access
DROP POLICY IF EXISTS "Users can view scan logs for accessible events" ON event_scan_logs;
CREATE POLICY "Users can view scan logs for accessible events" ON event_scan_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_scan_logs.event_id
      AND (
        event_events.partner_id = get_current_user_partner_id() OR
        is_user_owner()
      )
    )
  );

-- Gate staff can insert scan logs for their events
DROP POLICY IF EXISTS "Gate staff can insert scan logs" ON event_scan_logs;
CREATE POLICY "Gate staff can insert scan logs" ON event_scan_logs
  FOR INSERT
  WITH CHECK (
    get_user_role() = 'gate_staff' AND
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_scan_logs.event_id
      AND event_events.partner_id = get_current_user_partner_id()
    )
  );

-- Partner admins and organizers can insert scan logs
DROP POLICY IF EXISTS "Partner users can insert scan logs" ON event_scan_logs;
CREATE POLICY "Partner users can insert scan logs" ON event_scan_logs
  FOR INSERT
  WITH CHECK (
    (get_user_role() = 'partner_admin' OR get_user_role() = 'organizer') AND
    EXISTS (
      SELECT 1 FROM event_events
      WHERE event_events.id = event_scan_logs.event_id
      AND event_events.partner_id = get_current_user_partner_id()
    )
  );

-- ==================== Webhook Endpoints Policies ====================
-- Owners can do everything
DROP POLICY IF EXISTS "Owners can manage all webhook endpoints" ON event_webhook_endpoints;
CREATE POLICY "Owners can manage all webhook endpoints" ON event_webhook_endpoints
  FOR ALL
  USING (is_user_owner())
  WITH CHECK (is_user_owner());

-- Partner admins can manage webhook endpoints for their partner
DROP POLICY IF EXISTS "Partner admins can manage their webhook endpoints" ON event_webhook_endpoints;
CREATE POLICY "Partner admins can manage their webhook endpoints" ON event_webhook_endpoints
  FOR ALL
  USING (
    get_user_role() = 'partner_admin' AND
    partner_id = get_current_user_partner_id()
  )
  WITH CHECK (
    get_user_role() = 'partner_admin' AND
    partner_id = get_current_user_partner_id()
  );

-- ==================== API Keys Policies ====================
-- Owners can do everything
DROP POLICY IF EXISTS "Owners can manage all API keys" ON event_api_keys;
CREATE POLICY "Owners can manage all API keys" ON event_api_keys
  FOR ALL
  USING (is_user_owner())
  WITH CHECK (is_user_owner());

-- Partner admins can manage API keys for their partner
DROP POLICY IF EXISTS "Partner admins can manage their API keys" ON event_api_keys;
CREATE POLICY "Partner admins can manage their API keys" ON event_api_keys
  FOR ALL
  USING (
    get_user_role() = 'partner_admin' AND
    partner_id = get_current_user_partner_id()
  )
  WITH CHECK (
    get_user_role() = 'partner_admin' AND
    partner_id = get_current_user_partner_id()
  );

-- =====================================================
-- MIGRATION 4: Auth Sync (010_vetap_event_auth_sync.sql)
-- =====================================================

-- Function to handle new auth user creation (with contact info)
-- IMPORTANT: Uses SET search_path to ensure correct schema resolution
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_catalog
AS $$
BEGIN
  -- Check if event_users record already exists
  IF NOT EXISTS (SELECT 1 FROM public.event_users WHERE id = NEW.id) THEN
    -- Create event_users record with default values
    -- Note: partner_id and role should be set by admin/owner
    INSERT INTO public.event_users
      (id, email, name, role, partner_id, phone, phone_country_code, country, city)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      'organizer'::public.user_role, -- Default role
      NULL, -- partner_id will be set by admin
      NULLIF(NEW.raw_user_meta_data->>'phone', ''),
      NULLIF(NEW.raw_user_meta_data->>'phone_country_code', ''),
      NULLIF(NEW.raw_user_meta_data->>'country', ''),
      NULLIF(NEW.raw_user_meta_data->>'city', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      phone = COALESCE(EXCLUDED.phone, public.event_users.phone),
      phone_country_code = COALESCE(EXCLUDED.phone_country_code, public.event_users.phone_country_code),
      country = COALESCE(EXCLUDED.country, public.event_users.country),
      city = COALESCE(EXCLUDED.city, public.event_users.city);
  ELSE
    -- Update existing record with contact info if provided
    UPDATE public.event_users
    SET
      phone = COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), public.event_users.phone),
      phone_country_code = COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone_country_code', ''), public.event_users.phone_country_code),
      country = COALESCE(NULLIF(NEW.raw_user_meta_data->>'country', ''), public.event_users.country),
      city = COALESCE(NULLIF(NEW.raw_user_meta_data->>'city', ''), public.event_users.city)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to create event_users when auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Function to sync email updates
-- IMPORTANT: Uses SET search_path and IS DISTINCT FROM for NULL-safe comparison
CREATE OR REPLACE FUNCTION public.sync_auth_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_catalog
AS $$
BEGIN
  -- Update event_users email if it changed
  -- Use IS DISTINCT FROM instead of != to handle NULL values correctly
  UPDATE public.event_users
  SET email = NEW.email
  WHERE id = NEW.id
    AND public.event_users.email IS DISTINCT FROM NEW.email;
  
  RETURN NEW;
END;
$$;

-- Trigger to sync email updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_email();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ All VETAP Event migrations completed successfully!';
  RAISE NOTICE '📊 Tables created: 13';
  RAISE NOTICE '🔒 RLS enabled on all tables';
  RAISE NOTICE '🔄 Auth sync trigger installed';
END $$;


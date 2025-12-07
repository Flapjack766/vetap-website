-- =====================================================
-- VETAP Event - Database Schema
-- =====================================================
-- This migration creates the complete database schema
-- for the VETAP Event ticketing/access platform
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== Enums ====================
CREATE TYPE user_role AS ENUM ('owner', 'partner_admin', 'organizer', 'gate_staff');
CREATE TYPE event_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE pass_status AS ENUM ('unused', 'used', 'revoked', 'expired');
CREATE TYPE guest_type AS ENUM ('VIP', 'Regular', 'Staff', 'Media', 'Other');
CREATE TYPE scan_result AS ENUM ('valid', 'already_used', 'invalid', 'expired', 'not_allowed_zone', 'revoked');
CREATE TYPE webhook_event_type AS ENUM (
  'on_pass_generated',
  'on_check_in_valid',
  'on_check_in_invalid',
  'on_event_created',
  'on_event_updated'
);

-- ==================== Partners Table ====================
CREATE TABLE event_partners (
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

CREATE INDEX idx_partners_created_at ON event_partners(created_at);

-- ==================== Users Table ====================
CREATE TABLE event_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'organizer',
  partner_id UUID REFERENCES event_partners(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_email UNIQUE (email)
);

CREATE INDEX idx_users_partner_id ON event_users(partner_id);
CREATE INDEX idx_users_role ON event_users(role);
CREATE INDEX idx_users_email ON event_users(email);

-- ==================== Venues Table (Optional) ====================
CREATE TABLE event_venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  capacity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_venues_name ON event_venues(name);

-- ==================== Templates Table ====================
CREATE TABLE event_templates (
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

CREATE INDEX idx_templates_partner_id ON event_templates(partner_id);
CREATE INDEX idx_templates_is_active ON event_templates(is_active);

-- ==================== Events Table ====================
CREATE TABLE event_events (
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

CREATE INDEX idx_events_partner_id ON event_events(partner_id);
CREATE INDEX idx_events_status ON event_events(status);
CREATE INDEX idx_events_starts_at ON event_events(starts_at);
CREATE INDEX idx_events_created_by ON event_events(created_by);
CREATE INDEX idx_events_template_id ON event_events(template_id);

-- ==================== Zones Table ====================
CREATE TABLE event_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES event_events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  capacity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_zone_name_per_event UNIQUE (event_id, name)
);

CREATE INDEX idx_zones_event_id ON event_zones(event_id);

-- ==================== Gates Table ====================
CREATE TABLE event_gates (
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

CREATE INDEX idx_gates_event_id ON event_gates(event_id);
CREATE INDEX idx_gates_login_code ON event_gates(login_code);

-- ==================== Guests Table ====================
CREATE TABLE event_guests (
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

CREATE INDEX idx_guests_event_id ON event_guests(event_id);
CREATE INDEX idx_guests_email ON event_guests(email);
CREATE INDEX idx_guests_type ON event_guests(type);

-- ==================== Passes Table ====================
CREATE TABLE event_passes (
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

CREATE INDEX idx_passes_event_id ON event_passes(event_id);
CREATE INDEX idx_passes_guest_id ON event_passes(guest_id);
CREATE INDEX idx_passes_token ON event_passes(token); -- Critical for fast lookups
CREATE INDEX idx_passes_status ON event_passes(status);
CREATE INDEX idx_passes_qr_payload ON event_passes(qr_payload); -- For QR scanning

-- ==================== Pass Zones Junction Table ====================
CREATE TABLE event_pass_zones (
  pass_id UUID NOT NULL REFERENCES event_passes(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES event_zones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (pass_id, zone_id)
);

CREATE INDEX idx_pass_zones_pass_id ON event_pass_zones(pass_id);
CREATE INDEX idx_pass_zones_zone_id ON event_pass_zones(zone_id);

-- ==================== Scan Logs Table ====================
CREATE TABLE event_scan_logs (
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

CREATE INDEX idx_scan_logs_event_id ON event_scan_logs(event_id);
CREATE INDEX idx_scan_logs_pass_id ON event_scan_logs(pass_id);
CREATE INDEX idx_scan_logs_gate_id ON event_scan_logs(gate_id);
CREATE INDEX idx_scan_logs_scanned_at ON event_scan_logs(scanned_at); -- For time-based queries
CREATE INDEX idx_scan_logs_result ON event_scan_logs(result);

-- ==================== Webhook Endpoints Table ====================
CREATE TABLE event_webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES event_partners(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  event webhook_event_type NOT NULL,
  secret TEXT NOT NULL, -- For webhook signature verification
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_endpoints_partner_id ON event_webhook_endpoints(partner_id);
CREATE INDEX idx_webhook_endpoints_event ON event_webhook_endpoints(event);
CREATE INDEX idx_webhook_endpoints_is_active ON event_webhook_endpoints(is_active);

-- ==================== API Keys Table ====================
CREATE TABLE event_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES event_partners(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL, -- Hashed API key
  name VARCHAR(255), -- Optional name for the key
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES event_users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_api_keys_partner_id ON event_api_keys(partner_id);
CREATE INDEX idx_api_keys_key_hash ON event_api_keys(key_hash);
CREATE INDEX idx_api_keys_expires_at ON event_api_keys(expires_at);

-- ==================== Triggers for updated_at ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON event_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON event_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON event_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON event_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gates_updated_at BEFORE UPDATE ON event_gates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON event_guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON event_webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== Comments for Documentation ====================
COMMENT ON TABLE event_partners IS 'Partners/Organizers who use the platform';
COMMENT ON TABLE event_users IS 'Users of the system with different roles';
COMMENT ON TABLE event_venues IS 'Venue information (optional)';
COMMENT ON TABLE event_templates IS 'Invitation/pass design templates';
COMMENT ON TABLE event_events IS 'Events created by partners';
COMMENT ON TABLE event_zones IS 'Zones within an event (VIP, Main, etc.)';
COMMENT ON TABLE event_gates IS 'Check-in gates/devices';
COMMENT ON TABLE event_guests IS 'Guests invited to events';
COMMENT ON TABLE event_passes IS 'Actual passes/tickets for guests';
COMMENT ON TABLE event_pass_zones IS 'Junction table for pass-zone access';
COMMENT ON TABLE event_scan_logs IS 'Log of all QR code scans';
COMMENT ON TABLE event_webhook_endpoints IS 'Webhook endpoints for partners';
COMMENT ON TABLE event_api_keys IS 'API keys for partner authentication';


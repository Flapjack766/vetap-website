-- =====================================================
-- Migration: VETAP Event Scan Logs Enhancements
-- المرحلة 11: تحسينات سجلات المسح
-- =====================================================

-- 1. Make gate_id nullable (not all scans require a gate)
ALTER TABLE event_scan_logs 
ALTER COLUMN gate_id DROP NOT NULL;

-- 2. Add guest_id column for direct guest reference
ALTER TABLE event_scan_logs 
ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES event_guests(id) ON DELETE SET NULL;

-- 3. Add device_info column (better than user_agent alone)
ALTER TABLE event_scan_logs 
ADD COLUMN IF NOT EXISTS device_info TEXT;

-- 4. Add error_message column for debugging invalid scans
ALTER TABLE event_scan_logs 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 5. Add processing_time_ms for performance monitoring
ALTER TABLE event_scan_logs 
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;

-- 6. Create index on guest_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_scan_logs_guest_id ON event_scan_logs(guest_id);

-- 7. Add scanned_by as alias for scanner_user_id (if not exists)
-- This is for backward compatibility - we'll use scanner_user_id in the code
-- but add a view/alias if needed

-- 8. Add valid_from and valid_to to passes if not exists
ALTER TABLE event_passes 
ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ;

ALTER TABLE event_passes 
ADD COLUMN IF NOT EXISTS valid_to TIMESTAMPTZ;

ALTER TABLE event_passes 
ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1;

ALTER TABLE event_passes 
ADD COLUMN IF NOT EXISTS use_count INTEGER DEFAULT 0;

ALTER TABLE event_passes 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- 9. Create webhook_logs table for tracking webhook deliveries
CREATE TABLE IF NOT EXISTS event_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES event_partners(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_partner_id ON event_webhook_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON event_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_sent_at ON event_webhook_logs(sent_at);

-- 10. Add webhook_url and webhook_secret to partners table
ALTER TABLE event_partners 
ADD COLUMN IF NOT EXISTS webhook_url TEXT;

ALTER TABLE event_partners 
ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

ALTER TABLE event_partners 
ADD COLUMN IF NOT EXISTS webhook_events TEXT[] DEFAULT '{}';

-- 11. Add access_code to gates for quick login
ALTER TABLE event_gates 
ADD COLUMN IF NOT EXISTS access_code VARCHAR(8);

-- Create unique index for gate access codes
CREATE UNIQUE INDEX IF NOT EXISTS idx_gates_access_code 
ON event_gates(access_code) WHERE access_code IS NOT NULL;

-- 12. Add RLS for webhook_logs
ALTER TABLE event_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Partners can view their own webhook logs
CREATE POLICY "Partners can view own webhook logs"
  ON event_webhook_logs FOR SELECT
  USING (
    partner_id = get_current_user_partner_id()
    OR is_user_owner()
  );

-- System can insert webhook logs
CREATE POLICY "System can insert webhook logs"
  ON event_webhook_logs FOR INSERT
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE event_webhook_logs IS 'Log of webhook deliveries to partners';
COMMENT ON COLUMN event_scan_logs.device_info IS 'Parsed device information (OS, browser)';
COMMENT ON COLUMN event_scan_logs.error_message IS 'Error message for invalid scans';
COMMENT ON COLUMN event_scan_logs.processing_time_ms IS 'Time taken to process the scan in milliseconds';
COMMENT ON COLUMN event_passes.valid_from IS 'Pass validity start time';
COMMENT ON COLUMN event_passes.valid_to IS 'Pass validity end time';
COMMENT ON COLUMN event_passes.max_uses IS 'Maximum number of times this pass can be used';
COMMENT ON COLUMN event_passes.use_count IS 'Number of times this pass has been used';
COMMENT ON COLUMN event_gates.access_code IS 'Quick access code for gate staff login';


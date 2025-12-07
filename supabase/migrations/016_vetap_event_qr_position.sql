-- =====================================================
-- Migration: VETAP Event QR Position & Limits
-- إضافة حقول موقع QR وحدود الاستخدام
-- =====================================================

-- 1. Add QR position column to event_events
ALTER TABLE event_events
ADD COLUMN IF NOT EXISTS qr_position JSONB DEFAULT NULL;

-- 2. Add max_guests limit to event_events  
ALTER TABLE event_events
ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT NULL CHECK (max_guests IS NULL OR max_guests > 0);

-- 3. Add pass_max_uses default to event_events
ALTER TABLE event_events
ADD COLUMN IF NOT EXISTS pass_max_uses INTEGER DEFAULT 1 CHECK (pass_max_uses >= 1);

-- 4. Add file_type column to event_templates
ALTER TABLE event_templates
ADD COLUMN IF NOT EXISTS file_type VARCHAR(10) DEFAULT 'image' CHECK (file_type IN ('image', 'pdf'));

-- 4b. Add qr_rotation column to event_templates
ALTER TABLE event_templates
ADD COLUMN IF NOT EXISTS qr_rotation INTEGER DEFAULT 0 CHECK (qr_rotation >= 0 AND qr_rotation <= 360);

-- 5. Update existing templates to have file_type based on extension
UPDATE event_templates
SET file_type = CASE 
  WHEN base_file_url ILIKE '%.pdf' THEN 'pdf'
  ELSE 'image'
END
WHERE file_type IS NULL;

-- 6. Comments
COMMENT ON COLUMN event_events.qr_position IS 'JSON object containing x, y, width, height, rotation for QR code placement';
COMMENT ON COLUMN event_events.max_guests IS 'Maximum number of guests allowed for this event (NULL = unlimited)';
COMMENT ON COLUMN event_events.pass_max_uses IS 'Maximum number of times each pass can be used (default: 1)';
COMMENT ON COLUMN event_templates.file_type IS 'Type of template file: image or pdf';
COMMENT ON COLUMN event_templates.qr_rotation IS 'QR code rotation in degrees (0-360)';

-- 7. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_event_events_max_guests ON event_events(max_guests) WHERE max_guests IS NOT NULL;

-- 8. Function to check guest limit before insert
CREATE OR REPLACE FUNCTION check_event_guest_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get the max_guests for the event
  SELECT max_guests INTO max_allowed
  FROM event_events
  WHERE id = NEW.event_id;

  -- If no limit, allow insert
  IF max_allowed IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count current guests
  SELECT COUNT(*) INTO current_count
  FROM event_guests
  WHERE event_id = NEW.event_id;

  -- Check if limit exceeded
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Guest limit exceeded. Maximum allowed: %', max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for guest limit check
DROP TRIGGER IF EXISTS check_guest_limit_trigger ON event_guests;
CREATE TRIGGER check_guest_limit_trigger
  BEFORE INSERT ON event_guests
  FOR EACH ROW
  EXECUTE FUNCTION check_event_guest_limit();

-- 10. Function to initialize pass max_uses from event settings
CREATE OR REPLACE FUNCTION set_pass_max_uses()
RETURNS TRIGGER AS $$
BEGIN
  -- If max_uses not set, get from event settings
  IF NEW.max_uses IS NULL THEN
    SELECT pass_max_uses INTO NEW.max_uses
    FROM event_events
    WHERE id = NEW.event_id;
    
    -- Default to 1 if still null
    IF NEW.max_uses IS NULL THEN
      NEW.max_uses := 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for pass max_uses
DROP TRIGGER IF EXISTS set_pass_max_uses_trigger ON event_passes;
CREATE TRIGGER set_pass_max_uses_trigger
  BEFORE INSERT ON event_passes
  FOR EACH ROW
  EXECUTE FUNCTION set_pass_max_uses();


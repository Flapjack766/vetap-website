-- =====================================================
-- VETAP Event - Add Contact Information to Users
-- =====================================================
-- This migration adds phone, country code, country, and city fields
-- to the event_users table
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

-- Update the trigger function to include new fields
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if event_users record already exists
  IF NOT EXISTS (SELECT 1 FROM event_users WHERE id = NEW.id) THEN
    -- Create event_users record with default values
    -- Note: partner_id and role should be set by admin/owner
    INSERT INTO event_users (id, email, name, role, partner_id, phone, phone_country_code, country, city)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      'organizer', -- Default role
      NULL, -- partner_id will be set by admin
      NULLIF(NEW.raw_user_meta_data->>'phone', ''),
      NULLIF(NEW.raw_user_meta_data->>'phone_country_code', ''),
      NULLIF(NEW.raw_user_meta_data->>'country', ''),
      NULLIF(NEW.raw_user_meta_data->>'city', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      phone = COALESCE(EXCLUDED.phone, event_users.phone),
      phone_country_code = COALESCE(EXCLUDED.phone_country_code, event_users.phone_country_code),
      country = COALESCE(EXCLUDED.country, event_users.country),
      city = COALESCE(EXCLUDED.city, event_users.city);
  ELSE
    -- Update existing record with contact info if provided
    UPDATE event_users
    SET
      phone = COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), event_users.phone),
      phone_country_code = COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone_country_code', ''), event_users.phone_country_code),
      country = COALESCE(NULLIF(NEW.raw_user_meta_data->>'country', ''), event_users.country),
      city = COALESCE(NULLIF(NEW.raw_user_meta_data->>'city', ''), event_users.city)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== Comments ====================
COMMENT ON COLUMN event_users.phone IS 'User phone number';
COMMENT ON COLUMN event_users.phone_country_code IS 'Country code for phone number (e.g., +966, +971)';
COMMENT ON COLUMN event_users.country IS 'User country';
COMMENT ON COLUMN event_users.city IS 'User city';


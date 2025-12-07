-- =====================================================
-- VETAP Event - Auth Sync Trigger
-- =====================================================
-- This migration creates a trigger to sync event_users with auth.users
-- When a user signs up in Supabase Auth, we need to create a corresponding
-- event_users record (or link existing one)
-- =====================================================

-- Function to handle new auth user creation
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

-- ==================== Comments ====================
COMMENT ON FUNCTION public.handle_new_auth_user() IS 'Creates event_users record when auth user is created. Uses SET search_path for security.';
COMMENT ON FUNCTION public.sync_auth_user_email() IS 'Syncs email updates from auth.users to event_users. Uses IS DISTINCT FROM for NULL-safe comparison.';


-- =====================================================
-- VETAP Event System - Anonymous Passes Support
-- Migration: 017_vetap_event_anonymous_passes.sql
-- =====================================================

-- Add is_anonymous column to event_guests table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'event_guests' AND column_name = 'is_anonymous'
    ) THEN
        ALTER TABLE event_guests ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add is_anonymous column to event_passes table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'event_passes' AND column_name = 'is_anonymous'
    ) THEN
        ALTER TABLE event_passes ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create index for faster queries on anonymous passes
CREATE INDEX IF NOT EXISTS idx_event_guests_anonymous ON event_guests(event_id, is_anonymous);
CREATE INDEX IF NOT EXISTS idx_event_passes_anonymous ON event_passes(event_id, is_anonymous);

-- Add comment for documentation
COMMENT ON COLUMN event_guests.is_anonymous IS 'True if this is an anonymous guest (no real personal information)';
COMMENT ON COLUMN event_passes.is_anonymous IS 'True if this pass was generated for anonymous distribution';

-- =====================================================
-- END OF MIGRATION
-- =====================================================


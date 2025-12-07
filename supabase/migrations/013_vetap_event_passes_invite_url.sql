-- Add invite_file_url column to event_passes table
-- This stores the URL of the generated invitation file (PNG/PDF)

ALTER TABLE event_passes
ADD COLUMN IF NOT EXISTS invite_file_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_passes_invite_url ON event_passes(invite_file_url) WHERE invite_file_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN event_passes.invite_file_url IS 'URL of the generated invitation file (PNG/PDF/Wallet)';


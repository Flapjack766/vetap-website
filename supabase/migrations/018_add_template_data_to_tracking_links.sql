-- ============================================
-- Add template_data column to tracking_links
-- ============================================
-- This migration adds a JSONB column to store template data
-- for restaurant pages and menu pages

ALTER TABLE tracking_links 
ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}'::jsonb;

-- Add index for template_data queries (optional, but useful for filtering)
CREATE INDEX IF NOT EXISTS idx_tracking_links_template_data ON tracking_links USING GIN (template_data);

-- Add comment to document the column
COMMENT ON COLUMN tracking_links.template_data IS 'Stores template-specific data (images, menu items, descriptions, etc.) as JSONB';


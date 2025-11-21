-- Add metadata column to analytics_events table if it doesn't exist
-- This column stores additional data like link_type, link_url, etc.

ALTER TABLE analytics_events 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN analytics_events.metadata IS 'Stores additional event data like link_url, link_type for link_click events';


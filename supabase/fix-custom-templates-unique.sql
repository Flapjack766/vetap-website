-- Remove UNIQUE constraint from custom_templates.profile_id
-- This allows multiple templates per profile (one per request)
-- Run this in Supabase SQL Editor

-- 1. Drop the unique constraint
ALTER TABLE custom_templates 
DROP CONSTRAINT IF EXISTS custom_templates_profile_id_key;

-- 2. Verify the constraint is removed
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'custom_templates'::regclass
AND conname LIKE '%profile_id%';

-- 3. Add index for performance (non-unique)
CREATE INDEX IF NOT EXISTS idx_custom_templates_profile_id_active 
ON custom_templates(profile_id, is_active, is_deleted)
WHERE is_deleted = false;


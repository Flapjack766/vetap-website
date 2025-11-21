-- Add custom_template_id column to profiles table
-- This allows storing which specific custom template is selected
-- If template_id = 999 (custom), then custom_template_id points to the specific custom template

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS custom_template_id UUID REFERENCES custom_templates(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS profiles_custom_template_id_idx ON profiles(custom_template_id);

-- Update existing profiles that have template_id = 999 to use the latest custom template
-- This is a one-time migration
UPDATE profiles p
SET custom_template_id = (
  SELECT ct.id
  FROM custom_templates ct
  WHERE ct.profile_id = p.id
    AND ct.is_deleted = false
  ORDER BY ct.created_at DESC
  LIMIT 1
)
WHERE p.template_id = 999
  AND p.custom_template_id IS NULL;


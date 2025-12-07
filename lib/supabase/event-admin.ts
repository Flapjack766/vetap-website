import { createClient } from '@supabase/supabase-js';

/**
 * Creates an admin Supabase client for VETAP Event service
 * Uses SERVICE_ROLE_KEY for admin operations (bypasses RLS)
 * 
 * IMPORTANT: This uses SUPABASE_EVENT_SERVICE_ROLE_KEY
 * NOT the main project variable (SUPABASE_SERVICE_ROLE_KEY)
 * 
 * ⚠️ SECURITY WARNING: Service role key has full access to the database
 * Only use this in server-side code, never expose it to the client!
 */
export function createEventAdminClient() {
  // Prefer event-specific keys, but gracefully fall back to main keys on prod to avoid 500s
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_EVENT_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    const error =
      'Missing Supabase admin environment variables (event or main). Please set NEXT_PUBLIC_SUPABASE_EVENT_URL and SUPABASE_EVENT_SERVICE_ROLE_KEY, or fallback NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.';
    console.error('❌', error);
    throw new Error(error);
  }

  console.log('✅ Creating Supabase Event Admin client:', {
    url: supabaseUrl.substring(0, 50) + '...',
    hasServiceKey: !!serviceRoleKey,
    serviceKeyPreview: serviceRoleKey.substring(0, 8) + '***',
    usedEventKeys: !!process.env.SUPABASE_EVENT_SERVICE_ROLE_KEY,
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}


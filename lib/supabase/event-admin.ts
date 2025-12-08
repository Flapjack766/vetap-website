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
  // Event environment ONLY (as requested): must supply these
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL;
  const serviceRoleKey = process.env.SUPABASE_EVENT_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    const error =
      'Missing Supabase Event admin env vars. Required: NEXT_PUBLIC_SUPABASE_EVENT_URL and SUPABASE_EVENT_SERVICE_ROLE_KEY.';
    console.error('❌', error, {
      NEXT_PUBLIC_SUPABASE_EVENT_URL: !!supabaseUrl,
      SUPABASE_EVENT_SERVICE_ROLE_KEY: !!serviceRoleKey,
    });
    throw new Error(error);
  }

  console.log('✅ Creating Supabase Event Admin client:', {
    url: supabaseUrl.substring(0, 50) + '...',
    hasServiceKey: true,
    serviceKeyPreview: serviceRoleKey.substring(0, 8) + '***',
    usedEventKeys: true,
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}


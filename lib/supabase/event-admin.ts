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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL;
  const serviceRoleKey = process.env.SUPABASE_EVENT_SERVICE_ROLE_KEY;

  // Check for main project variables (common mistake)
  const mainServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    const error = 'Missing VETAP Event Supabase admin environment variables. Please check your .env.local file.';
    console.error('❌', error);
    console.error('Missing:', {
      'NEXT_PUBLIC_SUPABASE_EVENT_URL': !supabaseUrl,
      'SUPABASE_EVENT_SERVICE_ROLE_KEY': !serviceRoleKey,
    });
    console.error('💡 Make sure you have these in .env.local:');
    console.error('   NEXT_PUBLIC_SUPABASE_EVENT_URL=https://your-event-project.supabase.co');
    console.error('   SUPABASE_EVENT_SERVICE_ROLE_KEY=your-event-service-role-key');
    throw new Error(error);
  }

  // CRITICAL: Verify we're NOT using main project keys
  if (mainServiceKey && mainServiceKey === serviceRoleKey) {
    const error = 'CRITICAL ERROR: Event Service Role Key matches main project Service Role Key! Check .env.local - you may have copied main project keys instead of Event keys.';
    console.error('❌', error);
    throw new Error(error);
  }

  console.log('✅ Creating Supabase Event Admin client:', {
    url: supabaseUrl.substring(0, 50) + '...',
    hasServiceKey: !!serviceRoleKey,
    serviceKeyPreview: serviceRoleKey.substring(0, 20) + '...',
  });

  // Create admin client with service role key (bypasses RLS)
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}


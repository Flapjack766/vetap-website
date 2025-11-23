/**
 * Admin Supabase Client
 * 
 * This client uses the service_role key and bypasses RLS.
 * USE ONLY IN SERVER-SIDE API ROUTES, NEVER IN CLIENT COMPONENTS.
 * 
 * This client should only be used for:
 * - Admin dashboard operations
 * - Reading sensitive analytics data
 * - Operations that require full database access
 */

import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. This is required for admin operations.');
}

/**
 * Creates a Supabase client with service_role key
 * This client bypasses RLS and should ONLY be used in server-side API routes
 * 
 * @returns Supabase client with admin privileges
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}


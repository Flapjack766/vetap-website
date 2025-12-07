'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache for the Event client
let _eventClient: SupabaseClient | null = null;

/**
 * Creates a Supabase client for VETAP Event service
 * Uses localStorage with unique key to avoid conflicts with main project
 */
export function createEventClient(): SupabaseClient {
  // Return cached client if available
  if (_eventClient) {
    return _eventClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VETAP Event Supabase environment variables');
  }

  // Extract project ID for unique storage key
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'event';
  
  console.log('🔧 Creating Event Client:', { url: supabaseUrl, projectId });

  // Create client with unique storage key
  _eventClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: `sb-${projectId}-auth-token`,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  console.log('✅ Event Client ready:', supabaseUrl);

  return _eventClient;
}

/**
 * Clear cached client (useful for logout)
 */
export function clearEventClient() {
  _eventClient = null;
}

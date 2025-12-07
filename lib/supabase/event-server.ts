import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Get Event project ID from URL for unique cookie naming
function getEventProjectId(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL;
  if (!url) return 'event';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'event';
}

/**
 * Creates a server-side Supabase client for VETAP Event service
 * Uses Event-specific cookie name pattern
 */
export async function createEventClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VETAP Event Supabase environment variables');
  }

  const projectId = getEventProjectId();
  const cookiePrefix = `sb-${projectId}-`;

  console.log('✅ Event Server: Using Event Supabase:', {
    url: supabaseUrl.substring(0, 50) + '...',
    hasKey: !!supabaseAnonKey,
    cookiePrefix,
  });

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      name: `sb-${projectId}-auth-token`,
    },
    cookies: {
      getAll() {
        // Only get Event-specific cookies
        return cookieStore.getAll().filter(c => c.name.startsWith(cookiePrefix));
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignore - Server Component context
        }
      },
    },
  });
}

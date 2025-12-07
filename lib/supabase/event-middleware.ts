import { NextResponse, type NextRequest } from 'next/server';

/**
 * VETAP Event - Middleware
 * Since Event uses localStorage (not cookies), we can't check auth server-side.
 * Just pass through and let client-side handle auth redirects.
 */
export async function updateEventSession(request: NextRequest) {
  // Just pass through - client-side will handle auth
  return NextResponse.next({ request });
}

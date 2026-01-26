import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './lib/i18n/config';
import { updateSession } from './lib/supabase/middleware';
import { updateEventSession } from './lib/supabase/event-middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isEventRoute = pathname.includes('/event/');
  
  // Exclude /r/ routes from locale prefixing (tracking links should work without locale)
  if (pathname.startsWith('/r/')) {
    // Still update Supabase session but skip i18n middleware
    const supabaseResponse = isEventRoute 
      ? await updateEventSession(request)
      : await updateSession(request);
    return supabaseResponse;
  }
  
  // Update appropriate Supabase session
  const supabaseResponse = isEventRoute 
    ? await updateEventSession(request)
    : await updateSession(request);
  
  // Then apply i18n middleware
  const intlResponse = intlMiddleware(request);
  
  // Merge cookies from both responses
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  });
  
  return intlResponse;
}

export const config = {
  matcher: ['/', '/(ar|en|tr)/:path*', '/p/:path*', '/r/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};


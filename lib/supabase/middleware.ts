import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, ...options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if path requires authentication (dashboard routes)
  const pathname = request.nextUrl.pathname;
  const isDashboardRoute = pathname.includes('/dashboard');
  const isAuthRoute = 
    pathname.includes('/login') ||
    pathname.includes('/signup') ||
    pathname.includes('/forgot-password') ||
    pathname.includes('/reset-password');
  // Public routes (not currently used but kept for reference)
  // const isPublicRoute = 
  //   pathname.includes('/api') ||
  //   pathname.includes('/_next') ||
  //   pathname.match(/^\/p\//) ||
  //   pathname.match(/^\/(ar|en|tr)\/p\//) ||
  //   pathname === '/' ||
  //   pathname.match(/^\/(ar|en|tr)(\/|$)/);

  if (!user && isDashboardRoute && !isAuthRoute) {
    // no user, redirect to login page
    const url = request.nextUrl.clone();
    // Extract locale from pathname
    const localeMatch = pathname.match(/^\/(ar|en|tr)/);
    const locale = localeMatch ? localeMatch[1] : 'en';
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse;
}


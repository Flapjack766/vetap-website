import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * OAuth Start Endpoint
 * 
 * Initiates Google OAuth flow for Business Profile API
 * Redirects user to Google OAuth consent screen
 */

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const businessId = req.nextUrl.searchParams.get('businessId');
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId parameter is required' },
        { status: 400 }
      );
    }

    // Verify user owns the business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, owner_user_id')
      .eq('id', businessId)
      .eq('owner_user_id', user.id)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 403 }
      );
    }

    // Get OAuth credentials from environment
    const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Google Business OAuth credentials not configured');
      return NextResponse.json(
        { error: 'OAuth not configured' },
        { status: 500 }
      );
    }

    // Generate state token (signed with businessId for security)
    const state = crypto
      .createHash('sha256')
      .update(`${businessId}-${user.id}-${Date.now()}`)
      .digest('hex')
      .substring(0, 32);

    // Store state temporarily (you can use a cache/DB table for production)
    // For now, we'll encode businessId in state (not ideal for production, but works)
    const stateWithBusinessId = `${state}.${businessId}`;

    // Build OAuth URL
    // IMPORTANT: This redirect_uri MUST match exactly what's registered in Google Cloud Console
    // - No trailing slashes
    // - Must use https:// in production (http:// for localhost only)
    // - Must match the exact path: /api/google-business/oauth/callback
    const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
    // Remove trailing slash if present
    const baseUrl = siteUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/google-business/oauth/callback`;
    
    const scope = 'https://www.googleapis.com/auth/business.manage';
    
    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    oauthUrl.searchParams.set('client_id', clientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', scope);
    oauthUrl.searchParams.set('access_type', 'offline'); // Required for refresh_token
    oauthUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh_token
    oauthUrl.searchParams.set('state', stateWithBusinessId);
    
    // Log redirect_uri for debugging (remove in production if needed)
    console.log('OAuth redirect_uri:', redirectUri);

    // Redirect to Google OAuth
    return NextResponse.redirect(oauthUrl.toString(), {
      status: 302,
    });
  } catch (error) {
    console.error('Error in OAuth start:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


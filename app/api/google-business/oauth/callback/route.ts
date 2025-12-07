import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * OAuth Callback Endpoint
 * 
 * Handles Google OAuth callback after user authorization
 * Exchanges code for tokens and stores connection
 */

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        `${process.env.SITE_URL || 'https://vetaps.com'}/login?error=oauth_auth_required`,
        { status: 302 }
      );
    }

    const code = req.nextUrl.searchParams.get('code');
    const state = req.nextUrl.searchParams.get('state');
    const error = req.nextUrl.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.SITE_URL || 'https://vetaps.com'}/dashboard/tracking?error=oauth_${error}`,
        { status: 302 }
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.SITE_URL || 'https://vetaps.com'}/dashboard/tracking?error=oauth_invalid`,
        { status: 302 }
      );
    }

    // Extract businessId from state
    const stateParts = state.split('.');
    if (stateParts.length < 2) {
      return NextResponse.redirect(
        `${process.env.SITE_URL || 'https://vetaps.com'}/dashboard/tracking?error=oauth_invalid_state`,
        { status: 302 }
      );
    }

    const businessId = stateParts[1];

    // Verify user owns the business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, owner_user_id')
      .eq('id', businessId)
      .eq('owner_user_id', user.id)
      .single();

    if (businessError || !business) {
      return NextResponse.redirect(
        `${process.env.SITE_URL || 'https://vetaps.com'}/dashboard/tracking?error=oauth_business_not_found`,
        { status: 302 }
      );
    }

    // Get OAuth credentials
    const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET;
    const redirectUri = `${process.env.SITE_URL || 'https://vetaps.com'}/api/google-business/oauth/callback`;

    if (!clientId || !clientSecret) {
      console.error('Google Business OAuth credentials not configured');
      return NextResponse.redirect(
        `${process.env.SITE_URL || 'https://vetaps.com'}/dashboard/tracking?error=oauth_not_configured`,
        { status: 302 }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect(
        `${process.env.SITE_URL || 'https://vetaps.com'}/dashboard/tracking?error=oauth_token_exchange_failed`,
        { status: 302 }
      );
    }

    const tokenData = await tokenResponse.json();
    const {
      access_token,
      refresh_token,
      expires_in,
      scope,
    } = tokenData;

    if (!access_token || !refresh_token) {
      console.error('Missing tokens in response:', tokenData);
      return NextResponse.redirect(
        `${process.env.SITE_URL || 'https://vetaps.com'}/dashboard/tracking?error=oauth_missing_tokens`,
        { status: 302 }
      );
    }

    // Get user email from Google (using access token)
    let googleEmail = '';
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        googleEmail = userInfo.email || '';
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      // Continue without email - we'll use a placeholder
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (expires_in || 3600));

    // Store or update connection using admin client (bypasses RLS)
    const { data: existingConnection } = await adminClient
      .from('google_business_connections')
      .select('id')
      .eq('business_id', businessId)
      .maybeSingle();

    if (existingConnection) {
      // Update existing connection
      await adminClient
        .from('google_business_connections')
        .update({
          google_account_email: googleEmail || 'unknown@google.com',
          access_token: access_token,
          refresh_token: refresh_token,
          scope: scope || '',
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', existingConnection.id);
    } else {
      // Create new connection
      await adminClient
        .from('google_business_connections')
        .insert({
          business_id: businessId,
          google_account_email: googleEmail || 'unknown@google.com',
          access_token: access_token,
          refresh_token: refresh_token,
          scope: scope || '',
          expires_at: expiresAt.toISOString(),
        });
    }

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.SITE_URL || 'https://vetaps.com'}/dashboard/tracking?google=connected&businessId=${businessId}`,
      { status: 302 }
    );
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.SITE_URL || 'https://vetaps.com'}/dashboard/tracking?error=oauth_internal_error`,
      { status: 302 }
    );
  }
}


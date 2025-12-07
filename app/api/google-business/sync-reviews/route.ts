import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Sync Reviews Endpoint
 * 
 * This endpoint syncs Google Business Profile reviews for all connected businesses
 * Should be called by a cron job (hourly or every 6 hours)
 * 
 * Can also be called manually for testing
 */

interface GoogleBusinessConnection {
  id: string;
  business_id: string;
  google_account_email: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Google Business OAuth credentials not configured');
      return null;
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token refresh error:', errorData);
      return null;
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      expires_in: data.expires_in || 3600,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

async function getBusinessProfileData(accessToken: string, placeId: string) {
  try {
    // Google Business Profile API endpoint
    // Note: The actual API endpoint may vary - check Google's documentation
    const response = await fetch(
      `https://mybusinessaccountmanagement.googleapis.com/v1/accounts/-/locations/${placeId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      // If 401, token might be expired
      if (response.status === 401) {
        return { expired: true };
      }
      const errorData = await response.text();
      console.error('Business Profile API error:', errorData);
      return null;
    }

    const data = await response.json();
    
    // Extract review data (structure depends on API response)
    // This is a placeholder - adjust based on actual API response
    return {
      total_reviews: data.totalReviewCount || 0,
      average_rating: data.averageRating || 0,
      raw_payload: data,
    };
  } catch (error) {
    console.error('Error fetching business profile data:', error);
    return null;
  }
}

/**
 * Main sync function - shared between GET and POST
 */
async function syncReviews(req: NextRequest) {
  // Optional: Add authentication check for cron job
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow requests without auth if no CRON_SECRET is set (for Vercel Cron)
  // Vercel Cron adds a special header that we can check
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  
  if (cronSecret && !isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

    const adminClient = createAdminClient();

    // Get all active connections
    const { data: connections, error: connectionsError } = await adminClient
      .from('google_business_connections')
      .select('*')
      .gte('expires_at', new Date().toISOString()); // Only active connections

    if (connectionsError) {
      console.error('Error fetching connections:', connectionsError);
      return NextResponse.json(
        { error: 'Failed to fetch connections' },
        { status: 500 }
      );
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { message: 'No active connections to sync', synced: 0 },
        { status: 200 }
      );
    }

    let syncedCount = 0;
    const errors: string[] = [];

    // Process each connection
    for (const connection of connections as GoogleBusinessConnection[]) {
      try {
        // Check if token is expired
        const expiresAt = new Date(connection.expires_at);
        const now = new Date();
        let accessToken = connection.access_token;

        if (expiresAt <= now) {
          // Refresh token
          const refreshed = await refreshAccessToken(connection.refresh_token);
          if (!refreshed) {
            errors.push(`Failed to refresh token for business ${connection.business_id}`);
            continue;
          }

          accessToken = refreshed.access_token;

          // Update connection with new token
          const newExpiresAt = new Date();
          newExpiresAt.setSeconds(newExpiresAt.getSeconds() + refreshed.expires_in);

          await adminClient
            .from('google_business_connections')
            .update({
              access_token: accessToken,
              expires_at: newExpiresAt.toISOString(),
            })
            .eq('id', connection.id);
        }

        // Get branches for this business that have google_place_id
        const { data: branches, error: branchesError } = await adminClient
          .from('branches')
          .select('id, google_place_id')
          .eq('business_id', connection.business_id)
          .not('google_place_id', 'is', null);

        if (branchesError || !branches || branches.length === 0) {
          continue; // No branches with place IDs
        }

        // Sync reviews for each branch
        for (const branch of branches) {
          if (!branch.google_place_id) continue;

          const reviewData = await getBusinessProfileData(accessToken, branch.google_place_id);

          if (!reviewData) {
            errors.push(`Failed to fetch data for branch ${branch.id}`);
            continue;
          }

          if (reviewData.expired) {
            // Token expired during sync, skip this branch
            continue;
          }

          // Get previous sync to calculate new reviews
          const { data: lastSync } = await adminClient
            .from('review_sync')
            .select('total_reviews')
            .eq('branch_id', branch.id)
            .order('synced_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const previousTotal = lastSync?.total_reviews || 0;
          const newReviewsCount = Math.max(0, (reviewData.total_reviews || 0) - previousTotal);

          // Insert new sync record
          await adminClient
            .from('review_sync')
            .insert({
              branch_id: branch.id,
              business_id: connection.business_id,
              total_reviews: reviewData.total_reviews || 0,
              average_rating: reviewData.average_rating || null,
              new_reviews_count: newReviewsCount,
              raw_payload: reviewData.raw_payload || null,
            });

          syncedCount++;
        }
      } catch (error: any) {
        console.error(`Error syncing business ${connection.business_id}:`, error);
        errors.push(`Business ${connection.business_id}: ${error.message}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        synced: syncedCount,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in sync reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Used by Vercel Cron
 */
export async function GET(req: NextRequest) {
  return syncReviews(req);
}

/**
 * POST handler - For manual calls
 */
export async function POST(req: NextRequest) {
  return syncReviews(req);
}


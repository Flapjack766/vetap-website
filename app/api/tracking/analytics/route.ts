import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

/**
 * API Route for Tracking Analytics
 * 
 * Returns analytics data filtered by business_id and time range
 */

const analyticsQuerySchema = z.object({
  business_id: z.string().uuid(),
  time_range: z.enum(['today', '7days', '30days']).default('7days'),
  view_level: z.enum(['total', 'by_branch', 'by_card', 'by_link']).default('total'),
  branch_id: z.string().uuid().optional(),
  card_id: z.string().uuid().optional(),
  tracking_link_id: z.string().uuid().optional(),
});

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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const query = analyticsQuerySchema.parse({
      business_id: searchParams.get('business_id'),
      time_range: searchParams.get('time_range') || '7days',
      view_level: searchParams.get('view_level') || 'total',
      branch_id: searchParams.get('branch_id') || undefined,
      card_id: searchParams.get('card_id') || undefined,
      tracking_link_id: searchParams.get('tracking_link_id') || undefined,
    });

    // Verify user owns the business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, owner_user_id')
      .eq('id', query.business_id)
      .eq('owner_user_id', user.id)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 403 }
      );
    }

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (query.time_range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    // Build query based on view level
    let eventsQuery = adminClient
      .from('tracking_events')
      .select(`
        id,
        timestamp,
        branch_id,
        card_id,
        tracking_link_id,
        country,
        city,
        device_type,
        branch:branches(
          id,
          name
        ),
        card:nfc_cards(
          id,
          label
        ),
        tracking_link:tracking_links(
          id,
          slug
        )
      `)
      .eq('business_id', query.business_id)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', now.toISOString())
      .order('timestamp', { ascending: false });

    // Apply additional filters
    if (query.branch_id) {
      eventsQuery = eventsQuery.eq('branch_id', query.branch_id);
    }
    if (query.card_id) {
      eventsQuery = eventsQuery.eq('card_id', query.card_id);
    }
    if (query.tracking_link_id) {
      eventsQuery = eventsQuery.eq('tracking_link_id', query.tracking_link_id);
    }

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error('Error fetching tracking events:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch tracking events', details: eventsError.message },
        { status: 500 }
      );
    }

    // Process data based on view level
    let processedData: any = {};

    switch (query.view_level) {
      case 'total':
        processedData = processTotalView(events || []);
        break;
      case 'by_branch':
        processedData = processByBranch(events || []);
        break;
      case 'by_card':
        processedData = processByCard(events || []);
        break;
      case 'by_link':
        processedData = processByLink(events || []);
        break;
    }

    // Time series data for line chart
    const timeSeriesData = processTimeSeries(events || [], startDate, now);

    // Fetch review sync data for the same time range
    const { data: reviewSyncs, error: reviewError } = await adminClient
      .from('review_sync')
      .select(`
        id,
        branch_id,
        business_id,
        synced_at,
        total_reviews,
        average_rating,
        new_reviews_count
      `)
      .eq('business_id', query.business_id)
      .gte('synced_at', startDate.toISOString())
      .lte('synced_at', now.toISOString())
      .order('synced_at', { ascending: true });

    if (reviewError) {
      console.error('Error fetching review syncs:', reviewError);
    }

    // Process review data for time series
    const reviewTimeSeries = processReviewTimeSeries(reviewSyncs || [], startDate, now);

    // Calculate conversion estimate
    const conversionEstimate = calculateConversionEstimate(
      events || [],
      reviewSyncs || [],
      startDate,
      now
    );

    return NextResponse.json(
      {
        success: true,
        data: processedData,
        timeSeries: timeSeriesData,
        reviewTimeSeries: reviewTimeSeries,
        conversionEstimate: conversionEstimate,
        totalEvents: events?.length || 0,
        timeRange: {
          start: startDate.toISOString(),
          end: now.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in analytics API:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions to process data

function processTotalView(events: any[]) {
  const countries = new Map<string, number>();
  const cities = new Map<string, number>();
  const deviceTypes = new Map<string, number>();

  events.forEach((event) => {
    if (event.country) {
      countries.set(event.country, (countries.get(event.country) || 0) + 1);
    }
    if (event.city) {
      cities.set(event.city, (cities.get(event.city) || 0) + 1);
    }
    if (event.device_type) {
      deviceTypes.set(event.device_type, (deviceTypes.get(event.device_type) || 0) + 1);
    }
  });

  return {
    totalClicks: events.length,
    byCountry: Array.from(countries.entries()).map(([country, count]) => ({ country, count })),
    byCity: Array.from(cities.entries()).map(([city, count]) => ({ city, count })),
    byDevice: Array.from(deviceTypes.entries()).map(([device, count]) => ({ device, count })),
  };
}

function processByBranch(events: any[]) {
  const branchMap = new Map<string, { name: string; clicks: number; countries: Map<string, number>; cities: Map<string, number> }>();

  events.forEach((event) => {
    const branchId = event.branch_id || 'unknown';
    const branchName = event.branch?.name || 'Unknown Branch';

    if (!branchMap.has(branchId)) {
      branchMap.set(branchId, {
        name: branchName,
        clicks: 0,
        countries: new Map(),
        cities: new Map(),
      });
    }

    const branchData = branchMap.get(branchId)!;
    branchData.clicks++;

    if (event.country) {
      branchData.countries.set(event.country, (branchData.countries.get(event.country) || 0) + 1);
    }
    if (event.city) {
      branchData.cities.set(event.city, (branchData.cities.get(event.city) || 0) + 1);
    }
  });

  return Array.from(branchMap.entries()).map(([branchId, data]) => ({
    branch_id: branchId,
    branch_name: data.name,
    clicks: data.clicks,
    countries: Array.from(data.countries.entries()).map(([country, count]) => ({ country, count })),
    cities: Array.from(data.cities.entries()).map(([city, count]) => ({ city, count })),
  }));
}

function processByCard(events: any[]) {
  const cardMap = new Map<string, { label: string; clicks: number; countries: Map<string, number>; cities: Map<string, number> }>();

  events.forEach((event) => {
    if (!event.card_id) return;

    const cardId = event.card_id;
    const cardLabel = event.card?.label || 'Unknown Card';

    if (!cardMap.has(cardId)) {
      cardMap.set(cardId, {
        label: cardLabel,
        clicks: 0,
        countries: new Map(),
        cities: new Map(),
      });
    }

    const cardData = cardMap.get(cardId)!;
    cardData.clicks++;

    if (event.country) {
      cardData.countries.set(event.country, (cardData.countries.get(event.country) || 0) + 1);
    }
    if (event.city) {
      cardData.cities.set(event.city, (cardData.cities.get(event.city) || 0) + 1);
    }
  });

  return Array.from(cardMap.entries()).map(([cardId, data]) => ({
    card_id: cardId,
    card_label: data.label,
    clicks: data.clicks,
    countries: Array.from(data.countries.entries()).map(([country, count]) => ({ country, count })),
    cities: Array.from(data.cities.entries()).map(([city, count]) => ({ city, count })),
  }));
}

function processByLink(events: any[]) {
  const linkMap = new Map<string, { slug: string; clicks: number; countries: Map<string, number>; cities: Map<string, number> }>();

  events.forEach((event) => {
    if (!event.tracking_link_id) return;

    const linkId = event.tracking_link_id;
    const linkSlug = event.tracking_link?.slug || 'unknown';

    if (!linkMap.has(linkId)) {
      linkMap.set(linkId, {
        slug: linkSlug,
        clicks: 0,
        countries: new Map(),
        cities: new Map(),
      });
    }

    const linkData = linkMap.get(linkId)!;
    linkData.clicks++;

    if (event.country) {
      linkData.countries.set(event.country, (linkData.countries.get(event.country) || 0) + 1);
    }
    if (event.city) {
      linkData.cities.set(event.city, (linkData.cities.get(event.city) || 0) + 1);
    }
  });

  return Array.from(linkMap.entries()).map(([linkId, data]) => ({
    tracking_link_id: linkId,
    slug: data.slug,
    clicks: data.clicks,
    countries: Array.from(data.countries.entries()).map(([country, count]) => ({ country, count })),
    cities: Array.from(data.cities.entries()).map(([city, count]) => ({ city, count })),
  }));
}

function processTimeSeries(events: any[], startDate: Date, endDate: Date) {
  const dateMap = new Map<string, number>();
  
  // Initialize all dates in range with 0
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    dateMap.set(dateKey, 0);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Count events per date
  events.forEach((event) => {
    const eventDate = new Date(event.timestamp);
    const dateKey = eventDate.toISOString().split('T')[0];
    if (dateMap.has(dateKey)) {
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
    }
  });

  // Convert to array and format
  return Array.from(dateMap.entries())
    .map(([date, count]) => ({
      date,
      clicks: count,
      formattedDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function processReviewTimeSeries(reviewSyncs: any[], startDate: Date, endDate: Date) {
  const dateMap = new Map<string, { total_reviews: number; average_rating: number; new_reviews: number }>();
  
  // Initialize all dates in range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    dateMap.set(dateKey, { total_reviews: 0, average_rating: 0, new_reviews: 0 });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Get latest sync per date
  reviewSyncs.forEach((sync) => {
    const syncDate = new Date(sync.synced_at);
    const dateKey = syncDate.toISOString().split('T')[0];
    
    if (dateMap.has(dateKey)) {
      const existing = dateMap.get(dateKey)!;
      // Keep the latest sync for each date
      if (sync.total_reviews > existing.total_reviews || existing.total_reviews === 0) {
        dateMap.set(dateKey, {
          total_reviews: sync.total_reviews || 0,
          average_rating: parseFloat(sync.average_rating) || 0,
          new_reviews: sync.new_reviews_count || 0,
        });
      }
    }
  });

  // Fill gaps with previous values (carry forward)
  let lastTotalReviews = 0;
  let lastAverageRating = 0;
  
  return Array.from(dateMap.entries())
    .map(([date, data]) => {
      if (data.total_reviews > 0) {
        lastTotalReviews = data.total_reviews;
        lastAverageRating = data.average_rating;
      }
      return {
        date,
        total_reviews: lastTotalReviews,
        average_rating: lastAverageRating,
        new_reviews: data.new_reviews,
        formattedDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateConversionEstimate(
  events: any[],
  reviewSyncs: any[],
  startDate: Date,
  endDate: Date
): { percentage: number; clicks: number; newReviews: number; message: string } {
  const totalClicks = events.length;
  
  // Calculate total new reviews in the period
  const firstSync = reviewSyncs.length > 0 
    ? reviewSyncs[0] 
    : null;
  const lastSync = reviewSyncs.length > 0 
    ? reviewSyncs[reviewSyncs.length - 1] 
    : null;
  
  let newReviews = 0;
  if (firstSync && lastSync) {
    newReviews = Math.max(0, (lastSync.total_reviews || 0) - (firstSync.total_reviews || 0));
  } else if (reviewSyncs.length > 0) {
    // Sum new_reviews_count from all syncs
    newReviews = reviewSyncs.reduce((sum, sync) => sum + (sync.new_reviews_count || 0), 0);
  }

  const percentage = totalClicks > 0 
    ? Math.round((newReviews / totalClicks) * 100) 
    : 0;

  return {
    percentage,
    clicks: totalClicks,
    newReviews,
    message: `Estimated conversion: approximately ${percentage}% of clicks converted to new reviews (${newReviews} new reviews from ${totalClicks} clicks)`,
  };
}


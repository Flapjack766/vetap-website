import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

/**
 * API Route for Tracking Insights
 * 
 * Analyzes tracking and review data to generate intelligent insights
 */

const insightsQuerySchema = z.object({
  business_id: z.string().uuid(),
  time_range: z.enum(['today', '7days', '30days']).default('7days'),
  branch_id: z.string().uuid().optional(),
});

interface Insight {
  type: 'warning' | 'info' | 'success' | 'suggestion';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  data?: any;
}

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
    const query = insightsQuerySchema.parse({
      business_id: searchParams.get('business_id'),
      time_range: searchParams.get('time_range') || '7days',
      branch_id: searchParams.get('branch_id') || undefined,
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

    // Fetch tracking events
    let eventsQuery = adminClient
      .from('tracking_events')
      .select('id, timestamp, branch_id')
      .eq('business_id', query.business_id)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', now.toISOString());

    if (query.branch_id) {
      eventsQuery = eventsQuery.eq('branch_id', query.branch_id);
    }

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // Fetch review syncs
    let reviewQuery = adminClient
      .from('review_sync')
      .select('id, synced_at, total_reviews, average_rating, new_reviews_count')
      .eq('business_id', query.business_id)
      .gte('synced_at', startDate.toISOString())
      .lte('synced_at', now.toISOString())
      .order('synced_at', { ascending: true });

    if (query.branch_id) {
      reviewQuery = reviewQuery.eq('branch_id', query.branch_id);
    }

    const { data: reviewSyncs, error: reviewError } = await reviewQuery;

    if (reviewError) {
      console.error('Error fetching review syncs:', reviewError);
    }

    // Generate insights
    const insights: Insight[] = [];

    // Insight 1: High clicks but low reviews
    const totalClicks = events?.length || 0;
    const firstSync = reviewSyncs && reviewSyncs.length > 0 ? reviewSyncs[0] : null;
    const lastSync = reviewSyncs && reviewSyncs.length > 0 ? reviewSyncs[reviewSyncs.length - 1] : null;
    
    let newReviews = 0;
    if (firstSync && lastSync) {
      newReviews = Math.max(0, (lastSync.total_reviews || 0) - (firstSync.total_reviews || 0));
    } else if (reviewSyncs && reviewSyncs.length > 0) {
      newReviews = reviewSyncs.reduce((sum, sync) => sum + (sync.new_reviews_count || 0), 0);
    }

    if (totalClicks > 50 && newReviews < totalClicks * 0.1) {
      // More than 50 clicks but less than 10% conversion
      const conversionRate = totalClicks > 0 ? Math.round((newReviews / totalClicks) * 100) : 0;
      insights.push({
        type: 'suggestion',
        title: 'Low Review Conversion Rate',
        message: `العملاء يصلون لصفحة التقييم لكن لا يتركون مراجعة. معدل التحويل الحالي: ${conversionRate}%. جرّب تحفيزهم بعرض صغير أو رسالة ترحيبية.`,
        priority: 'high',
        data: {
          clicks: totalClicks,
          newReviews,
          conversionRate,
        },
      });
    }

    // Insight 2: Declining ratings
    if (reviewSyncs && reviewSyncs.length >= 2) {
      const recentSyncs = reviewSyncs.slice(-7); // Last 7 syncs
      const ratings = recentSyncs
        .map(sync => parseFloat(sync.average_rating || '0'))
        .filter(rating => rating > 0);

      if (ratings.length >= 3) {
        const firstHalf = ratings.slice(0, Math.floor(ratings.length / 2));
        const secondHalf = ratings.slice(Math.floor(ratings.length / 2));
        
        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        if (avgSecond < avgFirst - 0.3) {
          // Rating dropped by more than 0.3
          const startDate = new Date(recentSyncs[0].synced_at);
          const endDate = new Date(recentSyncs[recentSyncs.length - 1].synced_at);
          
          insights.push({
            type: 'warning',
            title: 'Declining Ratings Detected',
            message: `تم رصد ارتفاع في التقييمات المنخفضة خلال الفترة من ${startDate.toLocaleDateString('ar-SA')} إلى ${endDate.toLocaleDateString('ar-SA')}. المتوسط انخفض من ${avgFirst.toFixed(1)} إلى ${avgSecond.toFixed(1)}.`,
            priority: 'high',
            data: {
              previousAverage: avgFirst,
              currentAverage: avgSecond,
              decline: (avgFirst - avgSecond).toFixed(1),
              period: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
              },
            },
          });
        }
      }
    }

    // Insight 3: Low activity
    if (totalClicks < 10 && query.time_range === '30days') {
      insights.push({
        type: 'info',
        title: 'Low Activity',
        message: 'عدد النقرات منخفض خلال آخر 30 يوم. تأكد من أن روابط NFC نشطة ومتاحة للعملاء.',
        priority: 'medium',
        data: {
          clicks: totalClicks,
        },
      });
    }

    // Insight 4: High conversion rate (positive)
    if (totalClicks > 20 && newReviews > totalClicks * 0.2) {
      const conversionRate = Math.round((newReviews / totalClicks) * 100);
      insights.push({
        type: 'success',
        title: 'Excellent Conversion Rate',
        message: `معدل تحويل ممتاز! ${conversionRate}% من النقرات تحولت إلى تقييمات جديدة. استمر في العمل الجيد!`,
        priority: 'low',
        data: {
          clicks: totalClicks,
          newReviews,
          conversionRate,
        },
      });
    }

    // Insight 5: No reviews synced
    if (reviewSyncs && reviewSyncs.length === 0 && totalClicks > 0) {
      insights.push({
        type: 'warning',
        title: 'No Reviews Synced',
        message: 'لا توجد بيانات تقييمات متزامنة. تأكد من ربط حساب Google Business Profile في الإعدادات.',
        priority: 'high',
        data: {
          clicks: totalClicks,
        },
      });
    }

    // Insight 6: Rating improvement
    if (reviewSyncs && reviewSyncs.length >= 2) {
      const firstRating = parseFloat(reviewSyncs[0].average_rating || '0');
      const lastRating = parseFloat(reviewSyncs[reviewSyncs.length - 1].average_rating || '0');

      if (firstRating > 0 && lastRating > firstRating + 0.3) {
        insights.push({
          type: 'success',
          title: 'Rating Improvement',
          message: `تحسن في التقييمات! المتوسط ارتفع من ${firstRating.toFixed(1)} إلى ${lastRating.toFixed(1)}.`,
          priority: 'low',
          data: {
            previousRating: firstRating,
            currentRating: lastRating,
            improvement: (lastRating - firstRating).toFixed(1),
          },
        });
      }
    }

    // Sort insights by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return NextResponse.json(
      {
        success: true,
        insights,
        summary: {
          totalClicks,
          newReviews,
          conversionRate: totalClicks > 0 ? Math.round((newReviews / totalClicks) * 100) : 0,
          averageRating: lastSync ? parseFloat(lastSync.average_rating || '0') : 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in insights API:', error);
    
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


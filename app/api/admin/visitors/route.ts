import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin API Route for Visitors Analytics
 * 
 * This route uses service_role key to access all analytics data.
 * Only accessible by authenticated admin users.
 */
export async function GET(req: NextRequest) {
  try {
    // First, verify that the user is an admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    // Fallback: check if user email is admin@vetaps.com
    const isAdmin = adminCheck || user.email === 'admin@vetaps.com';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Now use admin client to access all data
    const adminClient = createAdminClient();
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('time_range') || '30d';

    // Calculate date range
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysAgo);

    // Fetch all analytics events in time range
    const { data: events, error: eventsError } = await adminClient
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // Fetch all profiles to match with visitors
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('id, user_id, email')
      .eq('is_deleted', false);

    if (profilesError) {
      console.warn('Error fetching profiles:', profilesError);
    }

    // Fetch conversions
    const { data: conversions } = await adminClient
      .from('analytics_conversions')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // Fetch sessions to get user_id matches
    const { data: sessions } = await adminClient
      .from('analytics_sessions')
      .select('id, user_id')
      .gte('start_time', startDate.toISOString());

    // Group events by session_id or IP
    const visitorMap = new Map<string, {
      session_id: string | null;
      ip_address: string | null;
      events: any[];
      first_visit: Date;
      last_visit: Date;
      countries: Set<string>;
      cities: Set<string>;
      devices: Set<string>;
      browsers: Set<string>;
      os_set: Set<string>;
      referrers: Set<string>;
      page_views: number;
      conversions: number;
    }>();

    events?.forEach(event => {
      const key = event.session_id || event.ip_address || 'unknown';
      let existing = visitorMap.get(key);
      if (!existing) {
        existing = {
          session_id: event.session_id,
          ip_address: event.ip_address,
          events: [] as any[],
          first_visit: new Date(event.created_at),
          last_visit: new Date(event.created_at),
          countries: new Set<string>(),
          cities: new Set<string>(),
          devices: new Set<string>(),
          browsers: new Set<string>(),
          os_set: new Set<string>(),
          referrers: new Set<string>(),
          page_views: 0,
          conversions: 0,
        };
        visitorMap.set(key, existing);
      }

      existing.events.push(event);
      const eventDate = new Date(event.created_at);
      if (eventDate < existing.first_visit) existing.first_visit = eventDate;
      if (eventDate > existing.last_visit) existing.last_visit = eventDate;
      
      if (event.country) existing.countries.add(event.country);
      if (event.city) existing.cities.add(event.city);
      if (event.device_type) existing.devices.add(event.device_type);
      if (event.browser) existing.browsers.add(event.browser);
      if (event.os) existing.os_set.add(event.os);
      if (event.referrer) existing.referrers.add(event.referrer);
      if (event.event_type === 'page_view') existing.page_views++;
      if (event.event_type === 'conversion') existing.conversions++;

      visitorMap.set(key, existing);
    });

    // Process visitors and match with accounts
    const visitorsArray = Array.from(visitorMap.entries()).map(([key, data]) => {
      const matchingProfileIds = new Set<string>();
      const matchingUserIds = new Set<string>();
      const matchingEmails = new Set<string>();

      // Match events to profiles
      if (data.ip_address || data.session_id) {
        events?.forEach(event => {
          // Match by IP
          if (data.ip_address && event.ip_address === data.ip_address && event.profile_id) {
            matchingProfileIds.add(event.profile_id);
          }
          // Match by session
          if (data.session_id && event.session_id === data.session_id && event.profile_id) {
            matchingProfileIds.add(event.profile_id);
          }
        });

        // Get profile details for matched profiles
        const matchedProfiles = (profiles || []).filter(p => matchingProfileIds.has(p.id));
        matchedProfiles.forEach(profile => {
          if (profile.user_id) matchingUserIds.add(profile.user_id);
          if (profile.email) matchingEmails.add(profile.email);
        });

        // Also check sessions table for user_id matches
        if (data.session_id && sessions) {
          const matchingSession = sessions.find(s => s.id === data.session_id && s.user_id);
          if (matchingSession && matchingSession.user_id) {
            matchingUserIds.add(matchingSession.user_id);
            
            // Get profiles for this user_id
            const userProfiles = (profiles || []).filter(p => p.user_id === matchingSession.user_id);
            userProfiles.forEach(profile => {
              matchingProfileIds.add(profile.id);
              if (profile.email) matchingEmails.add(profile.email);
            });
          }
        }
      }

      const profileIds = Array.from(matchingProfileIds);
      const userIds = Array.from(matchingUserIds);
      const emails = Array.from(matchingEmails);

      // Calculate engagement metrics
      const sessionDurations = new Map<string, number>();
      const sessionPageCounts = new Map<string, number>();
      const sessionStartTimes = new Map<string, Date>();

      data.events.forEach(event => {
        if (event.session_id) {
          if (!sessionStartTimes.has(event.session_id)) {
            sessionStartTimes.set(event.session_id, new Date(event.created_at));
          }
          const startTime = sessionStartTimes.get(event.session_id)!;
          const duration = new Date(event.created_at).getTime() - startTime.getTime();
          sessionDurations.set(event.session_id, Math.max(sessionDurations.get(event.session_id) || 0, duration));
          
          if (event.event_type === 'page_view') {
            sessionPageCounts.set(event.session_id, (sessionPageCounts.get(event.session_id) || 0) + 1);
          }
        }
      });

      const avgDuration = Array.from(sessionDurations.values()).reduce((a, b) => a + b, 0) / sessionDurations.size || 0;
      const avgPages = Array.from(sessionPageCounts.values()).reduce((a, b) => a + b, 0) / sessionPageCounts.size || 0;
      
      // Calculate bounce rate (sessions with only 1 page view)
      const singlePageSessions = Array.from(sessionPageCounts.values()).filter(count => count === 1).length;
      const bounceRate = sessionPageCounts.size > 0 ? (singlePageSessions / sessionPageCounts.size) * 100 : 0;

      // Calculate engagement score
      const engagementScore = data.events.reduce((score, event) => {
        const scoreMap: Record<string, number> = {
          'page_view': 1,
          'scroll': 0.5,
          'click': 2,
          'form_interaction': 3,
          'form_submit': 10,
          'conversion': 20,
        };
        return score + (scoreMap[event.event_type] || 0);
      }, 0);

      // Count conversions for this visitor
      const visitorConversions = (conversions || []).filter(c => 
        c.session_id === data.session_id || 
        (data.ip_address && c.metadata?.ip_address === data.ip_address)
      ).length;

      return {
        id: key,
        session_id: data.session_id,
        ip_address: data.ip_address,
        first_visit: data.first_visit.toISOString(),
        last_visit: data.last_visit.toISOString(),
        total_visits: new Set(data.events.filter(e => e.event_type === 'page_view').map(e => e.session_id || e.ip_address)).size,
        total_events: data.events.length,
        total_conversions: visitorConversions,
        country: Array.from(data.countries)[0] || null,
        city: Array.from(data.cities)[0] || null,
        device_type: Array.from(data.devices)[0] || null,
        browser: Array.from(data.browsers)[0] || null,
        os: Array.from(data.os_set)[0] || null,
        referrer: Array.from(data.referrers)[0] || null,
        has_account: userIds.length > 0,
        account_count: userIds.length,
        user_ids: userIds,
        profile_ids: profileIds,
        emails: emails as string[],
        engagement_score: engagementScore,
        avg_session_duration: Math.round(avgDuration / 1000), // seconds
        pages_per_session: Math.round(avgPages * 10) / 10,
        bounce_rate: Math.round(bounceRate * 10) / 10,
      };
    });

    // Sort by last visit (most recent first)
    visitorsArray.sort((a, b) => 
      new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime()
    );

    return NextResponse.json({
      visitors: visitorsArray,
      total: visitorsArray.length,
    });
  } catch (error) {
    console.error('Error in admin visitors API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


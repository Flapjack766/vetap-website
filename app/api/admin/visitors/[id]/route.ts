import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin API Route for Visitor Details
 * 
 * This route uses service_role key to access all analytics data for a specific visitor.
 * Only accessible by authenticated admin users.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const ipAddress = searchParams.get('ip_address');

    // Now use admin client to access all data
    const adminClient = createAdminClient();

    // Fetch sessions
    const sessionsQuery = adminClient
      .from('analytics_sessions')
      .select('*')
      .order('start_time', { ascending: false });

    if (sessionId) {
      sessionsQuery.eq('id', sessionId);
    } else if (ipAddress) {
      sessionsQuery.eq('ip_address', ipAddress);
    } else {
      // Try to determine from id
      if (id.includes('.')) {
        // Looks like an IP address
        sessionsQuery.eq('ip_address', id);
      } else {
        sessionsQuery.eq('id', id);
      }
    }

    const { data: sessions } = await sessionsQuery;

    // Fetch events
    const eventsQuery = adminClient
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (sessionId) {
      eventsQuery.eq('session_id', sessionId);
    } else if (ipAddress) {
      eventsQuery.eq('ip_address', ipAddress);
    } else {
      // Try to determine from id
      if (id.includes('.')) {
        // Looks like an IP address
        eventsQuery.eq('ip_address', id);
      } else {
        eventsQuery.eq('session_id', id);
      }
    }

    const { data: events } = await eventsQuery;

    // Fetch conversions
    const conversionsQuery = adminClient
      .from('analytics_conversions')
      .select('*')
      .order('created_at', { ascending: false });

    if (sessionId) {
      conversionsQuery.eq('session_id', sessionId);
    } else {
      if (id.includes('.')) {
        // IP address - need to match via metadata
        conversionsQuery.not('metadata', 'is', null);
      } else {
        conversionsQuery.eq('session_id', id);
      }
    }

    const { data: conversions } = await conversionsQuery;

    // Fetch user journey
    const journeyQuery = adminClient
      .from('analytics_user_journey')
      .select('*')
      .order('step_number', { ascending: true });

    if (sessionId) {
      journeyQuery.eq('session_id', sessionId);
    } else {
      if (!id.includes('.')) {
        journeyQuery.eq('session_id', id);
      }
    }

    const { data: journey } = await journeyQuery;

    // Fetch profiles if we have profile_ids from the main visitor data
    // This would need to be passed from the frontend, but for now we'll try to infer
    const profileIds = new Set<string>();
    events?.forEach(event => {
      if (event.profile_id) {
        profileIds.add(event.profile_id);
      }
    });

    let profiles: any[] = [];
    if (profileIds.size > 0) {
      const { data: profilesData } = await adminClient
        .from('profiles')
        .select('*')
        .in('id', Array.from(profileIds))
        .eq('is_deleted', false);

      profiles = profilesData || [];
    }

    return NextResponse.json({
      sessions: sessions || [],
      events: events || [],
      conversions: conversions || [],
      profiles: profiles,
      user_journey: journey || [],
    });
  } catch (error) {
    console.error('Error in admin visitor details API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


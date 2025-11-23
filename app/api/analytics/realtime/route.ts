import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profile_id');
    
    if (!profileId) {
      return NextResponse.json(
        { error: 'profile_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get active sessions (sessions with activity in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('analytics_sessions')
      .select('*')
      .eq('profile_id', profileId)
      .gte('updated_at', fiveMinutesAgo)
      .is('end_time', null)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (sessionsError) {
      console.error('Error fetching active sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch real-time data' },
        { status: 500 }
      );
    }

    // Get recent events (last 5 minutes)
    const { data: recentEvents, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('profile_id', profileId)
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(100);

    if (eventsError) {
      console.error('Error fetching recent events:', eventsError);
    }

    // Get recent conversions (last 5 minutes)
    const { data: recentConversions, error: conversionsError } = await supabase
      .from('analytics_conversions')
      .select('*')
      .eq('profile_id', profileId)
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(50);

    if (conversionsError) {
      console.error('Error fetching recent conversions:', conversionsError);
    }

    return NextResponse.json({
      active_visitors: activeSessions?.length || 0,
      active_sessions: activeSessions || [],
      recent_events: recentEvents || [],
      recent_conversions: recentConversions || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in real-time analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


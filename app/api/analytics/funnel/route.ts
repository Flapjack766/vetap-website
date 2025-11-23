import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profile_id');
    const funnelSteps = searchParams.get('steps')?.split(',') || [];
    const timeRange = searchParams.get('time_range') || '30d';
    
    if (!profileId) {
      return NextResponse.json(
        { error: 'profile_id is required' },
        { status: 400 }
      );
    }

    if (funnelSteps.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 funnel steps are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Calculate date range
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get all sessions for this profile in the time range
    const { data: sessions, error: sessionsError } = await supabase
      .from('analytics_sessions')
      .select('id')
      .eq('profile_id', profileId)
      .gte('start_time', startDate.toISOString());

    if (sessionsError) {
      throw sessionsError;
    }

    const sessionIds = sessions?.map(s => s.id) || [];

    if (sessionIds.length === 0) {
      return NextResponse.json({
        steps: funnelSteps.map((step, index) => ({
          step_name: step,
          step_number: index + 1,
          visitors: 0,
          conversion_rate: index === 0 ? 100 : 0,
        })),
        total_sessions: 0,
      });
    }

    // For each step, count unique sessions that reached it
    const funnelResults: Array<{ step_name: string; step_number: number; visitors: number; conversion_rate: number }> = [];
    
    for (let index = 0; index < funnelSteps.length; index++) {
      const step = funnelSteps[index];
      // Determine event type based on step
      let eventType = 'page_view';
      let eventLabel = null;
      
      if (step.startsWith('page:')) {
        eventType = 'page_view';
        eventLabel = step.replace('page:', '');
      } else if (step.startsWith('event:')) {
        eventType = step.replace('event:', '');
      } else {
        eventLabel = step;
      }

      const query = supabase
        .from('analytics_events')
        .select('session_id', { count: 'exact' })
        .in('session_id', sessionIds)
        .eq('event_type', eventType);

      if (eventLabel) {
        if (eventType === 'page_view') {
          query.eq('page_path', eventLabel);
        } else {
          query.eq('event_label', eventLabel);
        }
      }

      const { data, count, error } = await query;

      if (error) {
        console.error(`Error fetching step ${step}:`, error);
        funnelResults.push({
          step_name: step,
          step_number: index + 1,
          visitors: 0,
          conversion_rate: 0,
        });
        continue;
      }

      const uniqueSessions = new Set(data?.map(e => e.session_id) || []);
      const visitors = uniqueSessions.size;
      const previousVisitors = index > 0 ? funnelResults[index - 1]?.visitors || visitors : visitors;
      const conversionRate = previousVisitors > 0 ? (visitors / previousVisitors) * 100 : 0;

      funnelResults.push({
        step_name: step,
        step_number: index + 1,
        visitors,
        conversion_rate: conversionRate,
      });
    }

    return NextResponse.json({
      steps: funnelResults,
      total_sessions: sessionIds.length,
      overall_conversion_rate: funnelResults.length > 0 
        ? (funnelResults[funnelResults.length - 1].visitors / funnelResults[0].visitors) * 100 
        : 0,
    });
  } catch (error) {
    console.error('Error in funnel analysis API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


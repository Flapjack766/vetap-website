import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profile_id');
    const format = searchParams.get('format') || 'json'; // json or csv
    const timeRange = searchParams.get('time_range') || '30d';

    if (!profileId) {
      return NextResponse.json(
        { error: 'profile_id is required' },
        { status: 400 }
      );
    }

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user owns this profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profile || profile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Calculate date range
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysAgo);

    // Fetch analytics events
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('profile_id', profileId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (eventsError) {
      throw eventsError;
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Date',
        'Event Type',
        'Page Path',
        'Referrer',
        'Device Type',
        'Browser',
        'OS',
        'Country',
        'City',
        'Link Type',
        'Link URL',
      ];

      const rows = (events || []).map(event => [
        new Date(event.created_at).toISOString(),
        event.event_type,
        event.page_path || '',
        event.referrer || '',
        event.device_type || '',
        event.browser || '',
        event.os || '',
        event.country || '',
        event.city || '',
        event.metadata?.link_type || '',
        event.metadata?.link_url || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="analytics-${profileId}-${Date.now()}.csv"`,
        },
      });
    } else {
      // Return JSON
      return NextResponse.json({
        profile_id: profileId,
        time_range: timeRange,
        exported_at: new Date().toISOString(),
        total_events: events?.length || 0,
        events: events || [],
      }, {
        headers: {
          'Content-Disposition': `attachment; filename="analytics-${profileId}-${Date.now()}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


/**
 * VETAP Event - Get Scan Logs for Event
 * GET /api/event/events/[id]/scan-logs
 * 
 * Returns scan logs for a specific event with pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import { authenticateRequest } from '@/lib/event/api-auth';

// Force Node runtime (Supabase admin client needs Node APIs)
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const user = authResult.user;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const gateId = searchParams.get('gate_id') || null;
    const result = searchParams.get('result') || null;

    let adminClient;
    try {
      adminClient = createEventAdminClient();
    } catch (err: any) {
      console.error('❌ Failed to create Supabase admin client:', err?.message || err);
      // Return diagnostic (no secrets) to help ops understand missing config
      return NextResponse.json(
        {
          error: 'Supabase configuration missing on server',
          missing: {
            NEXT_PUBLIC_SUPABASE_EVENT_URL: !process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL,
            SUPABASE_EVENT_SERVICE_ROLE_KEY: !process.env.SUPABASE_EVENT_SERVICE_ROLE_KEY,
            NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY: !process.env.NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY,
            SUPABASE_EVENT_SIGNING_SECRET: !process.env.SUPABASE_EVENT_SIGNING_SECRET,
          },
        },
        { status: 500 }
      );
    }

    // Build query
    let query = adminClient
      .from('event_scan_logs')
      .select(`
        id,
        event_id,
        pass_id,
        guest_id,
        gate_id,
        scanner_user_id,
        result,
        scanned_at,
        raw_payload,
        device_info,
        error_message,
        processing_time_ms,
        pass:event_passes(
          id,
          token,
          status,
          first_used_at,
          guest:event_guests(
            id,
            full_name,
            type,
            email,
            phone
          )
        ),
        gate:event_gates(
          id,
          name
        ),
        scanner:auth.users!event_scan_logs_scanner_user_id_fkey(
          id,
          email
        )
      `)
      .eq('event_id', eventId)
      .order('scanned_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (gateId) {
      query = query.eq('gate_id', gateId);
    }
    if (result) {
      query = query.eq('result', result);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching scan logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch scan logs', details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = adminClient
      .from('event_scan_logs')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (gateId) {
      countQuery = countQuery.eq('gate_id', gateId);
    }
    if (result) {
      countQuery = countQuery.eq('result', result);
    }

    const { count, error: countError } = await countQuery;

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    });

  } catch (error: any) {
    console.error('Scan logs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


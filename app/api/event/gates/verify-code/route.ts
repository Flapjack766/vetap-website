/**
 * VETAP Event - Gate Code Verification API
 * POST /api/event/gates/verify-code
 * 
 * Verifies a gate access code for quick check-in
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEventAdminClient } from '@/lib/supabase/event-admin';

interface VerifyCodeRequest {
  code: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyCodeRequest = await request.json();
    const { code } = body;

    if (!code || code.length < 4) {
      return NextResponse.json(
        { error: 'Invalid code', message: 'Please provide a valid gate code' },
        { status: 400 }
      );
    }

    const adminClient = createEventAdminClient();

    // Find gate by access code
    const { data: gate, error: gateError } = await adminClient
      .from('event_gates')
      .select(`
        id,
        name,
        event_id,
        access_code,
        allowed_guest_types
      `)
      .eq('access_code', code.toUpperCase())
      .maybeSingle();

    if (gateError) {
      console.error('Gate lookup error:', gateError);
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to verify code' },
        { status: 500 }
      );
    }

    if (!gate) {
      return NextResponse.json(
        { error: 'Invalid code', message: 'Gate code not found' },
        { status: 404 }
      );
    }

    // Get event info
    const { data: event, error: eventError } = await adminClient
      .from('event_events')
      .select('id, name, status, starts_at, ends_at')
      .eq('id', gate.event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found', message: 'Associated event not found' },
        { status: 404 }
      );
    }

    // Check if event is active
    if (event.status !== 'active') {
      return NextResponse.json(
        { error: 'Event inactive', message: 'This event is not currently active' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      gate: {
        id: gate.id,
        name: gate.name,
        event_id: gate.event_id,
        allowed_guest_types: gate.allowed_guest_types,
      },
      event: {
        id: event.id,
        name: event.name,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
      },
    });
  } catch (error: any) {
    console.error('Gate code verification error:', error);
    return NextResponse.json(
      { error: 'Server error', message: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}


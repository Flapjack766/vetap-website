/**
 * VETAP Event - Events API
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type EventUser } from '@/lib/event/api-auth';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import { z } from 'zod';

// QR Position schema
const qrPositionSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1),
  height: z.number().min(1),
  rotation: z.number().min(0).max(360).default(0),
}).optional();

const createEventSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  venue: z.string().optional().nullable(),
  venue_id: z.string().uuid().optional().nullable(),
  template_id: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  qr_position: qrPositionSchema,
  max_guests: z.number().int().min(0).optional().nullable(),
  pass_max_uses: z.number().int().min(1).default(1),
});

/**
 * GET /api/event/events
 * Get all events for the authenticated user
 */
export const GET = withAuth(async (request: NextRequest, { user }: { user: EventUser }) => {
  try {
    console.log('📋 Events API: Fetching events for user:', user.id, user.role);
    
    const adminClient = createEventAdminClient();
    
    let query = adminClient
      .from('event_events')
      .select('*')
      .order('created_at', { ascending: false });

    // If user has partner_id, filter by it
    if (user.partner_id) {
      query = query.eq('partner_id', user.partner_id);
    } else if (user.role !== 'owner') {
      // Users without partner can only see events they created
      query = query.eq('created_by', user.id);
    }
    // Owners can see all events

    const { data: events, error } = await query;

    if (error) {
      console.error('❌ Events API: Error fetching events:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Events API: Found', events?.length || 0, 'events');
    return NextResponse.json({ events: events || [] }, { status: 200 });
  } catch (error) {
    console.error('❌ Events API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/event/events
 * Create a new event
 */
export const POST = withAuth(async (request: NextRequest, { user }: { user: EventUser }) => {
  try {
    if (!['owner', 'partner_admin', 'organizer'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Event management permission required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createEventSchema.parse(body);

    const startsAt = new Date(validatedData.starts_at);
    const endsAt = new Date(validatedData.ends_at);
    
    if (endsAt <= startsAt) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const adminClient = createEventAdminClient();

    const { data: event, error } = await adminClient
      .from('event_events')
      .insert({
        ...validatedData,
        partner_id: user.partner_id || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', message: error.errors },
        { status: 400 }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
});

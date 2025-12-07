import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/event/api-auth';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import { z } from 'zod';
import type { Guest, GuestType } from '@/lib/event/types';

// Validation schema for single guest
const createGuestSchema = z.object({
  full_name: z.string().min(1).max(255),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  type: z.enum(['VIP', 'Regular', 'Staff', 'Media', 'Other']).default('Regular'),
  notes: z.string().optional(),
  zone_ids: z.array(z.string().uuid()).optional(),
});

/**
 * POST /api/event/events/[id]/guests
 * Add a single guest to an event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    const { id: eventId } = await params;

    // Check if user can manage events
    if (!['owner', 'partner_admin', 'organizer'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Event management permission required' },
        { status: 403 }
      );
    }

    try {
      const body = await req.json();
      const validatedData = createGuestSchema.parse(body);

      const supabase = createEventAdminClient();

      // Verify event exists and user has access
      let eventQuery = supabase
        .from('event_events')
        .select('id, partner_id')
        .eq('id', eventId);

      if (user.role !== 'owner') {
        if (!user.partner_id) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'User has no partner assigned' },
            { status: 403 }
          );
        }
        eventQuery = eventQuery.eq('partner_id', user.partner_id);
      }

      const { data: event, error: eventError } = await eventQuery.single();

      if (eventError || !event) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Event not found or access denied' },
          { status: 404 }
        );
      }

      // Create guest
      const { data: guest, error: createError } = await supabase
        .from('event_guests')
        .insert({
          event_id: eventId,
          full_name: validatedData.full_name.trim(),
          phone: validatedData.phone?.trim() || null,
          email: validatedData.email?.trim() || null,
          type: validatedData.type,
          notes: validatedData.notes?.trim() || null,
        })
        .select('id, event_id, full_name, phone, email, type, notes, created_at, updated_at')
        .single();

      if (createError) {
        console.error('Error creating guest:', createError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to create guest', details: createError.message },
          { status: 500 }
        );
      }

      // Note: Zones are associated with passes, not guests directly
      // If zone_ids are provided, they will be used when generating passes for this guest

      return NextResponse.json(
        { 
          success: true, 
          guest: guest as Guest 
        },
        { status: 201 }
      );
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
  })(request);
}

/**
 * GET /api/event/events/[id]/guests
 * Get list of guests for an event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    const { id: eventId } = await params;

    try {
      const supabase = createEventAdminClient();

      // Verify event exists and user has access
      let eventQuery = supabase
        .from('event_events')
        .select('id, partner_id')
        .eq('id', eventId);

      if (user.role !== 'owner') {
        if (!user.partner_id) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'User has no partner assigned' },
            { status: 403 }
          );
        }
        eventQuery = eventQuery.eq('partner_id', user.partner_id);
      }

      const { data: event, error: eventError } = await eventQuery.single();

      if (eventError || !event) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Event not found or access denied' },
          { status: 404 }
        );
      }

      // Optional filters
      const type = req.nextUrl.searchParams.get('type');
      const search = req.nextUrl.searchParams.get('search');

      let query = supabase
        .from('event_guests')
        .select(`
          id, 
          event_id, 
          full_name, 
          phone, 
          email, 
          type, 
          notes, 
          created_at, 
          updated_at
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data: guests, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching guests:', fetchError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to fetch guests', details: fetchError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          success: true, 
          guests: guests || [] 
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: error.message || 'Failed to fetch guests' },
        { status: 500 }
      );
    }
  })(request);
}


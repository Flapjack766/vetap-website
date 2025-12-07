import { NextRequest, NextResponse } from 'next/server';
import { withAuth, requireEventManagement } from '@/lib/event/api-auth';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import { z } from 'zod';
import type { GuestType } from '@/lib/event/types';

// Validation schema for CSV import
const importGuestsSchema = z.object({
  guests: z.array(z.object({
    full_name: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    type: z.enum(['VIP', 'Regular', 'Staff', 'Media', 'Other']).default('Regular'),
    notes: z.string().optional(),
    zone_ids: z.array(z.string().uuid()).optional(),
  })),
});

/**
 * POST /api/event/events/[id]/guests/import
 * Import multiple guests from CSV/Excel (parsed on client side)
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
      const validatedData = importGuestsSchema.parse(body);

      if (!validatedData.guests || validatedData.guests.length === 0) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'No guests provided' },
          { status: 400 }
        );
      }

      const supabase = createEventAdminClient();

      // Verify event exists and user has access
      let eventQuery = supabase
        .from('event_events')
        .select('id, partner_id')
        .eq('id', eventId)
        .single();

      if (user.role !== 'owner') {
        if (!user.partner_id) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'User has no partner assigned' },
            { status: 403 }
          );
        }
        eventQuery = eventQuery.eq('partner_id', user.partner_id);
      }

      const { data: event, error: eventError } = await eventQuery;

      if (eventError || !event) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Event not found or access denied' },
          { status: 404 }
        );
      }

      // Prepare guests for bulk insert
      const guestsToInsert = validatedData.guests.map(guest => ({
        event_id: eventId,
        full_name: guest.full_name.trim(),
        phone: guest.phone?.trim() || null,
        email: guest.email?.trim() || null,
        type: guest.type,
        notes: guest.notes?.trim() || null,
      }));

      // Bulk insert guests
      const { data: insertedGuests, error: insertError } = await supabase
        .from('event_guests')
        .insert(guestsToInsert)
        .select('id, event_id, full_name, phone, email, type, notes, created_at');

      if (insertError) {
        console.error('Error importing guests:', insertError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to import guests', details: insertError.message },
          { status: 500 }
        );
      }

      // Note: Zones are associated with passes, not guests directly
      // If zone_ids are provided in the import, they will be used when generating passes

      return NextResponse.json(
        { 
          success: true, 
          imported: insertedGuests?.length || 0,
          guests: insertedGuests || []
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


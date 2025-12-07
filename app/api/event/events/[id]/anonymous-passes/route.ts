import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/event/api-auth';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import { generateQRPayload } from '@/lib/event/qr-payload';
import { z } from 'zod';
import crypto from 'crypto';

const generateAnonymousPassesSchema = z.object({
  count: z.number().min(1).max(1000), // Maximum 1000 passes at once
  prefix: z.string().max(50).optional(), // Custom prefix for names
  valid_from: z.string().datetime().optional(),
  valid_to: z.string().datetime().optional(),
});

/**
 * POST /api/event/events/[id]/anonymous-passes
 * Generate anonymous passes for an event (without real guest information)
 * 
 * These passes:
 * - Have placeholder names like "Guest #1", "Guest #2", etc.
 * - Each have a unique QR code
 * - Follow all the same validation logic as regular passes
 * - Can be distributed to anyone without collecting their information
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    // Check if user can manage events
    if (!['owner', 'partner_admin', 'organizer'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Event management permission required' },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;

    try {
      const body = await req.json();
      const validatedData = generateAnonymousPassesSchema.parse(body);

      const adminClient = createEventAdminClient();

      // Verify event exists and user has access
      let eventQuery = adminClient
        .from('event_events')
        .select('id, partner_id, name, status')
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

      // Get the highest number from existing anonymous guests to continue numbering
      const { data: lastAnonymous } = await adminClient
        .from('event_guests')
        .select('full_name')
        .eq('event_id', eventId)
        .eq('is_anonymous', true)
        .order('full_name', { ascending: false })
        .limit(1);

      // Extract the number from the last anonymous guest name (e.g., "Guest #5" -> 5)
      let startNumber = 1;
      if (lastAnonymous && lastAnonymous.length > 0) {
        const match = lastAnonymous[0].full_name.match(/#(\d+)$/);
        if (match) {
          startNumber = parseInt(match[1], 10) + 1;
        }
      }
      
      const prefix = validatedData.prefix || 'Guest';

      const createdGuests: Array<{ id: string; full_name: string }> = [];
      const createdPasses: Array<{ id: string; guest_id: string; qr_payload: string }> = [];

      // Create anonymous guests and passes
      for (let i = 0; i < validatedData.count; i++) {
        const guestNumber = startNumber + i;
        const guestId = crypto.randomUUID();
        const passId = crypto.randomUUID();
        const token = crypto.randomUUID();

        // Create anonymous guest
        const guestData = {
          id: guestId,
          event_id: eventId,
          full_name: `${prefix} #${guestNumber}`,
          email: `anonymous_${guestNumber}_${eventId.substring(0, 8)}@anonymous.local`,
          is_anonymous: true,
        };

        const { error: guestError } = await adminClient
          .from('event_guests')
          .insert(guestData);

        if (guestError) {
          console.error('Error creating anonymous guest:', guestError);
          continue;
        }

        createdGuests.push({ id: guestId, full_name: guestData.full_name });

        // Generate QR payload for the pass
        const qrPayload = generateQRPayload(
          eventId,
          passId,
          guestId,
          validatedData.valid_to ? new Date(validatedData.valid_to) : undefined,
          event.partner_id
        );

        // Create pass
        const passData = {
          id: passId,
          event_id: eventId,
          guest_id: guestId,
          token: token,
          qr_payload: qrPayload,
          status: 'unused' as const,
          valid_from: validatedData.valid_from || null,
          valid_to: validatedData.valid_to || null,
          is_anonymous: true,
        };

        const { error: passError } = await adminClient
          .from('event_passes')
          .insert(passData);

        if (passError) {
          console.error('Error creating anonymous pass:', passError);
          // Rollback guest creation
          await adminClient.from('event_guests').delete().eq('id', guestId);
          continue;
        }

        createdPasses.push({ id: passId, guest_id: guestId, qr_payload: qrPayload });
      }

      return NextResponse.json(
        {
          success: true,
          message: `Generated ${createdPasses.length} anonymous passes`,
          generated: createdPasses.length,
          requested: validatedData.count,
          guests: createdGuests,
          passes: createdPasses.map(p => ({ id: p.id, guest_id: p.guest_id })),
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
        { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'An unexpected error occurred' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/event/events/[id]/anonymous-passes
 * Get all anonymous passes for an event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    const { id: eventId } = await params;

    try {
      const adminClient = createEventAdminClient();

      // Verify event exists and user has access
      let eventQuery = adminClient
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

      // Get anonymous passes with their guests
      const { data: passes, error: passesError } = await adminClient
        .from('event_passes')
        .select(`
          id,
          event_id,
          guest_id,
          token,
          status,
          valid_from,
          valid_to,
          first_scanned_at,
          created_at,
          guest:event_guests(
            id,
            full_name,
            is_anonymous
          )
        `)
        .eq('event_id', eventId)
        .eq('is_anonymous', true)
        .order('created_at', { ascending: false });

      if (passesError) {
        console.error('Error fetching anonymous passes:', passesError);
        return NextResponse.json(
          { error: 'Database Error', message: 'Failed to fetch anonymous passes' },
          { status: 500 }
        );
      }

      // Count statistics
      const stats = {
        total: passes?.length || 0,
        unused: passes?.filter(p => p.status === 'unused').length || 0,
        used: passes?.filter(p => p.status === 'used').length || 0,
        revoked: passes?.filter(p => p.status === 'revoked').length || 0,
      };

      return NextResponse.json({
        passes: passes || [],
        stats,
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'An unexpected error occurred' },
        { status: 500 }
      );
    }
  })(request);
}


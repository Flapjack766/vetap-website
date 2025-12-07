import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/event/api-auth';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import { generateUniqueToken } from '@/lib/event/token-generator';
import { generateQRPayload } from '@/lib/event/qr-payload';
import type { Pass, PassStatus } from '@/lib/event/types';

/**
 * GET /api/event/events/[id]/passes
 * Get list of passes for an event with their status
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
      const status = req.nextUrl.searchParams.get('status');
      const guestId = req.nextUrl.searchParams.get('guest_id');

      let query = supabase
        .from('event_passes')
        .select(`
          id,
          event_id,
          guest_id,
          token,
          qr_payload,
          status,
          first_scanned_at,
          last_scanned_at,
          valid_from,
          valid_to,
          generated_at,
          revoked_at,
          is_anonymous,
          guest:event_guests(id, full_name, email, phone, is_anonymous)
        `)
        .eq('event_id', eventId)
        .order('generated_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (guestId) {
        query = query.eq('guest_id', guestId);
      }

      const { data: passes, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching passes:', fetchError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to fetch passes', details: fetchError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          success: true, 
          passes: passes || [] 
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: error.message || 'Failed to fetch passes' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * POST /api/event/events/[id]/passes
 * Generate passes for guests without passes
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
      const supabase = createEventAdminClient();

      // Verify event exists and user has access
      let eventQuery = supabase
        .from('event_events')
        .select('id, partner_id, name, starts_at, ends_at')
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

      // Get all guests for this event
      const { data: guests, error: guestsError } = await supabase
        .from('event_guests')
        .select('id, full_name, email')
        .eq('event_id', eventId);

      if (guestsError) {
        console.error('Error fetching guests:', guestsError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to fetch guests', details: guestsError.message },
          { status: 500 }
        );
      }

      if (!guests || guests.length === 0) {
        return NextResponse.json(
          { 
            success: true, 
            message: 'No guests found for this event',
            generated: 0,
            passes: []
          },
          { status: 200 }
        );
      }

      // Get existing passes to find guests without passes
      const { data: existingPasses, error: passesError } = await supabase
        .from('event_passes')
        .select('guest_id')
        .eq('event_id', eventId);

      if (passesError) {
        console.error('Error fetching existing passes:', passesError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to fetch existing passes', details: passesError.message },
          { status: 500 }
        );
      }

      const guestsWithPasses = new Set(existingPasses?.map(p => p.guest_id) || []);
      const guestsWithoutPasses = guests.filter(g => !guestsWithPasses.has(g.id));

      if (guestsWithoutPasses.length === 0) {
        return NextResponse.json(
          { 
            success: true, 
            message: 'All guests already have passes',
            generated: 0,
            passes: []
          },
          { status: 200 }
        );
      }

      // Get partner_id for QR payload signing
      const partnerId = event.partner_id;

      // Generate passes for guests without passes
      const passesToInsert = await Promise.all(
        guestsWithoutPasses.map(async (guest) => {
          // Generate unique token (32 bytes hex)
          const token = await generateUniqueToken(eventId);
          
          // Generate QR payload with digital signature
          const expiresAt = event.ends_at ? new Date(event.ends_at) : undefined;
          const qrPayload = generateQRPayload(
            eventId,
            '', // Pass ID will be set after insert
            guest.id,
            expiresAt,
            partnerId
          );

          return {
            event_id: eventId,
            guest_id: guest.id,
            token: token,
            qr_payload: qrPayload, // Will be updated with actual pass_id after insert
            status: 'unused' as PassStatus,
            valid_from: event.starts_at ? new Date(event.starts_at).toISOString() : null,
            valid_to: event.ends_at ? new Date(event.ends_at).toISOString() : null,
            generated_at: new Date().toISOString(),
          };
        })
      );

      // Bulk insert passes
      const { data: insertedPasses, error: insertError } = await supabase
        .from('event_passes')
        .insert(passesToInsert)
        .select('id, event_id, guest_id, token, qr_payload, status, valid_from, valid_to, generated_at');

      if (insertError) {
        console.error('Error generating passes:', insertError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to generate passes', details: insertError.message },
          { status: 500 }
        );
      }

      // Update QR payloads with actual pass IDs
      if (insertedPasses && insertedPasses.length > 0) {
        await Promise.all(
          insertedPasses.map(async (pass) => {
            // Regenerate QR payload with actual pass ID
            const expiresAt = pass.valid_to ? new Date(pass.valid_to) : undefined;
            const guestId = pass.guest_id;
            const updatedQRPayload = generateQRPayload(
              eventId,
              pass.id, // Actual pass ID
              guestId,
              expiresAt,
              partnerId
            );

            // Update pass with correct QR payload
            await supabase
              .from('event_passes')
              .update({ qr_payload: updatedQRPayload })
              .eq('id', pass.id);
          })
        );

        // Fetch updated passes
        const { data: updatedPasses } = await supabase
          .from('event_passes')
          .select('id, event_id, guest_id, token, qr_payload, status, valid_from, valid_to, generated_at')
          .in('id', insertedPasses.map(p => p.id));
        
        if (updatedPasses) {
          return NextResponse.json(
            { 
              success: true, 
              generated: updatedPasses.length,
              passes: updatedPasses
            },
            { status: 201 }
          );
        }
      }

      return NextResponse.json(
        { 
          success: true, 
          generated: insertedPasses?.length || 0,
          passes: insertedPasses || []
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('Unexpected error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: error.message || 'An unexpected error occurred' },
        { status: 500 }
      );
    }
  })(request);
}

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/event/api-auth';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import { z } from 'zod';

// QR Position schema
const qrPositionSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1),
  height: z.number().min(1),
  rotation: z.number().min(0).max(360).default(0),
}).optional().nullable();

// Validation schema for update
const updateEventSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
  venue: z.string().optional().nullable(),
  venue_id: z.string().uuid().optional().nullable(),
  template_id: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  qr_position: qrPositionSchema,
  max_guests: z.number().int().min(0).optional().nullable(),
  pass_max_uses: z.number().int().min(1).optional(),
});

/**
 * GET /api/event/events/[id]
 * Get event details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    const { id } = await params;

    try {
      const supabase = createEventAdminClient();

      let query = supabase
        .from('event_events')
        .select(`
          *,
          partner:event_partners(id, name, logo_url),
          created_by_user:event_users!event_events_created_by_fkey(id, name, email),
          template:event_templates(id, name, base_file_url)
        `)
        .eq('id', id);

      // Non-owners can only see their partner's events
      if (user.role !== 'owner') {
        if (!user.partner_id) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'User has no partner assigned' },
            { status: 403 }
          );
        }
        query = query.eq('partner_id', user.partner_id);
      }

      const { data: event, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Not Found', message: 'Event not found' },
            { status: 404 }
          );
        }
        console.error('Error fetching event:', error);
        return NextResponse.json(
          { error: 'Internal Server Error', message: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ event }, { status: 200 });
    } catch (error: any) {
      console.error('Unexpected error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'An unexpected error occurred' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * PATCH /api/event/events/[id]
 * Update event details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    const { id } = await params;

    // Check if user can manage events
    if (!['owner', 'partner_admin', 'organizer'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Event management permission required' },
        { status: 403 }
      );
    }

    try {
      const body = await req.json();
      const validatedData = updateEventSchema.parse(body);

      const supabase = createEventAdminClient();

      // First, verify event exists and user has access
      let eventQuery = supabase
        .from('event_events')
        .select('id, partner_id')
        .eq('id', id);

      if (user.role !== 'owner') {
        if (!user.partner_id) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'User has no partner assigned' },
            { status: 403 }
          );
        }
        eventQuery = eventQuery.eq('partner_id', user.partner_id);
      }

      const { data: existingEvent, error: fetchError } = await eventQuery.single();

      if (fetchError || !existingEvent) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Event not found or access denied' },
          { status: 404 }
        );
      }

      // Verify dates if both are provided
      if (validatedData.starts_at && validatedData.ends_at) {
        const startsAt = new Date(validatedData.starts_at);
        const endsAt = new Date(validatedData.ends_at);
        
        if (endsAt <= startsAt) {
          return NextResponse.json(
            { error: 'Bad Request', message: 'End date must be after start date' },
            { status: 400 }
          );
        }
      }

      // Update event
      const { data: event, error: updateError } = await supabase
        .from('event_events')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating event:', updateError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ event }, { status: 200 });
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
 * DELETE /api/event/events/[id]
 * Archive or delete event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    const { id } = await params;

    // Check if user can manage events
    if (!['owner', 'partner_admin', 'organizer'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Event management permission required' },
        { status: 403 }
      );
    }

    try {
      const supabase = createEventAdminClient();

      // First, verify event exists and user has access
      let eventQuery = supabase
        .from('event_events')
        .select('id, partner_id, status')
        .eq('id', id);

      if (user.role !== 'owner') {
        if (!user.partner_id) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'User has no partner assigned' },
            { status: 403 }
          );
        }
        eventQuery = eventQuery.eq('partner_id', user.partner_id);
      }

      const { data: existingEvent, error: fetchError } = await eventQuery.single();

      if (fetchError || !existingEvent) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Event not found or access denied' },
          { status: 404 }
        );
      }

      // Check query parameter for hard delete vs archive
      const hardDelete = req.nextUrl.searchParams.get('hard') === 'true';

      if (hardDelete && user.role !== 'owner') {
        // Only owners can hard delete
        return NextResponse.json(
          { error: 'Forbidden', message: 'Only owners can permanently delete events' },
          { status: 403 }
        );
      }

      if (hardDelete) {
        // Hard delete (permanent)
        const { error: deleteError } = await supabase
          .from('event_events')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error('Error deleting event:', deleteError);
          return NextResponse.json(
            { error: 'Internal Server Error', message: deleteError.message },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { success: true, message: 'Event permanently deleted' },
          { status: 200 }
        );
      } else {
        // Soft delete (archive)
        const { data: event, error: updateError } = await supabase
          .from('event_events')
          .update({
            status: 'archived',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('Error archiving event:', updateError);
          return NextResponse.json(
            { error: 'Internal Server Error', message: updateError.message },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { success: true, event, message: 'Event archived successfully' },
          { status: 200 }
        );
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'An unexpected error occurred' },
        { status: 500 }
      );
    }
  })(request);
}


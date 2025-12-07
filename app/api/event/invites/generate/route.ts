import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/event/api-auth';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import { generateInviteFile, getFileExtension, getMimeType } from '@/lib/event/invite-generator';
import { generateQRPayload } from '@/lib/event/qr-payload';
import { z } from 'zod';

const generateInviteSchema = z.object({
  pass_id: z.string().uuid(),
  format: z.enum(['png', 'jpg', 'pdf']).default('png'),
  include_guest_info: z.boolean().default(false),
  quality: z.number().min(1).max(100).optional(),
});

/**
 * POST /api/event/invites/generate
 * Generate invitation file for a pass
 * 
 * Requires: owner, partner_admin, or organizer role
 */
export async function POST(request: NextRequest) {
  return withAuth(async (req, { user }) => {
    // Check if user can manage events
    if (!['owner', 'partner_admin', 'organizer'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Event management permission required' },
        { status: 403 }
      );
    }

    try {
      const body = await req.json();
      const validatedData = generateInviteSchema.parse(body);

      const adminClient = createEventAdminClient();

      // Fetch pass with event, guest, and template
      const { data: passData, error: passError } = await adminClient
        .from('event_passes')
        .select(`
          id,
          event_id,
          guest_id,
          qr_payload,
          event:event_events(
            id,
            partner_id,
            template_id,
            qr_position
          ),
          guest:event_guests(
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('id', validatedData.pass_id)
        .single();

      if (passError || !passData) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Pass not found' },
          { status: 404 }
        );
      }

      // Extract relations (Supabase returns arrays for relations)
      const event = Array.isArray(passData.event) ? passData.event[0] : passData.event;
      const guest = Array.isArray(passData.guest) ? passData.guest[0] : passData.guest;

      if (!event) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Event not found' },
          { status: 404 }
        );
      }

      // Verify access
      if (user.role !== 'owner') {
        if (!user.partner_id || event.partner_id !== user.partner_id) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'Access denied' },
            { status: 403 }
          );
        }
      }

      // Fetch template
      if (!event.template_id) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'Event has no template assigned' },
          { status: 400 }
        );
      }

      const { data: template, error: templateError } = await adminClient
        .from('event_templates')
        .select('id, name, base_file_url, qr_position_x, qr_position_y, qr_width, qr_height, qr_rotation, file_type, is_active, created_at')
        .eq('id', event.template_id)
        .single();

      if (templateError || !template) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Template not found' },
          { status: 404 }
        );
      }

      // Generate QR payload if not present
      let qrPayload = passData.qr_payload;
      if (!qrPayload && guest) {
        qrPayload = generateQRPayload(
          event.id,
          passData.id,
          guest.id,
          undefined,
          event.partner_id
        );
      }

      // Merge event's qr_position with template data (event position takes precedence)
      const qrPosition = event.qr_position as { x?: number; y?: number; width?: number; height?: number } | null;
      const templateWithPosition = {
        ...template,
        qr_position_x: qrPosition?.x ?? template.qr_position_x,
        qr_position_y: qrPosition?.y ?? template.qr_position_y,
        qr_width: qrPosition?.width ?? template.qr_width,
        qr_height: qrPosition?.height ?? template.qr_height,
      };

      // Generate invite file
      const inviteBuffer = await generateInviteFile(
        templateWithPosition,
        passData as any,
        guest as any,
        qrPayload,
        {
          format: validatedData.format,
          includeGuestInfo: validatedData.include_guest_info,
          quality: validatedData.quality,
        }
      );

      // Upload to Supabase Storage
      const fileExtension = getFileExtension(validatedData.format);
      const fileName = `invites/${event.id}/${passData.id}.${fileExtension}`;
      
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from('event-invites')
        .upload(fileName, inviteBuffer, {
          contentType: getMimeType(validatedData.format),
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading invite file:', uploadError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to upload invite file', details: uploadError.message },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = adminClient.storage
        .from('event-invites')
        .getPublicUrl(fileName);

      // Note: invite_file_url column needs to be added to event_passes table
      // Uncomment when column exists:
      // const { error: updateError } = await adminClient
      //   .from('event_passes')
      //   .update({ invite_file_url: urlData.publicUrl })
      //   .eq('id', validatedData.pass_id);
      // 
      // if (updateError) {
      //   console.error('Error updating pass with invite URL:', updateError);
      // }

      return NextResponse.json(
        {
          success: true,
          invite_url: urlData.publicUrl,
          file_name: fileName,
          format: validatedData.format,
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


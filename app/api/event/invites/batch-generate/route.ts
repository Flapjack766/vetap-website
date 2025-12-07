import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/event/api-auth';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import { generateInviteFile, getFileExtension, getMimeType } from '@/lib/event/invite-generator';
import { generateQRPayload } from '@/lib/event/qr-payload';
import { z } from 'zod';
// Note: archiver package needs to be installed: npm install archiver @types/archiver
// For now, we'll use a simpler approach without ZIP

const batchGenerateSchema = z.object({
  event_id: z.string().uuid(),
  pass_ids: z.array(z.string().uuid()).optional(), // If not provided, generate for all passes
  format: z.enum(['png', 'jpg', 'pdf']).default('png'),
  include_guest_info: z.boolean().default(false),
  quality: z.number().min(1).max(100).optional(),
  return_zip: z.boolean().default(false), // Return ZIP file or just URLs
});

/**
 * POST /api/event/invites/batch-generate
 * Generate invitation files for multiple passes
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
      const validatedData = batchGenerateSchema.parse(body);

      const adminClient = createEventAdminClient();

      // Verify event exists and user has access
      let eventQuery = adminClient
        .from('event_events')
        .select('id, partner_id, template_id, name, qr_position')
        .eq('id', validatedData.event_id);

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

      if (!event.template_id) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'Event has no template assigned' },
          { status: 400 }
        );
      }

      // Fetch template
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

      // Fetch passes
      let passesQuery = adminClient
        .from('event_passes')
        .select(`
          id,
          event_id,
          guest_id,
          qr_payload,
          guest:event_guests(
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('event_id', validatedData.event_id);

      if (validatedData.pass_ids && validatedData.pass_ids.length > 0) {
        passesQuery = passesQuery.in('id', validatedData.pass_ids);
      }

      const { data: passes, error: passesError } = await passesQuery;

      if (passesError || !passes || passes.length === 0) {
        return NextResponse.json(
          { error: 'Not Found', message: 'No passes found' },
          { status: 404 }
        );
      }

      // Generate invites
      const results: Array<{
        pass_id: string;
        guest_name: string;
        invite_url?: string;
        file_name?: string;
        error?: string;
      }> = [];

      // Merge event's qr_position with template data (event position takes precedence)
      const qrPosition = event.qr_position as { x?: number; y?: number; width?: number; height?: number } | null;
      const templateWithPosition = {
        ...template,
        qr_position_x: qrPosition?.x ?? template.qr_position_x,
        qr_position_y: qrPosition?.y ?? template.qr_position_y,
        qr_width: qrPosition?.width ?? template.qr_width,
        qr_height: qrPosition?.height ?? template.qr_height,
      };

      console.log('Template with position:', {
        originalTemplate: { x: template.qr_position_x, y: template.qr_position_y, w: template.qr_width, h: template.qr_height },
        eventPosition: qrPosition,
        merged: { x: templateWithPosition.qr_position_x, y: templateWithPosition.qr_position_y, w: templateWithPosition.qr_width, h: templateWithPosition.qr_height },
      });

      for (const pass of passes) {
        try {
          // Get guest data (Supabase returns array for relations)
          const guest = Array.isArray(pass.guest) ? pass.guest[0] : pass.guest;
          
          if (!guest) {
            results.push({
              pass_id: pass.id,
              guest_name: 'Unknown',
              error: 'Guest not found for pass',
            });
            continue;
          }

          // Generate QR payload if not present
          let qrPayload = pass.qr_payload;
          if (!qrPayload) {
            qrPayload = generateQRPayload(
              event.id,
              pass.id,
              guest.id,
              undefined,
              event.partner_id
            );
          }

          // Generate invite file
          const inviteBuffer = await generateInviteFile(
            templateWithPosition,
            pass as any,
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
          const fileName = `invites/${event.id}/${pass.id}.${fileExtension}`;
          
          const { data: uploadData, error: uploadError } = await adminClient.storage
            .from('event-invites')
            .upload(fileName, inviteBuffer, {
              contentType: getMimeType(validatedData.format),
              upsert: true,
            });

          if (uploadError) {
            results.push({
              pass_id: pass.id,
              guest_name: guest.full_name || 'Unknown',
              error: uploadError.message,
            });
            continue;
          }

          // Get public URL
          const { data: urlData } = adminClient.storage
            .from('event-invites')
            .getPublicUrl(fileName);

          // Update pass with invite file URL
          const { error: updateError } = await adminClient
            .from('event_passes')
            .update({ invite_file_url: urlData.publicUrl })
            .eq('id', pass.id);
          
          if (updateError) {
            console.error('Error updating pass with invite URL:', updateError);
          }

          results.push({
            pass_id: pass.id,
            guest_name: guest.full_name || 'Unknown',
            invite_url: urlData.publicUrl,
            file_name: fileName,
          });
        } catch (error: any) {
          results.push({
            pass_id: pass.id,
            guest_name: 'Unknown',
            error: error.message || 'Failed to generate invite',
          });
        }
      }

      // If return_zip is true, create ZIP file
      // Note: Requires archiver package: npm install archiver @types/archiver
      if (validatedData.return_zip) {
        try {
          const archiver = await import('archiver');
          const archive = archiver.default('zip', {
            zlib: { level: 9 },
          });

          // Fetch all successful invites and add to ZIP
          for (const result of results) {
            if (result.invite_url && result.file_name) {
              try {
                const response = await fetch(result.invite_url);
                if (response.ok) {
                  const buffer = Buffer.from(await response.arrayBuffer());
                  archive.append(buffer, {
                    name: `${result.guest_name.replace(/[^a-zA-Z0-9]/g, '_')}_${result.pass_id}.${getFileExtension(validatedData.format)}`,
                  });
                }
              } catch (error) {
                console.error(`Error adding ${result.file_name} to ZIP:`, error);
              }
            }
          }

          archive.finalize();

          // Convert archive stream to buffer
          const chunks: Buffer[] = [];
          archive.on('data', (chunk: Buffer) => chunks.push(chunk));
          await new Promise<void>((resolve, reject) => {
            archive.on('end', resolve);
            archive.on('error', reject);
          });

          const zipBuffer = Buffer.concat(chunks);

          // Upload ZIP to storage
          const zipFileName = `invites/${event.id}/all_invites_${Date.now()}.zip`;
          const { data: zipUploadData, error: zipUploadError } = await adminClient.storage
            .from('event-invites')
            .upload(zipFileName, zipBuffer, {
              contentType: 'application/zip',
              upsert: true,
            });

          if (zipUploadError) {
            return NextResponse.json(
              {
                success: true,
                generated: results.filter(r => r.invite_url).length,
                total: results.length,
                results,
                zip_error: zipUploadError.message,
                note: 'ZIP generation failed, but individual files were generated',
              },
              { status: 200 }
            );
          }

          const { data: zipUrlData } = adminClient.storage
            .from('event-invites')
            .getPublicUrl(zipFileName);

          return NextResponse.json(
            {
              success: true,
              generated: results.filter(r => r.invite_url).length,
              total: results.length,
              results,
              zip_url: zipUrlData.publicUrl,
            },
            { status: 200 }
          );
        } catch (error: any) {
          // If archiver is not installed, return results without ZIP
          console.error('ZIP generation error (archiver may not be installed):', error);
          return NextResponse.json(
            {
              success: true,
              generated: results.filter(r => r.invite_url).length,
              total: results.length,
              results,
              zip_error: 'ZIP generation not available. Please install archiver: npm install archiver @types/archiver',
            },
            { status: 200 }
          );
        }
      }

      return NextResponse.json(
        {
          success: true,
          generated: results.filter(r => r.invite_url).length,
          total: results.length,
          results,
        },
        { status: 200 }
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


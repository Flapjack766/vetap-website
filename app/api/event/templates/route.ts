import { NextRequest, NextResponse } from 'next/server';
import { withAuth, requireEventManagement } from '@/lib/event/api-auth';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import { z } from 'zod';
import type { Template } from '@/lib/event/types';

// Validation schema
const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  base_file_url: z.string().url(),
  qr_position_x: z.number().min(0).optional(),
  qr_position_y: z.number().min(0).optional(),
  qr_width: z.number().min(1).optional(),
  qr_height: z.number().min(1).optional(),
  qr_rotation: z.number().min(0).max(360).optional(),
  file_type: z.enum(['image', 'pdf']).optional(),
  partner_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().default(true),
});

/**
 * POST /api/event/templates
 * Create a new template
 * 
 * Requires: owner or partner_admin role
 * - Owners can create global templates (partner_id = null)
 * - Partner admins can create templates for their partner
 */
export async function POST(request: NextRequest) {
  return withAuth(async (req, { user }) => {
    // Check if user can manage templates
    if (!['owner', 'partner_admin', 'organizer'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Template management permission required' },
        { status: 403 }
      );
    }

    try {
      const body = await req.json();
      const validatedData = createTemplateSchema.parse(body);

      // Determine partner_id
      let targetPartnerId: string | null = null;

      if (user.role === 'owner') {
        // Owners can create global templates or partner-specific templates
        targetPartnerId = validatedData.partner_id || null;
      } else if (user.role === 'partner_admin' || user.role === 'organizer') {
        // Others can only create templates for their own partner
        if (validatedData.partner_id && validatedData.partner_id !== user.partner_id) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'You can only create templates for your own partner' },
            { status: 403 }
          );
        }
        targetPartnerId = user.partner_id;
      }

      const supabase = createEventAdminClient();

      // Create template
      const { data: template, error: createError } = await supabase
        .from('event_templates')
        .insert({
          name: validatedData.name.trim(),
          description: validatedData.description?.trim() || null,
          base_file_url: validatedData.base_file_url,
          qr_position_x: validatedData.qr_position_x || null,
          qr_position_y: validatedData.qr_position_y || null,
          qr_width: validatedData.qr_width || null,
          qr_height: validatedData.qr_height || null,
          qr_rotation: validatedData.qr_rotation || 0,
          file_type: validatedData.file_type || 'image',
          partner_id: targetPartnerId,
          is_active: validatedData.is_active,
        })
        .select('id, name, description, base_file_url, qr_position_x, qr_position_y, qr_width, qr_height, qr_rotation, file_type, partner_id, is_active, created_at, updated_at')
        .single();

      if (createError) {
        console.error('Error creating template:', createError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to create template', details: createError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          success: true, 
          template: template as Template 
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
 * GET /api/event/templates
 * Get list of available templates
 * 
 * - Owners: see all templates (global + all partners)
 * - Others: see global templates + templates for their partner
 */
export async function GET(request: NextRequest) {
  return withAuth(async (req, { user }) => {
    try {
      const supabase = createEventAdminClient();
      const partnerId = req.nextUrl.searchParams.get('partner_id');
      const includeGlobal = req.nextUrl.searchParams.get('include_global') !== 'false';

      let query = supabase
        .from('event_templates')
        .select('id, name, description, base_file_url, qr_position_x, qr_position_y, qr_width, qr_height, qr_rotation, file_type, partner_id, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (user.role === 'owner') {
        // Owners can see all templates
        if (partnerId) {
          query = query.eq('partner_id', partnerId);
        } else if (!includeGlobal) {
          query = query.not('partner_id', 'is', null);
        }
      } else {
        // Others can see global templates + their partner's templates
        if (user.partner_id) {
          query = query.or(`partner_id.is.null,partner_id.eq.${user.partner_id}`);
        } else {
          query = query.is('partner_id', null);
        }
      }

      const { data: templates, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching templates:', fetchError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to fetch templates', details: fetchError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          success: true, 
          templates: templates || [] 
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: error.message || 'Failed to fetch templates' },
        { status: 500 }
      );
    }
  })(request);
}


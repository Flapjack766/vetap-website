import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/event/api-auth';
import { createEventClient } from '@/lib/supabase/event-server';
import type { Partner } from '@/lib/event/types';

/**
 * POST /api/event/partners
 * Create a new Partner
 * 
 * Requires: owner or partner_admin role
 */
export async function POST(request: NextRequest) {
  return withAuth(async (req, { user }) => {
    // Check if user can manage partners (only owners can create partners)
    if (user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only owners can create partners' },
        { status: 403 }
      );
    }

    try {
      const body = await req.json();
      const { name, logo_url, webhook_url, settings } = body;

      // Validate required fields
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'Partner name is required' },
          { status: 400 }
        );
      }

      const supabase = await createEventClient();

      // Create partner
      const { data: partner, error: createError } = await supabase
        .from('event_partners')
        .insert({
          name: name.trim(),
          logo_url: logo_url || null,
          webhook_url: webhook_url || null,
          settings: settings || {},
        })
        .select('id, name, logo_url, webhook_url, settings, created_at, updated_at')
        .single();

      if (createError) {
        console.error('Error creating partner:', createError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to create partner', details: createError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          success: true, 
          partner: partner as Partner 
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: error.message || 'Failed to create partner' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/event/partners
 * Get list of partners
 * 
 * - Owners: see all partners
 * - Others: see only their own partner
 */
export async function GET(request: NextRequest) {
  return withAuth(async (req, { user }) => {
    try {
      const supabase = await createEventClient();

      let query = supabase
        .from('event_partners')
        .select('id, name, logo_url, webhook_url, settings, created_at, updated_at')
        .order('created_at', { ascending: false });

      // Non-owners can only see their own partner
      if (user.role !== 'owner') {
        if (!user.partner_id) {
          return NextResponse.json(
            { success: true, partners: [] },
            { status: 200 }
          );
        }
        query = query.eq('id', user.partner_id);
      }

      const { data: partners, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching partners:', fetchError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to fetch partners', details: fetchError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          success: true, 
          partners: partners || [] 
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: error.message || 'Failed to fetch partners' },
        { status: 500 }
      );
    }
  })(request);
}


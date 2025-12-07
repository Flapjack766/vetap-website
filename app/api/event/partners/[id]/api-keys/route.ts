import { NextRequest, NextResponse } from 'next/server';
import { withAuth, requirePartnerAccess } from '@/lib/event/api-auth';
import { createEventClient } from '@/lib/supabase/event-server';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import crypto from 'crypto';
import type { ApiKey } from '@/lib/event/types';

/**
 * POST /api/event/partners/[id]/api-keys
 * Generate a new API key for a partner
 * 
 * Requires: owner or partner_admin role with access to the partner
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    const { id: partnerId } = await params;

    // Check partner access
    const accessResult = await requirePartnerAccess(req, partnerId);
    if ('error' in accessResult) {
      return accessResult.error;
    }

    // Check if user can manage API keys (only owners and partner admins)
    if (!['owner', 'partner_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'API key management permission required' },
        { status: 403 }
      );
    }

    try {
      const body = await req.json();
      const { name, expires_at } = body;

      const supabase = await createEventClient();

      // Verify partner exists
      const { data: partner, error: partnerError } = await supabase
        .from('event_partners')
        .select('id, name')
        .eq('id', partnerId)
        .single();

      if (partnerError || !partner) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Partner not found' },
          { status: 404 }
        );
      }

      // Generate API key (random 32-byte hex string)
      const apiKey = crypto.randomBytes(32).toString('hex');
      
      // Hash the API key for storage (using SHA-256)
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      // Store hashed key in database
      const { data: apiKeyRecord, error: createError } = await supabase
        .from('event_api_keys')
        .insert({
          partner_id: partnerId,
          key_hash: keyHash,
          name: name?.trim() || null,
          expires_at: expires_at || null,
          created_by: user.id,
        })
        .select('id, partner_id, name, last_used_at, expires_at, created_at, created_by')
        .single();

      if (createError) {
        console.error('Error creating API key:', createError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to create API key', details: createError.message },
          { status: 500 }
        );
      }

      // Return the API key only once (client should store it securely)
      return NextResponse.json(
        { 
          success: true,
          api_key: apiKey, // Return plain key only once
          api_key_info: {
            id: apiKeyRecord.id,
            partner_id: apiKeyRecord.partner_id,
            name: apiKeyRecord.name,
            expires_at: apiKeyRecord.expires_at,
            created_at: apiKeyRecord.created_at,
          },
          warning: 'Store this API key securely. It will not be shown again.',
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: error.message || 'Failed to create API key' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/event/partners/[id]/api-keys
 * Get list of API keys for a partner (without the actual keys)
 * 
 * Requires: owner or partner_admin role with access to the partner
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { user }) => {
    const { id: partnerId } = await params;

    // Check partner access
    const accessResult = await requirePartnerAccess(req, partnerId);
    if ('error' in accessResult) {
      return accessResult.error;
    }

    // Check if user can view API keys
    if (!['owner', 'partner_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'API key view permission required' },
        { status: 403 }
      );
    }

    try {
      const supabase = await createEventClient();

      const { data: apiKeys, error: fetchError } = await supabase
        .from('event_api_keys')
        .select('id, partner_id, name, last_used_at, expires_at, created_at, created_by')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching API keys:', fetchError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to fetch API keys', details: fetchError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          success: true, 
          api_keys: apiKeys || [] 
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: error.message || 'Failed to fetch API keys' },
        { status: 500 }
      );
    }
  })(request);
}


/**
 * VETAP Event - API Key Management
 * POST /api/event/partners/api-key - Generate new API key
 * DELETE /api/event/partners/api-key - Revoke API key
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import { authenticateRequest } from '@/lib/event/api-auth';

/**
 * Generate a new API key for the partner
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const user = authResult.user;

    // Only partner_admin and owner can generate API keys
    if (!['owner', 'partner_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to generate API keys' },
        { status: 403 }
      );
    }

    if (!user.partner_id && user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'No partner associated with this user' },
        { status: 403 }
      );
    }

    const adminClient = createEventAdminClient();

    // Get partner ID
    let partnerId = user.partner_id;
    
    if (user.role === 'owner' && !partnerId) {
      const { data: partners } = await adminClient
        .from('event_partners')
        .select('id')
        .limit(1)
        .single();
      
      if (!partners) {
        return NextResponse.json(
          { error: 'Not found', message: 'No partner found' },
          { status: 404 }
        );
      }
      partnerId = partners.id;
    }

    // Deactivate existing API keys
    await adminClient
      .from('event_api_keys')
      .update({ is_active: false })
      .eq('partner_id', partnerId);

    // Generate new API key
    const apiKey = `vetap_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Store API key
    const { error: insertError } = await adminClient
      .from('event_api_keys')
      .insert({
        partner_id: partnerId,
        key: apiKey,
        key_hash: keyHash,
        is_active: true,
        created_by: user.id,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('API key insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed', message: 'Failed to generate API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      api_key: apiKey,
      message: 'API key generated successfully. Please save this key securely - it will not be shown again.',
    });
  } catch (error: any) {
    console.error('API key generation error:', error);
    return NextResponse.json(
      { error: 'Server error', message: error.message || 'Failed to generate API key' },
      { status: 500 }
    );
  }
}

/**
 * Revoke API key
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const user = authResult.user;

    // Only partner_admin and owner can revoke API keys
    if (!['owner', 'partner_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to revoke API keys' },
        { status: 403 }
      );
    }

    const adminClient = createEventAdminClient();

    let partnerId = user.partner_id;
    
    if (user.role === 'owner' && !partnerId) {
      const { data: partners } = await adminClient
        .from('event_partners')
        .select('id')
        .limit(1)
        .single();
      
      if (partners) {
        partnerId = partners.id;
      }
    }

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Not found', message: 'No partner found' },
        { status: 404 }
      );
    }

    // Deactivate all API keys for this partner
    const { error: updateError } = await adminClient
      .from('event_api_keys')
      .update({ 
        is_active: false,
        revoked_at: new Date().toISOString(),
      })
      .eq('partner_id', partnerId);

    if (updateError) {
      console.error('API key revoke error:', updateError);
      return NextResponse.json(
        { error: 'Failed', message: 'Failed to revoke API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error: any) {
    console.error('API key revoke error:', error);
    return NextResponse.json(
      { error: 'Server error', message: error.message || 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}


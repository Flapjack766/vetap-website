/**
 * VETAP Event - Partner Webhook Configuration API
 * PUT /api/event/partners/webhook
 * 
 * Update webhook settings for a partner
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import { authenticateRequest } from '@/lib/event/api-auth';

interface WebhookConfigRequest {
  webhook_url: string | null;
  webhook_secret: string | null;
  webhook_events: string[];
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const user = authResult.user;

    // Only partner_admin and owner can update webhook settings
    if (!['owner', 'partner_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to update webhook settings' },
        { status: 403 }
      );
    }

    if (!user.partner_id && user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'No partner associated with this user' },
        { status: 403 }
      );
    }

    const body: WebhookConfigRequest = await request.json();
    const { webhook_url, webhook_secret, webhook_events } = body;

    // Validate webhook URL
    if (webhook_url) {
      try {
        const url = new URL(webhook_url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return NextResponse.json(
            { error: 'Invalid URL', message: 'Webhook URL must use HTTP or HTTPS' },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL', message: 'Please provide a valid webhook URL' },
          { status: 400 }
        );
      }
    }

    // Validate webhook events
    const validEvents = [
      'on_pass_generated',
      'on_check_in_valid',
      'on_check_in_invalid',
      'on_event_created',
      'on_event_updated',
    ];

    const invalidEvents = webhook_events.filter(e => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: 'Invalid events', message: `Invalid event types: ${invalidEvents.join(', ')}` },
        { status: 400 }
      );
    }

    const adminClient = createEventAdminClient();

    // Get partner ID
    let partnerId = user.partner_id;
    
    // If owner, get partner ID from query or use first partner
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

    // Update partner webhook settings
    const { error: updateError } = await adminClient
      .from('event_partners')
      .update({
        webhook_url: webhook_url || null,
        webhook_secret: webhook_secret || null,
        webhook_events: webhook_events || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', partnerId);

    if (updateError) {
      console.error('Webhook update error:', updateError);
      return NextResponse.json(
        { error: 'Update failed', message: 'Failed to update webhook settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook settings updated successfully',
    });
  } catch (error: any) {
    console.error('Webhook config error:', error);
    return NextResponse.json(
      { error: 'Server error', message: error.message || 'Failed to update webhook settings' },
      { status: 500 }
    );
  }
}


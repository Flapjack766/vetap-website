/**
 * VETAP Event - Webhook Test API
 * POST /api/event/partners/webhook/test
 * 
 * Send a test webhook to verify configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/event/api-auth';
import { sendTestWebhook } from '@/lib/event/webhook-service';

interface TestWebhookRequest {
  webhook_url: string;
  webhook_secret?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const user = authResult.user;

    // Only partner_admin and owner can test webhooks
    if (!['owner', 'partner_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to test webhooks' },
        { status: 403 }
      );
    }

    const body: TestWebhookRequest = await request.json();
    const { webhook_url, webhook_secret } = body;

    if (!webhook_url) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Webhook URL is required' },
        { status: 400 }
      );
    }

    // Validate webhook URL
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

    // Send test webhook
    const result = await sendTestWebhook(webhook_url, webhook_secret);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test webhook sent successfully',
        status_code: result.status_code,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error_message || 'Webhook test failed',
        status_code: result.status_code,
      });
    }
  } catch (error: any) {
    console.error('Webhook test error:', error);
    return NextResponse.json(
      { error: 'Server error', message: error.message || 'Failed to send test webhook' },
      { status: 500 }
    );
  }
}


/**
 * VETAP Event - Webhook Service
 * 
 * Service for sending webhooks to partners with retry logic
 */

import crypto from 'crypto';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import type { WebhookEventType } from './types';

// ==================== Types ====================

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, any>;
}

interface WebhookResult {
  success: boolean;
  status_code?: number;
  error_message?: string;
  response_body?: string;
}

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

// ==================== Constants ====================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

const WEBHOOK_TIMEOUT_MS = 10000;

// ==================== Main Service ====================

/**
 * Send webhook to a partner
 */
export async function sendWebhook(
  partnerId: string,
  eventType: WebhookEventType,
  data: Record<string, any>,
  retryConfig: Partial<RetryConfig> = {}
): Promise<WebhookResult> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  const adminClient = createEventAdminClient();

  try {
    // Get partner's webhook configuration
    const { data: partner, error: partnerError } = await adminClient
      .from('event_partners')
      .select('id, name, webhook_url, webhook_secret, webhook_events')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner) {
      console.error('Partner not found:', partnerId);
      return { success: false, error_message: 'Partner not found' };
    }

    // Check if webhook is configured
    if (!partner.webhook_url) {
      console.log('No webhook URL configured for partner:', partnerId);
      return { success: true, error_message: 'No webhook URL configured' };
    }

    // Check if event type is enabled
    if (partner.webhook_events && partner.webhook_events.length > 0) {
      if (!partner.webhook_events.includes(eventType)) {
        console.log('Event type not enabled for partner:', eventType, partnerId);
        return { success: true, error_message: 'Event type not enabled' };
      }
    }

    // Build payload
    const payload: WebhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    // Send with retry logic
    const result = await sendWithRetry(
      partner.webhook_url,
      payload,
      partner.webhook_secret,
      config
    );

    // Log webhook attempt
    await logWebhookAttempt(adminClient, partnerId, eventType, payload, result);

    return result;
  } catch (error: any) {
    console.error('Webhook service error:', error);
    return { success: false, error_message: error.message || 'Unknown error' };
  }
}

/**
 * Send webhook with retry logic
 */
async function sendWithRetry(
  url: string,
  payload: WebhookPayload,
  secret: string | null,
  config: RetryConfig
): Promise<WebhookResult> {
  let lastError: string | null = null;
  let delay = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await sendSingleRequest(url, payload, secret);

      // Success (2xx status code)
      if (result.success) {
        return result;
      }

      // Don't retry 4xx errors (client errors)
      if (result.status_code && result.status_code >= 400 && result.status_code < 500) {
        return result;
      }

      lastError = result.error_message || `HTTP ${result.status_code}`;
    } catch (error: any) {
      lastError = error.message || 'Request failed';
    }

    // Wait before retry (except on last attempt)
    if (attempt < config.maxRetries) {
      console.log(`Webhook retry ${attempt + 1}/${config.maxRetries} after ${delay}ms`);
      await sleep(delay);
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  return { 
    success: false, 
    error_message: `Failed after ${config.maxRetries + 1} attempts: ${lastError}` 
  };
}

/**
 * Send a single webhook request
 */
async function sendSingleRequest(
  url: string,
  payload: WebhookPayload,
  secret: string | null
): Promise<WebhookResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const bodyString = JSON.stringify(payload);
    
    // Generate signature
    const signature = secret
      ? crypto
          .createHmac('sha256', secret)
          .update(bodyString)
          .digest('hex')
      : undefined;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VETAP-Webhook/1.0',
        'X-VETAP-Event': payload.event,
        'X-VETAP-Timestamp': payload.timestamp,
        'X-VETAP-Delivery': crypto.randomUUID(),
        ...(signature && { 'X-VETAP-Signature': `sha256=${signature}` }),
      },
      body: bodyString,
      signal: controller.signal,
    });

    const responseText = await response.text().catch(() => '');

    return {
      success: response.ok,
      status_code: response.status,
      response_body: responseText.substring(0, 1000), // Limit response size
      error_message: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, error_message: 'Request timed out' };
    }
    return { success: false, error_message: error.message || 'Network error' };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Log webhook attempt to database
 */
async function logWebhookAttempt(
  client: ReturnType<typeof createEventAdminClient>,
  partnerId: string,
  eventType: WebhookEventType,
  payload: WebhookPayload,
  result: WebhookResult
): Promise<void> {
  try {
    await client
      .from('event_webhook_logs')
      .insert({
        partner_id: partnerId,
        event_type: eventType,
        payload: payload as any,
        sent_at: new Date().toISOString(),
        response_status: result.status_code || null,
        response_body: result.response_body || null,
        error_message: result.error_message || null,
      });
  } catch (error) {
    console.error('Failed to log webhook attempt:', error);
  }
}

/**
 * Send test webhook
 */
export async function sendTestWebhook(
  webhookUrl: string,
  webhookSecret?: string
): Promise<WebhookResult> {
  const payload: WebhookPayload = {
    event: 'on_event_created' as WebhookEventType,
    timestamp: new Date().toISOString(),
    data: {
      test: true,
      message: 'This is a test webhook from VETAP',
      event_id: 'test-event-id',
      event_name: 'Test Event',
    },
  };

  return sendSingleRequest(webhookUrl, payload, webhookSecret || null);
}

/**
 * Trigger webhook for an event
 */
export async function triggerWebhook(
  eventType: WebhookEventType,
  partnerId: string,
  data: Record<string, any>
): Promise<void> {
  // Fire and forget - don't wait for webhook to complete
  sendWebhook(partnerId, eventType, data).catch((error) => {
    console.error('Background webhook failed:', error);
  });
}

/**
 * Batch trigger webhooks for multiple partners
 */
export async function triggerWebhooksForEvent(
  eventType: WebhookEventType,
  partnerIds: string[],
  data: Record<string, any>
): Promise<void> {
  await Promise.allSettled(
    partnerIds.map((partnerId) => sendWebhook(partnerId, eventType, data))
  );
}

// ==================== Utility Functions ====================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verify webhook signature (for incoming webhooks)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signature === `sha256=${expectedSignature}`;
}

/**
 * Get webhook event description
 */
export function getWebhookEventDescription(eventType: WebhookEventType): string {
  const descriptions: Record<WebhookEventType, string> = {
    on_pass_generated: 'Triggered when a new pass is generated for a guest',
    on_check_in_valid: 'Triggered when a guest successfully checks in',
    on_check_in_invalid: 'Triggered when a check-in attempt fails',
    on_event_created: 'Triggered when a new event is created',
    on_event_updated: 'Triggered when an event is updated',
  };

  return descriptions[eventType] || eventType;
}


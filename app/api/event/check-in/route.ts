/**
 * VETAP Event - Check-in API
 * POST /api/event/check-in
 * 
 * المرحلة 11: منطق التحقق في الـ Backend
 * 
 * Features:
 * - Payload decryption (Base64 / JSON)
 * - Digital signature verification
 * - Database verification (event/pass existence)
 * - Time validity check (valid_from / valid_to)
 * - Status checking (revoked, used, unused)
 * - Transaction-based status update with optimistic locking
 * - ScanLog recording (always, even for invalid)
 * - Webhook sending for partners
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import { authenticateRequest } from '@/lib/event/api-auth';
import crypto from 'crypto';
import type { ScanResult, PassStatus, WebhookEventType } from '@/lib/event/types';

// ==================== Types ====================

interface CheckInRequest {
  qr_raw_value: string;  // النص المقروء من QR
  event_id: string;
  gate_id?: string;
  user_id?: string;      // الموظف (اختياري - يمكن استخراجه من التوكن)
  device_info?: string;  // معلومات الجهاز
}

interface CheckInResponse {
  result: ScanResult;
  message?: string;
  errorKey?: string;  // Translation key for error messages
  guest?: {
    id: string;
    full_name: string;
    type: string;
    email?: string;
    phone?: string;
  };
  pass?: {
    id: string;
    status: PassStatus;
    first_used_at?: string;
    valid_from?: string;
    valid_to?: string;
  };
  event?: {
    id: string;
    name: string;
  };
  scan_log_id?: string;
  scanned_at?: string;
}

interface DecodedPayload {
  pass_id?: string;
  token: string;
  event_id?: string;
  signature?: string;
  timestamp?: number;
  version?: string;
}

// ==================== Constants ====================

const QR_SIGNATURE_SECRET = process.env.QR_SIGNATURE_SECRET || 'vetap-qr-secret-key';
const WEBHOOK_TIMEOUT_MS = 5000;

// ==================== Main Handler ====================

export async function POST(request: NextRequest): Promise<NextResponse<CheckInResponse>> {
  const startTime = Date.now();
  const adminClient = createEventAdminClient();
  
  // Extract device info from headers
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const deviceInfo = extractDeviceInfo(userAgent);
  
  let eventId: string | null = null;
  let gateId: string | null = null;
  let userId: string | null = null;
  let rawPayload: string = '';
  let passId: string | null = null;
  let guestId: string | null = null;

  try {
    // ==================== 1. Parse Request ====================
    const body: CheckInRequest = await request.json();
    rawPayload = body.qr_raw_value;
    eventId = body.event_id;
    gateId = body.gate_id || null;
    
    if (!rawPayload || !eventId) {
      await logScan(adminClient, {
        event_id: eventId || 'unknown',
        gate_id: gateId,
        scanned_by: userId,
        result: 'invalid',
        raw_payload: rawPayload,
        device_info: deviceInfo,
        error_message: 'Missing required fields',
        processing_time_ms: Date.now() - startTime,
      });

      return NextResponse.json(
        { 
          result: 'invalid', 
          message: 'Missing required fields: qr_raw_value and event_id are required',
          errorKey: 'CHECKIN_ERROR_MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    // ==================== 2. Authenticate User ====================
    const authResult = await authenticateRequest(request);
    if ('user' in authResult) {
      userId = authResult.user.id;
    } else if (body.user_id) {
      userId = body.user_id;
    }

    // ==================== 3. Decode & Verify Payload ====================
    const decodeResult = decodeQRPayload(rawPayload);
    
    if (!decodeResult.success || !decodeResult.payload) {
      await logScan(adminClient, {
        event_id: eventId,
        gate_id: gateId,
        scanned_by: userId,
        result: 'invalid',
        raw_payload: rawPayload,
        device_info: deviceInfo,
        error_message: decodeResult.error || 'Failed to decode QR payload',
        processing_time_ms: Date.now() - startTime,
      });

      return NextResponse.json({
        result: 'invalid',
        message: decodeResult.error || 'Invalid QR code format',
        errorKey: 'CHECKIN_ERROR_INVALID_QR_FORMAT',
        scanned_at: new Date().toISOString(),
      });
    }

    const decodedPayload = decodeResult.payload;

    // ==================== 4. Verify Digital Signature ====================
    if (decodedPayload.signature) {
      const isValidSignature = verifySignature(decodedPayload);
      
      if (!isValidSignature) {
        await logScan(adminClient, {
          event_id: eventId,
          gate_id: gateId,
          scanned_by: userId,
          result: 'invalid',
          raw_payload: rawPayload,
          device_info: deviceInfo,
          error_message: 'Invalid signature',
          processing_time_ms: Date.now() - startTime,
        });

        return NextResponse.json({
          result: 'invalid',
          message: 'QR code signature verification failed',
          errorKey: 'CHECKIN_ERROR_SIGNATURE_FAILED',
          scanned_at: new Date().toISOString(),
        });
      }
    }

    // ==================== 5. Find Pass in Database ====================
    const { data: pass, error: passError } = await adminClient
      .from('event_passes')
      .select(`
        id,
        guest_id,
        event_id,
        status,
        token,
        qr_payload,
        first_used_at,
        valid_from,
        valid_to,
        expires_at,
        revoked_at,
        max_uses,
        use_count,
        created_at
      `)
      .eq('token', decodedPayload.token)
      .maybeSingle();

    if (passError) {
      console.error('Pass lookup error:', passError);
      await logScan(adminClient, {
        event_id: eventId,
        gate_id: gateId,
        scanned_by: userId,
        result: 'invalid',
        raw_payload: rawPayload,
        device_info: deviceInfo,
        error_message: `Database error: ${passError.message}`,
        processing_time_ms: Date.now() - startTime,
      });

      return NextResponse.json(
        { 
          result: 'invalid', 
          message: 'Database error occurred',
          errorKey: 'CHECKIN_ERROR_DATABASE'
        },
        { status: 500 }
      );
    }

    if (!pass) {
      await logScan(adminClient, {
        event_id: eventId,
        gate_id: gateId,
        scanned_by: userId,
        result: 'invalid',
        raw_payload: rawPayload,
        device_info: deviceInfo,
        error_message: 'Pass not found in database',
        processing_time_ms: Date.now() - startTime,
      });

      return NextResponse.json({
        result: 'invalid',
        message: 'Pass not found',
        errorKey: 'CHECKIN_ERROR_PASS_NOT_FOUND',
        scanned_at: new Date().toISOString(),
      });
    }

    passId = pass.id;
    guestId = pass.guest_id;

    // ==================== 6. Verify Event Ownership ====================
    if (pass.event_id !== eventId) {
      await logScan(adminClient, {
        event_id: eventId,
        gate_id: gateId,
        pass_id: passId,
        guest_id: guestId,
        scanned_by: userId,
        result: 'invalid',
        raw_payload: rawPayload,
        device_info: deviceInfo,
        error_message: `Pass belongs to different event: ${pass.event_id}`,
        processing_time_ms: Date.now() - startTime,
      });

      return NextResponse.json({
        result: 'invalid',
        message: 'Pass does not belong to this event',
        errorKey: 'CHECKIN_ERROR_WRONG_EVENT',
        scanned_at: new Date().toISOString(),
      });
    }

    // ==================== 7. Get Event Info ====================
    const { data: event } = await adminClient
      .from('event_events')
      .select('id, name, partner_id, starts_at, ends_at')
      .eq('id', eventId)
      .single();

    // ==================== 8. Get Guest Info ====================
    const { data: guest } = await adminClient
      .from('event_guests')
      .select('id, full_name, type, email, phone')
      .eq('id', pass.guest_id)
      .single();

    // ==================== 9. Check Gate Access ====================
    if (gateId && guest) {
      const { data: gate } = await adminClient
        .from('event_gates')
        .select('name, allowed_guest_types')
        .eq('id', gateId)
        .single();

      if (gate?.allowed_guest_types && gate.allowed_guest_types.length > 0) {
        if (!gate.allowed_guest_types.includes(guest.type)) {
          const scanLog = await logScan(adminClient, {
            event_id: eventId,
            gate_id: gateId,
            pass_id: passId,
            guest_id: guestId,
            scanned_by: userId,
            result: 'not_allowed_zone',
            raw_payload: rawPayload,
            device_info: deviceInfo,
            error_message: `Guest type ${guest.type} not allowed at gate ${gate.name}`,
            processing_time_ms: Date.now() - startTime,
          });

          // Send webhook for invalid check-in
          await sendWebhook(adminClient, event?.partner_id, 'on_check_in_invalid', {
            event_id: eventId,
            pass_id: passId,
            guest: guest,
            result: 'not_allowed_zone',
            gate_id: gateId,
            scanned_at: new Date().toISOString(),
          });

          return NextResponse.json({
            result: 'not_allowed_zone',
            message: `${guest.type} guests are not allowed at this gate`,
            guest: { id: guest.id, full_name: guest.full_name, type: guest.type },
            pass: { id: pass.id, status: pass.status },
            event: event ? { id: event.id, name: event.name } : undefined,
            scan_log_id: scanLog?.id,
            scanned_at: new Date().toISOString(),
          });
        }
      }
    }

    // ==================== 10. Check Time Validity (valid_from / valid_to) ====================
    const now = new Date();

    if (pass.valid_from && new Date(pass.valid_from) > now) {
      await logScan(adminClient, {
        event_id: eventId,
        gate_id: gateId,
        pass_id: passId,
        guest_id: guestId,
        scanned_by: userId,
        result: 'invalid',
        raw_payload: rawPayload,
        device_info: deviceInfo,
        error_message: `Pass not yet valid. Valid from: ${pass.valid_from}`,
        processing_time_ms: Date.now() - startTime,
      });

      return NextResponse.json({
        result: 'invalid',
        message: 'Pass is not yet valid',
        errorKey: 'CHECKIN_ERROR_NOT_VALID_YET',
        guest: guest ? { id: guest.id, full_name: guest.full_name, type: guest.type } : undefined,
        pass: { 
          id: pass.id, 
          status: pass.status,
          valid_from: pass.valid_from,
          valid_to: pass.valid_to,
        },
        scanned_at: now.toISOString(),
      });
    }

    if (pass.valid_to && new Date(pass.valid_to) < now) {
      await logScan(adminClient, {
        event_id: eventId,
        gate_id: gateId,
        pass_id: passId,
        guest_id: guestId,
        scanned_by: userId,
        result: 'expired',
        raw_payload: rawPayload,
        device_info: deviceInfo,
        error_message: `Pass expired. Valid until: ${pass.valid_to}`,
        processing_time_ms: Date.now() - startTime,
      });

      // Send webhook for invalid check-in
      await sendWebhook(adminClient, event?.partner_id, 'on_check_in_invalid', {
        event_id: eventId,
        pass_id: passId,
        guest: guest,
        result: 'expired',
        scanned_at: now.toISOString(),
      });

      return NextResponse.json({
        result: 'expired',
        message: 'Pass has expired',
        errorKey: 'CHECKIN_ERROR_EXPIRED',
        guest: guest ? { id: guest.id, full_name: guest.full_name, type: guest.type } : undefined,
        pass: { 
          id: pass.id, 
          status: pass.status,
          valid_from: pass.valid_from,
          valid_to: pass.valid_to,
        },
        scanned_at: now.toISOString(),
      });
    }

    // Check expires_at as well
    if (pass.expires_at && new Date(pass.expires_at) < now) {
      await logScan(adminClient, {
        event_id: eventId,
        gate_id: gateId,
        pass_id: passId,
        guest_id: guestId,
        scanned_by: userId,
        result: 'expired',
        raw_payload: rawPayload,
        device_info: deviceInfo,
        error_message: `Pass expired at: ${pass.expires_at}`,
        processing_time_ms: Date.now() - startTime,
      });

      await sendWebhook(adminClient, event?.partner_id, 'on_check_in_invalid', {
        event_id: eventId,
        pass_id: passId,
        guest: guest,
        result: 'expired',
        scanned_at: now.toISOString(),
      });

      return NextResponse.json({
        result: 'expired',
        message: 'Pass has expired',
        errorKey: 'CHECKIN_ERROR_EXPIRED',
        guest: guest ? { id: guest.id, full_name: guest.full_name, type: guest.type } : undefined,
        pass: { id: pass.id, status: pass.status },
        scanned_at: now.toISOString(),
      });
    }

    // ==================== 11. Check Pass Status ====================
    
    // Check if revoked
    if (pass.status === 'revoked' || pass.revoked_at) {
      await logScan(adminClient, {
        event_id: eventId,
        gate_id: gateId,
        pass_id: passId,
        guest_id: guestId,
        scanned_by: userId,
        result: 'revoked',
        raw_payload: rawPayload,
        device_info: deviceInfo,
        error_message: `Pass was revoked at: ${pass.revoked_at}`,
        processing_time_ms: Date.now() - startTime,
      });

      await sendWebhook(adminClient, event?.partner_id, 'on_check_in_invalid', {
        event_id: eventId,
        pass_id: passId,
        guest: guest,
        result: 'revoked',
        scanned_at: now.toISOString(),
      });

      return NextResponse.json({
        result: 'revoked',
        message: 'Pass has been revoked',
        errorKey: 'CHECKIN_ERROR_REVOKED',
        guest: guest ? { id: guest.id, full_name: guest.full_name, type: guest.type } : undefined,
        pass: { id: pass.id, status: 'revoked' },
        scanned_at: now.toISOString(),
      });
    }

    // Check if already used (for single-use passes)
    if (pass.status === 'used' && pass.first_used_at) {
      // Check if multi-use pass
      const maxUses = pass.max_uses || 1;
      const currentUses = pass.use_count || 1;

      if (currentUses >= maxUses) {
        await logScan(adminClient, {
          event_id: eventId,
          gate_id: gateId,
          pass_id: passId,
          guest_id: guestId,
          scanned_by: userId,
          result: 'already_used',
          raw_payload: rawPayload,
          device_info: deviceInfo,
          error_message: `Pass already used. First used at: ${pass.first_used_at}`,
          processing_time_ms: Date.now() - startTime,
        });

        await sendWebhook(adminClient, event?.partner_id, 'on_check_in_invalid', {
          event_id: eventId,
          pass_id: passId,
          guest: guest,
          result: 'already_used',
          first_used_at: pass.first_used_at,
          scanned_at: now.toISOString(),
        });

        return NextResponse.json({
          result: 'already_used',
          message: 'Pass has already been used',
          errorKey: 'CHECKIN_ERROR_ALREADY_USED',
          guest: guest ? { id: guest.id, full_name: guest.full_name, type: guest.type } : undefined,
          pass: { 
            id: pass.id, 
            status: pass.status,
            first_used_at: pass.first_used_at,
          },
          scanned_at: now.toISOString(),
        });
      }
    }

    // ==================== 12. Process Valid Check-in (with Transaction) ====================
    
    // Use optimistic locking to prevent race conditions
    const { data: updatedPass, error: updateError } = await adminClient
      .from('event_passes')
      .update({
        status: 'used',
        first_used_at: pass.first_used_at || now.toISOString(),
        use_count: (pass.use_count || 0) + 1,
        last_used_at: now.toISOString(),
      })
      .eq('id', pass.id)
      .eq('status', pass.status)  // Optimistic lock - only update if status hasn't changed
      .select('id, status, first_used_at')
      .maybeSingle();

    // Check if update was successful (optimistic lock check)
    if (updateError || !updatedPass) {
      // Status might have changed - re-fetch and check
      const { data: recheckPass } = await adminClient
        .from('event_passes')
        .select('status, first_used_at')
        .eq('id', pass.id)
        .single();

      if (recheckPass?.status === 'used') {
        await logScan(adminClient, {
          event_id: eventId,
          gate_id: gateId,
          pass_id: passId,
          guest_id: guestId,
          scanned_by: userId,
          result: 'already_used',
          raw_payload: rawPayload,
          device_info: deviceInfo,
          error_message: 'Race condition detected - pass was used by another scanner',
          processing_time_ms: Date.now() - startTime,
        });

        return NextResponse.json({
          result: 'already_used',
          message: 'Pass was just used by another scanner',
          errorKey: 'CHECKIN_ERROR_RACE_CONDITION',
          guest: guest ? { id: guest.id, full_name: guest.full_name, type: guest.type } : undefined,
          pass: { 
            id: pass.id, 
            status: 'used',
            first_used_at: recheckPass.first_used_at,
          },
          scanned_at: now.toISOString(),
        });
      }

      console.error('Pass update error:', updateError);
      return NextResponse.json(
        { 
          result: 'invalid', 
          message: 'Failed to process check-in',
          errorKey: 'CHECKIN_ERROR_PROCESSING_FAILED'
        },
        { status: 500 }
      );
    }

    // ==================== 13. Log Successful Scan ====================
    const scanLog = await logScan(adminClient, {
      event_id: eventId,
      gate_id: gateId,
      pass_id: passId,
      guest_id: guestId,
      scanned_by: userId,
      result: 'valid',
      raw_payload: rawPayload,
      device_info: deviceInfo,
      processing_time_ms: Date.now() - startTime,
    });

    // ==================== 14. Send Webhook ====================
    await sendWebhook(adminClient, event?.partner_id, 'on_check_in_valid', {
      event_id: eventId,
      event_name: event?.name,
      pass_id: passId,
      guest: guest,
      gate_id: gateId,
      scanned_by: userId,
      scanned_at: now.toISOString(),
      scan_log_id: scanLog?.id,
    });

    // ==================== 15. Return Success Response ====================
    return NextResponse.json({
      result: 'valid',
      message: 'Check-in successful',
      errorKey: 'CHECKIN_SUCCESS',
      guest: guest ? {
        id: guest.id,
        full_name: guest.full_name,
        type: guest.type,
        email: guest.email,
        phone: guest.phone,
      } : undefined,
      pass: {
        id: pass.id,
        status: 'used',
        first_used_at: updatedPass.first_used_at,
      },
      event: event ? { id: event.id, name: event.name } : undefined,
      scan_log_id: scanLog?.id,
      scanned_at: now.toISOString(),
    });

  } catch (error: any) {
    console.error('Check-in error:', error);
    
    // Log error scan
    await logScan(adminClient, {
      event_id: eventId || 'unknown',
      gate_id: gateId,
      pass_id: passId,
      guest_id: guestId,
      scanned_by: userId,
      result: 'invalid',
      raw_payload: rawPayload,
      device_info: deviceInfo,
      error_message: error.message || 'Unknown error',
      processing_time_ms: Date.now() - startTime,
    });

    return NextResponse.json(
      { 
        result: 'invalid', 
        message: error.message || 'Check-in failed',
        errorKey: 'CHECKIN_ERROR_CHECKIN_FAILED'
      },
      { status: 500 }
    );
  }
}

// ==================== Helper Functions ====================

/**
 * Decode QR payload (supports multiple formats)
 */
function decodeQRPayload(rawValue: string): { success: boolean; payload?: DecodedPayload; error?: string } {
  try {
    // Try different formats
    
    // Format 1: VETAP:{pass_id}:{token}:{signature}
    if (rawValue.startsWith('VETAP:')) {
      const parts = rawValue.split(':');
      if (parts.length >= 3) {
        return {
          success: true,
          payload: {
            version: 'v1',
            pass_id: parts[1],
            token: parts[2],
            signature: parts[3],
          },
        };
      }
    }

    // Format 2: Base64 encoded JSON
    if (rawValue.match(/^[A-Za-z0-9+/=]+$/)) {
      try {
        const decoded = Buffer.from(rawValue, 'base64').toString('utf-8');
        const json = JSON.parse(decoded);
        
        return {
          success: true,
          payload: {
            version: json.v || 'v2',
            pass_id: json.p || json.pass_id,
            token: json.t || json.token,
            event_id: json.e || json.event_id,
            signature: json.s || json.signature,
            timestamp: json.ts || json.timestamp,
          },
        };
      } catch {
        // Not base64 JSON, continue to next format
      }
    }

    // Format 3: Plain JSON
    if (rawValue.startsWith('{')) {
      try {
        const json = JSON.parse(rawValue);
        return {
          success: true,
          payload: {
            version: json.version || 'v3',
            pass_id: json.pass_id,
            token: json.token,
            event_id: json.event_id,
            signature: json.signature,
            timestamp: json.timestamp,
          },
        };
      } catch {
        return { success: false, error: 'Invalid JSON format' };
      }
    }

    // Format 4: Plain token (UUID or similar)
    if (rawValue.length >= 20 && rawValue.length <= 128) {
      return {
        success: true,
        payload: {
          version: 'plain',
          token: rawValue,
        },
      };
    }

    return { success: false, error: 'Unrecognized QR format' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to decode payload' };
  }
}

/**
 * Verify digital signature
 */
function verifySignature(payload: DecodedPayload): boolean {
  if (!payload.signature || !payload.token) {
    return true; // No signature to verify (backward compatibility)
  }

  try {
    // Create expected signature
    const dataToSign = `${payload.pass_id || ''}:${payload.token}:${payload.timestamp || ''}`;
    const expectedSignature = crypto
      .createHmac('sha256', QR_SIGNATURE_SECRET)
      .update(dataToSign)
      .digest('hex')
      .substring(0, 16); // Use first 16 chars for shorter QR

    return payload.signature === expectedSignature;
  } catch {
    return false;
  }
}

/**
 * Extract device info from user agent
 */
function extractDeviceInfo(userAgent: string): string {
  const info: string[] = [];
  
  // Detect OS
  if (userAgent.includes('Android')) {
    const match = userAgent.match(/Android ([0-9.]+)/);
    info.push(`Android ${match?.[1] || ''}`);
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    const match = userAgent.match(/OS ([0-9_]+)/);
    info.push(`iOS ${match?.[1]?.replace(/_/g, '.') || ''}`);
  } else if (userAgent.includes('Windows')) {
    info.push('Windows');
  } else if (userAgent.includes('Mac')) {
    info.push('macOS');
  } else if (userAgent.includes('Linux')) {
    info.push('Linux');
  }

  // Detect browser
  if (userAgent.includes('Chrome')) {
    info.push('Chrome');
  } else if (userAgent.includes('Safari')) {
    info.push('Safari');
  } else if (userAgent.includes('Firefox')) {
    info.push('Firefox');
  }

  return info.join(' / ') || userAgent.substring(0, 100);
}

/**
 * Log scan to database (always, even for invalid scans)
 */
async function logScan(
  client: ReturnType<typeof createEventAdminClient>,
  data: {
    event_id: string;
    gate_id?: string | null;
    pass_id?: string | null;
    guest_id?: string | null;
    scanned_by?: string | null;
    result: ScanResult;
    raw_payload: string;
    device_info?: string;
    error_message?: string;
    processing_time_ms?: number;
  }
): Promise<{ id: string } | null> {
  try {
    const { data: scanLog, error } = await client
      .from('event_scan_logs')
      .insert({
        event_id: data.event_id,
        gate_id: data.gate_id || null,
        pass_id: data.pass_id || null,
        guest_id: data.guest_id || null,
        scanner_user_id: data.scanned_by || null, // Column name in DB
        result: data.result,
        scanned_at: new Date().toISOString(),
        raw_payload: data.raw_payload,
        device_info: data.device_info || null,
        error_message: data.error_message || null,
        processing_time_ms: data.processing_time_ms || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Scan log error:', error);
      return null;
    }

    return scanLog;
  } catch (err) {
    console.error('Scan log error:', err);
    return null;
  }
}

/**
 * Send webhook to partner (if configured)
 */
async function sendWebhook(
  client: ReturnType<typeof createEventAdminClient>,
  partnerId: string | null | undefined,
  eventType: WebhookEventType,
  payload: Record<string, any>
): Promise<void> {
  if (!partnerId) return;

  try {
    // Get partner's webhook config
    const { data: partner } = await client
      .from('event_partners')
      .select('webhook_url, webhook_secret, webhook_events')
      .eq('id', partnerId)
      .single();

    if (!partner?.webhook_url) return;

    // Check if this event type is enabled
    if (partner.webhook_events && !partner.webhook_events.includes(eventType)) {
      return;
    }

    // Prepare webhook payload
    const webhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    // Create signature
    const signature = partner.webhook_secret
      ? crypto
          .createHmac('sha256', partner.webhook_secret)
          .update(JSON.stringify(webhookPayload))
          .digest('hex')
      : undefined;

    // Send webhook (fire and forget with timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    await fetch(partner.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VETAP-Event': eventType,
        'X-VETAP-Signature': signature || '',
        'X-VETAP-Timestamp': webhookPayload.timestamp,
      },
      body: JSON.stringify(webhookPayload),
      signal: controller.signal,
    }).catch(err => {
      console.error('Webhook send error:', err.message);
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    // Log webhook attempt (ignore errors)
    try {
      await client
        .from('event_webhook_logs')
        .insert({
          partner_id: partnerId,
          event_type: eventType,
          payload: webhookPayload,
          sent_at: new Date().toISOString(),
        });
    } catch {
      // Ignore logging errors
    }

  } catch (err) {
    console.error('Webhook error:', err);
  }
}

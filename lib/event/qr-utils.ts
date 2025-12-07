/**
 * VETAP Event - QR Code Utilities
 * 
 * Functions for generating and validating QR payloads
 */

import crypto from 'crypto';

const QR_SIGNATURE_SECRET = process.env.QR_SIGNATURE_SECRET || 'vetap-qr-secret-key';

// QR Payload formats
export type QRFormat = 'v1' | 'v2' | 'v3' | 'plain';

export interface QRPayloadV1 {
  version: 'v1';
  pass_id: string;
  token: string;
  signature?: string;
}

export interface QRPayloadV2 {
  version: 'v2';
  p: string;     // pass_id
  t: string;     // token
  e: string;     // event_id
  s?: string;    // signature
  ts?: number;   // timestamp
}

export interface QRPayloadV3 {
  version: 'v3';
  pass_id: string;
  token: string;
  event_id: string;
  signature?: string;
  timestamp?: number;
}

/**
 * Generate QR payload string for a pass
 */
export function generateQRPayload(
  passId: string,
  token: string,
  eventId: string,
  format: QRFormat = 'v1',
  includeSignature: boolean = true
): string {
  const timestamp = Date.now();

  switch (format) {
    case 'v1': {
      // Format: VETAP:{pass_id}:{token}:{signature}
      const signature = includeSignature
        ? generateSignature(passId, token, timestamp)
        : undefined;
      
      return signature
        ? `VETAP:${passId}:${token}:${signature}`
        : `VETAP:${passId}:${token}`;
    }

    case 'v2': {
      // Format: Base64 encoded JSON (compact)
      const payload: QRPayloadV2 = {
        version: 'v2',
        p: passId,
        t: token,
        e: eventId,
        ts: timestamp,
      };

      if (includeSignature) {
        payload.s = generateSignature(passId, token, timestamp);
      }

      return Buffer.from(JSON.stringify(payload)).toString('base64');
    }

    case 'v3': {
      // Format: Plain JSON
      const payload: QRPayloadV3 = {
        version: 'v3',
        pass_id: passId,
        token,
        event_id: eventId,
        timestamp,
      };

      if (includeSignature) {
        payload.signature = generateSignature(passId, token, timestamp);
      }

      return JSON.stringify(payload);
    }

    case 'plain':
    default:
      // Just the token
      return token;
  }
}

/**
 * Generate HMAC signature for QR payload
 */
export function generateSignature(
  passId: string,
  token: string,
  timestamp: number
): string {
  const dataToSign = `${passId}:${token}:${timestamp}`;
  return crypto
    .createHmac('sha256', QR_SIGNATURE_SECRET)
    .update(dataToSign)
    .digest('hex')
    .substring(0, 16); // Use first 16 chars for shorter QR
}

/**
 * Verify HMAC signature
 */
export function verifySignature(
  passId: string,
  token: string,
  timestamp: number,
  signature: string
): boolean {
  const expectedSignature = generateSignature(passId, token, timestamp);
  return signature === expectedSignature;
}

/**
 * Parse QR payload string
 */
export function parseQRPayload(rawValue: string): {
  success: boolean;
  format?: QRFormat;
  passId?: string;
  token?: string;
  eventId?: string;
  signature?: string;
  timestamp?: number;
  error?: string;
} {
  try {
    // Format 1: VETAP:{pass_id}:{token}:{signature}
    if (rawValue.startsWith('VETAP:')) {
      const parts = rawValue.split(':');
      if (parts.length >= 3) {
        return {
          success: true,
          format: 'v1',
          passId: parts[1],
          token: parts[2],
          signature: parts[3],
        };
      }
    }

    // Format 2: Base64 encoded JSON
    if (rawValue.match(/^[A-Za-z0-9+/=]+$/) && rawValue.length > 50) {
      try {
        const decoded = Buffer.from(rawValue, 'base64').toString('utf-8');
        const json = JSON.parse(decoded);

        return {
          success: true,
          format: 'v2',
          passId: json.p || json.pass_id,
          token: json.t || json.token,
          eventId: json.e || json.event_id,
          signature: json.s || json.signature,
          timestamp: json.ts || json.timestamp,
        };
      } catch {
        // Not base64 JSON
      }
    }

    // Format 3: Plain JSON
    if (rawValue.startsWith('{')) {
      try {
        const json = JSON.parse(rawValue);
        return {
          success: true,
          format: 'v3',
          passId: json.pass_id,
          token: json.token,
          eventId: json.event_id,
          signature: json.signature,
          timestamp: json.timestamp,
        };
      } catch {
        return { success: false, error: 'Invalid JSON format' };
      }
    }

    // Format 4: Plain token (UUID or similar)
    if (rawValue.length >= 20 && rawValue.length <= 128) {
      return {
        success: true,
        format: 'plain',
        token: rawValue,
      };
    }

    return { success: false, error: 'Unrecognized QR format' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to parse payload' };
  }
}

/**
 * Generate a unique token for a pass
 */
export function generatePassToken(): string {
  // Generate a URL-safe random token
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate a short access code for gates
 */
export function generateGateAccessCode(): string {
  // Generate 8 character alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}


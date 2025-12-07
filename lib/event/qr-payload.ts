/**
 * VETAP Event - QR Payload Generator
 * 
 * Generates and verifies QR code payloads with digital signatures
 */

import crypto from 'crypto';

/**
 * QR Payload Structure
 * 
 * {
 *   "v": 1,                    // Version
 *   "eid": "<event_id>",       // Event ID
 *   "pid": "<pass_id>",        // Pass ID
 *   "gid": "<guest_id>",       // Guest ID (optional)
 *   "exp": "<timestamp>",      // Expiration timestamp (optional)
 *   "sig": "<signature>"       // HMAC signature
 * }
 */

export interface QRPayload {
  v: number; // Version
  eid: string; // Event ID
  pid: string; // Pass ID
  gid?: string; // Guest ID (optional)
  exp?: number; // Expiration timestamp (optional)
  sig: string; // HMAC signature
}

/**
 * Get signing secret for a partner
 * Uses partner-specific secret or system-wide secret
 */
function getSigningSecret(partnerId?: string | null): string {
  // Use partner-specific secret if available
  if (partnerId) {
    const partnerSecret = process.env[`SUPABASE_EVENT_PARTNER_${partnerId}_SECRET`];
    if (partnerSecret) {
      return partnerSecret;
    }
  }
  
  // Fallback to system-wide secret
  const systemSecret = process.env.SUPABASE_EVENT_SIGNING_SECRET;
  if (!systemSecret) {
    throw new Error('SUPABASE_EVENT_SIGNING_SECRET is not configured. Please set it in .env.local');
  }
  
  return systemSecret;
}

/**
 * Generate HMAC signature for payload
 */
function generateSignature(payload: Omit<QRPayload, 'sig'>, secret: string): string {
  // Create payload without signature
  const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
  
  // Generate HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadString);
  
  // Return base64url encoded signature
  return hmac.digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate QR payload for a pass
 * @param eventId - Event ID
 * @param passId - Pass ID
 * @param guestId - Guest ID (optional)
 * @param expiresAt - Expiration timestamp (optional)
 * @param partnerId - Partner ID (for partner-specific secret)
 * @returns Base64url encoded QR payload
 */
export function generateQRPayload(
  eventId: string,
  passId: string,
  guestId?: string,
  expiresAt?: Date | string,
  partnerId?: string | null
): string {
  const secret = getSigningSecret(partnerId);
  
  // Build payload (without signature)
  const payload: Omit<QRPayload, 'sig'> = {
    v: 1, // Version
    eid: eventId,
    pid: passId,
  };
  
  if (guestId) {
    payload.gid = guestId;
  }
  
  if (expiresAt) {
    const expTimestamp = typeof expiresAt === 'string' 
      ? new Date(expiresAt).getTime() 
      : expiresAt.getTime();
    payload.exp = Math.floor(expTimestamp / 1000); // Unix timestamp in seconds
  }
  
  // Generate signature
  const signature = generateSignature(payload, secret);
  
  // Add signature to payload
  const signedPayload: QRPayload = {
    ...payload,
    sig: signature,
  };
  
  // Encode to base64url
  const jsonString = JSON.stringify(signedPayload);
  const base64 = Buffer.from(jsonString).toString('base64');
  const base64url = base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return base64url;
}

/**
 * Verify and decode QR payload
 * @param encodedPayload - Base64url encoded QR payload
 * @param partnerId - Partner ID (for partner-specific secret)
 * @returns Decoded payload if valid, null if invalid
 */
export function verifyQRPayload(
  encodedPayload: string,
  partnerId?: string | null
): QRPayload | null {
  try {
    // Decode base64url
    let base64 = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    const padding = base64.length % 4;
    if (padding) {
      base64 += '='.repeat(4 - padding);
    }
    
    // Decode JSON
    const jsonString = Buffer.from(base64, 'base64').toString('utf-8');
    const payload: QRPayload = JSON.parse(jsonString);
    
    // Validate payload structure
    if (!payload.v || !payload.eid || !payload.pid || !payload.sig) {
      return null;
    }
    
    // Check version
    if (payload.v !== 1) {
      return null;
    }
    
    // Check expiration if present
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null; // Expired
      }
    }
    
    // Extract signature
    const receivedSignature = payload.sig;
    
    // Rebuild payload without signature for verification
    const payloadWithoutSig: Omit<QRPayload, 'sig'> = {
      v: payload.v,
      eid: payload.eid,
      pid: payload.pid,
    };
    
    if (payload.gid) {
      payloadWithoutSig.gid = payload.gid;
    }
    
    if (payload.exp) {
      payloadWithoutSig.exp = payload.exp;
    }
    
    // Verify signature
    const secret = getSigningSecret(partnerId);
    const expectedSignature = generateSignature(payloadWithoutSig, secret);
    
    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(
      Buffer.from(receivedSignature),
      Buffer.from(expectedSignature)
    )) {
      return null; // Invalid signature
    }
    
    return payload;
  } catch (error) {
    console.error('Error verifying QR payload:', error);
    return null;
  }
}

/**
 * Extract pass ID from QR payload (without full verification)
 * Useful for quick lookups before full verification
 */
export function extractPassIdFromPayload(encodedPayload: string): string | null {
  try {
    // Decode base64url
    let base64 = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    const padding = base64.length % 4;
    if (padding) {
      base64 += '='.repeat(4 - padding);
    }
    
    // Decode JSON
    const jsonString = Buffer.from(base64, 'base64').toString('utf-8');
    const payload: Partial<QRPayload> = JSON.parse(jsonString);
    
    return payload.pid || null;
  } catch (error) {
    return null;
  }
}


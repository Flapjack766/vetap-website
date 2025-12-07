/**
 * VETAP Event - Token Generator
 * 
 * Generates unique tokens for passes with collision detection
 */

import crypto from 'crypto';
import { createEventClient } from '@/lib/supabase/event-server';

/**
 * Generate a random token
 * @param length - Length in bytes (default: 32)
 * @param encoding - Encoding format: 'hex', 'base64', 'base64url', 'base58' (default: 'hex')
 * @returns Random token string
 */
export function generateToken(length: number = 32, encoding: 'hex' | 'base64' | 'base64url' = 'hex'): string {
  const randomBytes = crypto.randomBytes(length);
  
  switch (encoding) {
    case 'hex':
      return randomBytes.toString('hex');
    case 'base64':
      return randomBytes.toString('base64');
    case 'base64url':
      return randomBytes
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    default:
      return randomBytes.toString('hex');
  }
}

/**
 * Generate a unique token for a pass
 * Checks database for uniqueness and retries if collision occurs
 * @param eventId - Event ID
 * @param maxRetries - Maximum retry attempts (default: 5)
 * @returns Unique token
 */
export async function generateUniqueToken(
  eventId: string,
  maxRetries: number = 5
): Promise<string> {
  const supabase = await createEventClient();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const token = generateToken(32, 'hex'); // 64 hex characters
    
    // Check if token already exists
    const { data: existingPass, error } = await supabase
      .from('event_passes')
      .select('id')
      .eq('token', token)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      // Unexpected error
      console.error('Error checking token uniqueness:', error);
      throw new Error('Failed to check token uniqueness');
    }
    
    if (!existingPass) {
      // Token is unique
      return token;
    }
    
    // Collision detected, retry
    console.warn(`Token collision detected (attempt ${attempt + 1}/${maxRetries}), generating new token...`);
  }
  
  // All retries exhausted
  throw new Error(`Failed to generate unique token after ${maxRetries} attempts`);
}

/**
 * Generate a shorter token for display purposes
 * @param length - Length in bytes (default: 8)
 * @returns Short token string (hex)
 */
export function generateShortToken(length: number = 8): string {
  return generateToken(length, 'hex');
}

/**
 * Validate token format
 * @param token - Token to validate
 * @param encoding - Expected encoding format
 * @returns true if valid format
 */
export function validateTokenFormat(token: string, encoding: 'hex' | 'base64' | 'base64url' = 'hex'): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  switch (encoding) {
    case 'hex':
      // Hex should only contain 0-9, a-f, A-F
      return /^[0-9a-fA-F]+$/.test(token) && token.length >= 16;
    case 'base64':
      // Base64 validation
      return /^[A-Za-z0-9+/]+=*$/.test(token) && token.length >= 16;
    case 'base64url':
      // Base64url validation (no padding, uses - and _)
      return /^[A-Za-z0-9_-]+$/.test(token) && token.length >= 16;
    default:
      return false;
  }
}


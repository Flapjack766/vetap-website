import { nanoid } from 'nanoid';

/**
 * Generate a random username for new users
 * Format: u + 10 alphanumeric characters (e.g., u8djs9k2n4a)
 */
export function generateRandomUsername(): string {
  const randomPart = nanoid(10).toLowerCase();
  return `u${randomPart}`;
}

/**
 * Check if username (random or custom) exists in database
 */
export async function usernameExists(
  supabase: any,
  username: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .or(`username_random.eq.${username},username_custom.eq.${username}`)
    .limit(1);

  if (error) {
    console.error('Error checking username:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Generate a unique random username
 * Retries if username already exists
 * Works with both client and server Supabase instances
 */
export async function generateUniqueRandomUsername(
  supabase: any,
  maxRetries: number = 5
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const username = generateRandomUsername();
    const exists = await usernameExists(supabase, username);
    
    if (!exists) {
      return username;
    }
  }
  
  // If all retries failed, add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36);
  return `u${nanoid(7).toLowerCase()}${timestamp.slice(-3)}`;
}

/**
 * Validate custom username
 * Rules:
 * - 3-20 characters
 * - Only lowercase letters, numbers, and hyphens
 * - Cannot start or end with hyphen
 * - Cannot contain consecutive hyphens
 */
export function validateCustomUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (username.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less' };
  }
  if (!/^[a-z0-9-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain lowercase letters, numbers, and hyphens' };
  }
  if (username.startsWith('-') || username.endsWith('-')) {
    return { valid: false, error: 'Username cannot start or end with a hyphen' };
  }
  if (username.includes('--')) {
    return { valid: false, error: 'Username cannot contain consecutive hyphens' };
  }
  return { valid: true };
}


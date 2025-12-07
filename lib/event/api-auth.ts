/**
 * VETAP Event - API Authentication Helpers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEventAdminClient } from '@/lib/supabase/event-admin';

export interface EventUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'partner_admin' | 'organizer' | 'gate_staff';
  partner_id?: string | null;
  phone?: string | null;
  phone_country_code?: string | null;
  country?: string | null;
  city?: string | null;
}

/**
 * Authenticate API request using Bearer token
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: EventUser } | { error: NextResponse }> {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    console.log('🔐 API Auth: Checking authorization header...');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ API Auth: Missing or invalid authorization header');
      return {
        error: NextResponse.json(
          { error: 'Unauthorized', message: 'Missing or invalid authorization header' },
          { status: 401 }
        ),
      };
    }

    const token = authHeader.substring(7);
    console.log('🔐 API Auth: Token received, length:', token.length);

    // Use admin client to verify token
    const adminClient = createEventAdminClient();
    
    // Verify token
    const { data: { user: authUser }, error: authError } = await adminClient.auth.getUser(token);

    if (authError) {
      console.log('❌ API Auth: Token verification failed:', authError.message);
      return {
        error: NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid or expired token' },
          { status: 401 }
        ),
      };
    }

    if (!authUser) {
      console.log('❌ API Auth: No user returned from token verification');
      return {
        error: NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid token' },
          { status: 401 }
        ),
      };
    }

    console.log('✅ API Auth: Token verified, user:', authUser.id, authUser.email);

    // Get user data from event_users table
    const { data: eventUser, error: userError } = await adminClient
      .from('event_users')
      .select('id, name, email, role, partner_id, phone, phone_country_code, country, city')
      .eq('id', authUser.id)
      .single();

    if (userError) {
      console.log('⚠️ API Auth: Error fetching event_users:', userError.message);
      // User might not exist in event_users yet - create with defaults
      return {
        user: {
          id: authUser.id,
          name: authUser.email || 'User',
          email: authUser.email || '',
          role: 'organizer',
          partner_id: null,
        },
      };
    }

    if (!eventUser) {
      console.log('⚠️ API Auth: Event user not found, using auth user data');
      return {
        user: {
          id: authUser.id,
          name: authUser.email || 'User',
          email: authUser.email || '',
          role: 'organizer',
          partner_id: null,
        },
      };
    }

    console.log('✅ API Auth: Event user found:', eventUser.id, eventUser.role);
    return { user: eventUser as EventUser };
  } catch (error) {
    console.error('❌ API Auth: Exception:', error);
    return {
      error: NextResponse.json(
        { error: 'Internal Server Error', message: 'Authentication failed' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Wrapper for authenticated API routes
 */
export function withAuth<T = unknown>(
  handler: (request: NextRequest, context: { user: EventUser }) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticateRequest(request);
    
    if ('error' in authResult) {
      return authResult.error;
    }

    return handler(request, { user: authResult.user });
  };
}

/**
 * Check if user has access to a specific partner
 * Returns the partner data if access is granted, or an error response
 */
export async function requirePartnerAccess(
  request: NextRequest,
  partnerId: string
): Promise<{ partner: { id: string; name: string } } | { error: NextResponse }> {
  try {
    const authResult = await authenticateRequest(request);
    
    if ('error' in authResult) {
      return authResult;
    }

    const { user } = authResult;

    // Owners can access any partner
    if (user.role === 'owner') {
      const adminClient = createEventAdminClient();
      const { data: partner, error: partnerError } = await adminClient
        .from('event_partners')
        .select('id, name')
        .eq('id', partnerId)
        .single();

      if (partnerError || !partner) {
        return {
          error: NextResponse.json(
            { error: 'Not Found', message: 'Partner not found' },
            { status: 404 }
          ),
        };
      }

      return { partner };
    }

    // Partner admins can only access their own partner
    if (user.role === 'partner_admin') {
      if (user.partner_id !== partnerId) {
        return {
          error: NextResponse.json(
            { error: 'Forbidden', message: 'You do not have access to this partner' },
            { status: 403 }
          ),
        };
      }

      const adminClient = createEventAdminClient();
      const { data: partner, error: partnerError } = await adminClient
        .from('event_partners')
        .select('id, name')
        .eq('id', partnerId)
        .single();

      if (partnerError || !partner) {
        return {
          error: NextResponse.json(
            { error: 'Not Found', message: 'Partner not found' },
            { status: 404 }
          ),
        };
      }

      return { partner };
    }

    // Other roles don't have partner access
    return {
      error: NextResponse.json(
        { error: 'Forbidden', message: 'Partner access permission required' },
        { status: 403 }
      ),
    };
  } catch (error) {
    console.error('❌ Partner Access Check Error:', error);
    return {
      error: NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to verify partner access' },
        { status: 500 }
      ),
    };
  }
}

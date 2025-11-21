import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'root', 'system',
  'login', 'signup', 'signin', 'logout',
  'api', 'www', 'mail', 'email',
  'support', 'help', 'contact', 'about',
  'dashboard', 'profile', 'settings', 'account',
  'p', 'u', 'user', 'users',
  'test', 'testing', 'dev', 'development',
  'null', 'undefined', 'true', 'false',
];

// Username validation regex: lowercase letters, numbers, and hyphens only
const USERNAME_REGEX = /^[a-z0-9-]+$/;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { requested_username, period_type, profile_id } = body;

    // Frontend validation (also validate on backend)
    if (!requested_username || typeof requested_username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const username = requested_username.trim().toLowerCase();

    // Validate username format
    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (username.length > 30) {
      return NextResponse.json(
        { error: 'Username must be less than 30 characters' },
        { status: 400 }
      );
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Check if username is reserved
    if (RESERVED_USERNAMES.includes(username)) {
      return NextResponse.json(
        { error: 'This username is reserved and cannot be used' },
        { status: 400 }
      );
    }

    // Validate period_type
    if (!period_type || !['week', 'month', 'year'].includes(period_type)) {
      return NextResponse.json(
        { error: 'Invalid period type' },
        { status: 400 }
      );
    }

    // Check if username is already taken in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username_custom', username)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'This username is already taken' },
        { status: 400 }
      );
    }

    // Check if user already has a pending request for this username
    const { data: existingRequest } = await supabase
      .from('username_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('requested_username', username)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request for this username' },
        { status: 400 }
      );
    }

    // Create username request
    const { data: newRequest, error: insertError } = await supabase
      .from('username_requests')
      .insert({
        user_id: user.id,
        requested_username: username,
        period_type,
        profile_id: profile_id || null, // Link to profile if provided
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating username request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create request. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Request submitted successfully',
        request: newRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in username request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


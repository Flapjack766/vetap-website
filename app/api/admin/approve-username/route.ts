import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Check if user is admin by checking admin_users table
    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminError) {
      console.error('Error checking admin status:', adminError);
      // Fallback: check if admin_users table exists, if not, allow if user email is admin@vetaps.com
      const isAdminFallback = user.email === 'admin@vetaps.com';
      if (!isAdminFallback) {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }
    } else if (!adminCheck) {
      // User is not in admin_users table
      // Fallback: check if user email is admin@vetaps.com
      const isAdminFallback = user.email === 'admin@vetaps.com';
      if (!isAdminFallback) {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { request_id, user_id, username, start_date, period_type, profile_id } = body;

    // Validate input
    if (!request_id || !user_id || !username || !start_date || !period_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get request details to check if profile_id is provided
    const { data: request, error: requestError } = await supabase
      .from('username_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (requestError || !request) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    if (!['week', 'month', 'year'].includes(period_type)) {
      return NextResponse.json(
        { error: 'Invalid period type' },
        { status: 400 }
      );
    }

    // Calculate expiration date
    const start = new Date(start_date);
    const expiresAt = new Date(start);

    switch (period_type) {
      case 'week':
        expiresAt.setDate(expiresAt.getDate() + 7);
        break;
      case 'month':
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        break;
      case 'year':
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        break;
    }

    // Check if username is still available
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username_custom', username)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      );
    }

    // Get user email from profiles (or use a default)
    const { data: existingUserProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user_id)
      .limit(1)
      .maybeSingle();

    const userEmail = existingUserProfile?.email || '';

    // Create NEW profile with custom username (not update existing)
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user_id,
        email: userEmail,
        username_custom: username,
        username_random: `u${Math.random().toString(36).substring(2, 12)}`, // Temporary, won't be used
        username_type: 'custom',
        profile_name: username, // Use username as profile name
        custom_username_expires_at: expiresAt.toISOString(),
        template_id: 1,
        links: {},
        is_primary: false, // New profiles are not primary
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      console.error('Profile error details:', JSON.stringify(profileError, null, 2));
      return NextResponse.json(
        { 
          error: 'Failed to create profile',
          details: profileError.message || JSON.stringify(profileError)
        },
        { status: 500 }
      );
    }

    if (!newProfile) {
      console.error('Profile creation returned no data');
      return NextResponse.json(
        { error: 'Profile creation failed: No data returned' },
        { status: 500 }
      );
    }

    // Update request with profile_id
    await supabase
      .from('username_requests')
      .update({ profile_id: newProfile.id })
      .eq('id', request_id);

    // Update request status to approved
    const { data: updatedRequest, error: updateRequestError } = await supabase
      .from('username_requests')
      .update({
        status: 'approved',
        note: `Approved on ${new Date().toISOString()}. Expires: ${expiresAt.toISOString()}`,
      })
      .eq('id', request_id)
      .select()
      .single();

    if (updateRequestError) {
      console.error('Error updating request:', updateRequestError);
      console.error('Request error details:', JSON.stringify(updateRequestError, null, 2));
      // Profile was updated, but request update failed
      // Return success but log the error
      console.warn('Profile updated but request status update failed');
      return NextResponse.json(
        {
          success: true,
          message: 'Username approved successfully, but request status update failed',
          warning: updateRequestError.message,
          expires_at: expiresAt.toISOString(),
        },
        { status: 200 }
      );
    }

    if (!updatedRequest) {
      console.warn('Request update returned no data, but profile was updated');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Username approved successfully. New profile created.',
        profile: newProfile,
        expires_at: expiresAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in approve username API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


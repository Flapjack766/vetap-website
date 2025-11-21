import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateUniqueRandomUsername } from '@/lib/supabase/utils';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { profile_name, username_type } = body;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate username_type
    if (username_type !== 'random' && username_type !== 'custom') {
      return NextResponse.json(
        { error: 'Invalid username_type. Must be "random" or "custom"' },
        { status: 400 }
      );
    }

    // If random, check limit (max 3)
    if (username_type === 'random') {
      const { data: randomProfiles, error: countError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('username_type', 'random')
        .eq('is_deleted', false);

      if (countError) {
        console.error('Error counting random profiles:', countError);
        return NextResponse.json(
          { error: 'Failed to check profile limit' },
          { status: 500 }
        );
      }

      if (randomProfiles && randomProfiles.length >= 3) {
        return NextResponse.json(
          { error: 'Maximum limit of 3 random profiles reached' },
          { status: 400 }
        );
      }
    }

    // If custom, user must request it (not create directly)
    if (username_type === 'custom') {
      return NextResponse.json(
        { error: 'Custom profiles must be requested through the username request system' },
        { status: 400 }
      );
    }

    // Generate random username
    const randomUsername = await generateUniqueRandomUsername(supabase);

    // Check if user has any profiles and if there's a primary profile
    const { data: existingProfiles, error: checkError } = await supabase
      .from('profiles')
      .select('id, is_primary')
      .eq('user_id', user.id)
      .eq('is_deleted', false);

    if (checkError) {
      console.error('Error checking existing profiles:', checkError);
      // Continue anyway - might be no profiles
    }

    // Always set is_primary = false for new profiles created via API
    // The first profile is created automatically during signup/dashboard access with is_primary = true
    // All subsequent profiles created via this API should be is_primary = false to avoid constraint violation
    const shouldBePrimary = false;
    
    // Log the values being inserted for debugging
    console.log('Creating profile with:', {
      user_id: user.id,
      username_random: randomUsername,
      username_type: 'random',
      profile_name: profile_name || `Profile ${(existingProfiles?.length || 0) + 1}`,
      is_primary: shouldBePrimary,
      existing_profiles_count: existingProfiles?.length || 0,
    });
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        email: user.email,
        username_random: randomUsername,
        username_type: 'random',
        profile_name: profile_name || `Profile ${(existingProfiles?.length || 0) + 1}`,
        is_primary: false, // Explicitly set to false
        template_id: 1,
        links: {},
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating profile:', createError);
      return NextResponse.json(
        { error: 'Failed to create profile', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, profile: newProfile },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in create-profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


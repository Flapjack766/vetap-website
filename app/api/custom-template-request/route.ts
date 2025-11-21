import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { profile_id, request_title, description, data_source, required_fields, uploaded_images, custom_data, color_scheme, layout_preference, special_features, reference_urls, additional_notes } = body;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user owns this profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', profile_id)
      .single();

    if (profileError || !profile || profile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!request_title || !description) {
      return NextResponse.json(
        { error: 'Request title and description are required' },
        { status: 400 }
      );
    }

    // Create template request
    const { data, error: insertError } = await supabase
      .from('custom_template_requests')
      .insert({
        profile_id,
        request_title,
        description,
        data_source: data_source || 'use_existing',
        required_fields: required_fields || [],
        uploaded_images: uploaded_images || {},
        custom_data: custom_data || {},
        color_scheme: color_scheme || null,
        layout_preference: layout_preference || null,
        special_features: special_features || null,
        reference_urls: reference_urls || null,
        additional_notes: additional_notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating template request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create template request' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in custom template request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


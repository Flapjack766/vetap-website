import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { request_id, template_code } = body;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin access
    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminError) {
      console.error('Error checking admin status:', adminError);
      // Fallback: check if user email is admin@vetaps.com
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

    // Get request details
    const { data: request, error: requestError } = await supabase
      .from('custom_template_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (requestError || !request) {
      console.error('Error fetching request:', requestError);
      return NextResponse.json(
        { error: 'Template request not found', details: requestError?.message },
        { status: 404 }
      );
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('custom_template_requests')
      .update({
        status: 'approved',
        template_code: template_code,
      })
      .eq('id', request_id);

    if (updateError) {
      console.error('Error updating request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update request status', details: updateError.message },
        { status: 500 }
      );
    }

    // Create new custom template record (always insert new, never update or delete)
    // All templates remain available for the user to choose from
    console.log('Creating new template for profile:', request.profile_id);
    const { data: newTemplate, error: insertError } = await supabase
      .from('custom_templates')
      .insert({
        profile_id: request.profile_id,
        request_id: request_id,
        template_name: request.request_title || 'Custom Template',
        template_code: template_code,
        is_active: true,
        is_deleted: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating custom template:', insertError);
      console.error('Insert error details:', JSON.stringify(insertError, null, 2));
      console.error('Error code:', insertError.code);
      console.error('Error hint:', insertError.hint);
      console.error('Request data:', {
        profile_id: request.profile_id,
        request_id: request_id,
        template_name: request.request_title,
        template_code_length: template_code?.length,
      });
      return NextResponse.json(
        { 
          error: 'Failed to create custom template', 
          details: insertError.message || JSON.stringify(insertError),
          code: insertError.code,
          hint: insertError.hint
        },
        { status: 500 }
      );
    }

    if (!newTemplate) {
      console.error('Template insert returned no data');
      return NextResponse.json(
        { error: 'Failed to create custom template: No data returned' },
        { status: 500 }
      );
    }

    const finalTemplate = newTemplate;

    // Update profile to use the new custom template
    // template_id = 999 means custom template is selected
    // custom_template_id points to the specific custom template
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        template_id: 999,
        custom_template_id: finalTemplate.id,
      })
      .eq('id', request.profile_id);

    if (profileError) {
      console.error('Error updating profile template_id:', profileError);
      // Continue anyway - template is created, user can select it manually
    }

    return NextResponse.json(
      { success: true, template: finalTemplate },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in approve-template API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


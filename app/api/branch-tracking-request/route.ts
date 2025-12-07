import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { renderBranchTrackingRequestEmailHTML } from '@/lib/mail';

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
    const { profile_id } = body;

    // Check if user already has a pending request
    const { data: existingRequest } = await supabase
      .from('branch_tracking_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request for branch tracking dashboard' },
        { status: 400 }
      );
    }

    // Get user profile to get name and email
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('profile_name, user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get user email from auth
    const userEmail = user.email || '';
    const userName = userProfile?.profile_name || user.email?.split('@')[0] || 'User';

    // Create branch tracking request
    const { data: newRequest, error: insertError } = await supabase
      .from('branch_tracking_requests')
      .insert({
        user_id: user.id,
        profile_id: profile_id || null, // Link to profile if provided
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating branch tracking request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create request. Please try again.' },
        { status: 500 }
      );
    }

    // Send confirmation email to user
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      // Determine locale from user metadata or default to 'en'
      const locale = (user.user_metadata?.locale as 'ar' | 'en') || 'en';
      
      const emailHTML = renderBranchTrackingRequestEmailHTML({
        name: userName,
        email: userEmail,
        locale,
      });

      await resend.emails.send({
        from: process.env.USERS_EMAIL || 'VETAP <users@vetaps.com>',
        to: userEmail,
        subject: locale === 'ar'
          ? `VETAP • طلب داشبورد تتبع الفروع قيد المراجعة`
          : `VETAP • Branch Tracking Dashboard Request Under Review`,
        html: emailHTML,
      });
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('Error sending branch tracking request email:', emailError);
      // Continue - the request was created successfully
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
    console.error('Error in branch tracking request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


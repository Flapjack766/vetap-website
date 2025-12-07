import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { renderBranchTrackingRejectionEmailHTML } from '@/lib/mail';

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

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminError) {
      const isAdminFallback = user.email === 'admin@vetaps.com';
      if (!isAdminFallback) {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }
    } else if (!adminCheck) {
      const isAdminFallback = user.email === 'admin@vetaps.com';
      if (!isAdminFallback) {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { request_id, rejection_reason } = body;

    // Validate input
    if (!request_id) {
      return NextResponse.json(
        { error: 'Missing request_id' },
        { status: 400 }
      );
    }

    // Create admin client early to use for all database operations
    const adminClient = createAdminClient();

    // Get request details using admin client (bypasses RLS)
    const { data: request, error: requestError } = await adminClient
      .from('branch_tracking_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (requestError || !request) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    if (request.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request is not pending' },
        { status: 400 }
      );
    }

    // Get user email from auth.users using admin client
    const { data: authUser } = await adminClient.auth.admin.getUserById(request.user_id);
    
    // Get user profile for name using admin client (bypasses RLS)
    const { data: userProfile } = await adminClient
      .from('profiles')
      .select('profile_name, email')
      .eq('user_id', request.user_id)
      .limit(1)
      .maybeSingle();
    
    const userEmail = authUser?.user?.email || userProfile?.email || '';
    const userName = userProfile?.profile_name || authUser?.user?.email?.split('@')[0] || 'User';

    // Update request status to rejected using admin client (bypasses RLS)
    const { data: updatedRequest, error: updateError } = await adminClient
      .from('branch_tracking_requests')
      .update({
        status: 'rejected',
        note: rejection_reason || `Rejected on ${new Date().toISOString()}`,
      })
      .eq('id', request_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating request:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject request' },
        { status: 500 }
      );
    }

    // Send rejection email to user
    if (userEmail) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        // Determine locale from user metadata or default to 'en'
        const locale = (authUser?.user?.user_metadata?.locale as 'ar' | 'en') || 'en';
        
        const emailHTML = renderBranchTrackingRejectionEmailHTML({
          name: userName,
          email: userEmail,
          rejection_reason: rejection_reason || undefined,
          locale,
        });

        await resend.emails.send({
          from: process.env.USERS_EMAIL || 'VETAP <users@vetaps.com>',
          to: userEmail,
          subject: locale === 'ar' 
            ? `VETAP • طلب داشبورد تتبع الفروع - تم الرفض`
            : `VETAP • Branch Tracking Dashboard Request - Rejected`,
          html: emailHTML,
        });
      } catch (emailError) {
        // Log email error but don't fail the request
        console.error('Error sending rejection email:', emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Request rejected successfully',
        request: updatedRequest,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in reject branch tracking API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


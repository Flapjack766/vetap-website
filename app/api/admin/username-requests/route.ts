import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Admin API Route for Username Requests
 * 
 * This route uses service_role key to access all username requests.
 * Only accessible by authenticated admin users.
 */
export async function GET(req: NextRequest) {
  try {
    console.log('Username requests API called');
    
    // First, verify that the user is an admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id, user.email);

    // Check if user is admin
    // First check admin_users table
    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    // Also check ADMIN_USER_IDS list (same as admin page)
    const ADMIN_USER_IDS = [
      '15f7e23f-8b8f-4f73-ae2d-e75201d788bc',
    ];

    // Check if user is admin
    const isAdminInTable = !!adminCheck;
    const isAdminInList = ADMIN_USER_IDS.includes(user.id);
    const isAdminEmail = user.email === 'admin@vetaps.com';
    
    const isAdmin = isAdminInTable || isAdminInList || isAdminEmail;

    if (!isAdmin) {
      console.error('Admin check failed:', {
        userId: user.id,
        email: user.email,
        adminCheck,
        isAdminInTable,
        isAdminInList,
        isAdminEmail,
      });
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Now use admin client to access all data
    const adminClient = createAdminClient();
    console.log('Admin client created, fetching requests...');

    // Fetch all username requests
    const { data: requestsData, error: requestsError } = await adminClient
      .from('username_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('Requests query result:', {
      count: requestsData?.length || 0,
      error: requestsError,
    });

    if (requestsError) {
      console.error('Error fetching username requests:', requestsError);
      return NextResponse.json(
        { error: 'Failed to fetch username requests', details: requestsError.message },
        { status: 500 }
      );
    }

    console.log('Fetched username requests:', requestsData?.length || 0);

    if (!requestsData || requestsData.length === 0) {
      console.log('No requests found, returning empty array');
      return NextResponse.json(
        { requests: [] },
        { status: 200 }
      );
    }

    // Fetch user info for each request
    console.log('Processing', requestsData.length, 'requests...');
    const requestsWithUsers = await Promise.all(
      (requestsData || []).map(async (request) => {
        // Get user email from auth.users
        const { data: authUser } = await adminClient.auth.admin.getUserById(request.user_id);
        const userEmail = authUser?.user?.email || 'Unknown';

        // Get user profile for name
        const { data: profileData } = await adminClient
          .from('profiles')
          .select('profile_name, display_name, email')
          .eq('user_id', request.user_id)
          .eq('is_deleted', false)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        // If no profile found, try to get any profile
        let finalProfileData = profileData;
        if (!profileData) {
          const { data: anyProfile } = await adminClient
            .from('profiles')
            .select('profile_name, display_name, email')
            .eq('user_id', request.user_id)
            .limit(1)
            .maybeSingle();
          finalProfileData = anyProfile;
        }

        return {
          ...request,
          user: {
            email: userEmail,
            profile: finalProfileData ? {
              display_name: finalProfileData.display_name || finalProfileData.profile_name || 'Unknown',
              email: finalProfileData.email || userEmail,
            } : undefined,
          },
        };
      })
    );

    console.log('Processed requests:', requestsWithUsers.length);
    
    return NextResponse.json(
      { requests: requestsWithUsers },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in username requests API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


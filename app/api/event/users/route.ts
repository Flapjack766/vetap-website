import { NextRequest, NextResponse } from 'next/server';
import { withAuth, requireUserManagement } from '@/lib/event/api-auth';
import { createEventClient } from '@/lib/supabase/event-server';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import type { User, UserRole } from '@/lib/event/types';

/**
 * POST /api/event/users
 * Create a new user within a Partner
 * 
 * Requires: owner or partner_admin role
 * - Owners can create users for any partner
 * - Partner admins can create users for their own partner only
 */
export async function POST(request: NextRequest) {
  return withAuth(async (req, { user }) => {
    // Check if user can manage users
    if (!['owner', 'partner_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'User management permission required' },
        { status: 403 }
      );
    }

    try {
      const body = await req.json();
      const { 
        email, 
        name, 
        role, 
        partner_id, 
        phone, 
        phone_country_code, 
        country, 
        city 
      } = body;

      // Validate required fields
      if (!email || !name || !role) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'Email, name, and role are required' },
          { status: 400 }
        );
      }

      // Validate role
      const validRoles: UserRole[] = ['owner', 'partner_admin', 'organizer', 'gate_staff'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Bad Request', message: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
          { status: 400 }
        );
      }

      // Determine partner_id
      let targetPartnerId: string | null = null;
      
      if (user.role === 'owner') {
        // Owners can create users for any partner
        targetPartnerId = partner_id || null;
      } else if (user.role === 'partner_admin') {
        // Partner admins can only create users for their own partner
        if (partner_id && partner_id !== user.partner_id) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'You can only create users for your own partner' },
            { status: 403 }
          );
        }
        targetPartnerId = user.partner_id;
      }

      // Validate: only owners can create owner users
      if (role === 'owner' && user.role !== 'owner') {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Only owners can create owner users' },
          { status: 403 }
        );
      }

      const supabase = await createEventClient();
      const adminClient = createEventAdminClient();

      // Check if user already exists in auth.users
      const { data: { users: existingAuthUsers } } = await adminClient.auth.admin.listUsers();
      const existingAuthUser = existingAuthUsers?.find(u => u.email === email);

      let userId: string;

      if (existingAuthUser) {
        // User exists in auth.users, use their ID
        userId = existingAuthUser.id;
      } else {
        // Create new user in auth.users
        const { data: newAuthUser, error: createAuthError } = await adminClient.auth.admin.createUser({
          email,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name,
            phone: phone || null,
            phone_country_code: phone_country_code || null,
            country: country || null,
            city: city || null,
          },
        });

        if (createAuthError || !newAuthUser) {
          console.error('Error creating auth user:', createAuthError);
          return NextResponse.json(
            { error: 'Internal Server Error', message: 'Failed to create user in authentication system' },
            { status: 500 }
          );
        }

        userId = newAuthUser.user.id;
      }

      // Check if user already exists in event_users
      const { data: existingEventUser } = await supabase
        .from('event_users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (existingEventUser) {
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('event_users')
          .update({
            name: name.trim(),
            role: role,
            partner_id: targetPartnerId,
            phone: phone?.trim() || null,
            phone_country_code: phone_country_code || null,
            country: country || null,
            city: city?.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
          .select('id, name, email, role, partner_id, phone, phone_country_code, country, city, created_at, updated_at')
          .single();

        if (updateError) {
          console.error('Error updating user:', updateError);
          return NextResponse.json(
            { error: 'Internal Server Error', message: 'Failed to update user', details: updateError.message },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { 
            success: true, 
            user: updatedUser as User,
            message: 'User updated successfully'
          },
          { status: 200 }
        );
      }

      // Create new user in event_users
      const { data: newUser, error: createError } = await supabase
        .from('event_users')
        .insert({
          id: userId,
          email,
          name: name.trim(),
          role: role,
          partner_id: targetPartnerId,
          phone: phone?.trim() || null,
          phone_country_code: phone_country_code || null,
          country: country || null,
          city: city?.trim() || null,
        })
        .select('id, name, email, role, partner_id, phone, phone_country_code, country, city, created_at, updated_at')
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to create user', details: createError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          success: true, 
          user: newUser as User 
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: error.message || 'Failed to create user' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/event/users
 * Get list of users
 * 
 * - Owners: see all users
 * - Partner admins: see users in their partner
 * - Others: see only themselves
 */
export async function GET(request: NextRequest) {
  return withAuth(async (req, { user }) => {
    try {
      const supabase = await createEventClient();
      const partnerId = req.nextUrl.searchParams.get('partner_id');

      let query = supabase
        .from('event_users')
        .select('id, name, email, role, partner_id, phone, phone_country_code, country, city, created_at, updated_at')
        .order('created_at', { ascending: false });

      // Apply filters based on user role
      if (user.role === 'owner') {
        // Owners can see all users, optionally filtered by partner_id
        if (partnerId) {
          query = query.eq('partner_id', partnerId);
        }
      } else if (user.role === 'partner_admin') {
        // Partner admins can only see users in their partner
        query = query.eq('partner_id', user.partner_id);
      } else {
        // Others can only see themselves
        query = query.eq('id', user.id);
      }

      const { data: users, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching users:', fetchError);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to fetch users', details: fetchError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          success: true, 
          users: users || [] 
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: error.message || 'Failed to fetch users' },
        { status: 500 }
      );
    }
  })(request);
}


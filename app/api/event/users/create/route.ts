import { NextRequest, NextResponse } from 'next/server';
import { createEventAdminClient } from '@/lib/supabase/event-admin';

/**
 * API route to create event_users record using service role key
 * This bypasses RLS and is used when trigger fails or session is not available
 * 
 * SECURITY: This should only be called from the client after successful signup
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, name, phone, phone_country_code, country, city } = body;

    // Validate required fields
    if (!userId || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email, name' },
        { status: 400 }
      );
    }

    // Use admin client (bypasses RLS)
    const adminClient = createEventAdminClient();

    // Check if user already exists by id
    const { data: existingUserById } = await adminClient
      .from('event_users')
      .select('id, email, name, phone, country, city, role, partner_id')
      .eq('id', userId)
      .maybeSingle();

    if (existingUserById) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'User already exists (id match)',
          user: existingUserById 
        },
        { status: 200 }
      );
    }

    // Check if user already exists by email (unique constraint)
    const { data: existingUserByEmail } = await adminClient
      .from('event_users')
      .select('id, email, name, phone, country, city, role, partner_id')
      .eq('email', email)
      .maybeSingle();

    if (existingUserByEmail) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'User already exists (email match)',
          user: existingUserByEmail 
        },
        { status: 200 }
      );
    }

    // Create event_users record
    const { data: newUser, error: createError } = await adminClient
      .from('event_users')
      .insert({
        id: userId,
        email,
        name: name.trim(),
        phone: phone?.trim() || null,
        phone_country_code: phone_country_code || null,
        country: country || null,
        city: city?.trim() || null,
        role: 'organizer', // Default role
        partner_id: null, // Will be set by admin later
      })
      .select('id, email, name, phone, country, city, created_at')
      .single();

    if (createError) {
      console.error('Error creating event_users:', createError);
      return NextResponse.json(
        { 
          error: 'Failed to create user record',
          details: createError.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        user: newUser 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}


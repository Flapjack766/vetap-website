import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

/**
 * API Route to create a tracking link
 * 
 * This route:
 * 1. Validates the request
 * 2. Generates a unique slug
 * 3. Creates the tracking link
 * 4. Returns the slug and URL
 */

const createLinkSchema = z.object({
  business_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  destination_type: z.enum(['google_maps_review', 'restaurant_page', 'menu_page', 'custom_url']),
  destination_url: z.string().url().optional(),
  selected_template: z.string().nullable().optional(),
  show_intermediate_page: z.boolean().default(true),
  collect_feedback_first: z.boolean().default(false),
  template_data: z.object({
    description: z.string().min(1).optional(),
    cover_image: z.string().url().optional(),
    logo: z.string().url().optional(),
    operating_hours: z.string().min(1).optional(),
    menu_items: z.array(z.object({
      name: z.string().min(1),
      description: z.string().min(1).optional(),
      price: z.string().min(1).optional(),
      image: z.string().url().optional(),
    })).optional(),
    menu_image: z.string().url().optional(),
    external_menu_url: z.string().url().optional(),
    menu_page_url: z.string().url().optional(),
    show_map: z.boolean().optional(),
    social_media_links: z.object({
      facebook: z.string().url().optional(),
      instagram: z.string().url().optional(),
      twitter: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      youtube: z.string().url().optional(),
      tiktok: z.string().url().optional(),
    }).optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

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
    
    // Log request body for debugging (remove in production)
    console.log('Received request body:', JSON.stringify(body, null, 2));
    
    const data = createLinkSchema.parse(body);

    // Verify user owns the business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, owner_user_id')
      .eq('id', data.business_id)
      .eq('owner_user_id', user.id)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 403 }
      );
    }

    // Verify branch belongs to business
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id, business_id')
      .eq('id', data.branch_id)
      .eq('business_id', data.business_id)
      .single();

    if (branchError || !branch) {
      return NextResponse.json(
        { error: 'Branch not found or does not belong to business' },
        { status: 403 }
      );
    }

    // Generate unique slug
    const generateSlug = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let slug = '';
      for (let i = 0; i < 6; i++) {
        slug += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return slug;
    };

    let slug = generateSlug();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure slug is unique
    while (attempts < maxAttempts) {
      const { data: existing } = await adminClient
        .from('tracking_links')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (!existing) {
        break; // Slug is unique
      }

      slug = generateSlug();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique slug. Please try again.' },
        { status: 500 }
      );
    }

    // Determine destination URL
    let destinationUrl = data.destination_url;
    
    if (!destinationUrl) {
      // For restaurant_page and menu_page, we'll use a placeholder
      // The actual page will be rendered based on template
      if (data.destination_type === 'restaurant_page' || data.destination_type === 'menu_page') {
        destinationUrl = `https://vetaps.com/r/${slug}`; // Will be handled by page.tsx
      } else {
        return NextResponse.json(
          { error: 'Destination URL is required for this destination type' },
          { status: 400 }
        );
      }
    }

    // Prepare template_data - only include if it has content
    const templateData = data.template_data && Object.keys(data.template_data).length > 0
      ? data.template_data
      : null;

    // Create tracking link using admin client (bypasses RLS)
    const { data: trackingLink, error: linkError } = await adminClient
      .from('tracking_links')
      .insert({
        business_id: data.business_id,
        branch_id: data.branch_id,
        slug: slug,
        destination_type: data.destination_type,
        destination_url: destinationUrl,
        selected_template: data.selected_template || null,
        show_intermediate_page: data.show_intermediate_page,
        collect_feedback_first: data.collect_feedback_first,
        template_data: templateData || {},
        is_active: true,
      })
      .select()
      .single();

    if (linkError) {
      console.error('Error creating tracking link:', linkError);
      return NextResponse.json(
        { error: 'Failed to create tracking link', details: linkError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        slug: trackingLink.slug,
        id: trackingLink.id,
        url: `${process.env.SITE_URL || 'https://vetaps.com'}/r/${trackingLink.slug}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in create-link API:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


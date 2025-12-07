import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * API Route to fetch tracking link data with branch and business info
 * 
 * This route is used by the intermediate page to get all necessary data
 * for rendering templates.
 */

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Fetch tracking link with related data
    const { data: trackingLink, error: linkError } = await adminClient
      .from('tracking_links')
      .select(`
        *,
        branch:branches(
          id,
          name,
          address,
          google_maps_url,
          business:businesses(
            id,
            name,
            industry
          )
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (linkError || !trackingLink) {
      return NextResponse.json(
        { error: 'Tracking link not found' },
        { status: 404 }
      );
    }

    // Format response
    const response = {
      trackingLink: {
        id: trackingLink.id,
        slug: trackingLink.slug,
        destination_type: trackingLink.destination_type,
        destination_url: trackingLink.destination_url,
        show_intermediate_page: trackingLink.show_intermediate_page,
        collect_feedback_first: trackingLink.collect_feedback_first,
        selected_template: trackingLink.selected_template,
      },
      branch: trackingLink.branch ? {
        id: trackingLink.branch.id,
        name: trackingLink.branch.name,
        address: trackingLink.branch.address,
        google_maps_url: trackingLink.branch.google_maps_url,
      } : null,
      business: trackingLink.branch?.business ? {
        id: trackingLink.branch.business.id,
        name: trackingLink.branch.business.name,
        industry: trackingLink.branch.business.industry,
      } : null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching tracking link data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


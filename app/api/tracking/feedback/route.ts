import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

/**
 * Feedback Submission API Route
 * 
 * This route handles feedback submission from the intermediate page
 * before redirecting to the final destination.
 */

const feedbackSchema = z.object({
  slug: z.string().min(3),
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = feedbackSchema.parse(body);

    const adminClient = createAdminClient();

    // Find the tracking link
    const { data: trackingLink, error: linkError } = await adminClient
      .from('tracking_links')
      .select('id, branch_id, business_id')
      .eq('slug', data.slug)
      .eq('is_active', true)
      .single();

    if (linkError || !trackingLink) {
      return NextResponse.json(
        { error: 'Tracking link not found' },
        { status: 404 }
      );
    }

    // Store feedback in tracking_events meta field
    // You can also create a separate feedback table if needed
    await adminClient
      .from('tracking_events')
      .insert({
        tracking_link_id: trackingLink.id,
        branch_id: trackingLink.branch_id,
        business_id: trackingLink.business_id,
        meta: {
          feedback: {
            rating: data.rating,
            comment: data.comment || null,
            submitted_at: new Date().toISOString(),
          },
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid feedback data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


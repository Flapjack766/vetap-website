import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const conversionSchema = z.object({
  profile_id: z.string().uuid(),
  conversion_type: z.string().min(1),
  conversion_value: z.number().optional(),
  goal_id: z.string().optional(),
  session_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = conversionSchema.parse(body);

    const supabase = await createClient();

    // Insert conversion event
    const { data: conversion, error: conversionError } = await supabase
      .from('analytics_conversions')
      .insert({
        profile_id: validated.profile_id,
        conversion_type: validated.conversion_type,
        conversion_value: validated.conversion_value || null,
        goal_id: validated.goal_id || null,
        session_id: validated.session_id || null,
        metadata: validated.metadata || null,
      })
      .select()
      .single();

    if (conversionError) {
      // If table doesn't exist, create it first (for development)
      if (conversionError.code === '42P01') {
        console.warn('analytics_conversions table does not exist. Please run migration.');
        return NextResponse.json(
          { error: 'Conversion tracking not configured. Please run database migrations.' },
          { status: 503 }
        );
      }
      
      console.error('Error inserting conversion:', conversionError);
      return NextResponse.json(
        { error: 'Failed to track conversion' },
        { status: 500 }
      );
    }

    // Also track as a regular event for analytics
    await supabase
      .from('analytics_events')
      .insert({
        profile_id: validated.profile_id,
        event_type: 'conversion',
        event_category: 'conversion',
        event_label: validated.conversion_type,
        event_value: validated.conversion_value || null,
        session_id: validated.session_id || null,
        metadata: {
          ...validated.metadata,
          goal_id: validated.goal_id,
          conversion_id: conversion.id,
        },
      });

    return NextResponse.json(
      { success: true, conversion_id: conversion.id },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid conversion data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error in conversion tracking API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


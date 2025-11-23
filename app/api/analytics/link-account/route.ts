import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const linkAccountSchema = z.object({
  user_id: z.string().uuid(),
  profile_id: z.string().uuid().optional(),
  session_id: z.string().optional(),
  ip_address: z.string().optional(),
  action: z.enum(['signup', 'login']),
});

/**
 * Link user account to visitor analytics
 * This is called when a user signs up or logs in
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = linkAccountSchema.parse(body);

    const supabase = await createClient();

    // Get client IP
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0].trim() || realIP || 'unknown';

    // Get user's profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('user_id', validated.user_id)
      .eq('is_deleted', false);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    const profileIds = profiles?.map(p => p.id) || [];
    const emails = profiles?.map(p => p.email).filter(Boolean) || [];

    // Find all sessions and events for this IP or session_id
    const queries: Promise<any>[] = [];

    // Find sessions by IP
    if (ip !== 'unknown') {
      queries.push(
        (async () => {
          const { data, error } = await supabase
            .from('analytics_sessions')
            .select('id')
            .eq('ip_address', ip)
            .is('user_id', null);
          return { data, error };
        })()
      );
    }

    // Find sessions by session_id if provided
    if (validated.session_id) {
      queries.push(
        (async () => {
          const { data, error } = await supabase
            .from('analytics_sessions')
            .select('id')
            .eq('id', validated.session_id)
            .is('user_id', null);
          return { data, error };
        })()
      );
    }

    // Find events by IP
    if (ip !== 'unknown') {
      queries.push(
        (async () => {
          const { data, error } = await supabase
            .from('analytics_events')
            .select('id, session_id, ip_address')
            .eq('ip_address', ip)
            .is('profile_id', null)
            .limit(1000);
          return { data, error };
        })()
      );
    }

    // Find events by session_id if provided
    if (validated.session_id) {
      queries.push(
        (async () => {
          const { data, error } = await supabase
            .from('analytics_events')
            .select('id, session_id, ip_address')
            .eq('session_id', validated.session_id)
            .is('profile_id', null)
            .limit(1000);
          return { data, error };
        })()
      );
    }

    const results = await Promise.all(queries);

    // Update sessions with user_id
    const sessionResults = results.filter(r => r.data && Array.isArray(r.data) && r.data.length > 0 && r.data[0].id && !r.data[0].profile_id);
    const sessionIds = new Set<string>();
    
    sessionResults.forEach(result => {
      if (result.data) {
        result.data.forEach((session: any) => {
          if (session.id) {
            sessionIds.add(session.id);
          }
        });
      }
    });

    // Update all matching sessions
    if (sessionIds.size > 0) {
      await supabase
        .from('analytics_sessions')
        .update({
          user_id: validated.user_id,
          updated_at: new Date().toISOString(),
        })
        .in('id', Array.from(sessionIds));
    }

    // Update events with profile_id (use first profile or provided profile_id)
    const targetProfileId = validated.profile_id || profileIds[0];
    let linkedEventsCount = 0;
    
    if (targetProfileId) {
      const eventResults = results.filter(r => r.data && Array.isArray(r.data) && r.data.length > 0 && (r.data[0].session_id || r.data[0].ip_address));
      const eventIds = new Set<string>();

      eventResults.forEach(result => {
        if (result.data) {
          result.data.forEach((event: any) => {
            if (event.id && !event.profile_id) {
              eventIds.add(event.id);
            }
          });
        }
      });

      linkedEventsCount = eventIds.size;

      // Update events in batches (Supabase limit is 1000)
      const eventIdsArray = Array.from(eventIds);
      for (let i = 0; i < eventIdsArray.length; i += 1000) {
        const batch = eventIdsArray.slice(i, i + 1000);
        await supabase
          .from('analytics_events')
          .update({
            profile_id: targetProfileId,
          })
          .in('id', batch);
      }
    }

    // Track the signup/login event
    await supabase
      .from('analytics_events')
      .insert({
        profile_id: targetProfileId || profileIds[0] || null,
        event_type: validated.action === 'signup' ? 'account_created' : 'account_login',
        event_category: 'conversion',
        event_label: validated.action,
        session_id: validated.session_id || null,
        ip_address: ip !== 'unknown' ? ip : null,
        metadata: {
          user_id: validated.user_id,
          profile_ids: profileIds,
          emails: emails,
          linked_sessions: Array.from(sessionIds).length,
          linked_events: linkedEventsCount,
        },
      });

    // Track as conversion if signup
    if (validated.action === 'signup') {
      await supabase
        .from('analytics_conversions')
        .insert({
          profile_id: targetProfileId || profileIds[0] || null,
          conversion_type: 'account_creation',
          session_id: validated.session_id || null,
          metadata: {
            user_id: validated.user_id,
            ip_address: ip !== 'unknown' ? ip : null,
          },
        });
    }

    return NextResponse.json({
      success: true,
      linked_sessions: sessionIds.size,
      linked_events: linkedEventsCount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error linking account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


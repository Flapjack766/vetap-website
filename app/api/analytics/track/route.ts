import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGeolocationFromIP } from '@/lib/analytics/geolocation';

// Get client IP address
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Parse user agent to extract device, browser, OS
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  // Device type
  let deviceType = 'desktop';
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'tablet';
  }
  
  // Browser
  let browser = 'unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
  else if (ua.includes('msie') || ua.includes('trident')) browser = 'IE';
  
  // OS
  let os = 'unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return { deviceType, browser, os };
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      profile_id, 
      event_type = 'page_view', 
      event_category,
      event_label,
      event_value,
      page_path, 
      session_id, 
      link_url, 
      link_type,
      metadata: clientMetadata,
    } = body;

    if (!profile_id) {
      return NextResponse.json(
        { error: 'profile_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get request metadata
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || '';
    const ip = getClientIP(req);
    const language = req.headers.get('accept-language')?.split(',')[0] || 'unknown';
    
    // Parse user agent
    const { deviceType, browser, os } = parseUserAgent(userAgent);
    
    // Get geolocation from IP using geolocation service
    const geolocation = await getGeolocationFromIP(ip);
    const country = geolocation.country;
    const city = geolocation.city;

    // Extract screen dimensions from body if available
    const screenWidth = body.screen_width || null;
    const screenHeight = body.screen_height || null;

    // Prepare metadata - merge client metadata with server-side data
    const metadata: Record<string, any> = {
      ...(clientMetadata || {}),
    };
    
    // Add link-specific metadata
    if (event_type === 'link_click' && link_url) {
      metadata.link_url = link_url;
      metadata.link_type = link_type || 'unknown';
    }

    // Update or create session
    if (session_id) {
      const { data: existingSession } = await supabase
        .from('analytics_sessions')
        .select('id, page_views, events_count')
        .eq('id', session_id)
        .single();

      if (existingSession) {
        // Update session
        await supabase
          .from('analytics_sessions')
          .update({
            page_views: event_type === 'page_view' ? (existingSession.page_views || 0) + 1 : existingSession.page_views,
            events_count: (existingSession.events_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', session_id);
      } else {
        // Create new session
        const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
        await supabase
          .from('analytics_sessions')
          .insert({
            id: session_id,
            profile_id,
            start_time: new Date().toISOString(),
            page_views: event_type === 'page_view' ? 1 : 0,
            events_count: 1,
            referrer: referrer || null,
            utm_source: urlParams.get('utm_source') || null,
            utm_medium: urlParams.get('utm_medium') || null,
            utm_campaign: urlParams.get('utm_campaign') || null,
            utm_term: urlParams.get('utm_term') || null,
            utm_content: urlParams.get('utm_content') || null,
            country,
            city,
            device_type: deviceType,
            browser,
            os,
            ip_address: ip !== 'unknown' ? ip : null,
          });
      }
    }

    // Insert analytics event
    const { error: insertError } = await supabase
      .from('analytics_events')
      .insert({
        profile_id,
        event_type,
        event_category: event_category || null,
        event_label: event_label || null,
        event_value: event_value || null,
        page_path: page_path || '/',
        referrer: referrer || null,
        user_agent: userAgent,
        ip_address: ip !== 'unknown' ? ip : null,
        country,
        city,
        device_type: deviceType,
        browser,
        os,
        screen_width: screenWidth,
        screen_height: screenHeight,
        language,
        session_id: session_id || null,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
      });

    // Track in user journey if session exists
    if (session_id) {
      const { data: journeyData } = await supabase
        .from('analytics_user_journey')
        .select('step_number')
        .eq('session_id', session_id)
        .order('step_number', { ascending: false })
        .limit(1)
        .single();

      const nextStep = (journeyData?.step_number || 0) + 1;
      
      await supabase
        .from('analytics_user_journey')
        .insert({
          profile_id,
          session_id,
          step_number: nextStep,
          page_path: page_path || '/',
          event_type,
          event_data: metadata,
        });
    }

    if (insertError) {
      console.error('Error inserting analytics event:', insertError);
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in analytics track API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


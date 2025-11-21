import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

// Get country from IP (simplified - in production, use a geolocation service)
async function getCountryFromIP(ip: string): Promise<{ country: string | null; city: string | null }> {
  // For now, return null - can be enhanced with a geolocation API
  // In production, use services like MaxMind GeoIP2, ipapi.co, or ip-api.com
  return { country: null, city: null };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile_id, event_type = 'page_view', page_path, session_id, link_url, link_type } = body;

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
    
    // Get country (simplified - can be enhanced)
    const { country, city } = await getCountryFromIP(ip);

    // Extract screen dimensions from body if available
    const screenWidth = body.screen_width || null;
    const screenHeight = body.screen_height || null;

    // Prepare metadata for link_click events
    const metadata = event_type === 'link_click' && link_url 
      ? { link_url, link_type: link_type || 'unknown' }
      : null;

    // Insert analytics event
    const { error: insertError } = await supabase
      .from('analytics_events')
      .insert({
        profile_id,
        event_type,
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
        metadata,
      });

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


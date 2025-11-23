/**
 * IP Geolocation Service
 * Extracts country and city from IP address using multiple services
 */

interface GeolocationResult {
  country: string | null;
  city: string | null;
  countryCode?: string | null;
  region?: string | null;
  timezone?: string | null;
}

/**
 * Get geolocation from IP using ip-api.com (free tier: 45 requests/minute)
 */
async function getGeolocationFromIPAPI(ip: string): Promise<GeolocationResult> {
  try {
    // Skip private/local IPs
    if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return { country: null, city: null };
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,regionName,timezone`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { country: null, city: null };
    }

    const data = await response.json();

    if (data.status === 'success') {
      return {
        country: data.country || null,
        city: data.city || null,
        countryCode: data.countryCode || null,
        region: data.regionName || null,
        timezone: data.timezone || null,
      };
    }

    return { country: null, city: null };
  } catch (error) {
    console.error('Error fetching geolocation from ip-api:', error);
    return { country: null, city: null };
  }
}

/**
 * Get geolocation from IP using ipapi.co (free tier: 1000 requests/day)
 */
async function getGeolocationFromIPAPICO(ip: string): Promise<GeolocationResult> {
  try {
    // Skip private/local IPs
    if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return { country: null, city: null };
    }

    const apiKey = process.env.IPAPI_CO_KEY;
    const url = apiKey 
      ? `https://ipapi.co/${ip}/json/?key=${apiKey}`
      : `https://ipapi.co/${ip}/json/`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { country: null, city: null };
    }

    const data = await response.json();

    if (!data.error) {
      return {
        country: data.country_name || null,
        city: data.city || null,
        countryCode: data.country_code || null,
        region: data.region || null,
        timezone: data.timezone || null,
      };
    }

    return { country: null, city: null };
  } catch (error) {
    console.error('Error fetching geolocation from ipapi.co:', error);
    return { country: null, city: null };
  }
}

/**
 * Get geolocation from IP with fallback to multiple services
 */
export async function getGeolocationFromIP(ip: string): Promise<GeolocationResult> {
  // Try ipapi.co first (better free tier)
  const result1 = await getGeolocationFromIPAPICO(ip);
  if (result1.country) {
    return result1;
  }

  // Fallback to ip-api.com
  const result2 = await getGeolocationFromIPAPI(ip);
  if (result2.country) {
    return result2;
  }

  return { country: null, city: null };
}

/**
 * Check if IP is from a known VPN/Proxy service (basic check)
 */
export function isLikelyVPN(ip: string): boolean {
  // This is a basic check - in production, use a dedicated VPN detection service
  // For now, we'll just return false
  return false;
}


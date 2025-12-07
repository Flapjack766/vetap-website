import crypto from 'crypto';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getGeolocationFromIP } from '@/lib/analytics/geolocation';
import TrackingLinkClient, { LinkData } from './TrackingLinkClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type HeaderStore = Awaited<ReturnType<typeof headers>>;

function hashIP(ip: string | null): string | null {
  if (!ip) return null;
  const cleanIP = ip.split(':')[0];
  return crypto.createHash('sha256').update(cleanIP).digest('hex').substring(0, 32);
}

function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|android|ip(hone|od)|iemobile|blackberry|kindle|silk-accelerated|(hpw|web)os|opera m(obi|ini)/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function getClientIP(headerStore: HeaderStore): string {
  const forwarded = headerStore.get('x-forwarded-for');
  const realIP = headerStore.get('x-real-ip');
  const cfIP = headerStore.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfIP) {
    return cfIP;
  }
  return 'unknown';
}

export default async function TrackingLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  const adminClient = createAdminClient();
  const { data: trackingLink, error } = await adminClient
    .from('tracking_links')
    .select(
      `
        id,
        slug,
        destination_type,
        destination_url,
        show_intermediate_page,
        collect_feedback_first,
        selected_template,
        template_data,
        branch_id,
        business_id,
        branch:branches (
          id,
          name,
          address,
          google_maps_url
        ),
        business:businesses (
          id,
          name,
          industry
        )
      `
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !trackingLink) {
    notFound();
  }

  const headerStore = await headers();
  const ip = getClientIP(headerStore);
  const userAgent = headerStore.get('user-agent');
  const referrer = headerStore.get('referer') || headerStore.get('referrer');
  const deviceType = getDeviceType(userAgent);
  const cardIdParam = resolvedSearchParams.card_id;
  const cardId = typeof cardIdParam === 'string' ? cardIdParam : null;

  let country: string | null = headerStore.get('cf-ipcountry');
  let city: string | null = headerStore.get('cf-ipcity');

  if (!country) {
    const geo = await getGeolocationFromIP(ip);
    country = geo.country;
    city = geo.city;
  }

  const eventData = {
    tracking_link_id: trackingLink.id,
    branch_id: trackingLink.branch_id,
    business_id: trackingLink.business_id,
    card_id: cardId,
    ip_hash: hashIP(ip),
    country,
    city,
    user_agent: userAgent,
    device_type: deviceType,
    referrer,
    meta: {
      ip_source: ip,
      timestamp: new Date().toISOString(),
    },
  };

  // Log tracking event asynchronously (don't await to avoid blocking redirect)
  Promise.resolve(
    adminClient
      .from('tracking_events')
      .insert(eventData)
  )
    .then(() => {
      // Successfully logged
    })
    .catch((eventError) => {
      console.error('Error logging tracking event:', eventError);
    });

  if (!trackingLink.show_intermediate_page && !trackingLink.collect_feedback_first) {
    redirect(trackingLink.destination_url);
  }

  const linkData: LinkData = {
    trackingLink: {
      id: trackingLink.id,
      slug: trackingLink.slug,
      destination_type: trackingLink.destination_type,
      destination_url: trackingLink.destination_url,
      show_intermediate_page: trackingLink.show_intermediate_page,
      collect_feedback_first: trackingLink.collect_feedback_first,
      selected_template: trackingLink.selected_template,
    },
    templateData: trackingLink.template_data ?? null,
    branch: (() => {
      const branch = trackingLink.branch as any;
      if (!branch) return null;
      if (Array.isArray(branch)) {
        return branch.length > 0 ? {
          id: branch[0].id,
          name: branch[0].name,
          address: branch[0].address,
          google_maps_url: branch[0].google_maps_url,
        } : null;
      }
      return {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        google_maps_url: branch.google_maps_url,
      };
    })(),
    business: (() => {
      const business = trackingLink.business as any;
      if (!business) return null;
      if (Array.isArray(business)) {
        return business.length > 0 ? {
          id: business[0].id,
          name: business[0].name,
          industry: business[0].industry,
        } : null;
      }
      return {
        id: business.id,
        name: business.name,
        industry: business.industry,
      };
    })(),
  };

  return (
    <TrackingLinkClient
      slug={slug}
      linkData={linkData}
      requireFeedback={trackingLink.collect_feedback_first}
      showTemplate={trackingLink.show_intermediate_page}
      destinationUrl={trackingLink.destination_url}
    />
  );
}
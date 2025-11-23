import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PublicProfile } from '@/app/(components)/profile/PublicProfile';

// Revalidate public profiles every 5 minutes
export const revalidate = 300;
export const dynamic = 'force-dynamic'; // Keep dynamic for real-time profile data

export async function generateStaticParams() {
  // This will be empty for now - we'll use dynamic rendering
  return [];
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string; slug: string }> 
}) {
  const { locale, slug } = await params;
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  // Try to fetch profile for better metadata
  try {
    const supabase = await createClient();
    
    // Try custom username first
    const { data: customProfile } = await supabase
      .from('profiles')
      .select('profile_name, username_custom, username_random')
      .eq('username_custom', slug)
      .eq('is_deleted', false)
      .maybeSingle();
    
    let profile: { profile_name: any; username_custom?: any; username_random: any } | null = customProfile;
    
    // Check expiration if custom profile exists
    if (customProfile) {
      const { data: fullProfile } = await supabase
        .from('profiles')
        .select('custom_username_expires_at, profile_name, username_custom, username_random')
        .eq('username_custom', slug)
        .eq('is_deleted', false)
        .single();
      
      if (fullProfile) {
        const now = new Date();
        const expiresAt = fullProfile.custom_username_expires_at 
          ? new Date(fullProfile.custom_username_expires_at) 
          : null;
        
        if (expiresAt && expiresAt <= now) {
          // Expired, try random username
          const { data: randomProfile } = await supabase
            .from('profiles')
            .select('profile_name, username_custom, username_random')
            .eq('username_random', slug)
            .eq('is_deleted', false)
            .maybeSingle();
          
          profile = randomProfile || null;
        } else {
          profile = fullProfile;
        }
      }
    }
    
    // If not found by custom, try random
    if (!profile) {
      const { data: randomProfile } = await supabase
        .from('profiles')
        .select('profile_name, username_custom, username_random')
        .eq('username_random', slug)
        .eq('is_deleted', false)
        .maybeSingle();
      
      profile = randomProfile || null;
    }
    
    const profileName = profile?.profile_name || slug;
    const title = isArabic 
      ? `${profileName} - بروفايل | VETAP`
      : `${profileName} - Profile | VETAP`;
    const description = isArabic
      ? `عرض بروفايل ${profileName} على VETAP. تواصل واحصل على معلومات التواصل والروابط الاجتماعية.`
      : `View ${profileName}'s profile on VETAP. Connect and get contact information and social links.`;
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${siteUrl}/${locale}/p/${slug}`,
        siteName: 'VETAP',
        locale: locale,
        type: 'profile',
        images: [
          {
            url: `${siteUrl}/images/og-image.png`,
            width: 1200,
            height: 630,
            alt: profileName,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`${siteUrl}/images/og-image.png`],
      },
      alternates: {
        canonical: `${siteUrl}/${locale}/p/${slug}`,
        languages: {
          'ar': `${siteUrl}/ar/p/${slug}`,
          'en': `${siteUrl}/en/p/${slug}`,
        },
      },
    };
  } catch (error) {
    // Fallback metadata if profile fetch fails
    return {
      title: isArabic ? 'بروفايل | VETAP' : 'Profile | VETAP',
      description: isArabic 
        ? 'عرض بروفايل على VETAP'
        : 'View profile on VETAP',
      openGraph: {
        title: isArabic ? 'بروفايل | VETAP' : 'Profile | VETAP',
        description: isArabic 
          ? 'عرض بروفايل على VETAP'
          : 'View profile on VETAP',
        url: `${siteUrl}/${locale}/p/${slug}`,
        siteName: 'VETAP',
        locale: locale,
        type: 'profile',
      },
      alternates: {
        canonical: `${siteUrl}/${locale}/p/${slug}`,
        languages: {
          'ar': `${siteUrl}/ar/p/${slug}`,
          'en': `${siteUrl}/en/p/${slug}`,
        },
      },
    };
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const supabase = await createClient();

  // First, try to find profile by username_custom
  const { data: customProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username_custom', slug)
    .eq('is_deleted', false)
    .single();

  // Check if custom username exists and is not expired
  if (customProfile) {
    const now = new Date();
    const expiresAt = customProfile.custom_username_expires_at 
      ? new Date(customProfile.custom_username_expires_at) 
      : null;
    
    // If custom username is expired, ignore it and search by random username
    if (expiresAt && expiresAt <= now) {
      // Custom username expired, search by random username instead
      const { data: randomProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username_random', slug)
        .eq('is_deleted', false)
        .single();

      if (error || !randomProfile) {
        notFound();
      }

      return <PublicProfile profile={randomProfile} locale={locale} />;
    }

    // Custom username is valid, use it
    return <PublicProfile profile={customProfile} locale={locale} />;
  }

  // If not found by custom username, search by random username
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username_random', slug)
    .eq('is_deleted', false)
    .single();

  if (error || !profile) {
    notFound();
  }

  return <PublicProfile profile={profile} locale={locale} />;
}


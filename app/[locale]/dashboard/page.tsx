import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardContent } from '@/app/(components)/dashboard/DashboardContent';

// Revalidate every 60 seconds for dashboard data
export const revalidate = 60;
export const dynamic = 'force-dynamic'; // Keep dynamic for auth checks

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? `${t('DASH1')} - VETAP` : `${t('DASH1')} - VETAP`,
    description: isArabic 
      ? 'إدارة بروفايلاتك الرقمية وبطاقات NFC الذكية من لوحة التحكم في VETAP'
      : 'Manage your digital profiles and NFC smart cards from your VETAP dashboard',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: isArabic ? `${t('DASH1')} - VETAP` : `${t('DASH1')} - VETAP`,
      description: isArabic 
        ? 'لوحة تحكم VETAP'
        : 'VETAP Dashboard',
      url: `${siteUrl}/${locale}/dashboard`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/dashboard`,
      languages: {
        'ar': `${siteUrl}/ar/dashboard`,
        'en': `${siteUrl}/en/dashboard`,
      },
    },
  };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Get user profiles (get primary or first one) - optimized query
  // Use maybeSingle() to avoid errors when no rows are found
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, user_id, email, username_random, username_custom, username_type, profile_name, avatar_url, template_id, links, is_primary, is_deleted, created_at, updated_at, display_name, headline, bio, phone, location')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  // If profile exists, use it
  if (profile) {
    return <DashboardContent profile={profile} locale={locale} />;
  }

  // Profile doesn't exist - check if it's a real error or just missing
  // With maybeSingle(), error is null when no rows found (expected for new users)
  // We only want to handle real errors, not "no rows" scenarios
  if (error && error !== null && typeof error === 'object') {
    // Check if error is an empty object {} - these should be completely ignored
    const errorKeys = Object.keys(error);
    const isEmptyObject = errorKeys.length === 0;
    
    // Also check JSON string representation to catch edge cases
    const errorString = JSON.stringify(error);
    const isEmptyString = errorString === '{}' || errorString === 'null';
    
    // Check if it's the "no rows" error (shouldn't happen with maybeSingle, but check anyway)
    const isNoRowsError = error.code === 'PGRST116';
    
    // If error is empty or "no rows", ignore it completely and continue
    if (isEmptyObject || isEmptyString || isNoRowsError) {
      // Silently continue - this is expected for new users
      // Do nothing, fall through to profile creation
      // DO NOT log empty errors
    } 
    // Check if error has meaningful content (message or valid error code)
    else {
      const hasMessage = 
        error.message && 
        typeof error.message === 'string' && 
        error.message.trim() !== '';
      
      const hasValidErrorCode = 
        error.code && 
        typeof error.code === 'string' && 
        error.code !== 'PGRST116' && 
        error.code.trim() !== '';
      
      // Only log and redirect if there's a real error with meaningful content
      // Triple-check that error is not empty before logging
      if (!isEmptyObject && !isEmptyString && (hasMessage || hasValidErrorCode)) {
        console.error('Profile fetch error:', error);
        redirect(`/${locale}/signup`);
      }
      // If no meaningful content or empty, ignore it and continue silently
    }
  }

  // Profile doesn't exist - create it (only once)
  const { generateUniqueRandomUsername } = await import('@/lib/supabase/utils');
  const randomUsername = await generateUniqueRandomUsername(supabase);
  
  // Create profile with unique username
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      email: user.email,
      username_random: randomUsername,
      username_type: 'random',
      is_primary: true,
      profile_name: 'Profile 1',
      template_id: 1,
      links: {},
    })
    .select()
    .maybeSingle();

  if (createError || !newProfile) {
    // If creation fails, redirect to signup
    console.error('Failed to create profile:', createError);
    redirect(`/${locale}/signup`);
  }

  return <DashboardContent profile={newProfile} locale={locale} />;
}


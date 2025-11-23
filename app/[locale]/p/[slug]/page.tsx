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
  
  // Don't use createClient in generateMetadata to avoid DYNAMIC_SERVER_USAGE
  // Metadata will be set dynamically on the client side if needed
  return {
    title: 'Profile | VETAP',
    description: 'View profile',
  };
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


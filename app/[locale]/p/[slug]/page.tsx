import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PublicProfile } from '@/app/(components)/profile/PublicProfile';

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
  const supabase = await createClient();
  
  // Try to find profile by custom or random username
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, headline, bio')
    .or(`username_custom.eq.${slug},username_random.eq.${slug}`)
    .single();

  if (!profile) {
    return {
      title: 'Profile Not Found',
    };
  }

  return {
    title: profile.display_name || profile.headline || 'Profile',
    description: profile.bio || profile.headline || '',
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const supabase = await createClient();

  // Search in username_custom first, then username_random
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username_custom.eq.${slug},username_random.eq.${slug}`)
    .single();

  if (error || !profile) {
    notFound();
  }

  return <PublicProfile profile={profile} locale={locale} />;
}


import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { PublicProfile } from '@/app/(components)/profile/PublicProfile';

export const dynamic = 'force-dynamic';

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
  noStore(); // Prevent caching
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


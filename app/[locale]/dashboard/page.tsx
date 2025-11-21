import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardContent } from '@/app/(components)/dashboard/DashboardContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('DASH1'),
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

  // Get user profiles (get primary or first one)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  // If profiles exist, use primary or first one
  if (profiles && profiles.length > 0) {
    const primaryProfile = profiles.find(p => p.is_primary) || profiles[0];
    return <DashboardContent profile={primaryProfile} locale={locale} />;
  }

  // Profile doesn't exist - check if it's a real error or just missing
  // PGRST116 means "no rows returned" which is expected for new users
  // Also check if error is actually meaningful (not just empty object)
  if (error) {
    // Check if it's a real error (not just "no rows" or empty object)
    const errorString = JSON.stringify(error);
    const isEmptyObject = errorString === '{}' || errorString === 'null';
    const isNoRowsError = error.code === 'PGRST116';
    const hasRealErrorContent = error.message || (error.code && error.code !== 'PGRST116');
    
    // Only treat as real error if it has meaningful content and is not empty
    if (!isEmptyObject && !isNoRowsError && hasRealErrorContent) {
      console.error('Profile fetch error:', error);
      redirect(`/${locale}/signup`);
    }
    // If error is just "no rows" or empty, continue to create profile
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


import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LinkBuilder } from '@/app/(components)/dashboard/tracking/links/LinkBuilder';

// Revalidate every 60 seconds
export const revalidate = 60;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? 'إنشاء رابط تتبع - VETAP' : 'Create Tracking Link - VETAP',
    description: isArabic 
      ? 'إنشاء وإدارة روابط التتبع الفريدة'
      : 'Create and manage unique tracking links',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function LinkBuilderPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if user has approved branch tracking access
  const { data: accessRequest } = await supabase
    .from('branch_tracking_requests')
    .select('status')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .maybeSingle();

  if (!accessRequest) {
    redirect(`/${locale}/dashboard`);
  }

  return <LinkBuilder locale={locale} />;
}


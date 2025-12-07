import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BranchTrackingDashboard } from '@/app/(components)/dashboard/tracking/BranchTrackingDashboard';

// Revalidate every 60 seconds
export const revalidate = 60;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? 'إدارة الفروع والكروت - VETAP' : 'Branch & Card Management - VETAP',
    description: isArabic 
      ? 'إدارة منشآتك وفروعك وكروت NFC من لوحة التحكم'
      : 'Manage your businesses, branches, and NFC cards from your dashboard',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: isArabic ? 'إدارة الفروع والكروت - VETAP' : 'Branch & Card Management - VETAP',
      description: isArabic 
        ? 'لوحة تحكم إدارة الفروع'
        : 'Branch Management Dashboard',
      url: `${siteUrl}/${locale}/dashboard/tracking`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/dashboard/tracking`,
      languages: {
        'ar': `${siteUrl}/ar/dashboard/tracking`,
        'en': `${siteUrl}/en/dashboard/tracking`,
      },
    },
  };
}

export default async function BranchTrackingPage({ params }: { params: Promise<{ locale: string }> }) {
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

  return <BranchTrackingDashboard locale={locale} />;
}


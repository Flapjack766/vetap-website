import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TrackingAnalytics } from '@/app/(components)/dashboard/tracking/analytics/TrackingAnalytics';

// Revalidate every 60 seconds
export const revalidate = 60;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? 'تحليلات التتبع - VETAP' : 'Tracking Analytics - VETAP',
    description: isArabic 
      ? 'تحليل أحداث التتبع والزيارات'
      : 'Analyze tracking events and visits',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function TrackingAnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
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

  return <TrackingAnalytics locale={locale} />;
}


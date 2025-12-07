import { AdvancedAnalytics } from '@/app/(components)/event/dashboard/AdvancedAnalytics';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'التحليلات المتقدمة - VETAP Event' : 'Advanced Analytics - VETAP Event',
    description: isArabic
      ? 'تقارير وتحليلات مفصلة للأحداث'
      : 'Detailed event reports and analytics',
  };
}

export default async function AnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return <AdvancedAnalytics locale={locale} />;
}


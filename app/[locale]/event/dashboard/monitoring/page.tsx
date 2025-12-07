import { SystemMonitoring } from '@/app/(components)/event/dashboard/SystemMonitoring';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'مراقبة النظام - VETAP Event' : 'System Monitoring - VETAP Event',
    description: isArabic
      ? 'مراقبة أداء النظام والأخطاء'
      : 'System performance and error monitoring',
  };
}

export default async function MonitoringPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return <SystemMonitoring locale={locale} />;
}


import { EventStatistics } from '@/app/(components)/event/dashboard/EventStatistics';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic 
      ? `إحصائيات الحدث - VETAP Event` 
      : `Event Statistics - VETAP Event`,
    description: isArabic 
      ? 'عرض إحصائيات وتحليلات الحدث'
      : 'View event statistics and analytics',
  };
}

export default async function StatisticsPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  
  return <EventStatistics locale={locale} eventId={id} />;
}


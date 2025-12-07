import { getTranslations } from 'next-intl/server';
import { EventsList } from '@/app/(components)/event/dashboard/EventsList';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic 
      ? `قائمة الأحداث - VETAP Event` 
      : `Events - VETAP Event`,
    description: isArabic 
      ? 'عرض وإدارة جميع الأحداث'
      : 'View and manage all events',
  };
}

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  // Auth is handled by client-side EventDashboardLayout
  // Server can't access localStorage session
  return <EventsList locale={locale} />;
}

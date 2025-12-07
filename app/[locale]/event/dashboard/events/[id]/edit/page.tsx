import { EventForm } from '@/app/(components)/event/dashboard/EventForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic 
      ? `تعديل الحدث - VETAP Event` 
      : `Edit Event - VETAP Event`,
    description: isArabic 
      ? 'تعديل تفاصيل الحدث وإعدادات القالب'
      : 'Edit event details and template settings',
  };
}

export default async function EditEventPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  
  return <EventForm locale={locale} eventId={id} />;
}


import { EventForm } from '@/app/(components)/event/dashboard/EventForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic 
      ? `إنشاء حدث جديد - VETAP Event` 
      : `Create New Event - VETAP Event`,
    description: isArabic 
      ? 'إنشاء حدث جديد وإعداد قالب الدعوة'
      : 'Create a new event and setup invitation template',
  };
}

export default async function NewEventPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return <EventForm locale={locale} />;
}


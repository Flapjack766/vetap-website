import { GuestManagement } from '@/app/(components)/event/dashboard/GuestManagement';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic 
      ? `إدارة الضيوف - VETAP Event` 
      : `Guest Management - VETAP Event`,
    description: isArabic 
      ? 'إضافة وإدارة ضيوف الحدث'
      : 'Add and manage event guests',
  };
}

export default async function GuestsPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  
  return <GuestManagement locale={locale} eventId={id} />;
}


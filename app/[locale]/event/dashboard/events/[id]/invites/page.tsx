import { InviteGeneration } from '@/app/(components)/event/dashboard/InviteGeneration';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic 
      ? `توليد الدعوات - VETAP Event` 
      : `Generate Invitations - VETAP Event`,
    description: isArabic 
      ? 'توليد وإدارة دعوات الحدث'
      : 'Generate and manage event invitations',
  };
}

export default async function InvitesPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  
  return <InviteGeneration locale={locale} eventId={id} />;
}


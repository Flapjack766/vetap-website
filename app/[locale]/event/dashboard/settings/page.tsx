import { PartnerSettings } from '@/app/(components)/event/dashboard/PartnerSettings';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'إعدادات الشريك - VETAP Event' : 'Partner Settings - VETAP Event',
    description: isArabic
      ? 'إدارة إعدادات Webhook و API'
      : 'Manage webhook and API settings',
  };
}

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return <PartnerSettings locale={locale} />;
}


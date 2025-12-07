import { getTranslations } from 'next-intl/server';
import { EventDashboardLayout } from '@/app/(components)/event/dashboard/EventDashboardLayout';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic 
      ? `لوحة التحكم - VETAP Event` 
      : `Dashboard - VETAP Event`,
    description: isArabic 
      ? 'إدارة الأحداث والضيوف والدعوات من لوحة التحكم'
      : 'Manage events, guests, and invites from your dashboard',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function EventDashboardLayoutPage({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return <EventDashboardLayout locale={locale}>{children}</EventDashboardLayout>;
}


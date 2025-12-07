import { GateStaffLogin } from '@/app/(components)/event/check-in/GateStaffLogin';
import type { Viewport } from 'next';

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'تسجيل الدخول - VETAP Check-in' : 'Check-in Login - VETAP',
    description: isArabic ? 'تسجيل دخول موظفي البوابة' : 'Gate staff login for check-in',
  };
}

export default async function CheckInLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return <GateStaffLogin locale={locale} />;
}


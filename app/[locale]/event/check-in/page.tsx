import { GateStaffLogin } from '@/app/(components)/event/check-in/GateStaffLogin';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'تسجيل الدخول - VETAP Check-in' : 'Check-in Login - VETAP',
    description: isArabic ? 'تسجيل دخول موظفي البوابة' : 'Gate staff login for check-in',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
    themeColor: '#0f172a',
  };
}

export default async function CheckInLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return <GateStaffLogin locale={locale} />;
}


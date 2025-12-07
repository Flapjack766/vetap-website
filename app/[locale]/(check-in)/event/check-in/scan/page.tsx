import { QRScanner } from '@/app/(components)/event/check-in/QRScanner';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'ماسح QR - VETAP Check-in' : 'QR Scanner - VETAP Check-in',
    description: isArabic ? 'مسح تذاكر الضيوف' : 'Scan guest passes',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
    themeColor: '#0f172a',
  };
}

export default async function CheckInScanPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return <QRScanner locale={locale} />;
}


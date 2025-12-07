import { QRScanner } from '@/app/(components)/event/check-in/QRScanner';
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
    title: isArabic ? 'ماسح QR - VETAP Check-in' : 'QR Scanner - VETAP Check-in',
    description: isArabic ? 'مسح تذاكر الضيوف' : 'Scan guest passes',
  };
}

export default async function CheckInScanPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return <QRScanner locale={locale} />;
}


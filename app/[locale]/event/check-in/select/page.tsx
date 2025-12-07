import { EventGateSelector } from '@/app/(components)/event/check-in/EventGateSelector';
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
    title: isArabic ? 'اختيار الحدث - VETAP Check-in' : 'Select Event - VETAP Check-in',
    description: isArabic ? 'اختر الحدث والبوابة للمسح' : 'Select event and gate for scanning',
  };
}

export default async function CheckInSelectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return <EventGateSelector locale={locale} />;
}


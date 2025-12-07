import { EventGateSelector } from '@/app/(components)/event/check-in/EventGateSelector';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'اختيار الحدث - VETAP Check-in' : 'Select Event - VETAP Check-in',
    description: isArabic ? 'اختر الحدث والبوابة للمسح' : 'Select event and gate for scanning',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
    themeColor: '#0f172a',
  };
}

export default async function CheckInSelectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return <EventGateSelector locale={locale} />;
}


import { setRequestLocale } from 'next-intl/server';
import { ReviewContent } from '@/app/(components)/nfc/ReviewContent';

export default async function NFCReviewCardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  return <ReviewContent locale={locale as 'ar' | 'en'} />;
}


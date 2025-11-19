import { setRequestLocale } from 'next-intl/server';
import { NFCContent } from '@/app/(components)/nfc/NFCContent';

export default async function NFCBusinessCardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  return <NFCContent locale={locale as 'ar' | 'en'} />;
}


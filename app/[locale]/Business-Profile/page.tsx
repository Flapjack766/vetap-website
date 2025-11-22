import { setRequestLocale } from 'next-intl/server';
import { ProfileContent } from '@/app/(components)/profile/ProfileContent';

export default async function BusinessProfilePagePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  return <ProfileContent locale={locale as 'ar' | 'en'} />;
}


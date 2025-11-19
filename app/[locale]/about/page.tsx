import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { AboutContent } from '@/app/(components)/about/AboutContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('ABOUT80'),
    description: t('ABOUT81'),
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  return <AboutContent locale={locale as 'ar' | 'en'} />;
}

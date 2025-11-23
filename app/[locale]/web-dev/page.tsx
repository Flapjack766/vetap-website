import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { WebDevelopmentContent } from '@/app/(components)/web-development/WebDevelopmentContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('WEBDEV1'),
    description: t('WEBDEV2'),
  };
}

export default async function WebDevelopmentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  return <WebDevelopmentContent locale={locale as 'ar' | 'en'} />;
}


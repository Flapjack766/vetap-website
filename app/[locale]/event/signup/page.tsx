import { getTranslations } from 'next-intl/server';
import { EventSignUpForm } from '@/app/(components)/event/auth/EventSignUpForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic 
      ? `${t('EVENT_AUTH_SIGN_UP')} - ${t('EVENT_APP_NAME')}` 
      : `${t('EVENT_AUTH_SIGN_UP')} - ${t('EVENT_APP_NAME')}`,
    description: isArabic 
      ? 'إنشاء حساب جديد في VETAP Event للوصول إلى منصة إدارة الأحداث'
      : 'Create a new VETAP Event account to access the event management platform',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: isArabic 
        ? `${t('EVENT_AUTH_SIGN_UP')} - ${t('EVENT_APP_NAME')}` 
        : `${t('EVENT_AUTH_SIGN_UP')} - ${t('EVENT_APP_NAME')}`,
      description: isArabic 
        ? 'إنشاء حساب جديد في VETAP Event'
        : 'Create a new VETAP Event account',
      url: `${siteUrl}/${locale}/event/signup`,
      siteName: 'VETAP Event',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/event/signup`,
      languages: {
        'ar': `${siteUrl}/ar/event/signup`,
        'en': `${siteUrl}/en/event/signup`,
      },
    },
  };
}

export default async function EventSignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return <EventSignUpForm locale={locale} />;
}


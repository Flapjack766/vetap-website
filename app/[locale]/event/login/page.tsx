import { getTranslations } from 'next-intl/server';
import { EventLoginForm } from '@/app/(components)/event/auth/EventLoginForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic 
      ? `${t('EVENT_AUTH_SIGN_IN')} - ${t('EVENT_APP_NAME')}` 
      : `${t('EVENT_AUTH_SIGN_IN')} - ${t('EVENT_APP_NAME')}`,
    description: isArabic 
      ? 'سجل الدخول إلى حسابك في VETAP Event للوصول إلى لوحة التحكم وإدارة الأحداث'
      : 'Sign in to your VETAP Event account to access your dashboard and manage events',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: isArabic 
        ? `${t('EVENT_AUTH_SIGN_IN')} - ${t('EVENT_APP_NAME')}` 
        : `${t('EVENT_AUTH_SIGN_IN')} - ${t('EVENT_APP_NAME')}`,
      description: isArabic 
        ? 'سجل الدخول إلى حسابك في VETAP Event'
        : 'Sign in to your VETAP Event account',
      url: `${siteUrl}/${locale}/event/login`,
      siteName: 'VETAP Event',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/event/login`,
      languages: {
        'ar': `${siteUrl}/ar/event/login`,
        'en': `${siteUrl}/en/event/login`,
      },
    },
  };
}

export default async function EventLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return <EventLoginForm locale={locale} />;
}


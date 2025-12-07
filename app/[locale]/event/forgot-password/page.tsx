import { getTranslations } from 'next-intl/server';
import { EventForgotPasswordForm } from '@/app/(components)/event/auth/EventForgotPasswordForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic 
      ? `${t('EVENT_AUTH_FORGOT_PASSWORD')} - ${t('EVENT_APP_NAME')}` 
      : `${t('EVENT_AUTH_FORGOT_PASSWORD')} - ${t('EVENT_APP_NAME')}`,
    description: isArabic 
      ? 'إعادة تعيين كلمة المرور لحسابك في VETAP Event'
      : 'Reset your VETAP Event account password',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: isArabic 
        ? `${t('EVENT_AUTH_FORGOT_PASSWORD')} - ${t('EVENT_APP_NAME')}` 
        : `${t('EVENT_AUTH_FORGOT_PASSWORD')} - ${t('EVENT_APP_NAME')}`,
      description: isArabic 
        ? 'إعادة تعيين كلمة المرور'
        : 'Reset password',
      url: `${siteUrl}/${locale}/event/forgot-password`,
      siteName: 'VETAP Event',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/event/forgot-password`,
      languages: {
        'ar': `${siteUrl}/ar/event/forgot-password`,
        'en': `${siteUrl}/en/event/forgot-password`,
      },
    },
  };
}

export default async function EventForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return <EventForgotPasswordForm locale={locale} />;
}


import { getTranslations } from 'next-intl/server';
import { EventResetPasswordForm } from '@/app/(components)/event/auth/EventResetPasswordForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic 
      ? `${t('EVENT_AUTH_RESET_PASSWORD')} - ${t('EVENT_APP_NAME')}` 
      : `${t('EVENT_AUTH_RESET_PASSWORD')} - ${t('EVENT_APP_NAME')}`,
    description: isArabic 
      ? 'تعيين كلمة مرور جديدة لحسابك في VETAP Event'
      : 'Set a new password for your VETAP Event account',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: isArabic 
        ? `${t('EVENT_AUTH_RESET_PASSWORD')} - ${t('EVENT_APP_NAME')}` 
        : `${t('EVENT_AUTH_RESET_PASSWORD')} - ${t('EVENT_APP_NAME')}`,
      description: isArabic 
        ? 'تعيين كلمة مرور جديدة'
        : 'Set new password',
      url: `${siteUrl}/${locale}/event/reset-password`,
      siteName: 'VETAP Event',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/event/reset-password`,
      languages: {
        'ar': `${siteUrl}/ar/event/reset-password`,
        'en': `${siteUrl}/en/event/reset-password`,
      },
    },
  };
}

export default async function EventResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return <EventResetPasswordForm locale={locale} />;
}

